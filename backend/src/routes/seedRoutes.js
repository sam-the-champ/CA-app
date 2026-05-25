const express = require('express');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

const router = express.Router();

/**
 * POST /api/seed
 * Seeds the database with an admin user if one doesn't exist.
 * Requires SEED_TOKEN header for security.
 */
router.post('/', async (req, res) => {
  try {
    // Verify seed token from header
    const seedToken = req.headers['x-seed-token'];
    const expectedToken = process.env.SEED_TOKEN;

    if (!expectedToken) {
      return res.status(500).json({
        success: false,
        message: 'SEED_TOKEN not configured on server',
      });
    }

    if (seedToken !== expectedToken) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid seed token',
      });
    }

    // Check if admin already exists
    const existing = await Admin.findOne({ username: process.env.ADMIN_USERNAME });
    if (existing) {
      return res.status(200).json({
        success: true,
        message: '⚠️  Admin already exists. Skipping seed.',
      });
    }

    // Create new admin with hashed password
    const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
    const admin = await Admin.create({
      username: process.env.ADMIN_USERNAME,
      password: hashed,
    });

    res.status(201).json({
      success: true,
      message: `✅ Admin created: ${admin.username}`,
      admin: {
        id: admin._id,
        username: admin.username,
      },
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({
      success: false,
      message: 'Seed operation failed',
      error: error.message,
    });
  }
});

module.exports = router;
