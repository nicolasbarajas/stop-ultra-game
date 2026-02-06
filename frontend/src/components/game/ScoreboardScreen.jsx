import React from 'react';

const ScoreboardScreen = ({ players, isMod, isHost, onContinue, onBackToLobby, onEndGame, isFinal, modName }) => {
    // Sort players by score
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

    return (
        <div className="flex flex-col h-full bg-[#1a1a2e] p-6 text-white items-center overflow-y-auto">
            <h2 className="text-3xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 tracking-wide text-center shrink-0">
                {isFinal ? "Resultados finales" : "Tabla de posiciones"}
            </h2>

            <div className="w-full max-w-md flex flex-col gap-4 mb-5">
                {sortedPlayers.map((p, idx) => (
                    <div
                        key={p.id}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 ${idx === 0
                            ? 'bg-gradient-to-r from-yellow-900/40 to-black border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)] transform scale-105'
                            : 'bg-slate-800 border-slate-700'
                            }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xl ${idx === 0 ? 'bg-yellow-500 text-black' : 'bg-slate-600 text-gray-300'
                                }`}>
                                {idx + 1}
                            </div>
                            <div className="flex flex-col">
                                <span className={`font-bold text-lg ${idx === 0 ? 'text-yellow-400' : 'text-white'}`}>
                                    {p.nickname}
                                </span>
                                {idx === 0 && <span className="text-[10px] text-yellow-600 tracking-widest font-bold">Líder</span>}
                            </div>
                        </div>
                        <div className="text-3xl font-black font-mono">
                            {p.score}
                        </div>
                    </div>
                ))}
            </div>

            {/* Actions Area - Moved immediately after list for better mobile layout */}
            <div className="w-full max-w-md flex flex-col gap-3 pb-8">
                {isFinal ? (
                    <>
                        {isHost ? (
                            <button
                                onClick={onBackToLobby}
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-black text-xl shadow-lg hover:scale-105 transition-transform"
                            >
                                Volver a la sala 🏠
                            </button>
                        ) : (
                            <div className="text-center text-gray-400 animate-pulse">
                                Esperando acción del anfitrión...
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        {isMod ? (
                            <div className="flex flex-col gap-3">
                                <div>
                                    <h2 className="text-lg font-black mb-2 text-white text-center">
                                        ¡Ganaste!, ahora eres moderador
                                    </h2>
                                    <p className="text-gray-400 text-center mb-2 text-sm">
                                        ¡Vamos a la siguiente ronda!
                                    </p>
                                </div>
                                <button
                                    onClick={onContinue}
                                    className="w-full py-4 mb-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xl shadow-lg hover:scale-105 transition-transform animate-pulse-slow"
                                >
                                    Preparar Ronda
                                </button>

                                <button
                                    onClick={() => {
                                        if (confirm("¿Estás seguro de finalizar la partida y ver los resultados finales?")) onEndGame();
                                    }}
                                    className="w-full py-4 text-red-400 text-lg font-bold border-2 border-red-500/30 rounded-xl hover:bg-red-900/20 transition-all"
                                >
                                    Finalizar Partida
                                </button>
                            </div>
                        ) : (
                            <div className="text-center text-gray-400 animate-pulse mt-4 px-4">
                                Esperando a que <span className="text-yellow-400 font-bold">{modName}</span> inicie la siguiente ronda...
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ScoreboardScreen;
