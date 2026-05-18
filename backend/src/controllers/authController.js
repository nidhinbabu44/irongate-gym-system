const { sql, getPool } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required' });
    }

    const pool = await getPool();
    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .query(`SELECT * FROM AdminUsers WHERE Username = @username AND IsActive = 1`);

    if (!result.recordset.length) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const admin = result.recordset[0];
    const valid = await bcrypt.compare(password, admin.PasswordHash);

    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Update last login
    await pool.request()
      .input('id', sql.Int, admin.AdminID)
      .query(`UPDATE AdminUsers SET LastLogin = GETDATE() WHERE AdminID = @id`);

    const token = jwt.sign(
      { adminId: admin.AdminID, username: admin.Username, role: admin.Role, fullName: admin.FullName },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      token,
      admin: { adminId: admin.AdminID, username: admin.Username, role: admin.Role, fullName: admin.FullName, email: admin.Email },
    });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getProfile = async (req, res) => {
  res.json({ success: true, admin: req.admin });
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const pool = await getPool();

    const result = await pool.request()
      .input('id', sql.Int, req.admin.adminId)
      .query(`SELECT PasswordHash FROM AdminUsers WHERE AdminID = @id`);

    const valid = await bcrypt.compare(currentPassword, result.recordset[0].PasswordHash);
    if (!valid) return res.status(400).json({ success: false, message: 'Current password incorrect' });

    const newHash = await bcrypt.hash(newPassword, 12);
    await pool.request()
      .input('id', sql.Int, req.admin.adminId)
      .input('hash', sql.NVarChar, newHash)
      .query(`UPDATE AdminUsers SET PasswordHash = @hash WHERE AdminID = @id`);

    res.json({ success: true, message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
