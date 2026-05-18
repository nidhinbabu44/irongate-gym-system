const { sql, getPool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

// Generate unique member code
const generateMemberCode = () => {
  const year = new Date().getFullYear().toString().slice(-2);
  const rand = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `GYM${year}${rand}`;
};

// GET all members
exports.getMembers = async (req, res) => {
  try {
    const pool = await getPool();
    const { search, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        m.MemberID, m.MemberCode, m.FirstName, m.LastName, m.Email, m.Phone,
        m.Gender, m.PhotoPath, m.IsActive, m.CreatedAt,
        ms.EndDate AS MembershipExpiry, ms.Status AS MembershipStatus,
        p.PlanName,
        CASE WHEN ms.EndDate >= CAST(GETDATE() AS DATE) AND ms.Status = 'Active' THEN 1 ELSE 0 END AS HasActiveMembership
      FROM Members m
      LEFT JOIN (
        SELECT MemberID, PlanID, EndDate, Status,
               ROW_NUMBER() OVER (PARTITION BY MemberID ORDER BY EndDate DESC) AS rn
        FROM Memberships
      ) ms ON m.MemberID = ms.MemberID AND ms.rn = 1
      LEFT JOIN MembershipPlans p ON ms.PlanID = p.PlanID
      WHERE 1=1
    `;

    const request = pool.request();

    if (search) {
      query += ` AND (m.FirstName LIKE @search OR m.LastName LIKE @search OR m.MemberCode LIKE @search OR m.Email LIKE @search OR m.Phone LIKE @search)`;
      request.input('search', sql.NVarChar, `%${search}%`);
    }
    if (status === 'active') query += ` AND m.IsActive = 1`;
    if (status === 'inactive') query += ` AND m.IsActive = 0`;
    if (status === 'expired') query += ` AND (ms.EndDate < CAST(GETDATE() AS DATE) OR ms.EndDate IS NULL)`;

    // Count
    const countResult = await request.query(`SELECT COUNT(*) AS total FROM (${query}) AS sub`);
    const total = countResult.recordset[0].total;

    query += ` ORDER BY m.CreatedAt DESC OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;

    const result = await pool.request()
      .input('search', sql.NVarChar, search ? `%${search}%` : '%')
      .query(query);

    res.json({ success: true, data: result.recordset, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error('getMembers error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET member by ID
exports.getMemberById = async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;

    const member = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT m.*,
          ms.StartDate AS MembershipStart, ms.EndDate AS MembershipExpiry,
          ms.Status AS MembershipStatus, p.PlanName, p.DurationDays
        FROM Members m
        LEFT JOIN (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY MemberID ORDER BY EndDate DESC) AS rn
          FROM Memberships
        ) ms ON m.MemberID = ms.MemberID AND ms.rn = 1
        LEFT JOIN MembershipPlans p ON ms.PlanID = p.PlanID
        WHERE m.MemberID = @id
      `);

    if (!member.recordset.length) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    // Payment history
    const payments = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT py.*, pl.PlanName 
        FROM Payments py
        JOIN MembershipPlans pl ON py.PlanID = pl.PlanID
        WHERE py.MemberID = @id
        ORDER BY py.PaymentDate DESC
      `);

    // Entry history (last 20)
    const entries = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT TOP 20 * FROM EntryLogs WHERE MemberID = @id ORDER BY EntryTime DESC
      `);

    res.json({
      success: true,
      data: member.recordset[0],
      payments: payments.recordset,
      entries: entries.recordset,
    });
  } catch (err) {
    console.error('getMemberById error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// CREATE member
exports.createMember = async (req, res) => {
  try {
    const pool = await getPool();
    const { firstName, lastName, email, phone, dateOfBirth, gender, address, emergencyContact, notes, faceDescriptor } = req.body;

    const memberCode = generateMemberCode();
    const photoPath = req.file ? `/uploads/${req.file.filename}` : null;

    const result = await pool.request()
      .input('memberCode', sql.NVarChar, memberCode)
      .input('firstName', sql.NVarChar, firstName)
      .input('lastName', sql.NVarChar, lastName)
      .input('email', sql.NVarChar, email || null)
      .input('phone', sql.NVarChar, phone || null)
      .input('dob', sql.Date, dateOfBirth || null)
      .input('gender', sql.NVarChar, gender || null)
      .input('address', sql.NVarChar, address || null)
      .input('emergency', sql.NVarChar, emergencyContact || null)
      .input('photoPath', sql.NVarChar, photoPath)
      .input('faceDescriptor', sql.NVarChar, faceDescriptor || null)
      .input('notes', sql.NVarChar, notes || null)
      .query(`
        INSERT INTO Members (MemberCode, FirstName, LastName, Email, Phone, DateOfBirth, Gender, Address, EmergencyContact, PhotoPath, FaceDescriptor, Notes)
        OUTPUT INSERTED.*
        VALUES (@memberCode, @firstName, @lastName, @email, @phone, @dob, @gender, @address, @emergency, @photoPath, @faceDescriptor, @notes)
      `);

    res.status(201).json({ success: true, data: result.recordset[0], message: 'Member created successfully' });
  } catch (err) {
    console.error('createMember error:', err);
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE member
exports.updateMember = async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    const { firstName, lastName, email, phone, dateOfBirth, gender, address, emergencyContact, notes, faceDescriptor, isActive } = req.body;

    const photoPath = req.file ? `/uploads/${req.file.filename}` : undefined;

    let query = `
      UPDATE Members SET
        FirstName = @firstName, LastName = @lastName, Email = @email,
        Phone = @phone, DateOfBirth = @dob, Gender = @gender,
        Address = @address, EmergencyContact = @emergency,
        Notes = @notes, UpdatedAt = GETDATE()
    `;

    const request = pool.request()
      .input('id', sql.Int, id)
      .input('firstName', sql.NVarChar, firstName)
      .input('lastName', sql.NVarChar, lastName)
      .input('email', sql.NVarChar, email || null)
      .input('phone', sql.NVarChar, phone || null)
      .input('dob', sql.Date, dateOfBirth || null)
      .input('gender', sql.NVarChar, gender || null)
      .input('address', sql.NVarChar, address || null)
      .input('emergency', sql.NVarChar, emergencyContact || null)
      .input('notes', sql.NVarChar, notes || null);

    if (faceDescriptor !== undefined) {
      query += `, FaceDescriptor = @faceDescriptor`;
      request.input('faceDescriptor', sql.NVarChar, faceDescriptor);
    }
    if (photoPath !== undefined) {
      query += `, PhotoPath = @photoPath`;
      request.input('photoPath', sql.NVarChar, photoPath);
    }
    if (isActive !== undefined) {
      query += `, IsActive = @isActive`;
      request.input('isActive', sql.Bit, isActive ? 1 : 0);
    }

    query += ` WHERE MemberID = @id`;

    await request.query(query);
    res.json({ success: true, message: 'Member updated successfully' });
  } catch (err) {
    console.error('updateMember error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE face descriptor only
exports.updateFaceDescriptor = async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    const { faceDescriptor } = req.body;

    await pool.request()
      .input('id', sql.Int, id)
      .input('faceDescriptor', sql.NVarChar, faceDescriptor)
      .query(`UPDATE Members SET FaceDescriptor = @faceDescriptor, UpdatedAt = GETDATE() WHERE MemberID = @id`);

    res.json({ success: true, message: 'Face data updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE member (soft delete)
exports.deleteMember = async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`UPDATE Members SET IsActive = 0, UpdatedAt = GETDATE() WHERE MemberID = @id`);
    res.json({ success: true, message: 'Member deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET all face descriptors for recognition
exports.getFaceDescriptors = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT m.MemberID, m.MemberCode, m.FirstName, m.LastName, m.PhotoPath,
             m.FaceDescriptor, m.IsActive,
             CASE WHEN ms.EndDate >= CAST(GETDATE() AS DATE) AND ms.Status = 'Active' THEN 1 ELSE 0 END AS HasActiveMembership,
             ms.EndDate AS MembershipExpiry
      FROM Members m
      LEFT JOIN (
        SELECT MemberID, EndDate, Status,
               ROW_NUMBER() OVER (PARTITION BY MemberID ORDER BY EndDate DESC) AS rn
        FROM Memberships
      ) ms ON m.MemberID = ms.MemberID AND ms.rn = 1
      WHERE m.IsActive = 1 AND m.FaceDescriptor IS NOT NULL
    `);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
