import React from 'react';
import HelpModal from './HelpModal';

const LobbyScreen = ({ roomId, players, onStartGame, isHost, onLeaveRoom }) => {
    const canStart = players.length >= 3; // Rule: Must have >= 3 players


    const [showTimeModal, setShowTimeModal] = React.useState(false);
    const timeOptions = [
        { label: "00:15", value: 15 },
        { label: "00:30", value: 30 },
        { label: "00:45", value: 45 },
        { label: "01:00", value: 60 },
        { label: "01:30", value: 90 },
        { label: "01:45", value: 105 },
        { label: "02:00", value: 120 },
    ];

    const handleStartClick = () => {
        setShowTimeModal(true);
    };

    const confirmStart = (time) => {
        onStartGame(time);
        setShowTimeModal(false);
    };

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
                    <button
                        onClick={handleStartClick}
                        disabled={!canStart}
                        className={`w-full py-4 rounded-xl font-black text-xl shadow-lg transition-all ${canStart
                            ? 'bg-green-500 hover:bg-green-400 hover:scale-[1.02] text-white cursor-pointer'
                            : 'bg-slate-700 text-gray-500 cursor-not-allowed grayscale'
                            }`}
                    >
                        {canStart ? "Iniciar partida 🚀" : "Esperando jugadores..."}
                    </button>
                ) : (
                    <div className="w-full py-4 rounded-xl font-bold text-lg text-center bg-slate-800 text-gray-400 border border-slate-700">
                        {canStart ? "Esperando inicio por parte del anfitrión..." : "Esperando jugadores..."}
                    </div>
                )}
            </div>

            {/* Timer Selection Modal */}
            {showTimeModal && (
                <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <h3 className="text-2xl font-bold text-white mb-2 text-center">Configurar Tiempo</h3>
                        <p className="text-gray-400 text-center mb-6 text-sm">¿Cuánto tiempo tendrán para escribir?</p>

                        <div className="grid grid-cols-1 gap-2 max-h-[50vh] overflow-y-auto mb-4 custom-scrollbar">
                            {timeOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => confirmStart(opt.value)}
                                    className="w-full p-4 rounded-xl bg-slate-700 hover:bg-indigo-600 text-white font-bold transition-all border border-slate-600 hover:border-indigo-400"
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setShowTimeModal(false)}
                            className="w-full py-3 text-red-400 font-bold hover:bg-slate-700 rounded-xl transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}


            {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
        </div>
    );
};

export default LobbyScreen;
