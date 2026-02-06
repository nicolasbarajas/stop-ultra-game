import React, { useState } from 'react';
import HelpModal from './HelpModal';

const HomeScreen = ({ onCreateRoom, onJoinRoom }) => {
    const [view, setView] = useState('MENU'); // 'MENU' | 'JOIN'
    const [nickname, setNickname] = useState("");
    const [joinCode, setJoinCode] = useState("");

    const [showHelp, setShowHelp] = useState(false);

    const handleCreate = () => {
        console.log("HomeScreen: handleCreate clicked");
        if (!nickname.trim()) {
            console.log("HomeScreen: No nickname");
            alert("Por favor ingresa un Nickname");
            return;
        }
        console.log("HomeScreen: Calling onCreateRoom with", nickname);
        onCreateRoom(nickname);
    };

    const goToJoin = () => {
        if (!nickname.trim()) {
            alert("Por favor ingresa un Nickname");
            return;
        }
        setView('JOIN');
    };

    const handleJoin = () => {
        console.log("HomeScreen: handleJoin clicked");
        if (joinCode.length > 0) {
            console.log("HomeScreen: Calling onJoinRoom with", joinCode, nickname);
            onJoinRoom(joinCode, nickname);
        } else {
            console.log("HomeScreen: No join code");
            alert("Por favor ingresa un CÓDIGO");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full gap-8 p-4 relative">
            {/* Help Button (Top Right) */}
            <button
                onClick={() => setShowHelp(true)}
                className="absolute top-1 right-2 p-2 text-gray-500 hover:text-white transition-colors flex items-center gap-1 text-xl"
                title="Ayuda"
            >
                Ayuda <span>?</span>
            </button>

            <div className="text-center">
                <h1 className="text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent mb-2">
                    Stop Ultra
                </h1>
                <p className="text-gray-400">El juego de palabras definitivo</p>
            </div>

            <div className="w-full max-w-sm flex flex-col gap-4">

                {view === 'MENU' && (
                    <>
                        <div className="flex flex-col gap-2">
                            <label className="text-md font-bold text-gray-400 ml-1">Nombre del jugador</label>
                            <input
                                type="text"
                                placeholder="Ej: Eugenia"
                                className="p-4 rounded-xl bg-slate-800 text-white text-center text-xl outline-none focus:ring-2 ring-purple-500 border border-slate-700 shadow-xl transition-all"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                maxLength={12}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <button
                                onClick={handleCreate}
                                className="py-6 bg-purple-600 rounded-xl font-bold text-lg shadow-lg hover:bg-purple-500 hover:scale-[1.02] transition-all flex flex-col items-center gap-1"
                            >
                                <span>🏠</span>
                                <span>Crear una <br /> nueva sala</span>
                            </button>
                            <button
                                onClick={goToJoin}
                                className="py-6 bg-cyan-600 rounded-xl font-bold text-lg shadow-lg hover:bg-cyan-500 hover:scale-[1.02] transition-all flex flex-col items-center gap-1 text-white"
                            >
                                <span>👟</span>
                                <span>Unirse a una <br /> sala existente</span>
                            </button>
                        </div>
                    </>
                )}

                {view === 'JOIN' && (
                    <div className="flex flex-col gap-4 bg-slate-800/80 p-6 rounded-2xl border border-slate-700 animate-fade-in-up">
                        <div className="text-center">
                            <div className="text-gray-400 text-sm mb-1">Jugando como</div>
                            <div className="font-bold text-xl text-white">{nickname}</div>
                        </div>

                        <input
                            type="text"
                            placeholder="Código de sala"
                            className="p-3 rounded-lg bg-slate-900 text-white text-center text-2xl uppercase font-mono tracking-widest outline-none focus:ring-2 ring-pink-500 border border-slate-700 placeholder-gray-600"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                            maxLength={4}
                            autoFocus
                        />

                        <button
                            onClick={handleJoin}
                            className="w-full py-3 bg-pink-600 rounded-lg font-bold shadow hover:bg-pink-500 transition-all mt-2"
                        >
                            Entrar
                        </button>

                        <button
                            onClick={() => setView('MENU')}
                            className="text-gray-500 text-xl mt-2 hover:text-white"
                        >
                            &larr; Volver
                        </button>
                    </div>
                )}

            </div>
            {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
        </div>
    );
};

export default HomeScreen;
