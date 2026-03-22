const express = require('express');
const router = express.Router();
const { authenticateToken } = require('./auth');

// ============================================================
// POST /api/bookings (Public - no auth needed)
// ============================================================

router.post('/', (req, res) => {
  try {
    const db = req.app.locals.db;
    const { name, phone, service_type, details, booking_date } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'A valid name (at least 2 characters) is required' });
    }

    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    if (!/^[\+]?[0-9]{10,15}$/.test(cleanPhone)) {
      return res.status(400).json({ error: 'Please enter a valid phone number (10-15 digits)' });
    }

    let validatedDate = null;
    if (booking_date) {
      const dateObj = new Date(booking_date);
      if (!isNaN(dateObj.getTime())) {
        validatedDate = booking_date;
      }
    }

    const finalName    = name.trim();
    const finalService = service_type ? service_type.trim() : 'General Enquiry';
    const finalDetails = details || '';
    const finalDate    = validatedDate || new Date().toISOString().split('T')[0];

    db.prepare(
      "INSERT INTO bookings (name, phone, service_type, details, booking_date, status) VALUES (?, ?, ?, ?, ?, 'pending')"
    ).run(finalName, cleanPhone, finalService, finalDetails, finalDate);

    console.log(`New booking: ${finalName} - ${finalService}`);

    res.status(201).json({
      message: 'Booking submitted successfully',
      booking: {
        name: finalName,
        phone: cleanPhone,
        service_type: finalService,
        booking_date: finalDate
      }
    });
  } catch (err) {
    console.error('POST /bookings error:', err);
    res.status(500).json({ error: 'Failed to submit booking. Please try again.' });
  }
});

// ============================================================
// GET /api/bookings (Auth required)
// ============================================================

router.get('/', authenticateToken, (req, res) => {
  try {
    const db = req.app.locals.db;
    const { status, from_date, to_date } = req.query;

    let query = 'SELECT * FROM bookings';
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (from_date) {
      conditions.push('booking_date >= ?');
      params.push(from_date);
    }

    if (to_date) {
      conditions.push('booking_date <= ?');
      params.push(to_date);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY id DESC';

    const bookings = db.prepare(query).all(...params);
    res.json(bookings);
  } catch (err) {
    console.error('GET /bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// ============================================================
// GET /api/bookings/:id (Auth required)
// ============================================================

router.get('/:id', authenticateToken, (req, res) => {
  try {
    const db = req.app.locals.db;
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// ============================================================
// PUT /api/bookings/:id/status (Auth required)
// ============================================================

router.put('/:id/status', authenticateToken, (req, res) => {
  try {
    const db = req.app.locals.db;
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const existing = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Booking not found' });

    db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, req.params.id);
    const updated = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update booking status' });
  }
});

module.exports = router;
