const { sql, getPool } = require('../config/database');

// VERIFY entry via face match (called from frontend after face-api.js match)
exports.verifyEntry = async (req, res) => {
  try {
    const pool = await getPool();
    const { memberId, confidenceScore, stationId } = req.body;

    // Check member + membership status
    const result = await pool.request()
      .input('memberId', sql.Int, memberId)
      .query(`
        SELECT m.MemberID, m.FirstName, m.LastName, m.MemberCode, m.IsActive, m.PhotoPath,
               ms.EndDate, ms.Status AS MembershipStatus,
               p.PlanName,
               CASE WHEN ms.EndDate >= CAST(GETDATE() AS DATE) AND ms.Status = 'Active' THEN 1 ELSE 0 END AS CanEnter
        FROM Members m
        LEFT JOIN (
          SELECT MemberID, PlanID, EndDate, Status,
                 ROW_NUMBER() OVER (PARTITION BY MemberID ORDER BY EndDate DESC) AS rn
          FROM Memberships
        ) ms ON m.MemberID = ms.MemberID AND ms.rn = 1
        LEFT JOIN MembershipPlans p ON ms.PlanID = p.PlanID
        WHERE m.MemberID = @memberId
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ success: false, message: 'Member not found', access: false });
    }

    const member = result.recordset[0];

    if (!member.IsActive) {
      return res.json({ success: false, message: 'Member account is disabled', access: false, member });
    }

    if (!member.CanEnter) {
      const expiry = member.EndDate ? new Date(member.EndDate).toLocaleDateString() : 'No membership';
      return res.json({
        success: false,
        message: `Membership expired (${expiry}). Please renew to continue.`,
        access: false,
        member,
      });
    }

    // Check if already inside (open entry without exit)
    const openEntry = await pool.request()
      .input('memberId', sql.Int, memberId)
      .query(`
        SELECT TOP 1 LogID FROM EntryLogs 
        WHERE MemberID = @memberId AND Status = 'Entry' AND ExitTime IS NULL 
        AND CAST(EntryTime AS DATE) = CAST(GETDATE() AS DATE)
        ORDER BY EntryTime DESC
      `);

    let action = 'Entry';
    if (openEntry.recordset.length) {
      // Record exit instead
      await pool.request()
        .input('logId', sql.Int, openEntry.recordset[0].LogID)
        .query(`UPDATE EntryLogs SET ExitTime = GETDATE(), Status = 'Exit' WHERE LogID = @logId`);
      action = 'Exit';
    } else {
      // Log entry
      await pool.request()
        .input('memberId', sql.Int, memberId)
        .input('confidence', sql.Decimal(5, 4), confidenceScore || null)
        .input('station', sql.NVarChar, stationId || 'Main')
        .input('ip', sql.NVarChar, req.ip || null)
        .query(`
          INSERT INTO EntryLogs (MemberID, ConfidenceScore, StationID, IPAddress, Status)
          VALUES (@memberId, @confidence, @station, @ip, 'Entry')
        `);
    }

    res.json({
      success: true,
      access: true,
      action,
      message: `${action} recorded for ${member.FirstName} ${member.LastName}`,
      member: {
        ...member,
        daysRemaining: Math.ceil((new Date(member.EndDate) - new Date()) / (1000 * 60 * 60 * 24)),
      },
    });
  } catch (err) {
    console.error('verifyEntry error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET entry logs
exports.getEntryLogs = async (req, res) => {
  try {
    const pool = await getPool();
    const { memberId, date, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let where = 'WHERE 1=1';
    const request = pool.request();

    if (memberId) {
      where += ' AND e.MemberID = @memberId';
      request.input('memberId', sql.Int, memberId);
    }
    if (date) {
      where += ' AND CAST(e.EntryTime AS DATE) = @date';
      request.input('date', sql.Date, date);
    }

    const result = await request.query(`
      SELECT e.*, m.FirstName + ' ' + m.LastName AS MemberName, m.MemberCode, m.PhotoPath
      FROM EntryLogs e
      LEFT JOIN Members m ON e.MemberID = m.MemberID
      ${where}
      ORDER BY e.EntryTime DESC
      OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY
    `);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const pool = await getPool();

    const stats = await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM Members WHERE IsActive = 1) AS totalActiveMembers,
        (SELECT COUNT(*) FROM Members) AS totalMembers,
        (SELECT COUNT(*) FROM Memberships 
         WHERE Status = 'Active' AND EndDate >= CAST(GETDATE() AS DATE)) AS activeMemberships,
        (SELECT COUNT(*) FROM Memberships 
         WHERE EndDate < CAST(GETDATE() AS DATE) AND Status = 'Active') AS expiredToday,
        (SELECT COUNT(*) FROM EntryLogs 
         WHERE CAST(EntryTime AS DATE) = CAST(GETDATE() AS DATE)) AS todayEntries,
        (SELECT COUNT(*) FROM EntryLogs 
         WHERE CAST(EntryTime AS DATE) = CAST(GETDATE() AS DATE) AND Status = 'Entry' AND ExitTime IS NULL) AS currentlyInside,
        (SELECT ISNULL(SUM(Amount), 0) FROM Payments 
         WHERE CAST(PaymentDate AS DATE) = CAST(GETDATE() AS DATE)) AS todayRevenue,
        (SELECT ISNULL(SUM(Amount), 0) FROM Payments 
         WHERE MONTH(PaymentDate) = MONTH(GETDATE()) AND YEAR(PaymentDate) = YEAR(GETDATE())) AS monthRevenue,
        (SELECT COUNT(*) FROM Memberships 
         WHERE EndDate BETWEEN CAST(GETDATE() AS DATE) AND DATEADD(DAY, 7, CAST(GETDATE() AS DATE))
         AND Status = 'Active') AS expiringThisWeek
    `);

    // Recent entries
    const recentEntries = await pool.request().query(`
      SELECT TOP 10 e.EntryTime, e.Status, m.FirstName + ' ' + m.LastName AS MemberName, m.PhotoPath, m.MemberCode
      FROM EntryLogs e
      JOIN Members m ON e.MemberID = m.MemberID
      ORDER BY e.EntryTime DESC
    `);

    // Weekly entries chart data
    const weeklyData = await pool.request().query(`
      SELECT 
        CAST(EntryTime AS DATE) AS Date,
        COUNT(*) AS Entries
      FROM EntryLogs
      WHERE EntryTime >= DATEADD(DAY, -7, GETDATE())
      GROUP BY CAST(EntryTime AS DATE)
      ORDER BY Date
    `);

    res.json({
      success: true,
      stats: stats.recordset[0],
      recentEntries: recentEntries.recordset,
      weeklyData: weeklyData.recordset,
    });
  } catch (err) {
    console.error('getDashboardStats error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
