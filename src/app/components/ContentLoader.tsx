import { motion } from "framer-motion";

interface ContentLoaderProps {
  minHeight?: string;
}

export default function ContentLoader({ minHeight = "min-h-[60vh]" }: ContentLoaderProps) {
  return (
    <div className={`flex items-center justify-center ${minHeight} w-full`}>
      <div className="relative text-center">
        {/* Animated Loader */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="relative w-20 h-20 mx-auto mb-6"
        >
          {/* Outer Ring */}
          <div className="absolute inset-0 border-4 border-gray-200 rounded-full" />

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
            className="absolute inset-8 bg-gradient-to-br from-[#D4AF37] to-[#B8962E] rounded-full flex items-center justify-center shadow-lg"
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
            <div className="w-3 h-3 bg-white rounded-full" />
          </motion.div>
        </motion.div>

        {/* Loading Text with Dots */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-center gap-1">
            <span className="text-gray-500 text-sm tracking-widest uppercase font-medium">
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
        </motion.div>
      </div>
    </div>
  );
}
