const cron = require('node-cron');
const { sql, getPool } = require('../config/database');

// Run daily at midnight to disable expired members
const startExpiryJob = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('⏰ Running membership expiry check...');
    try {
      const pool = await getPool();

      // Mark expired memberships
      const expiredResult = await pool.request().query(`
        UPDATE Memberships 
        SET Status = 'Expired', UpdatedAt = GETDATE()
        WHERE EndDate < CAST(GETDATE() AS DATE) AND Status = 'Active'
      `);

      // Disable members with no active membership
      const disabledResult = await pool.request().query(`
        UPDATE Members SET IsActive = 0, UpdatedAt = GETDATE()
        WHERE MemberID IN (
          SELECT m.MemberID FROM Members m
          WHERE m.IsActive = 1
          AND NOT EXISTS (
            SELECT 1 FROM Memberships ms 
            WHERE ms.MemberID = m.MemberID 
            AND ms.Status = 'Active' 
            AND ms.EndDate >= CAST(GETDATE() AS DATE)
          )
        )
      `);

      console.log(`✅ Expiry job done: ${expiredResult.rowsAffected[0]} memberships expired, ${disabledResult.rowsAffected[0]} members disabled`);
    } catch (err) {
      console.error('❌ Expiry job failed:', err.message);
    }
  }, { timezone: 'Asia/Manila' }); // Adjust timezone as needed

  console.log('✅ Membership expiry cron job scheduled (runs daily at midnight)');
};

// Manual trigger endpoint
const runExpiryCheck = async () => {
  const pool = await getPool();

  await pool.request().query(`
    UPDATE Memberships 
    SET Status = 'Expired', UpdatedAt = GETDATE()
    WHERE EndDate < CAST(GETDATE() AS DATE) AND Status = 'Active'
  `);

  const result = await pool.request().query(`
    UPDATE Members SET IsActive = 0, UpdatedAt = GETDATE()
    OUTPUT INSERTED.MemberID, INSERTED.FirstName, INSERTED.LastName
    WHERE MemberID IN (
      SELECT m.MemberID FROM Members m
      WHERE m.IsActive = 1
      AND NOT EXISTS (
        SELECT 1 FROM Memberships ms 
        WHERE ms.MemberID = m.MemberID 
        AND ms.Status = 'Active' 
        AND ms.EndDate >= CAST(GETDATE() AS DATE)
      )
    )
  `);

  return result.recordset;
};

module.exports = { startExpiryJob, runExpiryCheck };
