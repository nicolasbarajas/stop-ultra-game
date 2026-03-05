import React, { useState, useEffect, useRef } from 'react';
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
            let timeTaken = 0;
            if (startTime) {
                const nowSynced = Date.now() + serverOffset;
                const startMs = new Date(startTime).getTime();
                const elapsed = (nowSynced - startMs) / 1000;
                timeTaken = Math.max(0, elapsed);
            }

            onSubmitWord(word, timeTaken);
            setSubmitted(true);
        }
    };

    // Game HUD Component (Timer + Info Cards)
    const GameHUD = () => (
        <div className="bg-slate-900/50 py-2 px-1 flex flex-col shadow-2xl z-10 border-y border-white/5 relative overflow-hidden shrink-0">
            {/* Background Glow */}
            <div className="absolute top-0 left-0 w-full h-full bg-indigo-600/10 blur-3xl pointer-events-none"></div>

            {/* Timer Centered */}
            <div className="flex justify-center mb-2 relative z-10">
                <div className={`text-xl font-mono font-black tracking-widest px-4 py-1 rounded-xl bg-black/40 border border-white/10 ${timeLeft < 10 ? 'text-red-500 animate-pulse border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'text-green-400 shadow-[0_0_15px_rgba(74,222,128,0.1)]'}`}>
                    {timeLeft}s
                </div>
            </div>

            {/* Category & Letter Cards */}
            <div className="flex flex-col gap-2 relative z-10">
                {/* Letter Card */}
                <div className="bg-gradient-to-r from-indigo-900/90 to-slate-900/90 border border-indigo-500/30 rounded-xl flex items-center shadow-lg overflow-hidden relative h-16">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-indigo-500 to-transparent opacity-50"></div>
                    <div className="w-24 flex-none flex items-center justify-left pl-3 text-sm tracking-widest text-indigo-300 font-bold h-full">
                        {letter && letter.length > 1 ? "Letras:" : "Letra:"}
                    </div>
                    <div className="flex-1 flex justify-center items-center text-4xl font-black text-indigo-400 drop-shadow-[0_0_10px_rgba(99,102,241,0.6)] leading-none pb-1">
                        {letter}
                    </div>
                </div>

                {/* Category Card */}
                <div className="bg-gradient-to-r from-purple-900/90 to-slate-900/90 border border-purple-500/30 rounded-xl flex items-center shadow-lg overflow-hidden relative group h-16 mb-4">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-purple-500 to-transparent opacity-50"></div>
                    <div className="w-24 flex-none flex items-center justify-left pl-3 text-sm tracking-widest text-purple-300 font-bold h-full">
                        Categoría:
                    </div>
                    <div className="flex-1 flex flex-col justify-center items-center text-center px-2">
                        <span className="font-bold text-white text-xl leading-tight line-clamp-1 drop-shadow-md">
                            {category}
                        </span>
                        {categoryDescription && (
                            <span className="text-[12px] text-purple-200/80 mt-1 leading-tight font-medium">
                                {categoryDescription}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-[#1a1a2e] items-center w-full fixed inset-0 overflow-hidden overscroll-none">
            <div className="w-full max-w-md h-full flex flex-col relative shadow-2xl bg-[#1a1a2e] border-x border-white/5">

                {/* Mod View: Top Bar (Visible only for Mod at top) */}
                {isMod && <GameHUD />}

                {/* Main Content Area */}
                <div className={`flex-1 flex flex-col items-center w-full ${isMod ? 'p-4 overflow-hidden' : 'p-0 justify-end'}`}>
                    {isMod ? (
                        <div className="w-full h-full flex flex-col items-center min-h-0">
                            <div className="text-center mb-4 shrink-0">
                                <h3 className="text-xl font-bold text-indigo-400 tracking-wide">Respuestas en vivo</h3>
                            </div>

                            {/* Real-time Answer Feed */}
                            <div className="w-full max-w-sm flex-1 min-h-0 overflow-y-auto space-y-2 mb-4 custom-scrollbar">
                                {safeAnswers.map((ans, idx) => (
                                    <div key={idx} className="px-2 rounded-lg flex justify-between items-center animate-fade-in-up">
                                        <div className="flex flex-col">
                                            <span className="text-lg text-gray-400 font-bold">{ans.nickname}</span>
                                            {ans.time_taken !== undefined && (
                                                <span className="text-md text-indigo-400 font-mono">
                                                    {ans.time_taken.toFixed(3)}s
                                                </span>
                                            )}
                                        </div>
                                        <span className="bg-black/30 px-2 py-1 rounded text-green-400 font-mono text-sm">Envió</span>
                                    </div>
                                ))}
                                {safeAnswers.length === 0 && (
                                    <div className="text-gray-500 text-center text-sm italic mt-10">Esperando respuestas...</div>
                                )}
                            </div>

                            <button
                                onClick={onForceEnd}
                                className="mt-2 text-xs text-red-400 border border-red-500/30 px-4 py-2 rounded-xl hover:bg-red-500/10 transition-colors shrink-0 mb-4"
                            >
                                Forzar el fin de la ronda
                            </button>
                        </div>
                    ) : (
                        /* Player View: Feedback or Empty Space above HUD */
                        <div className="flex-1 w-full flex flex-col items-center justify-center">
                            {submitted && (
                                <div className="text-center animate-bounce-in">
                                    <div className="text-6xl text-green-500 mb-4 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]">✓</div>
                                    <div className="text-2xl font-bold text-white">¡Enviado!</div>
                                    <div className="mt-2 text-sm text-gray-400">Suerte 🍀</div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Player View: Bottom HUD + Keyboard */}
                {!isMod && (
                    <div className="flex flex-col w-full z-50">
                        {/* HUD sits effectively on top of keyboard area */}
                        <GameHUD />

                        {!submitted && (
                            <VirtualKeyboard
                                onKeyPress={handleKeyPress}
                                onBackspace={handleBackspace}
                                onDeleteAll={handleDeleteAll}
                                onSend={handleSend}
                                currentText={word}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlayingScreen;
