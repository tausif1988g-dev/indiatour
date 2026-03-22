const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Resolve DB path
const dbPath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, 'india_tours.db');

// Ensure directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// We use sql.js (pure JavaScript SQLite via WebAssembly)
const initSqlJs = require('sql.js');

// We wrap everything in an async initializer and export a promise
let dbInstance = null;

async function initDatabase() {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs();

  // Load existing DB from file or create new
  let db;
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
    console.log(`Database loaded from: ${dbPath}`);
  } else {
    db = new SQL.Database();
    console.log(`New database created at: ${dbPath}`);
  }

  // Helper to persist DB to file after every write
  function persist() {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }

  // ============================================================
  // CREATE TABLES
  // ============================================================

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price INTEGER NOT NULL,
      duration TEXT NOT NULL,
      description TEXT,
      image_url TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      service_type TEXT,
      details TEXT,
      booking_date TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  persist();

  // ============================================================
  // SEED ADMIN USER
  // ============================================================

  const adminCheck = db.exec("SELECT id FROM users WHERE email = 'admin@indiatours.com'");
  if (!adminCheck.length || !adminCheck[0].values.length) {
    console.log('Seeding admin user...');
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.run(
      "INSERT INTO users (email, password, role) VALUES (?, ?, 'admin')",
      ['admin@indiatours.com', hashedPassword]
    );
    persist();
    console.log('Admin user created: admin@indiatours.com / admin123');
  }

  // ============================================================
  // SEED PACKAGES
  // ============================================================

  const pkgCountResult = db.exec('SELECT COUNT(*) as cnt FROM packages');
  const pkgCount = pkgCountResult[0]?.values[0][0] || 0;

  if (pkgCount === 0) {
    console.log('Seeding packages...');
    const packages = [
      ['1 Day Kolkata City Tour', 'Kolkata', 1500, '1 day', 'Explore Victoria Memorial, Howrah Bridge, Park Street and more in a single exciting day in the City of Joy.'],
      ['3 Days Heritage Tour', 'Kolkata', 4500, '3 days', 'Heritage walk through North Kolkata, colonial architecture, renowned museums, ancient temples, and local bazaars.'],
      ['Sundarbans Weekend Tour', 'Kolkata', 6000, '2 days', 'Explore the magical mangrove forests of Sundarbans, the habitat of the Royal Bengal Tiger with boat safaris and nature walks.'],
      ['5 Days Darjeeling + Kolkata', 'Travel', 12000, '5 days', 'Magical journey combining tea gardens, the famous toy train, breathtaking mountain views, and the vibrant culture of Kolkata.'],
      ['Economy Umrah Package', 'Umrah', 85000, '15 days', 'Economy Umrah package with economy hotels, return flights from Kolkata, visa processing included. Guided by experienced scholars.'],
      ['Deluxe Umrah Package', 'Umrah', 120000, '21 days', '4-star hotels within walking distance of Masjid al-Haram, return flights, complete visa assistance, and Ziyarat included.'],
      ['Premium Umrah Package', 'Umrah', 180000, '21 days', '5-star hotels near Haram, business class flights, premium service throughout, personal guide, and VIP Ziyarat tours.'],
      ['Economy Hajj Package', 'Hajj', 350000, '40 days', 'Complete Hajj package including accommodation in Mina and Arafat, return flights, visa, guidance by experienced Islamic scholars.'],
      ['Premium Hajj Package', 'Hajj', 500000, '40 days', 'Premium Hajj experience with 5-star accommodation, business class flights, dedicated personal guide, and premium facilities throughout.'],
    ];

    const insertStmt = db.prepare(
      'INSERT INTO packages (name, category, price, duration, description) VALUES (?, ?, ?, ?, ?)'
    );

    for (const pkg of packages) {
      insertStmt.run(pkg);
    }
    insertStmt.free();
    persist();
    console.log(`Seeded ${packages.length} packages.`);
  }

  // ============================================================
  // WRAPPER API (mimics better-sqlite3 synchronous API)
  // ============================================================

  const wrapper = {
    _db: db,
    _persist: persist,

    prepare(sql) {
      return {
        _sql: sql,
        _db: db,
        _persist: persist,

        run(...params) {
          const flatParams = params.flat();
          db.run(sql, flatParams);
          persist();
          // Get last insert rowid
          const res = db.exec('SELECT last_insert_rowid() as id');
          return { lastInsertRowid: res[0]?.values[0][0] };
        },

        get(...params) {
          const flatParams = params.flat();
          const stmt = db.prepare(sql);
          stmt.bind(flatParams);
          if (stmt.step()) {
            const cols = stmt.getColumnNames();
            const vals = stmt.get();
            stmt.free();
            const obj = {};
            cols.forEach((col, i) => { obj[col] = vals[i]; });
            return obj;
          }
          stmt.free();
          return null;
        },

        all(...params) {
          const flatParams = params.flat();
          const results = [];
          const stmt = db.prepare(sql);
          stmt.bind(flatParams);
          while (stmt.step()) {
            const cols = stmt.getColumnNames();
            const vals = stmt.get();
            const obj = {};
            cols.forEach((col, i) => { obj[col] = vals[i]; });
            results.push(obj);
          }
          stmt.free();
          return results;
        },

        free() {} // no-op for compatibility
      };
    },

    exec(sql) {
      db.run(sql);
      persist();
    },

    pragma() {} // no-op
  };

  dbInstance = wrapper;
  return wrapper;
}

// Export a proxy that initializes on first use
// Routes call db.prepare(...) synchronously but we need async init
// We handle this by doing async init in server.js before starting

module.exports = { initDatabase };
