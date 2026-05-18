const { sql, getPool } = require('../config/database');

// GET all payments
exports.getPayments = async (req, res) => {
  try {
    const pool = await getPool();
    const { memberId, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let where = 'WHERE 1=1';
    const request = pool.request();

    if (memberId) {
      where += ' AND py.MemberID = @memberId';
      request.input('memberId', sql.Int, memberId);
    }

    const result = await request.query(`
      SELECT py.*, 
             m.FirstName + ' ' + m.LastName AS MemberName, m.MemberCode,
             pl.PlanName, pl.DurationDays
      FROM Payments py
      JOIN Members m ON py.MemberID = m.MemberID
      JOIN MembershipPlans pl ON py.PlanID = pl.PlanID
      ${where}
      ORDER BY py.PaymentDate DESC
      OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY
    `);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// RECORD payment and create/extend membership
exports.recordPayment = async (req, res) => {
  const pool = await getPool();
  const transaction = new (require('mssql').Transaction)(pool);

  try {
    const { memberId, planId, amount, paymentMethod, startDate, transactionRef, notes } = req.body;

    await transaction.begin();
    const request = new (require('mssql').Request)(transaction);

    // Get plan details
    const plan = await request
      .input('planId', sql.Int, planId)
      .query(`SELECT * FROM MembershipPlans WHERE PlanID = @planId AND IsActive = 1`);

    if (!plan.recordset.length) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    const planData = plan.recordset[0];
    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + planData.DurationDays);

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    // Insert payment
    const paymentResult = await new (require('mssql').Request)(transaction)
      .input('memberId', sql.Int, memberId)
      .input('planId', sql.Int, planId)
      .input('amount', sql.Decimal(10, 2), amount || planData.Price)
      .input('method', sql.NVarChar, paymentMethod || 'Cash')
      .input('startDate', sql.Date, startStr)
      .input('endDate', sql.Date, endStr)
      .input('ref', sql.NVarChar, transactionRef || null)
      .input('notes', sql.NVarChar, notes || null)
      .query(`
        INSERT INTO Payments (MemberID, PlanID, Amount, PaymentMethod, StartDate, EndDate, TransactionRef, Notes, Status)
        OUTPUT INSERTED.PaymentID
        VALUES (@memberId, @planId, @amount, @method, @startDate, @endDate, @ref, @notes, 'Active')
      `);

    const paymentId = paymentResult.recordset[0].PaymentID;

    // Deactivate any existing active memberships
    await new (require('mssql').Request)(transaction)
      .input('memberId', sql.Int, memberId)
      .query(`UPDATE Memberships SET Status = 'Superseded' WHERE MemberID = @memberId AND Status = 'Active'`);

    // Create new membership
    await new (require('mssql').Request)(transaction)
      .input('memberId', sql.Int, memberId)
      .input('planId', sql.Int, planId)
      .input('paymentId', sql.Int, paymentId)
      .input('startDate', sql.Date, startStr)
      .input('endDate', sql.Date, endStr)
      .query(`
        INSERT INTO Memberships (MemberID, PlanID, PaymentID, StartDate, EndDate, Status)
        VALUES (@memberId, @planId, @paymentId, @startDate, @endDate, 'Active')
      `);

    // Re-activate member if they were disabled due to expiry
    await new (require('mssql').Request)(transaction)
      .input('memberId', sql.Int, memberId)
      .query(`UPDATE Members SET IsActive = 1, UpdatedAt = GETDATE() WHERE MemberID = @memberId`);

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'Payment recorded and membership activated',
      data: { paymentId, startDate: startStr, endDate: endStr, planName: planData.PlanName },
    });
  } catch (err) {
    await transaction.rollback();
    console.error('recordPayment error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET membership plans
exports.getPlans = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`SELECT * FROM MembershipPlans WHERE IsActive = 1 ORDER BY Price`);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// CREATE/UPDATE plan
exports.savePlan = async (req, res) => {
  try {
    const pool = await getPool();
    const { planId, planName, description, durationDays, price, features } = req.body;

    if (planId) {
      await pool.request()
        .input('id', sql.Int, planId)
        .input('name', sql.NVarChar, planName)
        .input('desc', sql.NVarChar, description)
        .input('days', sql.Int, durationDays)
        .input('price', sql.Decimal(10, 2), price)
        .input('features', sql.NVarChar, features)
        .query(`UPDATE MembershipPlans SET PlanName=@name, Description=@desc, DurationDays=@days, Price=@price, Features=@features, UpdatedAt=GETDATE() WHERE PlanID=@id`);
    } else {
      await pool.request()
        .input('name', sql.NVarChar, planName)
        .input('desc', sql.NVarChar, description)
        .input('days', sql.Int, durationDays)
        .input('price', sql.Decimal(10, 2), price)
        .input('features', sql.NVarChar, features)
        .query(`INSERT INTO MembershipPlans (PlanName, Description, DurationDays, Price, Features) VALUES (@name, @desc, @days, @price, @features)`);
    }
    res.json({ success: true, message: 'Plan saved' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
