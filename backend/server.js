require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const { initDatabase } = require('./db/database');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logger
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
  });
}

// ============================================================
// SERVE STATIC FRONTEND FILES
// ============================================================

const frontendPath = path.join(__dirname, '..');
app.use(express.static(frontendPath));

// Serve Font Awesome locally
app.use('/fa', express.static(path.join(__dirname, 'node_modules/@fortawesome/fontawesome-free')));

// ============================================================
// START: Initialize DB then mount routes
// ============================================================

async function startServer() {
  console.log('Initializing database...');

  try {
    const db = await initDatabase();

    // Make db available to routes via app.locals
    app.locals.db = db;

    // Health check
    app.get('/api/health', (req, res) => {
      res.json({
        status: 'OK',
        message: 'India Tours & Travels API is running',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      });
    });

    // Auth routes
    const { router: authRouter } = require('./routes/auth');
    app.use('/api', authRouter);

    // Packages routes
    const packagesRouter = require('./routes/packages');
    app.use('/api/packages', packagesRouter);

    // Bookings routes
    const bookingsRouter = require('./routes/bookings');
    app.use('/api/bookings', bookingsRouter);

    // Frontend catch-all
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(frontendPath, 'index.html'));
      } else {
        res.status(404).json({ error: 'API endpoint not found' });
      }
    });

    // Error handler
    app.use((err, req, res, next) => {
      console.error('Unhandled error:', err);
      if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'Invalid JSON in request body' });
      }
      res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : err.message || 'Internal server error'
      });
    });

    app.listen(PORT, () => {
      console.log('');
      console.log('╔════════════════════════════════════════════╗');
      console.log('║     India Tours & Travels - Backend        ║');
      console.log('╠════════════════════════════════════════════╣');
      console.log(`║  Server:  http://localhost:${PORT}            ║`);
      console.log(`║  API:     http://localhost:${PORT}/api/health  ║`);
      console.log(`║  Admin:   http://localhost:${PORT}/admin/login ║`);
      console.log('╠════════════════════════════════════════════╣');
      console.log('║  Admin Login:                              ║');
      console.log('║  Email:    admin@indiatours.com            ║');
      console.log('║  Password: admin123                        ║');
      console.log('╚════════════════════════════════════════════╝');
      console.log('');
    });

  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

module.exports = app;
