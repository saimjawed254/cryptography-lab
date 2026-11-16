import React, { useState } from 'react';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';

export default function KeyViewerModal({ user, isOpen, onClose }) {
  const [copiedKey, setCopiedKey] = useState(null);
  const [showPrivate, setShowPrivate] = useState(false);

  if (!isOpen || !user) return null;

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(type);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border border-slate-200 bg-white" />
            <div>
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                {user.name}'s Cryptographic Credentials
                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-medium">
                  RSA-2048
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-mono">{user.account_number}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Public Key */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="font-medium text-slate-800">Public Key (Stored in Bank Directory)</span>
                <span className="text-xs text-slate-500">Shared openly with the bank</span>
              </div>
              <button
                onClick={() => copyToClipboard(user.public_key, 'public')}
                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-sky-600 transition font-medium"
              >
                {copiedKey === 'public' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === 'public' ? 'Copied' : 'Copy PEM'}
              </button>
            </div>
            <pre className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 overflow-x-auto whitespace-pre max-h-36">
              {user.public_key}
            </pre>
            <p className="text-xs text-slate-500 mt-1.5">
              Used by the Bank Server to decrypt and verify the signature: $S^e \pmod n$.
            </p>
          </div>

          {/* Private Key */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="font-medium text-slate-800">Private Key (Confidential)</span>
                <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
                  Kept strictly on user's device
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowPrivate(!showPrivate)}
                  className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 transition font-medium"
                >
                  {showPrivate ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showPrivate ? 'Hide' : 'Reveal'}
                </button>
                <button
                  onClick={() => copyToClipboard(user.private_key, 'private')}
                  className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-sky-600 transition font-medium"
                >
                  {copiedKey === 'private' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey === 'private' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
            <div className="relative">
              <pre className={`p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs overflow-x-auto whitespace-pre max-h-36 ${showPrivate ? 'text-slate-800' : 'text-slate-400 blur-sm select-none'}`}>
                {user.private_key}
              </pre>
              {!showPrivate && (
                <div 
                  onClick={() => setShowPrivate(true)}
                  className="absolute inset-0 flex items-center justify-center bg-white/60 cursor-pointer rounded-xl backdrop-blur-[1px]"
                >
                  <span className="text-xs px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg flex items-center gap-1.5 hover:bg-slate-50 transition shadow-sm font-medium">
                    <Eye className="w-3.5 h-3.5 text-sky-600" /> Click to Reveal Secret Key
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              Used on the sender's device to encrypt the SHA-256 hash: $S = H^d \pmod n$.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
