# Secure Banking Transactions using Digital Signatures
## Academic Project Report & Theoretical Functioning Manual
**Applied Cryptography**  
**Department of Computer Science and Engineering**  
**7th Semester B.Tech Project Report**

**Project Team Members (Arranged Roll Number Wise):**
1. **Chaitanya** (Roll No: 2306044)
2. **Rohith** (Roll No: 2306045)
3. **Siddharth** (Roll No: 2306046)
4. **Aditya** (Roll No: 2306047)
5. **Saim** (Roll No: 2306049)

---

## 1. Executive Summary & Objective

In digital financial transactions over public or untrusted networks, communication is exposed to active and passive adversaries. The primary objective of this project is to implement, visualize, and prove the security properties of **Digital Signatures** in a simulated banking environment.

The application implements an end-to-end cryptographic pipeline:
1. **Asymmetric Key Infrastructure:** Each user holds a distinct 2048-bit RSA key pair.
2. **Canonical Data Normalization:** Ensures deterministic serialization across platforms.
3. **Cryptographic Hashing:** Compresses transaction payloads using **SHA-256**.
4. **Digital Signature Generation:** Signs the digest using **RSA-2048 (PKCS#1 v1.5)** with the sender's private key ($S = H^d \pmod n$).
5. **Bank Verification:** Authenticates the signature using the sender's public key ($H \stackrel{?}{=} S^e \pmod n$).
6. **Man-In-The-Middle (MITM) Interception Suite:** Allows testing live tampering of transaction parameters (Amount, Beneficiary, Signature corruption).

---

## 2. Theoretical Foundations

### 2.1 The Four Security Goals
- **Confidentiality:** Preventing unauthorized observers from reading transaction contents.
- **Integrity:** Detecting any modification or truncation of data in transit.
- **Authentication:** Positively confirming the true identity of the transaction originator.
- **Non-Repudiation:** Preventing the sender from denying having authorized the transaction.

Digital signatures uniquely provide **Integrity**, **Authentication**, and **Non-Repudiation**.

### 2.2 Mathematical Structure of RSA-2048
RSA relies on the computational difficulty of the integer factorization problem:
1. Two large primes $p$ and $q$ are chosen.
2. Modulus: $n = p \times q$ (2048 bits).
3. Totient: $\phi(n) = (p - 1)(q - 1)$.
4. Public Exponent: $e = 65537$ such that $\gcd(e, \phi(n)) = 1$.
5. Private Exponent: $d \equiv e^{-1} \pmod{\phi(n)}$ computed via Extended Euclidean Algorithm.
6. Public Key: $(e, n)$; Private Key: $(d, n)$.

### 2.3 The "Hash-Then-Sign" Paradigm
Directly signing a large message ($M^d \pmod n$) is computationally expensive and vulnerable to algebraic homomorphic attacks. The system therefore:
1. Computes a 256-bit SHA-256 fingerprint: $H = \text{SHA256}(M)$.
2. Formats $H$ using the **PKCS#1 v1.5** encoding:
   $$\text{EM} = \text{0x00} \parallel \text{0x01} \parallel \text{0xFF} \dots \text{0xFF} \parallel \text{0x00} \parallel T$$
   where $T$ is the DER-encoded ASN.1 `DigestInfo` containing the SHA-256 OID and hash value.
3. Computes the signature: $S = \text{EM}^d \pmod n$.

### 2.4 Verification Equation
Upon receiving $\{ M_{\text{wire}}, S \}$, the bank server:
1. Recomputes $H_{\text{recomputed}} = \text{SHA256}(M_{\text{wire}})$.
2. Decrypts the signature using the sender's registered public key: $\text{EM}_{\text{recovered}} = S^e \pmod n$.
3. Checks whether the recovered digest matches $H_{\text{recomputed}}$.
4. If $H_{\text{recomputed}} == H_{\text{extracted}}$, the signature is mathematically valid; otherwise, it is rejected.

---

## 3. Seed Registered Banking Accounts

| User Name | Account Number | Bank | Initial Balance | Key Pair Algorithm |
| :--- | :--- | :--- | :--- | :--- |
| **Siddharth** | `SBIN004829101` | State Bank of India | ₹85,000.00 | RSA-2048 / SHA-256 |
| **Chaitanya** | `HDFC009382102` | HDFC Bank | ₹62,000.00 | RSA-2048 / SHA-256 |
| **Rohith** | `ICIC001920103` | ICICI Bank | ₹45,000.00 | RSA-2048 / SHA-256 |
| **Saim** | `AXIS007182104` | Axis Bank | ₹95,000.00 | RSA-2048 / SHA-256 |
| **Aditya** | `PNB0003819105` | Punjab National Bank | ₹54,000.00 | RSA-2048 / SHA-256 |

---

## 4. Formal Algorithmic Specification

### Algorithm 1: Client-Side Transaction Signing
- **Input:** Transaction Object $\mathcal{P} = \{\text{sender\_acc}, \text{receiver\_acc}, \text{amount}, \text{timestamp}, \text{nonce}\}$, Sender Private Key $K_{\text{priv}} = (d, n)$
- **Output:** Base64-encoded Digital Signature $S$
1. **Canonical Serialization:** Convert $\mathcal{P}$ into a deterministic byte stream $\mathcal{M}$ by sorting all JSON keys in ascending lexicographical order: $\mathcal{M} \leftarrow \text{CanonicalEncode}(\mathcal{P})$.
2. **Cryptographic Hashing:** Compute the 256-bit message digest: $H \leftarrow \text{SHA-256}(\mathcal{M})$.
3. **PKCS#1 v1.5 Formatting:** Encode digest $H$ with DER-encoded `DigestInfo` and `0xFF` padding string: $\text{EM} \leftarrow \text{0x00} \parallel \text{0x01} \parallel \text{PS} \parallel \text{0x00} \parallel \text{DigestInfo}(H)$.
4. **Modular Exponentiation:** Sign using sender's private exponent: $S \leftarrow \text{EM}^d \pmod n$.
5. **Return:** Output digital signature $S$ formatted as a base64 string.

### Algorithm 2: Bank-Side Signature Verification
- **Input:** Received Wire Payload $\mathcal{P}_{\text{wire}}$, Digital Signature $S$, Sender Public Key $K_{\text{pub}} = (e, n)$
- **Output:** Boolean verdict $\in \{\textbf{True}, \textbf{False}\}$
1. **Recompute Hash:** Derive canonical representation $\mathcal{M}_{\text{wire}} = \text{CanonicalEncode}(\mathcal{P}_{\text{wire}})$ and compute: $H_{\text{recomputed}} \leftarrow \text{SHA-256}(\mathcal{M}_{\text{wire}})$.
2. **Public-Key Decryption:** Decrypt signature $S$ using registered public exponent: $\text{EM}_{\text{recovered}} \leftarrow S^e \pmod n$.
3. **Verification & Equality Check:** Extract recovered hash $H_{\text{extracted}}$ from $\text{EM}_{\text{recovered}}$. If the structure conforms to PKCS#1 v1.5 and $H_{\text{recomputed}} == H_{\text{extracted}}$, return **True** (Authentic & Intact); otherwise, return **False** (Tampered / Forged).

---

## 5. Man-in-the-Middle (MITM) Attack Demonstrations

### Attack 1: Amount Tampering
- **Scenario:** Siddharth sends ₹2,500 to Chaitanya. An in-flight attacker changes the amount to ₹30,000.
- **Server Detection:** Recomputing the SHA-256 hash yields a completely different digest due to the avalanche effect. The decrypted signature does not match.
- **Verdict:** `ERR_SIGNATURE_MISMATCH` — Transaction aborted, funds preserved.

### Attack 2: Beneficiary Diversion (Receiver Spoofing)
- **Scenario:** Attacker replaces Chaitanya's account with `HACK999999999`.
- **Server Detection:** Modifying the recipient changes the canonical string, resulting in hash mismatch.
- **Verdict:** `ERR_SIGNATURE_MISMATCH` — Transfer blocked.

### Attack 3: Replay Attack Mitigation
- **Scenario:** Attacker records a valid transaction $\{ \text{payload}, S \}$ and replays it later.
- **Server Detection:** The bank maintains an indexed cache $\mathcal{N}_{\text{processed}}$ of all executed nonces. The server asserts:
  $$\eta \notin \mathcal{N}_{\text{processed}}(U_i)$$
  If $\eta \in \mathcal{N}_{\text{processed}}(U_i)$, the transaction is flagged and aborted immediately.
- **Verdict:** `REJECTED_REPLAY_ATTACK` — Replay blocked.

---

## 6. How to Run the Application

From the project root:
```powershell
cd SecureBanking
npm run start
```
Open **`http://localhost:5000`** in any browser.

The LaTeX report file is located at:
`SecureBanking/report/Secure_Banking_Digital_Signatures_Report.tex`
and compiled PDF at:
`SecureBanking/report/Secure_Banking_Digital_Signatures_Report.pdf`
