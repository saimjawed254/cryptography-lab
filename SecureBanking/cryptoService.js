const crypto = require('crypto');

/**
 * Generates an RSA 2048-bit key pair in PEM format.
 */
function generateRSAKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });
  return { publicKey, privateKey };
}

/**
 * Computes deterministic SHA-256 hash of a payload string or object.
 */
function hashPayload(payload) {
  const serialized = typeof payload === 'string' ? payload : canonicalSerialize(payload);
  const hash = crypto.createHash('sha256');
  hash.update(serialized, 'utf8');
  return {
    serialized,
    hashHex: hash.digest('hex')
  };
}

/**
 * Canonical JSON serialization to guarantee identical key ordering and byte-for-byte reproducibility.
 */
function canonicalSerialize(obj) {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalSerialize).join(',') + ']';
  }
  const sortedKeys = Object.keys(obj).sort();
  const keyVals = sortedKeys.map(k => `${JSON.stringify(k)}:${canonicalSerialize(obj[k])}`);
  return '{' + keyVals.join(',') + '}';
}

/**
 * Signs data using private key and RSA-SHA256 (PKCS#1 v1.5 padding).
 */
function signData(dataToSign, privateKeyPem) {
  const serialized = typeof dataToSign === 'string' ? dataToSign : canonicalSerialize(dataToSign);
  const signer = crypto.createSign('SHA256');
  signer.update(serialized, 'utf8');
  signer.end();
  const signatureBase64 = signer.sign(privateKeyPem, 'base64');
  const signatureHex = Buffer.from(signatureBase64, 'base64').toString('hex');
  return {
    signatureBase64,
    signatureHex
  };
}

/**
 * Verifies RSA-SHA256 signature against data using public key.
 */
function verifySignature(dataToVerify, signatureBase64, publicKeyPem) {
  const serialized = typeof dataToVerify === 'string' ? dataToVerify : canonicalSerialize(dataToVerify);
  const verifier = crypto.createVerify('SHA256');
  verifier.update(serialized, 'utf8');
  verifier.end();
  const isValid = verifier.verify(publicKeyPem, signatureBase64, 'base64');
  return isValid;
}

module.exports = {
  generateRSAKeyPair,
  hashPayload,
  canonicalSerialize,
  signData,
  verifySignature
};

