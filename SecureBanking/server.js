const path = require('path');
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('crypto');
const crypto = require('crypto');
const db = require('./db');
const { hashPayload, canonicalSerialize, signData, verifySignature, generateRSAKeyPair } = require('./cryptoService');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve static React client build
app.use(express.static(path.join(__dirname, 'client', 'dist')));

// -------------------------------------------------------------
// 1. Account & Identity Management
// -------------------------------------------------------------

// Fetch all bank accounts and their public keys
app.get('/api/accounts', (req, res) => {
  try {
    const users = db.getAllUsers();
    // Return users (in a simulated local demo, client also receives private_key
    // to execute real cryptographic signing on the client-side device)
    res.json({ success: true, accounts: users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create a new bank customer with freshly generated RSA-2048 keys
app.post('/api/accounts/create', (req, res) => {
  try {
    const { name, email, initialDeposit } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Name and email are required.' });
    }

    const { publicKey, privateKey } = generateRSAKeyPair();
    const id = `USR-${Date.now().toString(36).toUpperCase()}`;
    const account_number = `SBIN${Math.floor(100000000 + Math.random() * 900000000)}`;
    const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`;
    const balance = parseFloat(initialDeposit) || 10000.00;

    const userObj = {
      id,
      account_number,
      name,
      email,
      avatar,
      balance,
      public_key: publicKey,
      private_key: privateKey
    };

    db.db.prepare(`
      INSERT INTO users (id, account_number, name, email, avatar, balance, public_key, private_key)
      VALUES (@id, @account_number, @name, @email, @avatar, @balance, @public_key, @private_key)
    `).run(userObj);

    res.json({ success: true, account: userObj });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 2. Client-Side Cryptographic Helper Endpoints
// (Used to simulate device-level cryptographic computations transparently)
// -------------------------------------------------------------

// Simulate client-side payload canonicalization and SHA-256 hashing
app.post('/api/crypto/hash', (req, res) => {
  try {
    const { payload } = req.body;
    const { serialized, hashHex } = hashPayload(payload);
    res.json({ success: true, serialized, hashHex });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Simulate client-side signing using sender's locally held private key
app.post('/api/crypto/sign', (req, res) => {
  try {
    const { payload, privateKeyPem } = req.body;
    const { serialized, hashHex } = hashPayload(payload);
    const { signatureBase64, signatureHex } = signData(serialized, privateKeyPem);
    res.json({
      success: true,
      serialized,
      hashHex,
      signatureBase64,
      signatureHex
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 3. Bank Verification & Transaction Processing Engine
// -------------------------------------------------------------

/**
 * Endpoint where the signed wire payload arrives at the bank server.
 * The bank verifies the digital signature using the registered public key of the sender.
 */
app.post('/api/transactions/process', (req, res) => {
  try {
    const {
      wirePayload,       // The payload as received by the bank (might have been tampered in-flight)
      signatureBase64,   // The signature sent along with the packet
      clientReportedHash,// For UI step comparison
      mitmTampered       // Flag indicating if this was an intentional MITM demo run
    } = req.body;

    if (!wirePayload || !signatureBase64) {
      return res.status(400).json({
        success: false,
        error: 'Missing wirePayload or digital signature.'
      });
    }

    const {
      sender_id,
      sender_acc,
      receiver_id,
      receiver_acc,
      amount,
      timestamp,
      nonce
    } = wirePayload;

    // 1. Identify Sender in Bank PKI Registry
    const sender = db.getUserById(sender_id) || db.getUserByAccount(sender_acc);
    if (!sender) {
      return res.status(404).json({
        success: false,
        verified: false,
        error: 'Sender account not found in bank PKI directory.'
      });
    }

    // 2. Identify Receiver
    const receiver = db.getUserById(receiver_id) || db.getUserByAccount(receiver_acc);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        verified: false,
        error: 'Beneficiary account not found in banking directory.'
      });
    }

    // 3. Recompute SHA-256 Hash on Server
    const { serialized: serverSerialized, hashHex: serverHashHex } = hashPayload(wirePayload);

    // 4. Check for Replay Attack (Nonce check)
    const nonceValid = db.checkAndStoreNonce(nonce, sender.id);
    if (!nonceValid) {
      const txRecord = {
        id: `TX-${Date.now()}`,
        tx_ref: `REF-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        sender_id: sender.id,
        sender_acc: sender.account_number,
        receiver_id: receiver.id,
        receiver_acc: receiver.account_number,
        amount: parseFloat(amount),
        currency: 'INR',
        timestamp: timestamp || Date.now(),
        nonce: nonce || 'UNKNOWN',
        raw_payload: serverSerialized,
        client_hash: clientReportedHash || 'N/A',
        signature_base64: signatureBase64,
        server_hash: serverHashHex,
        verified_status: 'REJECTED_REPLAY_ATTACK',
        failure_reason: 'Cryptographic Nonce previously used. Replay attack detected.',
        mitm_tampered: mitmTampered ? 1 : 0
      };
      db.recordTransaction(txRecord);

      return res.json({
        success: false,
        verified: false,
        stage: 'NONCE_REPLAY_CHECK',
        error: 'REPLAY ATTACK DETECTED: This transaction nonce has already been executed!',
        serverHashHex,
        clientReportedHash,
        senderPublicKey: sender.public_key,
        transaction: txRecord
      });
    }

    // 5. Cryptographic Verification: Verify RSA-SHA256 signature using Sender's Public Key
    let isSignatureValid = false;
    try {
      isSignatureValid = verifySignature(serverSerialized, signatureBase64, sender.public_key);
    } catch (cryptoErr) {
      isSignatureValid = false;
    }

    const txId = `TX-${Date.now()}`;
    const txRef = `REF-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // If signature verification failed
    if (!isSignatureValid) {
      const txRecord = {
        id: txId,
        tx_ref: txRef,
        sender_id: sender.id,
        sender_acc: sender.account_number,
        receiver_id: receiver.id,
        receiver_acc: receiver.account_number,
        amount: parseFloat(amount),
        currency: 'INR',
        timestamp: timestamp || Date.now(),
        nonce,
        raw_payload: serverSerialized,
        client_hash: clientReportedHash || 'N/A',
        signature_base64: signatureBase64,
        server_hash: serverHashHex,
        verified_status: 'REJECTED_SIGNATURE_MISMATCH',
        failure_reason: 'Digital Signature verification failed! Recalculated hash does not match decrypted signature.',
        mitm_tampered: mitmTampered ? 1 : 0
      };
      db.recordTransaction(txRecord);

      return res.json({
        success: false,
        verified: false,
        stage: 'SIGNATURE_VERIFICATION',
        error: 'SIGNATURE VERIFICATION FAILED: Data tampering or unauthorized key signature detected!',
        serverHashHex,
        clientReportedHash,
        senderPublicKey: sender.public_key,
        serverSerialized,
        transaction: txRecord
      });
    }

    // 6. Balance Check
    const txAmount = parseFloat(amount);
    if (sender.balance < txAmount) {
      const txRecord = {
        id: txId,
        tx_ref: txRef,
        sender_id: sender.id,
        sender_acc: sender.account_number,
        receiver_id: receiver.id,
        receiver_acc: receiver.account_number,
        amount: txAmount,
        currency: 'INR',
        timestamp: timestamp || Date.now(),
        nonce,
        raw_payload: serverSerialized,
        client_hash: clientReportedHash || serverHashHex,
        signature_base64: signatureBase64,
        server_hash: serverHashHex,
        verified_status: 'REJECTED_INSUFFICIENT_FUNDS',
        failure_reason: `Insufficient funds. Current balance: ₹${sender.balance.toFixed(2)}`,
        mitm_tampered: mitmTampered ? 1 : 0
      };
      db.recordTransaction(txRecord);

      return res.json({
        success: false,
        verified: true, // Signature was mathematically valid, but business logic failed
        stage: 'LEDGER_SETTLEMENT',
        error: `Transaction rejected: Insufficient balance (Available: ₹${sender.balance.toFixed(2)})`,
        serverHashHex,
        clientReportedHash,
        senderPublicKey: sender.public_key,
        transaction: txRecord
      });
    }

    // 7. Atomic Execution & Ledger Update
    const newSenderBal = sender.balance - txAmount;
    const newReceiverBal = receiver.balance + txAmount;

    db.updateUserBalance(sender.id, newSenderBal);
    db.updateUserBalance(receiver.id, newReceiverBal);

    const txRecord = {
      id: txId,
      tx_ref: txRef,
      sender_id: sender.id,
      sender_acc: sender.account_number,
      receiver_id: receiver.id,
      receiver_acc: receiver.account_number,
      amount: txAmount,
      currency: 'INR',
      timestamp: timestamp || Date.now(),
      nonce,
      raw_payload: serverSerialized,
      client_hash: clientReportedHash || serverHashHex,
      signature_base64: signatureBase64,
      server_hash: serverHashHex,
      verified_status: 'SETTLED_VERIFIED',
      failure_reason: null,
      mitm_tampered: 0
    };
    db.recordTransaction(txRecord);

    return res.json({
      success: true,
      verified: true,
      stage: 'COMPLETE_SUCCESS',
      message: 'Cryptographic signature verified successfully. Funds debited and credited.',
      serverHashHex,
      clientReportedHash,
      senderPublicKey: sender.public_key,
      serverSerialized,
      senderNewBalance: newSenderBal,
      receiverNewBalance: newReceiverBal,
      transaction: txRecord
    });

  } catch (err) {
    console.error('Processing Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 4. Audit & History Endpoints
// -------------------------------------------------------------

// Fetch recent transactions with their crypto metadata
app.get('/api/transactions', (req, res) => {
  try {
    const transactions = db.getTransactions(30);
    res.json({ success: true, transactions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Reset demo state back to default
app.post('/api/admin/reset', (req, res) => {
  try {
    db.resetDemoData();
    res.json({ success: true, message: 'Bank ledger and accounts reset to default seed state.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Catch-all fallback to serve React index.html
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
  }
  next();
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` SECURE BANKING DIGITAL SIGNATURES BACKEND RUNNING`);
  console.log(` Port: http://localhost:${PORT}`);
  console.log(` Cryptographic Module: RSA-2048 & SHA-256 (Native Crypto)`);
  console.log(` Database: SQLite (bank_system.db)`);
  console.log(`====================================================`);
});
