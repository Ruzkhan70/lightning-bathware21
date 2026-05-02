import { useState } from "react";
import { X, Shield, Mail, Lock, CheckCircle, Key, AlertCircle } from "lucide-react";
import { useAdmin } from "../context/AdminContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { toast } from "sonner";

interface ForgotCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ForgotCodeModal({ isOpen, onClose }: ForgotCodeModalProps) {
  const { requestForgotCodeOTP, submitForgotCode } = useAdmin();
  const [step, setStep] = useState<"request" | "verify" | "success">("request");
  const [newCode, setNewCode] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleRequestOTP = async () => {
    setIsLoading(true);
    try {
      const result = await requestForgotCodeOTP();
      if (result.success) {
        setStep("verify");
      } else {
        toast.error(result.error || "Failed to send OTP");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (otp.length !== 6) {
      toast.error("Enter a valid 6-digit OTP");
      return;
    }
    if (!/^\d{6}$/.test(newCode)) {
      toast.error("Security code must be 6 digits");
      return;
    }
    if (newCode !== confirmCode) {
      toast.error("Security codes do not match");
      return;
    }

    setIsLoading(true);
    try {
      const result = await submitForgotCode(otp, newCode);
      if (result.success) {
        setStep("success");
      } else {
        toast.error(result.error || "Failed to update code");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep("request");
    setOtp("");
    setNewCode("");
    setConfirmCode("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center">
              <Key className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Forgot Security Code</h2>
              <p className="text-sm text-muted-foreground">
                {step === "request" && "Request an OTP to reset your code"}
                {step === "verify" && "Enter OTP and set new code"}
                {step === "success" && "Security code updated"}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6">
          {step === "request" && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">OTP will be sent to your recovery email</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">The OTP is valid for 15 minutes</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleRequestOTP}
                disabled={isLoading}
                className="w-full bg-[#D4AF37] hover:bg-[#C5A028] text-black"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </div>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send OTP to Email
                  </>
                )}
              </Button>
            </div>
          )}

          {step === "verify" && (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-800 dark:text-green-200">OTP sent to your recovery email</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">OTP Code</label>
                <Input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="text-center text-xl tracking-[0.3em] font-mono"
                  maxLength={6}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">New Security Code</label>
                <Input
                  type="password"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="6-digit code"
                  className="text-center text-xl tracking-[0.3em] font-mono"
                  maxLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Confirm Security Code</label>
                <Input
                  type="password"
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Re-enter code"
                  className="text-center text-xl tracking-[0.3em] font-mono"
                  maxLength={6}
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={otp.length !== 6 || newCode.length !== 6 || confirmCode.length !== 6 || isLoading}
                className="w-full bg-[#D4AF37] hover:bg-[#C5A028] text-black disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </div>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Update Security Code
                  </>
                )}
              </Button>
            </div>
          )}

          {step === "success" && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Security Code Updated</h3>
              <p className="text-sm text-muted-foreground">Your new security code has been set. It will be rotated automatically every 7 days.</p>
              <Button onClick={handleClose} className="w-full bg-[#D4AF37] hover:bg-[#C5A028] text-black">
                Done
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
