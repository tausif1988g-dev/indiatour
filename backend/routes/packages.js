const express = require('express');
const router = express.Router();
const { authenticateToken } = require('./auth');

// ============================================================
// GET /api/packages
// Supports: ?category=Kolkata&limit=3
// ============================================================

router.get('/', (req, res) => {
  try {
    const db = req.app.locals.db;
    const { category, limit } = req.query;

    let query = 'SELECT * FROM packages WHERE active = 1';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY id ASC';

    if (limit && !isNaN(parseInt(limit))) {
      query += ` LIMIT ${parseInt(limit)}`;
    }

    const packages = db.prepare(query).all(...params);
    res.json(packages);
  } catch (err) {
    console.error('GET /packages error:', err);
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

// ============================================================
// GET /api/packages/:id
// ============================================================

router.get('/:id', (req, res) => {
  try {
    const db = req.app.locals.db;
    const pkg = db.prepare('SELECT * FROM packages WHERE id = ? AND active = 1').get(req.params.id);
    if (!pkg) return res.status(404).json({ error: 'Package not found' });
    res.json(pkg);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch package' });
  }
});

// ============================================================
// POST /api/packages (Auth required)
// ============================================================

router.post('/', authenticateToken, (req, res) => {
  try {
    const db = req.app.locals.db;
    const { name, category, price, duration, description, image_url } = req.body;

    if (!name || !category || price === undefined || !duration) {
      return res.status(400).json({ error: 'Name, category, price, and duration are required' });
    }

    const validCategories = ['Kolkata', 'Travel', 'Umrah', 'Hajj'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: `Category must be one of: ${validCategories.join(', ')}` });
    }

    if (isNaN(parseInt(price)) || parseInt(price) < 0) {
      return res.status(400).json({ error: 'Price must be a non-negative number' });
    }

    const result = db.prepare(
      'INSERT INTO packages (name, category, price, duration, description, image_url) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(
      name.trim(),
      category,
      parseInt(price),
      duration.trim(),
      description ? description.trim() : '',
      image_url ? image_url.trim() : null
    );

    const newPackage = db.prepare('SELECT * FROM packages WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newPackage);
  } catch (err) {
    console.error('POST /packages error:', err);
    res.status(500).json({ error: 'Failed to create package' });
  }
});

// ============================================================
// PUT /api/packages/:id (Auth required)
// ============================================================

router.put('/:id', authenticateToken, (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM packages WHERE id = ?').get(id);

    if (!existing) {
      return res.status(404).json({ error: 'Package not found' });
    }

    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name.trim();
    if (req.body.category !== undefined) {
      const validCategories = ['Kolkata', 'Travel', 'Umrah', 'Hajj'];
      if (!validCategories.includes(req.body.category)) {
        return res.status(400).json({ error: `Category must be one of: ${validCategories.join(', ')}` });
      }
      updates.category = req.body.category;
    }
    if (req.body.price !== undefined) {
      if (isNaN(parseInt(req.body.price)) || parseInt(req.body.price) < 0) {
        return res.status(400).json({ error: 'Price must be a non-negative number' });
      }
      updates.price = parseInt(req.body.price);
    }
    if (req.body.duration !== undefined) updates.duration = req.body.duration.trim();
    if (req.body.description !== undefined) updates.description = req.body.description.trim();
    if (req.body.image_url !== undefined) updates.image_url = req.body.image_url;
    if (req.body.active !== undefined) updates.active = req.body.active ? 1 : 0;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.updated_at = new Date().toISOString();

    const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(updates), id];

    db.prepare(`UPDATE packages SET ${setClauses} WHERE id = ?`).run(...values);

    const updated = db.prepare('SELECT * FROM packages WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    console.error('PUT /packages/:id error:', err);
    res.status(500).json({ error: 'Failed to update package' });
  }
});

// ============================================================
// DELETE /api/packages/:id (Auth required)
// ============================================================

router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM packages WHERE id = ?').get(id);

    if (!existing) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // Soft delete
    db.prepare('UPDATE packages SET active = 0 WHERE id = ?').run(id);

    res.json({ message: 'Package deleted successfully', id: parseInt(id) });
  } catch (err) {
    console.error('DELETE /packages/:id error:', err);
    res.status(500).json({ error: 'Failed to delete package' });
  }
});

module.exports = router;
