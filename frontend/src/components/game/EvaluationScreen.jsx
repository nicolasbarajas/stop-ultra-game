import React, { useState } from 'react';
import PreviousAnswersModal from './PreviousAnswersModal';
import ConfirmModal from '../ConfirmModal';
import { useConfirm } from '../../hooks/useConfirm';

const EvaluationScreen = ({
    answers,
    categoryDescription,
    players,
    isMod,
    isHost,
    onSelectWinner,
    onRestartRound,
    onEndGame,
    modName,
    letter,
    category,
    winnersHistory = [] // New prop
}) => {
    const [selectedId, setSelectedId] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const { confirmConfig, requestConfirm, closeConfirm } = useConfirm();

    return (
        <div className="flex flex-col fixed inset-0 w-full overflow-hidden overscroll-none bg-[#1a1a2e] p-4 text-white">
            <div className="bg-slate-900/50 p-4 mb-4 rounded-xl border border-white/5 relative shrink-0 shadow-lg">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-50 rounded-t-xl" />
                <div className="flex items-center gap-4">
                    {/* Letter Box */}
                    <div className="flex flex-col items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-lg shadow-lg border border-indigo-400/30 shrink-0">
                        <span className="text-[12px] text-indigo-200 font-bold tracking-wider">{letter && letter.length > 1 ? "Letras" : "Letra"}</span>
                        <span className="text-4xl font-black text-white drop-shadow-md leading-none pb-1">{letter}</span>
                    </div>

                    {/* Category Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <span className="text-sm text-indigo-300 font-bold tracking-wider mb-0.5">Categoría Actual</span>
                        <h2 className="text-2xl font-bold text-white leading-tight truncate drop-shadow-sm">{category}</h2>
                        {categoryDescription && (
                            <p className="text-xs text-slate-400 mt-1 truncate">{categoryDescription}</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between w-full mb-4 px-1">
                <h2 className="text-xl font-bold text-yellow-400 shrink-0">Respuestas</h2>
                <button onClick={() => setShowHistory(true)} className="bg-[#0077b6] border border-[#023e8a] text-xs font-bold text-white px-3 py-1.5 rounded-lg shadow-md hover:bg-[#0096c7] hover:shadow-[#0077b6]/30 transition-all active:scale-95">
                    Respuestas previas
                </button>
            </div>

            {/* Table of Answers - Compact list */}
            <div className="flex-1 min-h-0 overflow-y-auto mb-2 custom-scrollbar p-1">
                <div className="flex flex-col gap-1">
                    {answers.map((entry, idx) => (
                        <div
                            key={idx}
                            onClick={() => isMod && setSelectedId(entry.client_id)}
                            className={`p-2 mb-2 rounded-lg border flex justify-between items-center transition-all ${selectedId === entry.client_id
                                ? 'bg-gradient-to-r from-green-900 to-slate-800 border-green-500 shadow-md'
                                : 'bg-slate-800/60 border-slate-700'
                                } ${isMod ? 'cursor-pointer active:scale-[0.99]' : ''}`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-lg font-bold text-green-600 w-4 text-center text-bold">{idx + 1}</span>
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-400">{entry.nickname}</span>
                                    <span className="text-lg font-bold text-white tracking-wide leading-tight">
                                        {entry.answer}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {entry.time_taken !== undefined && (
                                    <span className="text-lg font-mono font-bold text-indigo-300 tracking-wider">
                                        {entry.time_taken.toFixed(3)}s
                                    </span>
                                )}
                                {selectedId === entry.client_id && (
                                    <div className="text-xl animate-bounce">🏆</div>
                                )}
                            </div>
                        </div>
                    ))}
                    {answers.length === 0 && (
                        <div className="text-center text-gray-500 py-4 text-lg font-bold">Nadie respondió...</div>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-2 w-full shrink-0 mt-2 mb-2">
                {isMod ? (
                    <>
                        {answers.length > 0 ? (
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => selectedId && onSelectWinner(selectedId)}
                                    disabled={!selectedId}
                                    className={`w-full py-2 mb-2 rounded-xl font-black text-lg transition-all shadow-lg ${selectedId
                                        ? 'bg-gradient-to-r from-green-600 to-emerald-700 text-white active:scale-[0.98]'
                                        : 'bg-slate-700 text-gray-500 cursor-not-allowed'
                                        }`}
                                >
                                    {selectedId ? "Confirmar Ganador" : "↑ Elige al ganador ↑"}
                                </button>
                                <button
                                    onClick={() => {
                                        requestConfirm("¿Seguro que nadie ganó? Se iniciará una nueva ronda.", onRestartRound, { confirmText: "Repetir ronda", isDanger: false });
                                    }}
                                    className="w-full py-2 mb-2 rounded-xl font-bold text-lg text-yellow-400 border-2 border-yellow-500/30 hover:bg-yellow-500/10 transition-all"
                                >
                                    Nadie ganó - Repetir ronda
                                </button>
                                <button
                                    onClick={() => {
                                        requestConfirm("¿Estás seguro de finalizar la partida?", onEndGame, { confirmText: "Finalizar" });
                                    }}
                                    className="w-full py-2 text-red-400 text-lg font-bold border-2 border-red-500/30 rounded-xl hover:bg-red-900/20 transition-all"
                                >
                                    Finalizar la partida
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={onRestartRound}
                                    className="w-full py-3 mb-2 rounded-xl font-black text-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-lg"
                                >
                                    Repetir la ronda
                                </button>
                                <button
                                    onClick={() => {
                                        requestConfirm("¿Estás seguro de finalizar la partida?", onEndGame, { confirmText: "Finalizar" });
                                    }}
                                    className="w-full py-3 text-red-400 text-lg font-bold border-2 border-red-500/30 rounded-xl hover:bg-red-900/20 transition-all"
                                >
                                    Finalizar la partida
                                </button>
                            </div>
                        )}
                    </>

                ) : (
                    <div className="text-center text-md text-gray-400 animate-pulse px-4 flex flex-col">
                        {answers.length > 0 ? (
                            <>
                                <span>
                                    El moderador <span className="text-yellow-400 font-bold">{modName}</span>
                                </span>
                                <span>
                                    está eligiendo al ganador...
                                </span>
                            </>
                        ) : (
                            <>
                                <span>
                                    Esperando que el moderador <span className="text-yellow-400 font-bold">{modName}</span>
                                </span>
                                <span>
                                    reinicie la ronda o finalice la partida.
                                </span>
                            </>
                        )}
                    </div>
                )}
            </div>

            <PreviousAnswersModal
                isOpen={showHistory}
                onClose={() => setShowHistory(false)}
                history={winnersHistory}
                currentCategory={category}
            />

            <ConfirmModal {...confirmConfig} onClose={closeConfirm} />
        </div >
    );
};

export default EvaluationScreen;
