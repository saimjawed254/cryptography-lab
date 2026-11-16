# Secure Banking Transactions using Digital Signatures
**7th-Semester B.Tech Applied Cryptography & Network Security Lab Project**

A full-stack, local prototype demonstrating **Public-Key Cryptography (RSA-2048)**, **Cryptographic Hashing (SHA-256)**, **PKCS#1 v1.5 Digital Signatures**, and **Man-in-the-Middle (MITM) Tamper Detection** for secure banking fund transfers.

---

## 1. Project Overview & Architecture

When a customer initiates a fund transfer, the transaction must satisfy three fundamental information security pillars:
1. **Authentication:** Proving the request genuinely originates from the legitimate account holder.
2. **Integrity:** Ensuring in-transit data (recipient, amount, timestamp) cannot be modified without immediate detection.
3. **Non-Repudiation:** The sender cannot claim they never authorized the transfer.

```
                      CLIENT (SENDER)                                          BANK SERVER / PKI
+---------------------------------------------------------+         +---------------------------------------+
| 1. Formulate Raw Transaction Object                     |         | 1. Look up Sender Public Key (e, n)   |
| 2. Canonical JSON Serialization                         |         | 2. Check Replay Attack (Nonce Cache)  |
| 3. SHA-256 Hash Digest: H1 = SHA256(CanonicalPayload)   |         | 3. Recompute Hash: H2 = SHA256(Wire)  |
| 4. RSA Signature: S = (H1 ^ d) mod n                    |         | 4. Decrypt & Verify: (S ^ e) mod n    |
+---------------------------------------------------------+         +---------------------------------------+
                            |                                                           ▲
                            ▼                                                           │
             [ IN-TRANSIT NETWORK WIRE PACKET ] ────────────────────────────────────────┘
                   { wirePayload, signature }
                            │
               (Optional MITM Attack Injected)
               - Alter Amount: 1,000 -> 15,000
               - Divert Beneficiary: HACK999999
               - Corrupt Signature Bytes
```

---

## 2. Interactive Cryptographic Stepper (UI Walkthrough)

During lab evaluation, the professor can click **"Launch Cryptographic Stepper & Transit"** to observe data transformation across 5 distinct steps:

1. **Step 1: Canonical Serialization:** Displays the raw parameters and lexicographically sorted JSON string so both sender and bank process identical byte streams.
2. **Step 2: SHA-256 Digest:** Demonstrates message compression from arbitrary length down to a fixed 256-bit (64 hex character) digest ($H_1$).
3. **Step 3: RSA-2048 Signing:** Applies the sender's private key using the PKCS#1 v1.5 padding standard ($S = H_1^d \pmod n$) to generate the 2048-bit base64 signature.
4. **Step 4: Wire Transit & MITM Playground:** Gives interactive buttons to simulate Man-in-the-Middle attacks (Amount Tampering, Receiver Diversion, Signature Bit-flipping).
5. **Step 5: Bank Verification & Ledger Settlement:** Displays the side-by-side hash comparison ($H_{\text{client}}$ vs $H_{\text{server}}$), public-key verification result, and atomic balance debit/credit.

---

## 3. Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti.
- **Backend:** Node.js, Express.
- **Cryptography Engine:** Node.js native `node:crypto` (RSA-2048 keygen, SHA-256 digest, PKCS#1 v1.5 signing & verification).
- **Database:** SQLite (`better-sqlite3`) storing bank accounts, public keys, transaction audit logs, and processed nonces.

---

## 4. How to Run Locally

### Quick Start (Single Command):
From the project folder:
```powershell
cd SecureBankingDigitalSignatures
npm run start
```
Then open your browser at **[http://localhost:5000](http://localhost:5000)**.

*(Both the Express API and the pre-built React frontend are served together on port 5000).*

### Development Mode (Concurrent):
If you want to edit React code with Vite hot-reloading:
- Terminal 1 (Backend): `node server.js` (Runs on port 5000)
- Terminal 2 (Frontend): `cd client && npm run dev` (Runs on port 3000 with auto-proxy)

---

## 5. Seed Demonstration Accounts

The system automatically initializes with pre-configured accounts and freshly generated RSA-2048 key pairs:
- **Alice Sharma** (`SBIN004829101`) — Balance: ₹75,000.00
- **Bob Verma** (`HDFC009382102`) — Balance: ₹32,000.00
- **Charlie Patel** (`ICIC001920103`) — Balance: ₹18,500.00

*Click **"View Keys"** on any account card to inspect or copy their PEM-formatted Public Key and Private Key.*

