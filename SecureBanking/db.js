const Database = require('better-sqlite3');
const path = require('path');
const { generateRSAKeyPair } = require('./cryptoService');

const dbPath = path.join(__dirname, 'bank_system.db');
const db = new Database(dbPath);

// Enable WAL mode for high performance
db.pragma('journal_mode = WAL');

// Initialize schema
function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      account_number TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      avatar TEXT NOT NULL,
      balance REAL NOT NULL,
      public_key TEXT NOT NULL,
      private_key TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      tx_ref TEXT UNIQUE NOT NULL,
      sender_id TEXT NOT NULL,
      sender_acc TEXT NOT NULL,
      receiver_id TEXT NOT NULL,
      receiver_acc TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'INR',
      timestamp INTEGER NOT NULL,
      nonce TEXT NOT NULL,
      raw_payload TEXT NOT NULL,
      client_hash TEXT NOT NULL,
      signature_base64 TEXT NOT NULL,
      server_hash TEXT NOT NULL,
      verified_status TEXT NOT NULL,
      failure_reason TEXT,
      mitm_tampered INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(sender_id) REFERENCES users(id),
      FOREIGN KEY(receiver_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS processed_nonces (
      nonce TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed standard demo users if not present
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    seedDefaultUsers();
  }
}

function seedDefaultUsers() {
  console.log('[*] Seeding default banking accounts with RSA-2048 key pairs...');

  const defaultProfiles = [
    {
      id: 'USR-SIDDHARTH-101',
      account_number: 'SBIN004829101',
      name: 'Siddharth',
      email: 'siddharth@securebank.in',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Siddharth',
      balance: 85000.00
    },
    {
      id: 'USR-CHAITANYA-102',
      account_number: 'HDFC009382102',
      name: 'Chaitanya',
      email: 'chaitanya@securebank.in',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Chaitanya',
      balance: 62000.00
    },
    {
      id: 'USR-ROHITH-103',
      account_number: 'ICIC001920103',
      name: 'Rohith',
      email: 'rohith@securebank.in',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Rohith',
      balance: 45000.00
    },
    {
      id: 'USR-SAIM-104',
      account_number: 'AXIS007182104',
      name: 'Saim',
      email: 'saim@securebank.in',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Saim',
      balance: 95000.00
    },
    {
      id: 'USR-ADITYA-105',
      account_number: 'PNB0003819105',
      name: 'Aditya',
      email: 'aditya@securebank.in',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Aditya',
      balance: 54000.00
    }
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (id, account_number, name, email, avatar, balance, public_key, private_key)
    VALUES (@id, @account_number, @name, @email, @avatar, @balance, @public_key, @private_key)
  `);

  for (const profile of defaultProfiles) {
    const { publicKey, privateKey } = generateRSAKeyPair();
    insertUser.run({
      ...profile,
      public_key: publicKey,
      private_key: privateKey
    });
  }
  console.log('[+] Default accounts generated successfully.');
}

function getAllUsers() {
  return db.prepare('SELECT id, account_number, name, email, avatar, balance, public_key, private_key FROM users').all();
}

function getUserById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

function getUserByAccount(accountNumber) {
  return db.prepare('SELECT * FROM users WHERE account_number = ?').get(accountNumber);
}

function updateUserBalance(userId, newBalance) {
  return db.prepare('UPDATE users SET balance = ? WHERE id = ?').run(newBalance, userId);
}

function recordTransaction(txData) {
  const insertTx = db.prepare(`
    INSERT INTO transactions (
      id, tx_ref, sender_id, sender_acc, receiver_id, receiver_acc,
      amount, currency, timestamp, nonce, raw_payload, client_hash,
      signature_base64, server_hash, verified_status, failure_reason, mitm_tampered
    ) VALUES (
      @id, @tx_ref, @sender_id, @sender_acc, @receiver_id, @receiver_acc,
      @amount, @currency, @timestamp, @nonce, @raw_payload, @client_hash,
      @signature_base64, @server_hash, @verified_status, @failure_reason, @mitm_tampered
    )
  `);
  return insertTx.run(txData);
}

function getTransactions(limit = 20) {
  return db.prepare('SELECT * FROM transactions ORDER BY created_at DESC LIMIT ?').all(limit);
}

function checkAndStoreNonce(nonce, senderId) {
  const exists = db.prepare('SELECT * FROM processed_nonces WHERE nonce = ?').get(nonce);
  if (exists) {
    return false; // Replay attack detected
  }
  db.prepare('INSERT INTO processed_nonces (nonce, sender_id) VALUES (?, ?)').run(nonce, senderId);
  return true;
}

function resetDemoData() {
  db.exec(`
    DELETE FROM transactions;
    DELETE FROM processed_nonces;
    DELETE FROM users;
  `);
  seedDefaultUsers();
}

initDatabase();

module.exports = {
  db,
  getAllUsers,
  getUserById,
  getUserByAccount,
  updateUserBalance,
  recordTransaction,
  getTransactions,
  checkAndStoreNonce,
  resetDemoData
};

