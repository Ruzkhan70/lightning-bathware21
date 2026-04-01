import { motion } from "framer-motion";
import { useAdmin } from "../context/AdminContext";

export default function LoadingScreen() {
  const { storeProfile } = useAdmin();
  
  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white overflow-hidden"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background Gradient Animation */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-white">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/5 via-transparent to-[#D4AF37]/5"
          animate={{
            x: ["-100%", "100%"],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      {/* Floating Particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-[#D4AF37] rounded-full opacity-20"
          style={{
            left: `${15 + i * 15}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [-20, 20, -20],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 2 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Main Content */}
      <div className="relative text-center px-4">
        {/* Store Name */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight flex items-center justify-center gap-1">
            <span className="text-black">{storeProfile.storeName}</span>
            <span className="text-[#D4AF37]">{storeProfile.storeNameAccent}</span>
          </h1>
        </motion.div>

        {/* Animated Loader */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="relative w-28 h-28 mx-auto mb-8"
        >
          {/* Outer Ring */}
          <motion.div
            className="absolute inset-0 border-4 border-gray-200 rounded-full"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          />

          {/* Spinning Ring - Clockwise */}
          <motion.div
            className="absolute inset-0 border-4 border-transparent rounded-full"
            style={{
              borderTopColor: "#D4AF37",
              borderRightColor: "#D4AF37",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />

          {/* Inner Spinning Ring - Counter Clockwise */}
          <motion.div
            className="absolute inset-5 border-4 border-transparent rounded-full"
            style={{
              borderBottomColor: "#D4AF37",
              borderLeftColor: "#D4AF37",
            }}
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />

          {/* Center Logo Dot */}
          <motion.div
            className="absolute inset-10 bg-gradient-to-br from-[#D4AF37] to-[#B8962E] rounded-full flex items-center justify-center shadow-lg"
            animate={{
              scale: [1, 1.1, 1],
              boxShadow: [
                "0 0 20px rgba(212, 175, 55, 0.3)",
                "0 0 40px rgba(212, 175, 55, 0.6)",
                "0 0 20px rgba(212, 175, 55, 0.3)",
              ],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div className="w-4 h-4 bg-white rounded-full" />
          </motion.div>
        </motion.div>

        {/* Loading Text with Pulsing Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <motion.p
            className="text-[#D4AF37] text-lg font-bold tracking-[0.4em] uppercase"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            LOADING
          </motion.p>
        </motion.div>
      </div>

      {/* Corner Decorations */}
      <motion.div
        className="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-[#D4AF37]/20 rounded-tl-xl"
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.div
        className="absolute top-8 right-8 w-16 h-16 border-r-2 border-t-2 border-[#D4AF37]/20 rounded-tr-xl"
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
      />
      <motion.div
        className="absolute bottom-8 left-8 w-16 h-16 border-l-2 border-b-2 border-[#D4AF37]/20 rounded-bl-xl"
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 2, repeat: Infinity, delay: 1 }}
      />
      <motion.div
        className="absolute bottom-8 right-8 w-16 h-16 border-r-2 border-b-2 border-[#D4AF37]/20 rounded-br-xl"
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
      />
    </motion.div>
  );
}
