import React from 'react';

const ModPreparing = ({ letter, category, isMod, onSpin, modName }) => {
    // If a letter is set, it means the spin has happened and we are waiting for the game to start.
    const isSpinning = !!letter;

    const handleSpin = () => {
        if (isMod && !isSpinning) {
            onSpin(); // Send request to backend
        }
    };

    return (
        <div className="flex flex-col items-center justify-center fixed inset-0 w-full overflow-hidden overscroll-none p-4 bg-[#1a1a2e] text-white">

            {/* Header Status */}
            <div className="text-center animate-fade-in-down mb-8">
                <div className="text-pink-500 font-bold tracking-widest text-sm mb-2">Preparación de la ronda</div>
                <h2 className="text-2xl font-bold text-white">
                    {isMod ? "Tu turno de moderar" : (
                        <span>
                            <span className="text-yellow-400 font-black">{modName}</span> está moderando <br /> esta ronda
                        </span>
                    )}
                </h2>
            </div>

            {/* 1. IDLE STATE (Waiting for Spin) */}
            {!isSpinning && (
                <div className="flex flex-col items-center animate-fade-in">
                    <div className="text-6xl mb-6 animate-bounce">🎲</div>
                    {isMod ? (
                        <button
                            onClick={handleSpin}
                            className="bg-purple-600 hover:bg-purple-500 text-white font-black text-2xl py-4 px-12 rounded-xl shadow-[0_0_30px_rgba(147,51,234,0.5)] hover:scale-105 transition-all"
                        >
                            ! Gira la ruleta !
                        </button>
                    ) : (
                        <div className="text-sm font-mono text-center px-4 leading-relaxed max-w-xs opacity-70">
                            Esperando el giro de la ruleta...
                        </div>
                    )}
                </div>
            )}

            {/* 2. SPINNING STATE - Visible until game starts (unmounts) */}
            {isSpinning && (
                <div className="flex flex-col items-center">
                    <div className="w-32 h-32 rounded-full border-8 border-purple-500/30 flex items-center justify-center bg-purple-900/20 animate-breathe relative">
                        <div className="absolute inset-0 rounded-full border-4 border-t-pink-500 animate-spin opacity-50"></div>
                        {/* Removed ... */}
                    </div>
                    <p className="mt-6 text-purple-300 font-bold animate-pulse text-xl">
                        Ruleta girando...
                    </p>
                </div>
            )}
        </div>
    );
};


export default ModPreparing;
