import React, { useState, useEffect } from 'react';
import VirtualKeyboard from '../VirtualKeyboard';

const PlayingScreen = ({
    isMod,
    letter,
    category,
    answers = [], // New prop for Real-time view
    onSubmitWord,
    onForceEnd,
    isHost,
    initialTime = 60
}) => {
    const [word, setWord] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(initialTime);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

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
            {/* Top Bar Info (Always Visible) */}
            {/* Top Bar Info (Always Visible) */}
            <div className="bg-slate-800 flex flex-col shadow-lg z-10 border-b border-white/10">
                {/* Timer Centered */}
                <div className={`w-full text-center py-2 font-mono font-bold text-3xl border-b border-slate-700/50 ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-green-400'}`}>
                    {timeLeft}s
                </div>

                {/* Category & Letter Split */}
                <div className="flex h-24">
                    <div className="flex-1 flex flex-col justify-center items-center border-r border-slate-700/50 p-2">
                        <span className="text-sm text-gray-400 mb-1">Categoría</span>
                        <span className="text-white font-bold text-center leading-tight text-xl overflow-hidden px-2 line-clamp-2">
                            {category}
                        </span>
                    </div>

                    <div className="flex-1 flex flex-col justify-center items-center p-2 bg-indigo-900/20">
                        <span className="text-sm text-indigo-300 mb-1">Letra</span>
                        <div className="text-5xl font-black text-indigo-400 drop-shadow-md">
                            {letter}
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
                            {answers.map((ans, idx) => (
                                <div key={idx} className="bg-slate-800/80 p-3 rounded-lg flex justify-between items-center border border-slate-700 animate-fade-in-up">
                                    <span className="text-xs text-gray-400 font-bold">{ans.nickname}</span>
                                    <span className="bg-black/30 px-2 py-1 rounded text-green-400 font-mono text-sm">ENVIADO</span>
                                </div>
                            ))}
                            {answers.length === 0 && (
                                <div className="text-gray-500 text-center text-sm italic mt-10">Esperando que alguien escriba...</div>
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
