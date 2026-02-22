import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VirtualKeyboard from './VirtualKeyboard';
import LobbyScreen from './LobbyScreen';
import GameCoordinator from './GameCoordinator';
import { getClientId, getStoredNickname, setStoredNickname } from '../utils/auth';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("GameCoordinator Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 text-center text-red-400">
                    <h2 className="text-xl font-bold mb-2">Algo salió mal en el juego.</h2>
                    <p className="mb-4 text-sm bg-black/30 p-2 rounded text-red-300 font-mono">
                        {this.state.error && this.state.error.toString()}
                    </p>
                    <button onClick={() => window.location.reload()} className="mt-4 bg-red-500/20 px-4 py-2 rounded">
                        Recargar
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

function GameRoom() {
    const { roomId } = useParams();
    const navigate = useNavigate();

    // Game Logic State
    const [nickname, setNickname] = useState(getStoredNickname());
    const [isHost, setIsHost] = useState(false);
    const clientId = useRef(getClientId()).current;
    const [players, setPlayers] = useState([]);

    // Core Game Loop State
    const [gameState, setGameState] = useState(null); // Backend State
    const [gameData, setGameData] = useState({}); // { letter, category, answers, moderator_id, ... }
    const serverOffset = useRef(0); // Difference between ServerTime and ClientTime

    const ws = useRef(null);
    const intentionalDisconnect = useRef(false);
    const isProd = import.meta.env.PROD;

    // Helper to get backend URL (needs to be consistent)
    const BACKEND_URL = isProd
        ? "https://stop-ultra-backend.onrender.com"
        : `http://${window.location.hostname}:8000`;

    const WS_BASE_URL = isProd
        ? "wss://stop-ultra-backend.onrender.com"
        : `ws://${window.location.hostname}:8000`;

    // Initial Check and Connection
    useEffect(() => {
        if (!roomId || !nickname) return;

        const checkAndConnect = async () => {
            try {
                const res = await fetch(`${BACKEND_URL}/check-room`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        room_id: roomId,
                        nickname: nickname,
                        client_id: clientId
                    })
                });

                if (!res.ok) {
                    const err = await res.json();
                    alert(err.detail);
                    navigate("/");
                    return;
                }

                const data = await res.json();
                // data.rejoin is true if rejoining active game

                connectWebSocket(roomId, nickname);
            } catch (e) {
                console.error("Error connecting:", e);
                alert("Error de conexión");
                navigate("/");
            }
        };

        checkAndConnect();

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [roomId, navigate, nickname]);

    // Reconnection on visibility change
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                syncClock(); // Re-sync clock
                if (roomId && (!ws.current || ws.current.readyState === WebSocket.CLOSED)) {
                    console.log("App active: Reconnecting WebSocket...");
                    connectWebSocket(roomId, nickname);
                }
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [roomId, nickname]);


    const syncClock = async () => {
        try {
            const start = Date.now();
            const res = await fetch(`${BACKEND_URL}/sync-time`);
            if (!res.ok) return;
            const data = await res.json();
            const end = Date.now();

            // RTT = end - start
            // Latency ~ RTT / 2
            const latency = (end - start) / 2;

            const serverTime = new Date(data.server_time).getTime();
            // Expected Server Time at 'end' = serverTime + latency
            // Offset = (serverTime + latency) - end

            const offset = (serverTime + latency) - end;
            serverOffset.current = offset;
            console.log(`Clock synced. RTT: ${end - start}ms, Latency: ${latency}ms, Offset: ${offset}ms`);
        } catch (e) {
            console.error("Clock sync failed", e);
        }
    };

    const connectWebSocket = (code, nick) => {
        if (ws.current) ws.current.close();

        intentionalDisconnect.current = false;
        ws.current = new WebSocket(`${WS_BASE_URL}/ws/${code}/${clientId}`);

        ws.current.onopen = () => {
            console.log("WS Connected");
            sendJsonMessage("JOIN", { nickname: nick });
            syncClock(); // Sync on connect
        };

        ws.current.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            handleServerMessage(msg);
        };

        ws.current.onclose = () => {
            console.log("Desconectado");
            if (intentionalDisconnect.current) {
                // Was intentional
            } else {
                console.log("Desconexión inesperada. Intentando reconectar si es visible...");
                if (document.visibilityState === 'visible') {
                    setTimeout(() => connectWebSocket(code, nick), 2000);
                }
            }
        };
    };

    const handleServerMessage = (msg) => {
        switch (msg.type) {
            case "PLAYER_LIST_UPDATE":
                setPlayers(msg.payload);
                const me = msg.payload.find(p => p.id === clientId);
                if (me) {
                    setIsHost(me.is_host);
                }
                break;

            case "GAME_STATE_UPDATE":
                const { state, server_time, ...data } = msg.payload;

                // Note: We rely on syncClock() for accurate offset, 
                // so we ignore server_time here to avoid jitter/inaccuracy from one-way websocket latency.

                if (state === "LOBBY") {
                    setGameState(null);
                } else {
                    setGameState(state);
                    setGameData(prev => ({
                        ...prev,
                        ...data,
                        round_start_time: data.round_start_time || prev.round_start_time
                    }));
                }
                break;
            default:
                break;
        }
    };

    const sendJsonMessage = (action, payload = {}) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ action, payload }));
        }
    };

    const startGame = (timeLimit = 60, gameMode = "UNIQUE_LETTERS") => {
        sendJsonMessage("START_GAME", { time_limit: timeLimit, game_mode: gameMode });
    };

    const leaveRoom = () => {
        intentionalDisconnect.current = true;
        sendJsonMessage("LEAVE_ROOM");
        if (ws.current) ws.current.close();
        navigate("/");
    };

    // Render logic based on state
    if (!nickname) {
        return (
            <div className="flex flex-col items-center justify-center p-4 h-[100dvh] w-full text-center relative">
                <div className="max-w-md w-full bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl relative overflow-hidden z-10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                    <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400 mb-4 text-center">
                        Ingreso a la sala
                    </h2>
                    <p className="text-gray-300 mb-8 text-lg">
                        No tienes un nombre registrado, ingresa uno a continuación para acceder a la sala:
                    </p>

                    <div className="space-y-4">
                        <input
                            type="text"
                            id="room-nickname-input"
                            className="w-full bg-slate-900/50 text-white font-bold p-4 rounded-xl text-center text-xl border-2 border-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all"
                            placeholder="Ej: Eugenia"
                            maxLength={12}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    document.getElementById('btn-ingresar-sala').click();
                                }
                            }}
                        />
                        <button
                            id="btn-ingresar-sala"
                            onClick={() => {
                                const input = document.getElementById('room-nickname-input').value.trim();
                                if (input) {
                                    setStoredNickname(input);
                                    setNickname(input);
                                } else {
                                    alert("Por favor ingresa un nombre válido");
                                }
                            }}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xl py-4 rounded-xl shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Ingresar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === null) {
        return (
            <LobbyScreen
                roomId={roomId}
                players={players}
                onStartGame={startGame}
                isHost={isHost}
                onLeaveRoom={leaveRoom}
                myClientId={clientId}
                onKickPlayer={(targetId) => sendJsonMessage("KICK_PLAYER", { target_id: targetId })}
            />
        );
    }

    return (
        <ErrorBoundary>
            <GameCoordinator
                roomId={roomId}
                gameState={gameState}
                gameData={gameData}
                myClientId={clientId}
                players={players}
                isHost={isHost}
                sendAction={sendJsonMessage}
                onLeaveRoom={leaveRoom}
                serverOffset={serverOffset.current}
            />
        </ErrorBoundary>
    );
}

export default GameRoom;
