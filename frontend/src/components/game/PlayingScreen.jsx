import React, { useState, useEffect } from 'react';
import VirtualKeyboard from '../VirtualKeyboard';

const PlayingScreen = ({
    isMod,
    letter,
    category,
    categoryDescription,
    answers = [], // New prop for Real-time view
    onSubmitWord,
    onForceEnd,
    isHost,
    initialTime = 60,
    startTime,
    serverOffset = 0 // Default to 0
}) => {
    const [timeLeft, setTimeLeft] = useState(typeof initialTime === 'number' ? initialTime : 60);
    const [word, setWord] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const safeAnswers = Array.isArray(answers) ? answers : [];

    // Timer Logic
    useEffect(() => {
        if (!startTime) {
            setTimeLeft(typeof initialTime === 'number' ? initialTime : 60);
            return;
        }

        const calculateTimeLeft = () => {
            const start = new Date(startTime).getTime();
            const now = Date.now() + serverOffset;
            const elapsedSeconds = Math.floor((now - start) / 1000);
            const remaining = Math.max(initialTime - elapsedSeconds, 0);
            return remaining;
        };

        const initialRemaining = calculateTimeLeft();
        setTimeLeft(initialRemaining);

        if (initialRemaining <= 0) return;

        const timer = setInterval(() => {
            const remaining = calculateTimeLeft();
            setTimeLeft(remaining);
            if (remaining <= 0) {
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [startTime, initialTime, serverOffset]);

    useEffect(() => {
        if (timeLeft === 0 && isMod) {
            onForceEnd();
        }
    }, [timeLeft, isMod, onForceEnd]);

    // Keyboard handlers
    const handleKeyPress = (key) => {
        if (submitted) return;
        setWord(prev => (prev + key).slice(0, 25));
    };

    const handleBackspace = () => {
        if (submitted) return;
        setWord(prev => prev.slice(0, -1));
    };

    const handleDeleteAll = () => {
        if (submitted) return;
        setWord("");
    };

    const handleSend = () => {
        if (word.length > 0 && !submitted) {
            onSubmitWord(word);
            setSubmitted(true);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#1a1a2e]">
            {/* Top Bar Info (Always Visible) - Compact Mode */}
            <div className="bg-slate-900/50 p-3 flex flex-col shadow-2xl z-10 border-b border-white/5 relative overflow-hidden shrink-0">
                {/* Background Glow */}
                <div className="absolute top-0 left-0 w-full h-full bg-indigo-600/10 blur-3xl pointer-events-none"></div>

                {/* Timer Centered - Smooshed to top */}
                <div className="flex justify-center mb-3 relative z-10">
                    <div className={`text-2xl font-mono font-black tracking-widest px-4 py-1 rounded-xl bg-black/40 border border-white/10 ${timeLeft < 10 ? 'text-red-500 animate-pulse border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'text-green-400 shadow-[0_0_15px_rgba(74,222,128,0.1)]'}`}>
                        {timeLeft}s
                    </div>
                </div>

                {/* Category & Letter Cards - Horizontal Layouts for Compactness */}
                <div className="flex flex-col gap-2 relative z-10">
                    {/* Letter Card (Horizontal) */}
                    <div className="bg-gradient-to-r from-indigo-900/90 to-slate-900/90 border border-indigo-500/30 rounded-xl flex items-center p-0 shadow-lg overflow-hidden relative h-24">
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-indigo-500 to-transparent opacity-50"></div>
                        {/* Label Left */}
                        <div className="w-32 flex-none flex items-center justify-left pl-4  text-md tracking-widest text-indigo-300 font-bold border-r border-indigo-500/30 h-full bg-black/10">
                            Letra
                        </div>
                        {/* Value Right */}
                        <div className="flex-1 flex justify-center items-center text-6xl font-black text-indigo-400 drop-shadow-[0_0_10px_rgba(99,102,241,0.6)] leading-none pb-1">
                            {letter}
                        </div>
                    </div>

                    {/* Category Card (Horizontal) */}
                    <div className="bg-gradient-to-r from-purple-900/90 to-slate-900/90 border border-purple-500/30 rounded-xl flex items-center p-0 shadow-lg overflow-hidden relative group h-24">
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-purple-500 to-transparent opacity-50"></div>
                        {/* Label Left */}
                        <div className="w-32 flex-none flex items-center justify-left pl-4 text-md tracking-widest text-purple-300 font-bold border-r border-purple-500/30 h-full bg-black/10">
                            Categoría
                        </div>
                        {/* Value Right */}
                        <div className="flex-1 flex flex-col justify-center items-center text-center px-2">
                            <span className="font-bold text-white text-2xl sm:text-2xl leading-tight line-clamp-1 drop-shadow-md">
                                {category}
                            </span>
                            {categoryDescription && (
                                <span className="text-xs text-purple-200/80 mt-0.5 leading-tight font-medium">
                                    {categoryDescription}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className={`flex-1 flex flex-col items-center justify-center p-4 ${isMod ? '' : 'pb-[45vh]'}`}>
                {isMod ? (
                    <div className="w-full h-full flex flex-col items-center">
                        <div className="text-center mb-4">
                            <h3 className="text-xl font-bold text-indigo-400 tracking-wide">Respuestas en vivo</h3>
                        </div>

                        {/* Real-time Answer Feed */}
                        <div className="w-full max-w-sm flex-1 overflow-y-auto space-y-2 mb-4 custom-scrollbar">
                            {safeAnswers.map((ans, idx) => (
                                <div key={idx} className="bg-slate-800/80 p-3 rounded-lg flex justify-between items-center border border-slate-700 animate-fade-in-up">
                                    <span className="text-xs text-gray-400 font-bold">{ans.nickname}</span>
                                    <span className="bg-black/30 px-2 py-1 rounded text-green-400 font-mono text-sm">ENVIADO</span>
                                </div>
                            ))}
                            {safeAnswers.length === 0 && (
                                <div className="text-gray-500 text-center text-sm italic mt-10">Esperando respuestas...</div>
                            )}
                        </div>

                        <button
                            onClick={onForceEnd}
                            className="mt-2 text-xs text-red-400 border border-red-500/30 px-4 py-2 rounded-xl hover:bg-red-500/10 transition-colors"
                        >
                            Forzar el fin de la ronda
                        </button>
                    </div>
                ) : (
                    <>
                        {submitted ? (
                            <div className="text-center animate-bounce-in">
                                <div className="text-6xl text-green-500 mb-4 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]">✓</div>
                                <div className="text-2xl font-bold text-white">¡Enviado!</div>
                                <div className="mt-2 text-sm text-gray-400">Suerte 🍀</div>
                            </div>
                        ) : (
                            <div className="flex-1"></div>
                        )}
                    </>
                )}
            </div>

            {/* Keyboard (Only for Players who haven't submitted) */}
            {!isMod && !submitted && (
                <VirtualKeyboard
                    onKeyPress={handleKeyPress}
                    onBackspace={handleBackspace}
                    onDeleteAll={handleDeleteAll}
                    onSend={handleSend}
                    currentText={word}
                />
            )}
        </div>
    );
};

export default PlayingScreen;
