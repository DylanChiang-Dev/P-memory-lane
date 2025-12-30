import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface IntroSlideProps {
    year: number;
    username?: string;
}

export const IntroSlide: React.FC<IntroSlideProps> = ({ year, username = 'My' }) => {
    return (
        <div className="w-full h-full relative snap-start flex flex-col items-center justify-center overflow-hidden bg-slate-950 text-white">
            {/* Background Atmosphere */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950" />

            <div className="relative z-10 flex flex-col items-center space-y-8 animate-fade-in px-8 text-center">
                {/* Visual Icon */}
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 1.5, type: "spring" }}
                    className="relative"
                >
                    <div className="absolute inset-0 bg-teal-500 blur-2xl opacity-30 animate-pulse rounded-full" />
                    <Sparkles className="w-16 h-16 text-teal-400 relative z-10" />
                </motion.div>

                <div className="space-y-2">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className="text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50"
                    >
                        {year}
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2, duration: 1 }}
                        className="text-lg font-light tracking-[0.5em] uppercase text-white/60"
                    >
                        Memory Lane
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2, duration: 1, repeat: Infinity, repeatType: "reverse" }}
                    className="absolute bottom-16 left-0 right-0 text-center"
                >
                    <p className="text-white/30 text-xs tracking-widest uppercase">Swipe Up to Begin</p>
                </motion.div>
            </div>
        </div>
    );
};
