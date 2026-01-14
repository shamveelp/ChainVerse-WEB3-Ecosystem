"use client"

import React from "react"
import { motion } from "framer-motion"

export default function LoadingScreen() {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900">
            <div className="relative flex flex-col items-center justify-center">
                {/* Outer interacting rings */}
                <motion.div
                    className="absolute h-32 w-32 rounded-full border-2 border-blue-500/30"
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 180, 360],
                        borderWidth: ["2px", "4px", "2px"],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                    }}
                />
                <motion.div
                    className="absolute h-24 w-24 rounded-full border-2 border-purple-500/30"
                    animate={{
                        scale: [1.2, 1, 1.2],
                        rotate: [360, 180, 0],
                        borderWidth: ["2px", "4px", "2px"],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                    }}
                />

                {/* Central Logo Container */}
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-slate-800 shadow-2xl shadow-blue-500/20">
                    <motion.div
                        className="h-10 w-10 bg-gradient-to-tr from-blue-500 to-purple-500"
                        animate={{
                            rotate: [0, 360],
                            borderRadius: ["20%", "50%", "20%"],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut",
                        }}
                    />
                </div>

                {/* Loading Text */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8 flex flex-col items-center gap-1"
                >
                    <h2 className="text-xl font-bold tracking-[0.2em] text-white">
                        CHAINVERSE
                    </h2>
                    <motion.div
                        className="flex gap-1"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                    >
                        <span className="h-1 w-1 rounded-full bg-blue-500" />
                        <span className="h-1 w-1 rounded-full bg-purple-500" />
                        <span className="h-1 w-1 rounded-full bg-blue-500" />
                    </motion.div>
                </motion.div>
            </div>
        </div>
    )
}
