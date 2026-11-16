import React, { useState } from 'react';
import { 
  Building2, 
  Send, 
  Key, 
  ShieldCheck, 
  History, 
  RefreshCw, 
  UserPlus, 
  CheckCircle2, 
  XCircle
} from 'lucide-react';
import StepperTransactionModal from './components/StepperTransactionModal';
import KeyViewerModal from './components/KeyViewerModal';

export default function App() {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Transfer Form State
  const [senderId, setSenderId] = useState('');
  const [receiverId, setReceiverId] = useState('');
  const [amount, setAmount] = useState('2500');

  // Modals
  const [isStepperOpen, setIsStepperOpen] = useState(false);
  const [selectedUserForKeys, setSelectedUserForKeys] = useState(null);
  const [selectedTxForAudit, setSelectedTxForAudit] = useState(null);

  // New Account Modal
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDeposit, setNewDeposit] = useState('10000');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [accRes, txRes] = await Promise.all([
        fetch('/api/accounts'),
        fetch('/api/transactions')
      ]);
      const accData = await accRes.json();
      const txData = await txRes.json();

      if (accData.success) {
        setAccounts(accData.accounts);
        if (!senderId && accData.accounts.length > 0) {
          setSenderId(accData.accounts[0].id);
        }
        if (!receiverId && accData.accounts.length > 1) {
          setReceiverId(accData.accounts[1].id);
        }
      }
      if (txData.success) {
        setTransactions(txData.transactions);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleResetDemo = async () => {
    if (!window.confirm('Reset all bank accounts and ledger to initial seed state?')) return;
    try {
      await fetch('/api/admin/reset', { method: 'POST' });
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!newName || !newEmail) return;
    try {
      const res = await fetch('/api/accounts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          initialDeposit: parseFloat(newDeposit)
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsCreateAccountOpen(false);
        setNewName('');
        setNewEmail('');
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const currentSender = accounts.find(a => a.id === senderId);
  const currentReceiver = accounts.find(a => a.id === receiverId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-slate-900">SECUREBANK</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                  Digital Signatures Lab
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Applied Cryptography | RSA-2048 & SHA-256 Authentication Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreateAccountOpen(true)}
              className="px-3.5 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl transition flex items-center gap-1.5 shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5 text-sky-600" /> New Account
            </button>
            <button
              onClick={handleResetDemo}
              title="Reset Demo Ledger"
              className="px-3.5 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl transition flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-600" /> Reset Demo
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">

        {/* Cryptographic Architecture Overview Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-mono text-sky-700 font-bold uppercase tracking-wider">
                Cryptographic Workflow Protocol
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Secure Fund Transfer with Public-Key Cryptography
              </h1>
              <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                Every transaction payload is canonically formatted, hashed with <strong>SHA-256</strong>, 
                and signed with the sender’s private key using <strong>RSA-2048 PKCS#1 v1.5</strong>. 
                The bank server uses the sender’s public key from the PKI registry to verify authenticity, integrity, and non-repudiation.
              </p>
            </div>

            {/* Quick Math Pill */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono bg-slate-50 p-3 rounded-xl border border-slate-200 self-start lg:self-center">
              <div className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2 h-2 rounded-full bg-sky-600"></span>
                <span>H = SHA256(M)</span>
              </div>
              <span className="text-slate-400">→</span>
              <div className="flex items-center gap-1.5 text-amber-700">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>S = (H^d) mod n</span>
              </div>
              <span className="text-slate-400">→</span>
              <div className="flex items-center gap-1.5 text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span>H == (S^e) mod n ?</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Section: Active Bank Accounts Grid */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-sky-600" />
              <h2 className="font-semibold text-sm text-slate-800">
                Bank PKI Directory & Customer Accounts (5 Users)
              </h2>
            </div>
            <span className="text-xs text-slate-500">
              Each user holds an individual 2048-bit RSA key pair
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {accounts.map(acc => {
              const isSelectedSender = acc.id === senderId;
              const isSelectedReceiver = acc.id === receiverId;

              return (
                <div 
                  key={acc.id}
                  className={`bg-white border rounded-2xl p-4 transition-all shadow-sm ${
                    isSelectedSender 
                      ? 'border-sky-500 ring-2 ring-sky-100' 
                      : isSelectedReceiver 
                      ? 'border-emerald-500 ring-2 ring-emerald-100' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <img 
                        src={acc.avatar} 
                        alt={acc.name} 
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200 bg-slate-50 shrink-0" 
                      />
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900 text-xs flex items-center gap-1 truncate">
                          {acc.name}
                          {isSelectedSender && (
                            <span className="text-[9px] bg-sky-100 text-sky-800 px-1 py-0.2 rounded font-mono font-bold">
                              SRC
                            </span>
                          )}
                          {isSelectedReceiver && (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded font-mono font-bold">
                              DST
                            </span>
                          )}
                        </h3>
                        <p className="text-[10px] text-slate-500 font-mono truncate">{acc.account_number}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-medium">Balance</span>
                      <span className="text-xs sm:text-sm font-bold text-slate-900 font-mono">
                        ₹{acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedUserForKeys(acc)}
                      className="px-2 py-1 text-[11px] bg-slate-50 hover:bg-slate-100 text-sky-700 rounded-lg border border-slate-200 transition flex items-center gap-1 font-mono font-medium"
                    >
                      <Key className="w-3 h-3" /> Keys
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Middle Section: Transaction Builder & Stepper Trigger */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Form: Initiate Transaction */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Send className="w-4 h-4 text-sky-600" />
              <h2 className="font-semibold text-sm text-slate-900">
                Initiate Signed Transaction
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              {/* Sender Select */}
              <div>
                <label className="text-slate-600 block mb-1 font-medium">Sender (Signs with Private Key):</label>
                <select
                  value={senderId}
                  onChange={(e) => setSenderId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-sky-500 font-medium"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id} disabled={a.id === receiverId}>
                      {a.name} — ₹{a.balance.toLocaleString('en-IN')} ({a.account_number})
                    </option>
                  ))}
                </select>
              </div>

              {/* Receiver Select */}
              <div>
                <label className="text-slate-600 block mb-1 font-medium">Beneficiary (Receiver):</label>
                <select
                  value={receiverId}
                  onChange={(e) => setReceiverId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id} disabled={a.id === senderId}>
                      {a.name} ({a.account_number})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount Input */}
              <div>
                <label className="text-slate-600 block mb-1 font-medium">Transfer Amount (INR):</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="1"
                    max={currentSender ? currentSender.balance : 999999}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Quick Amount Pills */}
              <div className="flex gap-2 pt-1">
                {['500', '1000', '2500', '5000', '10000'].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-mono border border-slate-200 transition font-medium"
                  >
                    ₹{val}
                  </button>
                ))}
              </div>
            </div>

            {/* Launch Visual Stepper Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsStepperOpen(true)}
                disabled={!senderId || !receiverId || !amount || parseFloat(amount) <= 0}
                className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:pointer-events-none"
              >
                <ShieldCheck className="w-4 h-4" />
                Launch Cryptographic Stepper & Transit
              </button>
              <p className="text-[11px] text-slate-500 text-center mt-2">
                Walk through step-by-step hashing, signing, and MITM tampering attacks.
              </p>
            </div>
          </div>

          {/* Right Section: Live Blockchain / Bank Audit Ledger */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 flex flex-col shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-sky-600" />
                <h2 className="font-semibold text-sm text-slate-900">
                  Bank Transaction Audit Ledger
                </h2>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {transactions.length} Recorded Transactions
              </span>
            </div>

            {/* Transaction List */}
            <div className="overflow-x-auto flex-1 max-h-[360px] overflow-y-auto">
              {transactions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No transactions recorded yet. Launch a transaction to generate cryptographic signatures.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-mono text-[11px] bg-slate-50">
                      <th className="py-2.5 px-3">Tx Ref</th>
                      <th className="py-2.5 px-2">Parties</th>
                      <th className="py-2.5 px-2">Amount</th>
                      <th className="py-2.5 px-2">Cryptographic Hash</th>
                      <th className="py-2.5 px-2">Status</th>
                      <th className="py-2.5 px-3 text-right">Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {transactions.map(tx => {
                      const isVerified = tx.verified_status === 'SETTLED_VERIFIED';
                      const isTampered = tx.mitm_tampered === 1;

                      return (
                        <tr key={tx.id} className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-3 font-bold text-slate-800">
                            {tx.tx_ref}
                          </td>
                          <td className="py-2.5 px-2 text-slate-700 font-sans">
                            <span className="text-sky-700 font-medium">{tx.sender_acc.slice(-4)}</span>
                            <span className="text-slate-400 mx-1">→</span>
                            <span className="text-emerald-700 font-medium">{tx.receiver_acc.slice(-4)}</span>
                          </td>
                          <td className="py-2.5 px-2 font-bold text-slate-900">
                            ₹{tx.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-2 text-slate-600">
                            <span className="text-[10px] block truncate max-w-[120px]" title={tx.server_hash}>
                              {tx.server_hash.substring(0, 14)}...
                            </span>
                          </td>
                          <td className="py-2.5 px-2">
                            {isVerified ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> VERIFIED
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <XCircle className="w-3 h-3" /> REJECTED
                              </span>
                            )}
                            {isTampered && (
                              <span className="ml-1 inline-flex items-center gap-0.5 text-[9px] text-amber-700 font-bold">
                                (MITM)
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => setSelectedTxForAudit(tx)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] transition font-medium"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>

      </main>

      {/* Transaction Stepper Modal */}
      <StepperTransactionModal
        isOpen={isStepperOpen}
        onClose={() => setIsStepperOpen(false)}
        sender={currentSender}
        receiver={currentReceiver}
        amount={amount}
        onComplete={() => {
          fetchData();
        }}
      />

      {/* Key Viewer Modal */}
      <KeyViewerModal
        isOpen={!!selectedUserForKeys}
        user={selectedUserForKeys}
        onClose={() => setSelectedUserForKeys(null)}
      />

      {/* Audit Detail Modal */}
      {selectedTxForAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                Cryptographic Forensic Audit: {selectedTxForAudit.tx_ref}
              </h3>
              <button onClick={() => setSelectedTxForAudit(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4 text-xs font-mono">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-500 block text-[10px]">VERIFIED STATUS:</span>
                <span className={selectedTxForAudit.verified_status === 'SETTLED_VERIFIED' ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                  {selectedTxForAudit.verified_status}
                </span>
                {selectedTxForAudit.failure_reason && (
                  <p className="text-rose-800 font-sans text-xs mt-1">
                    Reason: {selectedTxForAudit.failure_reason}
                  </p>
                )}
              </div>

              <div>
                <span className="text-slate-700 block mb-1 font-sans font-medium">Raw In-Flight Canonical Payload:</span>
                <pre className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 break-all whitespace-pre-wrap">
                  {selectedTxForAudit.raw_payload}
                </pre>
              </div>

              <div>
                <span className="text-slate-700 block mb-1 font-sans font-medium">Server Recomputed SHA-256 Hash:</span>
                <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-lg text-sky-900 break-all font-bold">
                  {selectedTxForAudit.server_hash}
                </div>
              </div>

              <div>
                <span className="text-slate-700 block mb-1 font-sans font-medium">Digital Signature (Base64 PKCS#1 v1.5):</span>
                <pre className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-amber-900 break-all whitespace-pre-wrap max-h-24 overflow-y-auto">
                  {selectedTxForAudit.signature_base64}
                </pre>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
              <button
                onClick={() => setSelectedTxForAudit(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-medium"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Account Modal */}
      {isCreateAccountOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-sky-600" />
              Generate New Bank Account with RSA Keys
            </h3>
            <p className="text-xs text-slate-500">
              The bank server will automatically generate a 2048-bit RSA key pair for this user.
            </p>
            <form onSubmit={handleCreateAccount} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 block mb-1 font-medium">Full Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Nair"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="text-slate-600 block mb-1 font-medium">Email Address:</label>
                <input
                  type="email"
                  required
                  placeholder="priya@securebank.in"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="text-slate-600 block mb-1 font-medium">Initial Balance Deposit (INR):</label>
                <input
                  type="number"
                  min="500"
                  value={newDeposit}
                  onChange={e => setNewDeposit(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-sky-500"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateAccountOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold transition shadow-sm"
                >
                  Create Account & Generate Keys
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        Secure Banking Transactions Using Digital Signatures • B.Tech Cryptography Lab Project • RSA-2048 / SHA-256 / PKCS#1 v1.5
      </footer>

    </div>
  );
}
