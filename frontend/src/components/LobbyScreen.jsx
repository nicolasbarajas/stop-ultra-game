import React from 'react';
import HelpModal from './HelpModal';
import RoomShareHeader from './RoomShareHeader';

const LobbyScreen = ({ roomId, players, onStartGame, isHost, onLeaveRoom, myClientId, onKickPlayer }) => {
    const canStart = players.length >= 3; // Rule: Must have >= 3 players

    const [selectedTime, setSelectedTime] = React.useState(30);
    const [selectedMode, setSelectedMode] = React.useState("UNIQUE_LETTERS");

    const timeOptions = [
        { label: "15 Segundos", value: 15 },
        { label: "30 Segundos", value: 30 },
        { label: "45 Segundos", value: 45 },
        { label: "60 Segundos", value: 60 },
        { label: "90 Segundos", value: 90 },
        { label: "105 Segundos", value: 105 },
        { label: "120 Segundos", value: 120 },
    ];

    const modeOptions = [
        { label: "Sólo letras únicas", value: "UNIQUE_LETTERS" },
        { label: "Sólo letras dobles", value: "DOUBLE_LETTERS" },
        { label: "Mixto intercalado", value: "MIXED_INTERLEAVED" },
        { label: "Mixto aleatorio", value: "MIXED_RANDOM" },
    ];

    const [showHelp, setShowHelp] = React.useState(false);

    return (
        <div className="flex flex-col items-center h-full p-4 gap-3 relative">

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

            <div className="text-gray-400 text-xl -mb-2">
                Sala
            </div>

            {/* Header */}
            <div className="relative flex items-center justify-center w-full max-w-md">
                {/* Contenedor del ID - Centro absoluto */}
                <RoomShareHeader
                    roomId={roomId}
                    className="relative text-2xl font-black font-mono text-white bg-slate-800 px-3 py-1 border-2 border-dashed border-gray-600"
                    iconMargin={8}
                />
            </div>

            {/* Players List */}
            <div className="w-full max-w-md bg-slate-800/50 rounded-2xl p-4 flex flex-col border border-slate-700">
                <h3 className="text-gray-400 font-bold mb-3 flex justify-between">
                    <span>Jugadores</span>
                    <span className="bg-slate-700 px-2 rounded text-white">{players.length}</span>
                </h3>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {players.map((p, idx) => {
                        const isMe = p.id === myClientId;
                        return (
                            <div
                                key={idx}
                                className={`flex items-center justify-between gap-3 p-3 rounded-lg animate-fade-in border transition-all ${isMe
                                    ? 'bg-indigo-600/40 border-indigo-400'
                                    : 'bg-slate-700/50 border-slate-600/50'
                                    }`}
                            >
                                <div className="flex items-center gap-3 overflow-hidden flex-1">
                                    <div className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center font-bold text-sm ${isMe
                                        ? 'bg-white text-indigo-600'
                                        : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                                        }`}>
                                        {p.nickname.charAt(0).toUpperCase()}
                                    </div>
                                    <span className={`font-medium text-lg truncate ${isMe ? 'text-white' : 'text-gray-200'}`}>
                                        {p.nickname} {isMe && <span className="opacity-50 text-xs ml-1">(Tú)</span>}
                                    </span>
                                </div>

                                {isHost && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (!isMe && confirm(`¿Sacar a ${p.nickname} de la sala?`)) {
                                                if (onKickPlayer) onKickPlayer(p.id);
                                            }
                                        }}
                                        disabled={isMe}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isMe
                                            ? 'text-gray-500 cursor-not-allowed opacity-60 bg-gray-700/30 border border-gray-600/30'
                                            : 'text-red-500 hover:bg-red-500/20 bg-red-500/10 border border-red-500/20'
                                            }`}
                                        title={isMe ? "No puedes sacarte a ti mismo" : "Sacar jugador"}
                                    >
                                        <span className="text-xs font-bold">✕</span>
                                    </button>
                                )}
                            </div>
                        );
                    })}

                    {players.length === 0 && (
                        <div className="text-center text-gray-500 mt-10 mb-5">
                            {isHost ? "Creando sala..." : "Cargando..."}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="w-full max-w-md pb-4">
                {!canStart && players.length > 0 && (
                    <div className="text-center text-yellow-500/80 rounded-lg text-sm mb-6">
                        Esperando a mínimo {3 - players.length} {(3 - players.length) === 1 ? 'jugador' : 'jugadores'} más para iniciar...
                    </div>
                )}

                {isHost ? (
                    <div className="space-y-3">
                        <div className="bg-slate-800 rounded-xl p-3 border border-slate-700 flex flex-col gap-2">
                            <label className="text-gray-400 text-xs font-bold tracking-wider">Tiempo de ronda</label>
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

                        <div className="bg-slate-800 rounded-xl p-3 border border-slate-700 flex flex-col gap-2">
                            <label className="text-gray-400 text-xs font-bold tracking-wider">Modo de juego</label>
                            <div className="relative">
                                <select
                                    value={selectedMode}
                                    onChange={(e) => setSelectedMode(e.target.value)}
                                    className="w-full bg-slate-700 text-white font-bold p-3 rounded-lg outline-none focus:ring-2 focus:ring-green-500 appearance-none cursor-pointer border border-slate-600"
                                >
                                    {modeOptions.map(opt => (
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

                        {
                            canStart && (
                                <button
                                    onClick={() => onStartGame(selectedTime, selectedMode)}
                                    disabled={!canStart}
                                    className={`w-full py-4 rounded-xl font-black text-xl shadow-lg transition-all ${canStart
                                        ? 'bg-green-500 hover:bg-green-400 hover:scale-[1.02] text-white cursor-pointer'
                                        : 'bg-slate-700 text-gray-500 cursor-not-allowed grayscale'
                                        }`}
                                >
                                    Iniciar partida 🚀
                                </button>
                            )
                        }
                    </div>
                ) : (
                    canStart && (
                        <div className="w-full py-2 rounded-xl font-bold text-md text-center text-gray-400 animate-pulse">
                            Esperando inicio por parte del anfitrión...
                        </div>
                    )
                )}
            </div>

            {/* Timer Selection Modal Removed */}


            {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
        </div>
    );
};

export default LobbyScreen;
