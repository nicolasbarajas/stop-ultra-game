import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const WinnerRevealScreen = ({
    winnerName,
    winningWord,
    winningTime,
    isMeNextMod,
    nextModName,
    onSkip
}) => {
    const [canSkip, setCanSkip] = useState(false);

    useEffect(() => {
        if (isMeNextMod) {
            const timer = setTimeout(() => {
                setCanSkip(true);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [isMeNextMod]);

    return (
        <div className="flex flex-col items-center justify-center h-full w-full p-6 text-center space-y-8 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-b from-yellow-900/20 to-black pointer-events-none" />
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-yellow-500/10 rounded-full blur-[100px]" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-lg max-h-lg bg-yellow-500/5 rounded-full blur-[80px]" />

            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="z-10 flex flex-col items-center"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="text-6xl mb-4"
                    >
                        🏆
                    </motion.div>

                    <h2 className="text-2xl text-yellow-100/80 font-light tracking-wide uppercase mb-2">
                        Ganador de la ronda
                    </h2>

                    <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-100 to-yellow-300 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)] mb-6">
                        {winnerName}
                    </h1>

                    <div className="relative">
                        <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full" />
                        <div className="relative bg-black/40 border border-yellow-500/30 px-8 py-4 rounded-2xl backdrop-blur-md">
                            <span className="text-yellow-200/60 text-sm uppercase tracking-wider block mb-1">Palabra Ganadora</span>
                            <span className="text-2xl md:text-3xl font-bold text-white tracking-wide">
                                "{winningWord}"
                            </span>
                            {winningTime > 0 && (
                                <span className="block text-indigo-300 text-sm font-mono mt-2">
                                    ⏱ {winningTime.toFixed(3)}s
                                </span>
                            )}
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.5, duration: 0.8 }}
                    className="z-10 mt-12 bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 p-6 rounded-xl max-w-sm w-full shadow-2xl"
                >
                    {isMeNextMod ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-yellow-400">¡Es tu turno de moderar!</h3>
                                <p className="text-slate-300 text-sm">Prepárate para girar la ruleta.</p>
                            </div>

                            {canSkip && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    onClick={onSkip}
                                    className="px-6 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded-lg border border-yellow-500/50 transition-all font-medium text-sm"
                                >
                                    Continuar ahora ➜
                                </motion.button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center mx-auto text-lg border border-slate-600">
                                👤
                            </div>
                            <h3 className="text-lg font-medium text-slate-200">
                                El jugador <span className="text-yellow-400 font-bold">{nextModName}</span> será el siguiente moderador
                            </h3>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Countdown or Progress bar (Optional visual cue) */}
            <motion.div
                className="absolute bottom-0 left-0 h-1 bg-yellow-500/50"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 10, ease: "linear" }}
            />
        </div>
    );
};

export default WinnerRevealScreen;
