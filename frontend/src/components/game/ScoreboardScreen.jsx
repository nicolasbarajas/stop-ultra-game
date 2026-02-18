import React from 'react';

const ScoreboardScreen = ({ players, isMod, isHost, onContinue, onBackToLobby, onEndGame, isFinal, modName, onKickPlayer, myClientId }) => {
    // Sort players by score
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

    const hostPlayer = players.find(p => p.is_host);
    const hostName = hostPlayer ? hostPlayer.nickname : "el anfitrión";

    return (
        <div className="flex flex-col h-full bg-[#1a1a2e] p-6 text-white items-center overflow-y-auto">
            <h2 className="text-3xl font-black mb-6 text-white text-center">
                {isFinal ? "Resultados finales" : "Tabla de posiciones"}
            </h2>

            <div className="w-full max-w-md flex flex-col gap-4 mb-5">
                {sortedPlayers.map((p, idx) => (
                    <div key={p.id} className="flex items-center gap-3 w-full">
                        <div
                            className={`flex-1 flex items-center justify-between p-4 rounded-xl border-2 transition-all ${idx === 0
                                ? 'bg-gradient-to-r from-green-900/20 to-black/80 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]'
                                : 'bg-slate-800 border-slate-700'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xl ${idx === 0 ? 'bg-green-600 text-white' : 'bg-slate-600 text-gray-300'
                                    }`}>
                                    {idx + 1}
                                </div>
                                <div className="flex flex-col">
                                    <span className={`font-bold text-lg ${idx === 0 ? 'text-green-400' : 'text-white'}`}>
                                        {p.nickname}
                                    </span>
                                    {idx === 0 && <span className="text-[10px] text-green-500 tracking-widest font-bold uppercase">Líder</span>}
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-3xl font-black font-mono">{p.score}</span>
                            </div>
                        </div>

                        {/* Kick Button (Outside) - Only show if NOT final results */}
                        {(isHost || isMod) && !isFinal && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (p.id !== myClientId && confirm(`¿Sacar a ${p.nickname} de la partida?`)) {
                                        if (onKickPlayer) onKickPlayer(p.id);
                                    }
                                }}
                                disabled={p.id === myClientId}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${p.id === myClientId
                                    ? 'text-gray-500 cursor-not-allowed opacity-60 bg-gray-700/30 border border-gray-600/30'
                                    : 'text-red-500 hover:bg-red-500/20 bg-red-500/10 border border-red-500/20'
                                    }`}
                                title={p.id === myClientId ? "No puedes sacarte a ti mismo" : "Sacar jugador"}
                            >
                                <span className="text-xs font-bold">✕</span>
                            </button>
                        )}
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
                                className="w-full py-4 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xl shadow-lg transition-all"
                            >
                                Volver a la sala 🏠
                            </button>
                        ) : (
                            <div className="text-center text-gray-400 animate-pulse px-4 flex flex-col gap-1">
                                <span>Esperando que el anfitrión <span className="text-rose-400 font-bold">{hostName}</span></span>
                                <span>finalice totalmente la partida...</span>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        {isMod ? (
                            <div className="flex flex-col gap-3">
                                <div>
                                    <h2 className="text-lg font-black mb-2 text-white text-center">
                                        Ahora eres moderador
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
                            <div className="text-center text-gray-400 animate-pulse px-4">
                                Esperando a que <span className="text-yellow-400 font-bold">{modName}</span> inicie <br />
                                la siguiente ronda...
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ScoreboardScreen;
