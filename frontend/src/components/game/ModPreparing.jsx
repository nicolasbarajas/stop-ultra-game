import React from 'react';

const ModPreparing = ({ letter, category, isMod, onSpin, onStartRound, modName }) => {
    const [isSpinning, setIsSpinning] = React.useState(false);

    const handleSpinClick = () => {
        setIsSpinning(true);
        // Delay the actual data fetch to show the animation
        setTimeout(() => {
            onSpin();
        }, 2000);
    };

    // Stop spinning animation once the letter is received
    React.useEffect(() => {
        if (letter) {
            setIsSpinning(false);
        }
    }, [letter]);

    return (
        <div className="flex flex-col items-center justify-center h-full p-4 bg-[#1a1a2e] text-white">

            {/* Header Status */}
            <div className="text-center animate-fade-in-down mb-8">
                <div className="text-pink-500 font-bold tracking-widest text-sm mb-2">Preparación de la ronda</div>
                <h2 className="text-2xl font-bold text-white">
                    {isMod ? "Tu turno de moderar" : (
                        <span>
                            El moderador <span className="text-yellow-400 font-black">{modName}</span> está preparando la ronda
                        </span>
                    )}
                </h2>
            </div>

            {/* MODERATOR VIEW */}
            {isMod && (
                <>
                    {/* 1. Initial State: Button */}
                    {!letter && !isSpinning && (
                        <div className="flex flex-col items-center animate-fade-in">
                            <div className="text-6xl mb-6 animate-bounce">🎲</div>
                            <button
                                onClick={handleSpinClick}
                                className="bg-purple-600 hover:bg-purple-500 text-white font-black text-2xl py-6 px-12 rounded-xl shadow-[0_0_30px_rgba(147,51,234,0.5)] hover:scale-105 transition-all"
                            >
                                ! Gira la ruleta !
                            </button>
                        </div>
                    )}

                    {/* 2. Loading State: Breathing Circle */}
                    {isSpinning && (
                        <div className="flex flex-col items-center">
                            <div className="w-48 h-48 rounded-full border-8 border-purple-500/30 flex items-center justify-center bg-purple-900/20 animate-breathe relative">
                                <div className="absolute inset-0 rounded-full border-4 border-t-pink-500 animate-spin opacity-50"></div>
                                <span className="text-3xl font-black text-purple-200">...</span>
                            </div>
                            <p className="mt-6 text-purple-300 font-bold animate-pulse">Girando...</p>
                        </div>
                    )}

                    {/* 3. Result State: Cards (Fade In) */}
                    {letter && !isSpinning && (
                        <div className="flex flex-col gap-6 w-full max-w-sm animate-fade-in-delayed">
                            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-500/30 p-8 rounded-2xl flex flex-col items-center shadow-2xl relative overflow-hidden group">
                                <div className="text-indigo-300 font-medium mb-2 tracking-wide text-lg">Letra</div>
                                <div className="text-8xl font-black text-white drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                                    {letter}
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-purple-900 to-slate-900 border border-purple-500/30 p-6 rounded-2xl flex flex-col items-center shadow-xl relative overflow-hidden">
                                <div className="text-purple-300 font-medium mb-2 tracking-wide text-lg">Categoría</div>
                                <div className="text-3xl font-bold text-white text-center leading-tight">
                                    {category}
                                </div>
                            </div>

                            <div className="h-24 flex items-center justify-center w-full mt-2">
                                <button
                                    onClick={onStartRound}
                                    className="bg-green-600 hover:bg-green-500 text-white font-black text-xl py-4 px-12 rounded-xl shadow-lg hover:shadow-green-500/20 hover:scale-105 active:scale-95 transition-all animate-pulse-slow"
                                >
                                    Iniciar Ronda
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* WAITING VIEW (Non-Mod) */}
            {!isMod && (
                <div className="flex flex-col items-center opacity-80">
                    {/* Horizontal Progress Bar */}
                    <div className="w-64 h-3 bg-slate-800 rounded-full relative overflow-hidden border border-slate-700 mb-6 shadow-inner">
                        <div className="absolute h-full w-1/3 bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-slide-right rounded-full filter blur-[1px]"></div>
                    </div>

                    <div className="text-xl font-mono text-center px-4 leading-relaxed max-w-xs">
                        Esperando a que <span className="text-yellow-400 font-bold">{modName}</span> gire la ruleta...
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModPreparing;
