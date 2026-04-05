"use client";

import { motion } from "framer-motion";

export default function Template({ children }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1], // Custom cubic-bezier for "snappy" feel
                opacity: { duration: 0.6 },
                scale: { duration: 0.8 }
            }}
            style={{ width: "100%" }}
        >
            {children}
        </motion.div>
    );
}
