import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Binary, 
  Key, 
  Send, 
  Server, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  ArrowLeft, 
  RotateCcw,
  FileCode,
  Flame,
  Radio,
  Lock
} from 'lucide-react';

export default function StepperTransactionModal({ 
  isOpen, 
  onClose, 
  sender, 
  receiver, 
  amount, 
  onComplete 
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Cryptographic intermediate states
  const [nonce, setNonce] = useState(() => 'NONCE-' + Math.random().toString(36).substring(2, 9).toUpperCase());
  const [timestamp, setTimestamp] = useState(() => Date.now());

  // Step 1: Raw Payload
  const [payloadObj, setPayloadObj] = useState(null);
  const [canonicalString, setCanonicalString] = useState('');

  // Step 2: SHA-256 Hash
  const [clientHashHex, setClientHashHex] = useState('');

  // Step 3: RSA Signature
  const [signatureBase64, setSignatureBase64] = useState('');
  const [signatureHex, setSignatureHex] = useState('');

  // Step 4: Wire Transmission & Tamper Simulation
  const [isTamperingEnabled, setIsTamperingEnabled] = useState(false);
  const [tamperType, setTamperType] = useState('AMOUNT'); // 'AMOUNT' | 'RECEIVER' | 'SIGNATURE'
  const [tamperedPayload, setTamperedPayload] = useState(null);
  const [tamperedSignature, setTamperedSignature] = useState('');

  // Step 5: Server Verification Results
  const [verificationResult, setVerificationResult] = useState(null);

  // Initialize payload on open
  React.useEffect(() => {
    if (isOpen && sender && receiver) {
      const ts = Date.now();
      const n = 'NONCE-' + Math.random().toString(36).substring(2, 9).toUpperCase();
      setTimestamp(ts);
      setNonce(n);

      const raw = {
        sender_id: sender.id,
        sender_acc: sender.account_number,
        receiver_id: receiver.id,
        receiver_acc: receiver.account_number,
        amount: parseFloat(amount),
        currency: 'INR',
        nonce: n,
        timestamp: ts
      };
      setPayloadObj(raw);

      prepareCanonicalAndHash(raw);
    }
  }, [isOpen, sender, receiver, amount]);

  const prepareCanonicalAndHash = async (payload) => {
    try {
      setLoading(true);
      const res = await fetch('/api/crypto/hash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload })
      });
      const data = await res.json();
      if (data.success) {
        setCanonicalString(data.serialized);
        setClientHashHex(data.hashHex);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleComputeSignature = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/crypto/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payload: payloadObj,
          privateKeyPem: sender.private_key
        })
      });
      const data = await res.json();
      if (data.success) {
        setSignatureBase64(data.signatureBase64);
        setSignatureHex(data.signatureHex);
        setTamperedSignature(data.signatureBase64);
        setTamperedPayload(JSON.parse(JSON.stringify(payloadObj)));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendToBankServer = async () => {
    try {
      setLoading(true);

      const finalWirePayload = isTamperingEnabled ? tamperedPayload : payloadObj;
      const finalSignature = isTamperingEnabled && tamperType === 'SIGNATURE' 
        ? tamperedSignature 
        : signatureBase64;

      const res = await fetch('/api/transactions/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wirePayload: finalWirePayload,
          signatureBase64: finalSignature,
          clientReportedHash: clientHashHex,
          mitmTampered: isTamperingEnabled
        })
      });

      const data = await res.json();
      setVerificationResult(data);
      setCurrentStep(5);
      if (onComplete) onComplete(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyTamper = (type) => {
    setTamperType(type);
    setIsTamperingEnabled(true);
    const copy = JSON.parse(JSON.stringify(payloadObj));

    if (type === 'AMOUNT') {
      copy.amount = (copy.amount * 10) + 5000;
      setTamperedPayload(copy);
    } else if (type === 'RECEIVER') {
      copy.receiver_acc = 'HACK999999999';
      copy.receiver_id = 'USR-ATTACKER-666';
      setTamperedPayload(copy);
    } else if (type === 'SIGNATURE') {
      const corrupted = signatureBase64.substring(0, 20) + 'CORRUPTED' + signatureBase64.substring(29);
      setTamperedSignature(corrupted);
      setTamperedPayload(copy);
    }
  };

  const resetTamper = () => {
    setIsTamperingEnabled(false);
    setTamperedPayload(JSON.parse(JSON.stringify(payloadObj)));
    setTamperedSignature(signatureBase64);
  };

  if (!isOpen || !sender || !receiver) return null;

  const stepsMeta = [
    { num: 1, title: 'Canonical Form', subtitle: 'Deterministic JSON' },
    { num: 2, title: 'SHA-256 Digest', subtitle: 'One-Way Hash' },
    { num: 3, title: 'RSA Signing', subtitle: 'Private Key Encrypt' },
    { num: 4, title: 'Wire & MITM', subtitle: 'Transit & Tampering' },
    { num: 5, title: 'Bank Verification', subtitle: 'Public Key Verify' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 flex items-center gap-2 text-base">
                Cryptographic Execution Stepper
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                  Step {currentStep} of 5
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Mathematical transformation of transaction data from sender to bank.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition"
          >
            ✕
          </button>
        </div>

        {/* Step Progress Tracker Bar */}
        <div className="px-6 py-3 bg-white border-b border-slate-200">
          <div className="grid grid-cols-5 gap-2">
            {stepsMeta.map((s) => {
              const isActive = currentStep === s.num;
              const isPast = currentStep > s.num;
              return (
                <div 
                  key={s.num} 
                  className={`flex flex-col p-2.5 rounded-xl transition border text-left ${
                    isActive 
                      ? 'bg-sky-50 border-sky-300 text-sky-900' 
                      : isPast 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                      isActive 
                        ? 'bg-sky-600 text-white font-bold' 
                        : isPast 
                        ? 'bg-emerald-600 text-white font-bold' 
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {isPast ? '✓' : s.num}
                    </span>
                    <span className="truncate">{s.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 hidden sm:block truncate">
                    {s.subtitle}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Step Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/50">

          {/* STEP 1: Canonical Serialization */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-start justify-between shadow-sm">
                <div>
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                    <FileCode className="w-4 h-4 text-sky-600" />
                    Step 1: Canonical JSON Serialization
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    In cryptography, identical JSON keys ordered differently yield completely different hashes. 
                    Canonical serialization lexicographically sorts all keys so both sender and bank reproduce identical byte streams.
                  </p>
                </div>
                <span className="px-2.5 py-1 text-xs rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-mono font-medium">
                  Input Object
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                    <span>1. Transaction Parameters</span>
                    <span className="text-slate-400 font-mono">Object View</span>
                  </div>
                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 text-xs font-mono shadow-sm">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Sender:</span>
                      <span className="text-slate-800 font-semibold">{sender.name} ({sender.account_number})</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Receiver:</span>
                      <span className="text-slate-800 font-semibold">{receiver.name} ({receiver.account_number})</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Amount:</span>
                      <span className="text-sky-700 font-bold text-sm">₹{parseFloat(amount).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Nonce:</span>
                      <span className="text-amber-700 font-semibold">{nonce}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Timestamp:</span>
                      <span className="text-slate-700">{timestamp}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                    <span>2. Deterministic Byte Stream</span>
                    <span className="text-emerald-700 font-mono font-medium">Serialized String</span>
                  </div>
                  <pre className="p-4 bg-white border border-emerald-300 rounded-xl font-mono text-xs text-emerald-800 overflow-x-auto whitespace-pre-wrap break-all h-[178px] shadow-sm">
                    {canonicalString}
                  </pre>
                </div>
              </div>

              <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-800 flex items-center gap-2">
                <span className="font-bold text-sky-700">Next Action:</span>
                This exact UTF-8 byte stream will now be fed into the SHA-256 cryptographic compression function.
              </div>
            </div>
          )}

          {/* STEP 2: SHA-256 Digest */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                  <Binary className="w-4 h-4 text-sky-600" />
                  Step 2: Cryptographic Hashing (SHA-256)
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Instead of encrypting a large payload directly with RSA (which is slow and algebraically vulnerable), 
                  we hash the message into a fixed 256-bit (32-byte / 64-hex-character) cryptographic fingerprint.
                </p>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-sm">
                <div className="text-xs text-slate-500 flex items-center justify-between">
                  <span>Input String (UTF-8 Bytes):</span>
                  <span className="text-slate-400 font-mono">{canonicalString.length} bytes</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg font-mono text-xs text-slate-700 break-all border border-slate-200">
                  {canonicalString}
                </div>

                <div className="flex items-center justify-center my-2 text-slate-400">
                  <ArrowRight className="w-5 h-5 rotate-90 text-sky-600" />
                </div>

                <div className="text-xs text-sky-800 font-semibold flex items-center justify-between">
                  <span>Generated SHA-256 Digest (H1):</span>
                  <span className="text-xs font-mono text-sky-600">256 bits (64 hex characters)</span>
                </div>
                <div className="p-3 bg-sky-50 border border-sky-300 rounded-lg font-mono text-xs text-sky-900 break-all select-all font-bold">
                  {clientHashHex}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                  <div className="font-semibold text-slate-800">One-Way Property</div>
                  <p className="text-slate-500 mt-0.5 text-[11px]">Cannot recover original transaction details from this hash digest.</p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                  <div className="font-semibold text-slate-800">Collision Resistant</div>
                  <p className="text-slate-500 mt-0.5 text-[11px]">Infeasible to find any second payload yielding this exact 64-hex digest.</p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                  <div className="font-semibold text-slate-800">Avalanche Guarantee</div>
                  <p className="text-slate-500 mt-0.5 text-[11px]">Changing even a single digit in the amount alters ~50% of these hash bits.</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: RSA Signing */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                  <Key className="w-4 h-4 text-amber-600" />
                  Step 3: RSA-2048 Digital Signature Generation
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  {sender?.name} signs the SHA-256 digest using their secret Private Key (d) with the PKCS#1 v1.5 standard. 
                  Mathematical formula: <span className="font-mono text-amber-800 font-bold">S = (H1^d) mod n</span>.
                </p>
              </div>

              {!signatureBase64 ? (
                <div className="p-8 bg-white border border-dashed border-slate-300 rounded-xl text-center space-y-4 shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">Ready to Apply Private Key</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      Click below to invoke {sender?.name}'s hardware crypto simulation. The private key will encrypt the SHA-256 digest locally.
                    </p>
                  </div>
                  <button
                    onClick={handleComputeSignature}
                    disabled={loading}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-xl text-xs transition flex items-center gap-2 mx-auto shadow-sm"
                  >
                    {loading ? 'Encrypting with Private Key...' : `Sign with ${sender?.name}'s Private Key (RSA-2048)`}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-white border border-amber-200 rounded-xl space-y-3 shadow-sm">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-amber-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Generated Digital Signature (S)
                      </span>
                      <span className="font-mono text-slate-500 text-xs">2048-bit Block (256 bytes)</span>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[11px] text-slate-500 font-medium">Base64 Encoded (Wire Format):</div>
                      <pre className="p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-amber-900 break-all whitespace-pre-wrap max-h-24 overflow-y-auto">
                        {signatureBase64}
                      </pre>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[11px] text-slate-500 font-medium">Hexadecimal Representation:</div>
                      <pre className="p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-600 break-all whitespace-pre-wrap max-h-20 overflow-y-auto">
                        {signatureHex}
                      </pre>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                    <span className="font-bold text-emerald-700">Cryptographic Seal Applied:</span>
                    The signature is tied specifically to this exact payload and to {sender?.name}'s key. Any modification to either will fail verification.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Wire Transit & MITM Attack Simulation */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-start justify-between shadow-sm">
                <div>
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                    <Radio className="w-4 h-4 text-indigo-600 animate-pulse" />
                    Step 4: Network Wire Packet & Man-in-the-Middle (MITM) Playground
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    The client transmits the <span className="font-mono text-slate-800 font-medium">raw payload</span> alongside the <span className="font-mono text-slate-800 font-medium">signature</span>.
                    Here you can demonstrate a live interception attack before the packet reaches the bank.
                  </p>
                </div>
                {isTamperingEnabled ? (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-300 flex items-center gap-1.5 animate-pulse">
                    <Flame className="w-3.5 h-3.5 text-rose-600" />
                    MITM ATTACK ACTIVE
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Legitimate Packet
                  </span>
                )}
              </div>

              {/* Attack Controls */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-sm">
                <div className="text-xs font-semibold text-slate-800 flex items-center justify-between">
                  <span>Simulate Interception / Attack Scenarios:</span>
                  {isTamperingEnabled && (
                    <button 
                      onClick={resetTamper}
                      className="text-xs text-sky-600 hover:text-sky-800 flex items-center gap-1 font-medium"
                    >
                      <RotateCcw className="w-3 h-3" /> Revert to Legitimate
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    onClick={() => applyTamper('AMOUNT')}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      isTamperingEnabled && tamperType === 'AMOUNT'
                        ? 'bg-rose-50 border-rose-400 text-rose-900'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">1. Amount Tampering</span>
                      <Flame className="w-4 h-4 text-rose-600" />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Attacker alters amount from ₹{amount} to ₹{(parseFloat(amount) * 10) + 5000}.
                    </p>
                  </button>

                  <button
                    onClick={() => applyTamper('RECEIVER')}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      isTamperingEnabled && tamperType === 'RECEIVER'
                        ? 'bg-rose-50 border-rose-400 text-rose-900'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">2. Receiver Spoofing</span>
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Beneficiary account diverted to attacker's account (`HACK999999999`).
                    </p>
                  </button>

                  <button
                    onClick={() => applyTamper('SIGNATURE')}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      isTamperingEnabled && tamperType === 'SIGNATURE'
                        ? 'bg-rose-50 border-rose-400 text-rose-900'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">3. Signature Corruption</span>
                      <Binary className="w-4 h-4 text-indigo-600" />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Simulates corrupted bytes or forged signature during transit.
                    </p>
                  </button>
                </div>
              </div>

              {/* Wire Packet Preview */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-sm">
                <div className="text-xs font-semibold text-slate-800 flex items-center justify-between">
                  <span>In-Transit Network Payload (What Bank Receives):</span>
                  <span className="text-[11px] text-slate-400 font-mono">POST /api/transactions/process</span>
                </div>
                <pre className={`p-3 rounded-lg font-mono text-xs overflow-x-auto whitespace-pre-wrap max-h-36 border ${
                  isTamperingEnabled 
                    ? 'bg-rose-50 border-rose-200 text-rose-900' 
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}>
                  {JSON.stringify(
                    {
                      wirePayload: isTamperingEnabled ? tamperedPayload : payloadObj,
                      signatureBase64: isTamperingEnabled && tamperType === 'SIGNATURE' ? tamperedSignature : signatureBase64
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          )}

          {/* STEP 5: Bank Verification & Ledger Update */}
          {currentStep === 5 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                  <Server className="w-4 h-4 text-sky-600" />
                  Step 5: Bank Backend Mathematical Verification
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  The bank uses {sender?.name}'s registered Public Key (e=65537, n) from its database to verify the digital signature.
                </p>
              </div>

              {verificationResult && (
                <div className="space-y-4">
                  {/* Verdict Banner */}
                  {verificationResult.verified ? (
                    <div className="p-5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-start gap-4">
                      <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <div>
                        <h4 className="font-bold text-emerald-900 text-base">
                          SIGNATURE VERIFIED — TRANSACTION SETTLED
                        </h4>
                        <p className="text-xs text-emerald-800 mt-1">
                          {verificationResult.message}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-xs font-mono">
                          <span className="text-slate-600">
                            Tx Ref: <strong className="text-emerald-700">{verificationResult.transaction?.tx_ref}</strong>
                          </span>
                          <span className="text-slate-600">
                            Sender New Balance: <strong className="text-emerald-700">₹{verificationResult.senderNewBalance?.toLocaleString('en-IN')}</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 bg-rose-50 border border-rose-300 rounded-2xl flex items-start gap-4">
                      <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700">
                        <XCircle className="w-8 h-8" />
                      </div>
                      <div>
                        <h4 className="font-bold text-rose-900 text-base">
                          VERIFICATION REJECTED — SECURITY ALERT TRIGGERED
                        </h4>
                        <p className="text-xs text-rose-800 mt-1 font-semibold">
                          {verificationResult.error}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Stage Failed: <span className="font-mono text-rose-700 font-bold">{verificationResult.stage}</span>. 
                          The transaction was immediately blocked and no funds were moved.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Hash Comparison Table */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-sm">
                    <h5 className="text-xs font-semibold text-slate-800 flex items-center justify-between">
                      <span>Cryptographic Equality Proof:</span>
                      <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-bold ${
                        verificationResult.clientReportedHash === verificationResult.serverHashHex
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {verificationResult.clientReportedHash === verificationResult.serverHashHex ? 'HASH MATCH: TRUE' : 'HASH MISMATCH: FALSE'}
                      </span>
                    </h5>

                    <div className="space-y-2 text-xs font-mono">
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-slate-500 block text-[10px]">Client Generated Hash (Signed by {sender?.name}'s Key):</span>
                        <span className="text-sky-800 break-all select-all font-semibold">
                          {verificationResult.clientReportedHash}
                        </span>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-slate-500 block text-[10px]">Server Recomputed Hash (Derived from Wire Payload):</span>
                        <span className={`break-all select-all font-semibold ${
                          verificationResult.clientReportedHash === verificationResult.serverHashHex 
                            ? 'text-emerald-700' 
                            : 'text-rose-700'
                        }`}>
                          {verificationResult.serverHashHex}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600">
                      <strong>Mathematical Theorem:</strong> If any parameter in the payload is modified by an attacker, 
                      the server's recomputed hash differs completely. Because the attacker lacks {sender?.name}'s private key, 
                      they cannot generate a valid corresponding signature.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Bottom Controls */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <div>
            {currentStep > 1 && currentStep < 5 && (
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Previous Step
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentStep < 3 && (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="px-5 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                Next Step: {stepsMeta[currentStep].title} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {currentStep === 3 && (
              <button
                onClick={() => setCurrentStep(4)}
                disabled={!signatureBase64}
                className="px-5 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:pointer-events-none text-white rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                Proceed to Wire Transit & Attacks <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {currentStep === 4 && (
              <button
                onClick={handleSendToBankServer}
                disabled={loading}
                className="px-6 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition flex items-center gap-2 shadow-sm"
              >
                {loading ? 'Transmitting to Bank...' : 'Transmit Wire Packet to Bank Server'} 
                <Send className="w-3.5 h-3.5" />
              </button>
            )}

            {currentStep === 5 && (
              <button
                onClick={onClose}
                className="px-6 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition"
              >
                Close & Return to Dashboard
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
