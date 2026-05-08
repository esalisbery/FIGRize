import React, { useState, useEffect } from 'react';
import { X, Lock, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';
import styles from './FacebookLoginPopup.module.css';

interface FacebookLoginPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectClick: () => void;
  connectStatus: 'idle' | 'waiting' | 'success' | 'error';
  connectError?: string;
}

export const FacebookLoginPopup: React.FC<FacebookLoginPopupProps> = ({
  isOpen,
  onClose,
  onConnectClick,
  connectStatus,
  connectError,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) setVisible(true);
  }, [isOpen]);

  if (!isOpen && !visible) return null;

  const handleClose = () => {
    setVisible(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-[400px] rounded-xl shadow-2xl overflow-hidden font-sans border border-[rgba(120,140,180,0.14)]">

        {/* FB-branded header */}
        <div className="bg-[#1877F2] px-4 py-3 flex items-center justify-between shadow-sm">
          <h3 className="text-white font-bold text-xl tracking-tight">facebook</h3>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="text-white/80 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className={`p-8 flex flex-col items-center gap-6 ${styles.modalWrapper}`}>

          {/* Idle / ready state */}
          {connectStatus === 'idle' && (
            <>
              <div className="text-center">
                <h4 className="text-xl font-bold text-app-text mb-1">Connect Your Pages</h4>
                <p className="text-app-text-3 text-sm leading-relaxed">
                  FIGRize will open a secure Facebook window so you can authorize access to your Pages.
                  Your password is never seen by FIGRize.
                </p>
              </div>

              <div className="w-full space-y-3 text-sm text-app-text-2">
                <div className="flex items-start gap-2.5">
                  <CheckCircle size={15} className="text-app-teal mt-0.5 shrink-0" />
                  <span>Manage and publish to your Facebook Pages</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle size={15} className="text-app-teal mt-0.5 shrink-0" />
                  <span>Schedule posts for optimal engagement</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle size={15} className="text-app-teal mt-0.5 shrink-0" />
                  <span>Read page insights and analytics</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onConnectClick}
                className="w-full bg-[#1877f2] hover:bg-[#166fe5] text-white font-bold py-3 rounded-lg text-base transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <ExternalLink size={16} />
                Continue with Facebook
              </button>
            </>
          )}

          {/* Waiting for user to authorize in popup */}
          {connectStatus === 'waiting' && (
            <>
              <div className="w-14 h-14 rounded-full border-4 border-app-border border-t-[#1877f2] animate-spin" />
              <div className="text-center">
                <h4 className="text-lg font-bold text-app-text mb-1">Waiting for Authorization</h4>
                <p className="text-app-text-3 text-sm">
                  A Facebook window has opened. Complete authorization there, then come back here.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="text-app-text-3 text-sm hover:text-app-text-2 underline underline-offset-2 transition-colors"
              >
                Cancel
              </button>
            </>
          )}

          {/* Success */}
          {connectStatus === 'success' && (
            <>
              <div className="w-14 h-14 rounded-full bg-[rgba(62,193,166,0.12)] border border-[rgba(62,193,166,0.3)] flex items-center justify-center">
                <CheckCircle size={28} className="text-app-teal" />
              </div>
              <div className="text-center">
                <h4 className="text-lg font-bold text-app-text mb-1">Pages Connected!</h4>
                <p className="text-app-text-3 text-sm">
                  Your Facebook Pages are now linked to FIGRize. You can start scheduling posts.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="w-full bg-[rgba(62,193,166,0.12)] border border-[rgba(62,193,166,0.3)] text-app-teal font-semibold py-2.5 rounded-lg hover:bg-[rgba(62,193,166,0.2)] transition-colors"
              >
                Done
              </button>
            </>
          )}

          {/* Error */}
          {connectStatus === 'error' && (
            <>
              <div className="w-14 h-14 rounded-full bg-[rgba(255,107,107,0.1)] border border-[rgba(255,107,107,0.25)] flex items-center justify-center">
                <AlertCircle size={28} className="text-app-danger" />
              </div>
              <div className="text-center">
                <h4 className="text-lg font-bold text-app-text mb-1">Connection Failed</h4>
                <p className="text-app-text-3 text-sm">
                  {connectError || 'Something went wrong. Please try again.'}
                </p>
              </div>
              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-2.5 rounded-lg bg-app-surface border border-app-border text-app-text-2 font-semibold hover:bg-app-surface-3 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onConnectClick}
                  className="flex-1 py-2.5 rounded-lg bg-[#1877f2] hover:bg-[#166fe5] text-white font-semibold transition-colors"
                >
                  Try Again
                </button>
              </div>
            </>
          )}

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-app-text-3 pt-1">
            <Lock size={10} />
            <span>FIGRize never stores your Facebook password.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
