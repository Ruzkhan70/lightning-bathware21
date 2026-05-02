import { useState } from "react";
import { X, Shield, Key, AlertCircle } from "lucide-react";
import { useAdmin } from "../context/AdminContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface SecurityCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SecurityCodeModal({ isOpen, onClose, onSuccess }: SecurityCodeModalProps) {
  const { verifySecurityCodeAction, requestForgotCodeOTP } = useAdmin();
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);

  if (!isOpen) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;

    setIsVerifying(true);
    try {
      const valid = await verifySecurityCodeAction(code);
      if (valid) {
        setCode("");
        onClose();
        onSuccess();
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSendOTP = async () => {
    setIsSendingOTP(true);
    try {
      const result = await requestForgotCodeOTP();
      if (result.success) {
        setShowForgot(true);
      } else {
        console.error(result.error);
      }
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleClose = () => {
    setCode("");
    setShowForgot(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Security Verification</h2>
              <p className="text-sm text-gray-500">Enter your 6-digit security code</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {!showForgot ? (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-800">
                  A security code is required before changing your username or password. This code was sent to your recovery email.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Security Code</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    className="pl-10 text-center text-2xl tracking-[0.5em] font-mono"
                    maxLength={6}
                    autoFocus
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={code.length !== 6 || isVerifying}
                className="w-full bg-[#D4AF37] hover:bg-[#C5A028] text-black disabled:opacity-50"
              >
                {isVerifying ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Verifying...
                  </div>
                ) : (
                  "Verify Code"
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={isSendingOTP}
                  className="text-sm text-[#D4AF37] hover:underline disabled:opacity-50"
                >
                  {isSendingOTP ? "Sending OTP..." : "Forgot your code? Request OTP"}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-green-800 font-medium">OTP sent to your recovery email</p>
                <p className="text-xs text-green-600 mt-1">Check your inbox and use the code to set a new security code</p>
              </div>
              <p className="text-sm text-gray-500 text-center">
                Go to Settings → Security & Devices and use the "Change Security Code" option with your OTP.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
