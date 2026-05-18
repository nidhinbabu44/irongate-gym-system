const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authMiddleware } = require('../middleware/auth');
const authController = require('../controllers/authController');
const memberController = require('../controllers/memberController');
const paymentController = require('../controllers/paymentController');
const entryController = require('../controllers/entryController');
const { runExpiryCheck } = require('../services/expiryService');

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `member_${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  },
});

// === AUTH ===
router.post('/auth/login', authController.login);
router.get('/auth/profile', authMiddleware, authController.getProfile);
router.put('/auth/change-password', authMiddleware, authController.changePassword);

// === MEMBERS ===
router.get('/members', authMiddleware, memberController.getMembers);
router.get('/members/faces', memberController.getFaceDescriptors); // Public for face recognition kiosk
router.get('/members/:id', authMiddleware, memberController.getMemberById);
router.post('/members', authMiddleware, upload.single('photo'), memberController.createMember);
router.put('/members/:id', authMiddleware, upload.single('photo'), memberController.updateMember);
router.put('/members/:id/face', authMiddleware, memberController.updateFaceDescriptor);
router.delete('/members/:id', authMiddleware, memberController.deleteMember);

// === PAYMENTS ===
router.get('/payments', authMiddleware, paymentController.getPayments);
router.post('/payments', authMiddleware, paymentController.recordPayment);
router.get('/plans', paymentController.getPlans);
router.post('/plans', authMiddleware, paymentController.savePlan);

// === ENTRY ===
router.post('/entry/verify', entryController.verifyEntry);
router.get('/entry/logs', authMiddleware, entryController.getEntryLogs);
router.get('/dashboard/stats', authMiddleware, entryController.getDashboardStats);

// === ADMIN ===
router.post('/admin/run-expiry', authMiddleware, async (req, res) => {
  try {
    const disabled = await runExpiryCheck();
    res.json({ success: true, message: `Expiry check complete. ${disabled.length} members disabled.`, disabled });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
