import { motion } from "framer-motion";

const LOGO_URL = "https://i.imgur.com/EKKhbqA.png";

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white overflow-hidden">
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
        {/* Logo Container with Glow */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative mb-8"
        >
          {/* Glow Effect Behind Logo */}
          <motion.div
            className="absolute inset-0 blur-3xl bg-[#D4AF37]/20 rounded-full scale-150"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Logo Image */}
          <motion.img
            src={LOGO_URL}
            alt="Lightning Bathware Logo"
            className="relative w-48 h-48 md:w-56 md:h-56 object-contain mx-auto"
            animate={{
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>

        {/* Store Name */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            <span className="text-black">Lightning</span>
            <span className="text-[#D4AF37]"> Bathware</span>
          </h1>
        </motion.div>

        {/* Animated Loader */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="relative w-24 h-24 mx-auto mb-6"
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
            className="absolute inset-4 border-4 border-transparent rounded-full"
            style={{
              borderBottomColor: "#D4AF37",
              borderLeftColor: "#D4AF37",
            }}
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />

          {/* Center Logo Dot */}
          <motion.div
            className="absolute inset-7 bg-gradient-to-br from-[#D4AF37] to-[#B8962E] rounded-full flex items-center justify-center shadow-lg"
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

        {/* Loading Text with Dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <div className="flex items-center justify-center gap-1">
            <span className="text-gray-500 text-sm tracking-[0.3em] uppercase font-medium">
              Loading
            </span>
            <div className="flex gap-1 ml-1">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full"
                  animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 w-48 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#D4AF37] to-[#B8962E]"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </div>
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
    </div>
  );
}
