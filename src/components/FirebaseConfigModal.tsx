import React, { useState } from 'react';
import { 
  Database, 
  X, 
  Check, 
  RotateCcw, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  Key, 
  Server, 
  ShieldCheck,
  Code2
} from 'lucide-react';
import { 
  getActiveFirebaseConfig, 
  saveCustomFirebaseConfig, 
  clearCustomFirebaseConfig, 
  parseFirebaseConfigSnippet, 
  defaultFirebaseConfig,
  type FirebaseConfig 
} from '../../lib/firebase';

interface FirebaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseConfigModal: React.FC<FirebaseConfigModalProps> = ({ isOpen, onClose }) => {
  const { config: activeConfig, isCustom } = getActiveFirebaseConfig();

  // Raw snippet input
  const [snippet, setSnippet] = useState('');
  const [snippetParsed, setSnippetParsed] = useState(false);

  // Editable fields
  const [apiKey, setApiKey] = useState(activeConfig.apiKey || '');
  const [projectId, setProjectId] = useState(activeConfig.projectId || '');
  const [authDomain, setAuthDomain] = useState(activeConfig.authDomain || '');
  const [storageBucket, setStorageBucket] = useState(activeConfig.storageBucket || '');
  const [messagingSenderId, setMessagingSenderId] = useState(activeConfig.messagingSenderId || '');
  const [appId, setAppId] = useState(activeConfig.appId || '');

  const [errorMessage, setErrorMessage] = useState('');
  const [showManualFields, setShowManualFields] = useState(false);

  if (!isOpen) return null;

  const handleSnippetChange = (text: string) => {
    setSnippet(text);
    setErrorMessage('');
    const parsed = parseFirebaseConfigSnippet(text);
    if (parsed) {
      setApiKey(parsed.apiKey);
      setProjectId(parsed.projectId);
      setAuthDomain(parsed.authDomain);
      setStorageBucket(parsed.storageBucket || '');
      setMessagingSenderId(parsed.messagingSenderId || '');
      setAppId(parsed.appId || '');
      setSnippetParsed(true);
    } else {
      setSnippetParsed(false);
    }
  };

  const handleSaveAndApply = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanApiKey = apiKey.trim();
    const cleanProjectId = projectId.trim();
    const cleanAuthDomain = authDomain.trim() || `${cleanProjectId}.firebaseapp.com`;
    const cleanStorageBucket = storageBucket.trim() || `${cleanProjectId}.firebasestorage.app`;

    if (!cleanApiKey) {
      setErrorMessage('API Key is required.');
      return;
    }
    if (!cleanProjectId) {
      setErrorMessage('Project ID is required.');
      return;
    }

    const newConfig: FirebaseConfig = {
      apiKey: cleanApiKey,
      projectId: cleanProjectId,
      authDomain: cleanAuthDomain,
      storageBucket: cleanStorageBucket,
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim(),
    };

    saveCustomFirebaseConfig(newConfig);

    // Reload the application so the Firebase client boots into the new project
    window.location.reload();
  };

  const handleResetToDefault = () => {
    if (window.confirm('Reset database connection to the default hosted Firebase project?')) {
      clearCustomFirebaseConfig();
      window.location.reload();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="firebase-modal-title"
    >
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-4 sm:my-6 animate-scaleUp">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800/80 bg-gradient-to-b from-slate-900 to-slate-950/70 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 id="firebase-modal-title" className="text-base sm:text-lg font-black text-white">
                Connect Your Firebase Project
              </h2>
              <p className="text-xs text-slate-400">
                Use your own independent Firebase Authentication & Firestore database
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Connection Status Ribbon */}
        <div className="px-5 sm:px-6 py-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Active Database:</span>
            <span className="font-mono font-bold text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded border border-sky-500/20">
              {activeConfig.projectId || 'None configured'}
            </span>
          </div>

          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            isCustom
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
          }`}>
            {isCustom ? 'Custom Connected Project' : 'Default Hosted Project'}
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveAndApply} className="p-5 sm:p-6 space-y-4">
          
          {errorMessage && (
            <div role="alert" className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick Paste Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="firebase-snippet" className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Code2 className="w-3.5 h-3.5 text-sky-400" />
                Paste Firebase Web Config Object
              </label>
              {snippetParsed && (
                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 animate-fadeIn">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Credentials recognized!
                </span>
              )}
            </div>

            <textarea
              id="firebase-snippet"
              rows={4}
              value={snippet}
              onChange={(e) => handleSnippetChange(e.target.value)}
              placeholder={`Paste from Firebase Console, e.g.:\nconst firebaseConfig = {\n  apiKey: "AIzaSy...",\n  projectId: "my-dealership",\n  ...\n};`}
              className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder-slate-600 outline-none transition-all resize-none"
            />
          </div>

          {/* Collapsible Manual Fields Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowManualFields(!showManualFields)}
              className="text-xs text-sky-400 hover:text-sky-300 font-bold underline underline-offset-4"
            >
              {showManualFields ? 'Hide Individual Fields' : 'View / Edit Individual Config Fields'}
            </button>
          </div>

          {/* Individual Fields */}
          {showManualFields && (
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3 animate-fadeIn text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Project ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    placeholder="my-project-id"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2 text-white font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    API Key *
                  </label>
                  <input
                    type="text"
                    required
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2 text-white font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Auth Domain
                  </label>
                  <input
                    type="text"
                    value={authDomain}
                    onChange={(e) => setAuthDomain(e.target.value)}
                    placeholder="my-project.firebaseapp.com"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2 text-white font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Storage Bucket
                  </label>
                  <input
                    type="text"
                    value={storageBucket}
                    onChange={(e) => setStorageBucket(e.target.value)}
                    placeholder="my-project.firebasestorage.app"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2 text-white font-mono outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Quick instructions box */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
            <span className="font-bold text-slate-300 flex items-center gap-1">
              <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
              Where to find this in Firebase Console:
            </span>
            <p>
              1. Open <strong className="text-white">console.firebase.google.com</strong> and create or open your project.
            </p>
            <p>
              2. Go to <strong className="text-white">Project Settings (⚙️) → Your Apps → Web App (`&lt;/&gt;`)</strong>.
            </p>
            <p>
              3. Copy the <code className="text-sky-300">firebaseConfig</code> code snippet and paste it into the box above.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800/80">
            {isCustom ? (
              <button
                type="button"
                onClick={handleResetToDefault}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 hover:text-rose-300 border border-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Default Project</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-sky-500/25"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Apply & Connect Database</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
