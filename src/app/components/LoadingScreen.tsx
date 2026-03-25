import { motion } from "framer-motion";

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
      <div className="text-center">
        {/* Logo Animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold">
            <span className="text-black">Lightning</span>
            <span className="text-[#D4AF37]"> Bathware</span>
          </h1>
        </motion.div>

        {/* Animated Loader */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          {/* Outer Ring */}
          <motion.div
            className="absolute inset-0 border-4 border-gray-200 rounded-full"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
          
          {/* Spinning Ring */}
          <motion.div
            className="absolute inset-0 border-4 border-transparent border-t-[#D4AF37] rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Inner Spinning Ring */}
          <motion.div
            className="absolute inset-3 border-4 border-transparent border-b-[#D4AF37] rounded-full"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Center Dot */}
          <motion.div
            className="absolute inset-7 bg-[#D4AF37] rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </div>

        {/* Loading Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-gray-600 text-sm tracking-wider">LOADING</p>
          <div className="flex justify-center gap-1 mt-2">
            <motion.span
              className="w-2 h-2 bg-[#D4AF37] rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0 }}
            />
            <motion.span
              className="w-2 h-2 bg-[#D4AF37] rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
            />
            <motion.span
              className="w-2 h-2 bg-[#D4AF37] rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
