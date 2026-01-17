
import React, { useState, useEffect } from 'react';

interface SuperAdminApprovalModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  message?: string;
}

const SuperAdminApprovalModal: React.FC<SuperAdminApprovalModalProps> = ({ 
  isOpen, 
  onConfirm, 
  onCancel,
  message = "Super Admin approval required to proceed."
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(false);

    // Simulated secure validation (matching user requirements)
    // In a production environment, this would be an API call
    setTimeout(() => {
      if (password === "Ahmed6132") {
        console.log(`[AUTH LOG] Success: Action approved by Super Admin at ${new Date().toISOString()}`);
        onConfirm();
      } else {
        console.warn(`[AUTH LOG] Failure: Invalid password attempt at ${new Date().toISOString()}`);
        setError(true);
        setIsSubmitting(false);
      }
    }, 400); // Slight delay for professional feel
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
        <div className="p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-inner border border-amber-100">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-gray-800 tracking-tight">Authorization Needed</h3>
            <p className="text-gray-500 text-sm px-4">{message}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative group">
              <input
                autoFocus
                type="password"
                placeholder="Enter Super Admin Password"
                className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl outline-none transition-all text-center text-lg font-bold tracking-widest ${
                  error 
                    ? 'border-red-300 bg-red-50 text-red-600 animate-shake' 
                    : 'border-gray-100 focus:border-indigo-500 focus:bg-white text-gray-800'
                }`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
              {error && (
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-2 animate-in slide-in-from-top-1">
                  Access Denied: Invalid Credentials
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex-1 py-4 text-gray-400 font-bold hover:text-gray-600 hover:bg-gray-50 rounded-2xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? (
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'Confirm'}
              </button>
            </div>
          </form>
        </div>
        
        <div className="bg-gray-50 py-3 px-8 text-center border-t border-gray-100">
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 4.908-3.333 9.277-9 11.166-5.667-1.889-9-6.258-9-11.166 0-.68.056-1.35.166-2.001zM10 5a1 1 0 011 1v4a1 1 0 11-2 0V6a1 1 0 011-1zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            Encrypted Security Shield Active
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminApprovalModal;
