import React from 'react';
import HelpModal from './HelpModal';

const LobbyScreen = ({ roomId, players, onStartGame, isHost, onLeaveRoom }) => {
    const canStart = players.length >= 3; // Rule: Must have >= 3 players


    const [selectedTime, setSelectedTime] = React.useState(30);

    const timeOptions = [
        { label: "15 Segundos", value: 15 },
        { label: "30 Segundos", value: 30 },
        { label: "45 Segundos", value: 45 },
        { label: "60 Segundos", value: 60 },
        { label: "90 Segundos", value: 90 },
        { label: "105 Segundos", value: 105 },
        { label: "120 Segundos", value: 120 },
    ];

    const [showHelp, setShowHelp] = React.useState(false);

    return (
        <div className="flex flex-col items-center h-full p-4 gap-6 relative">

            {/* EXIT Button (Top Left) */}
            <button
                onClick={onLeaveRoom}
                className="absolute top-1 left-2 p-2 text-gray-500 hover:text-white transition-colors text-xl"
                title="Salir de la sala"
            >
                ← Salir
            </button>

            {/* Help Button (Top Right) */}
            <button
                onClick={() => setShowHelp(true)}
                className="absolute top-1 right-2 p-2 text-gray-500 hover:text-white transition-colors flex items-center gap-1 text-xl"
                title="Ayuda"
            >
                Ayuda <span>?</span>
            </button>

            {/* Header */}
            <div className="text-center mt-8">
                <div className="text-gray-400 text-sm tracking-wider mb-1">Código de sala</div>
                <div className="text-6xl font-black font-mono text-white bg-slate-800 px-6 py-2 rounded-xl border-2 border-dashed border-gray-600 select-all">
                    {roomId}
                </div>
            </div>

            {/* Players List */}
            <div className="w-full max-w-md bg-slate-800/50 rounded-2xl p-4 overflow-hidden flex flex-col border border-slate-700 max-h-[60vh]">
                <h3 className="text-gray-400 font-bold mb-3 flex justify-between">
                    <span>Jugadores</span>
                    <span className="bg-slate-700 px-2 rounded text-white">{players.length}</span>
                </h3>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {players.map((p, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg animate-fade-in border border-slate-600/50">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-sm">
                                {p.nickname.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-lg truncate max-w-[200px]">{p.nickname}</span>
                        </div>
                    ))}

                    {players.length === 0 && (
                        <div className="text-center text-gray-500 italic mt-10">Esperando jugadores...</div>
                    )}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="w-full max-w-md pb-4">
                {!canStart && (
                    <div className="text-center text-yellow-500/80 bg-yellow-900/10 py-5 rounded-lg border border-yellow-900/30 text-sm mb-3">
                        Esperando a {3 - players.length} {(3 - players.length) === 1 ? 'jugador' : 'jugadores'} más para iniciar...
                    </div>
                )}

                {isHost ? (
                    <div className="space-y-3">
                        <div className="bg-slate-800 rounded-xl p-3 border border-slate-700 flex flex-col gap-2">
                            <label className="text-gray-400 text-xs font-bold uppercase tracking-wider">Tiempo de ronda</label>
                            <div className="relative">
                                <select
                                    value={selectedTime}
                                    onChange={(e) => setSelectedTime(Number(e.target.value))}
                                    className="w-full bg-slate-700 text-white font-bold p-3 rounded-lg outline-none focus:ring-2 focus:ring-green-500 appearance-none cursor-pointer border border-slate-600"
                                >
                                    {timeOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-white">
                                    ▼
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => onStartGame(selectedTime)}
                            disabled={!canStart}
                            className={`w-full py-4 rounded-xl font-black text-xl shadow-lg transition-all ${canStart
                                ? 'bg-green-500 hover:bg-green-400 hover:scale-[1.02] text-white cursor-pointer'
                                : 'bg-slate-700 text-gray-500 cursor-not-allowed grayscale'
                                }`}
                        >
                            {canStart ? "Iniciar partida 🚀" : "Esperando jugadores..."}
                        </button>
                    </div>
                ) : (
                    <div className="w-full py-4 rounded-xl font-bold text-lg text-center bg-slate-800 text-gray-400 border border-slate-700">
                        {canStart ? "Esperando inicio por parte del anfitrión..." : "Esperando jugadores..."}
                    </div>
                )}
            </div>

            {/* Timer Selection Modal Removed */}


            {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
        </div>
    );
};

export default LobbyScreen;
