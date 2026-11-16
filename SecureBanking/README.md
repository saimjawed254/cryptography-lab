# Secure Banking Transactions using Digital Signatures
**Applied Cryptography — 7th Semester B.Tech Project**

A full-stack, local prototype demonstrating **Public-Key Cryptography (RSA-2048)**, **Cryptographic Hashing (SHA-256)**, **PKCS#1 v1.5 Digital Signatures**, and **Man-in-the-Middle (MITM) Tamper Detection** for secure banking fund transfers.

---

## 👥 Project Team Members

| S.No | Name | Roll Number | Role |
| :---: | :--- | :---: | :--- |
| 1 | **Chaitanya** | `2306044` | Cryptographic Stepper & MITM Playground |
| 2 | **Rohith** | `2306045` | Database & Nonce Replay Mitigation |
| 3 | **Siddharth** | `2306046` | PKI Key Generation & Verification Engine |
| 4 | **Aditya** | `2306047` | UI / UX & Forensic Audit Ledger |
| 5 | **Saim** | `2306049` | Core Signing Pipeline & Integration |

---

## 🏛️ Project Overview & Architecture

When a customer initiates an electronic fund transfer, the transaction must satisfy three fundamental information security pillars:
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
               - Alter Amount: ₹2,500 -> ₹30,000
               - Divert Beneficiary: HACK999999999
               - Corrupt Signature Bytes
```

---

## 🔬 Interactive Cryptographic Stepper (UI Walkthrough)

During lab evaluation, the professor can click **"Launch Cryptographic Stepper & Transit"** to observe data transformation across 5 distinct steps:

1. **Step 1: Canonical Serialization:** Displays the raw parameters and lexicographically sorted JSON string so both sender and bank process identical byte streams.
2. **Step 2: SHA-256 Digest:** Demonstrates message compression from arbitrary length down to a fixed 256-bit (64 hex character) digest ($H_1$).
3. **Step 3: RSA-2048 Signing:** Applies the sender's private key using the PKCS#1 v1.5 padding standard ($S = H_1^d \pmod n$) to generate the 2048-bit base64 signature.
4. **Step 4: Wire Transit & MITM Playground:** Provides interactive attack simulation buttons:
   - **Amount Tampering:** Alters amount in transit (e.g., ₹2,500 $\to$ ₹30,000).
   - **Receiver Spoofing:** Diverts funds to an attacker's account (`HACK999999999`).
   - **Signature Bit-Flipping:** Corrupts raw signature bytes.
5. **Step 5: Bank Verification & Ledger Settlement:** Displays side-by-side hash comparison ($H_{\text{client}}$ vs $H_{\text{server}}$), public-key verification verdict, and atomic balance debit/credit.

---

## 💻 Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti (Light Theme).
- **Backend:** Node.js, Express.
- **Cryptography Engine:** Node.js native `node:crypto` (RSA-2048 keygen, SHA-256 digest, PKCS#1 v1.5 signing & verification).
- **Database:** SQLite (`better-sqlite3`) storing bank accounts, public keys, transaction audit logs, and processed nonces.

---

## 🚀 How to Run Locally

### Quick Start (Single Command):
From the `SecureBanking` folder:
```powershell
cd SecureBanking
npm run start
```
Then open your browser at **[http://localhost:5000](http://localhost:5000)**.

*(Both the Express API and the pre-built React frontend are served together on port 5000).*

### Development Mode (Concurrent):
If you want to edit React code with Vite hot-reloading:
- Terminal 1 (Backend): `node server.js` (Runs on port 5000)
- Terminal 2 (Frontend): `cd client && npm run dev` (Runs on port 3000 with auto-proxy)

---

## 🏦 Seed Demonstration Accounts

The system automatically initializes with 5 pre-configured accounts and freshly generated RSA-2048 key pairs:

| Account Holder | Account Number | Bank | Initial Balance | Key Type |
| :--- | :--- | :--- | :---: | :---: |
| **Siddharth** | `SBIN004829101` | SBI | ₹85,000.00 | RSA-2048 / SHA-256 |
| **Chaitanya** | `HDFC009382102` | HDFC | ₹62,000.00 | RSA-2048 / SHA-256 |
| **Rohith** | `ICIC001920103` | ICICI | ₹45,000.00 | RSA-2048 / SHA-256 |
| **Saim** | `AXIS007182104` | Axis | ₹95,000.00 | RSA-2048 / SHA-256 |
| **Aditya** | `PNB0003819105` | PNB | ₹54,000.00 | RSA-2048 / SHA-256 |

*Click **"Keys"** on any account card in the UI to inspect or copy their PEM-formatted Public Key and Private Key.*

---

## 📑 Academic Report Documentation

The formal academic project report is available in the `report/` directory:
- **PDF Report:** [`report/Secure_Banking_Digital_Signatures_Report.pdf`](report/Secure_Banking_Digital_Signatures_Report.pdf) (Compiled with LaTeX)
- **LaTeX Source:** [`report/Secure_Banking_Digital_Signatures_Report.tex`](report/Secure_Banking_Digital_Signatures_Report.tex)
- **Markdown Version:** [`report/Secure_Banking_Digital_Signatures_Report.md`](report/Secure_Banking_Digital_Signatures_Report.md)
