import React, { useState } from 'react';

const EvaluationScreen = ({
    answers,
    players,
    isMod,
    isHost,
    onSelectWinner,
    onRestartRound,
    onEndGame,
    modName
}) => {
    const [selectedId, setSelectedId] = useState(null);

    return (
        <div className="flex flex-col h-full bg-[#1a1a2e] p-4 text-white overflow-hidden">
            <h2 className="text-center text-xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 shrink-0">
                Respuestas
            </h2>

            {/* Table of Answers - Compact list */}
            <div className="overflow-y-auto mb-5 custom-scrollbar p-1 shrink-0 max-h-[60vh]">
                <div className="flex flex-col gap-2">
                    {answers.map((entry, idx) => (
                        <div
                            key={idx}
                            onClick={() => isMod && setSelectedId(entry.client_id)}
                            className={`p-3 rounded-lg border flex justify-between items-center transition-all ${selectedId === entry.client_id
                                ? 'bg-gradient-to-r from-green-900 to-slate-800 border-green-500 shadow-md'
                                : 'bg-slate-800/60 border-slate-700'
                                } ${isMod ? 'cursor-pointer active:scale-[0.99]' : ''}`}
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-xl bg-slate-600 flex items-center justify-center font-bold text-[10px]">
                                    {entry.nickname.charAt(0)}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-400">{entry.nickname}</span>
                                    <span className="text-lg font-bold text-white tracking-wide leading-tight">
                                        {entry.answer}
                                    </span>
                                </div>
                            </div>

                            {selectedId === entry.client_id && (
                                <div className="text-xl animate-bounce">🏆</div>
                            )}
                        </div>
                    ))}
                    {answers.length === 0 && (
                        <div className="text-center text-gray-500 py-4 text-sm">Nadie respondió...</div>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-2 w-full">
                {isMod ? (
                    <>
                        {answers.length > 0 ? (
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => selectedId && onSelectWinner(selectedId)}
                                    disabled={!selectedId}
                                    className={`w-full py-3 mb-3 rounded-xl font-black text-lg transition-all shadow-lg ${selectedId
                                        ? 'bg-gradient-to-r from-green-600 to-emerald-700 text-white active:scale-[0.98]'
                                        : 'bg-slate-700 text-gray-500 cursor-not-allowed'
                                        }`}
                                >
                                    {selectedId ? "Confirmar Ganador" : "↑ Elige al ganador ↑"}
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirm("¿Seguro que nadie ganó? Se iniciará una nueva ronda.")) onRestartRound();
                                    }}
                                    className="w-full py-3 mb-2 rounded-xl font-bold text-lg text-yellow-400 border-2 border-yellow-500/30 hover:bg-yellow-500/10 transition-all"
                                >
                                    Nadie ganó - Repetir ronda
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirm("¿Estás seguro de finalizar la partida?")) onEndGame();
                                    }}
                                    className="w-full py-3 text-red-400 text-lg font-bold border-2 border-red-500/30 rounded-xl hover:bg-red-900/20 transition-all"
                                >
                                    Finalizar Partida
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={onRestartRound}
                                    className="w-full py-3 mb-2 rounded-xl font-black text-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-lg"
                                >
                                    Nueva Ronda
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirm("¿Estás seguro de finalizar la partida?")) onEndGame();
                                    }}
                                    className="w-full py-3 text-red-400 text-lg font-bold border-2 border-red-500/30 rounded-xl hover:bg-red-900/20 transition-all"
                                >
                                    Finalizar Partida
                                </button>
                            </div>
                        )}
                    </>

                ) : (
                    <div className="text-center text-xs text-gray-400 animate-pulse bg-slate-800/50 p-2 rounded-lg border border-slate-700">
                        {answers.length > 0 ? (
                            <span>
                                El moderador <span className="text-yellow-400 font-bold">{modName}</span> está eligiendo al ganador...
                            </span>
                        ) : (
                            "Nadie ha respondido... Esperando decisión."
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EvaluationScreen;
