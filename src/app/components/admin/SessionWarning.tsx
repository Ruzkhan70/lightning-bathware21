import { Clock, LogOut, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface SessionWarningProps {
  show: boolean;
  remainingTime: number;
  onStayLoggedIn: () => void;
  onLogout: () => void;
}

export default function SessionWarning({
  show,
  remainingTime,
  onStayLoggedIn,
  onLogout,
}: SessionWarningProps) {
  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[201] w-full max-w-md"
          >
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-500 to-yellow-500 px-6 py-4 flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-full">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Session Expiring</h3>
              </div>

              {/* Content */}
              <div className="p-6 text-center">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-amber-50 border-4 border-amber-200 mb-4">
                    <span className="text-3xl font-bold text-amber-600">
                      {minutes}:{seconds.toString().padStart(2, "0")}
                    </span>
                  </div>
                  <p className="text-gray-600">
                    Your admin session will expire in
                  </p>
                  <p className="text-2xl font-bold text-amber-600">
                    {minutes > 0 ? `${minutes} minute${minutes > 1 ? "s" : ""} and ${seconds} seconds` : `${seconds} seconds`}
                  </p>
                </div>

                <p className="text-sm text-gray-500 mb-6">
                  For security purposes, your session will be automatically logged out.
                </p>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={onLogout}
                    variant="outline"
                    className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout Now
                  </Button>
                  <Button
                    onClick={onStayLoggedIn}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-lg"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Stay Logged In
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
