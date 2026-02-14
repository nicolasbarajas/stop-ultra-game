import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VirtualKeyboard from './VirtualKeyboard';
import LobbyScreen from './LobbyScreen';
import GameCoordinator from './GameCoordinator';
import { getClientId, getStoredNickname } from '../utils/auth';

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
        if (!roomId) return;

        // If no nickname, redirect to home with room code? 
        // Or prompt? For now, redirect to home to force name entry.
        if (!nickname) {
            alert("Por favor ingresa tu nombre primero");
            navigate(`/?room=${roomId}`);
            return;
        }

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

    const startGame = (timeLimit = 60) => {
        sendJsonMessage("START_GAME", { time_limit: timeLimit });
    };

    const leaveRoom = () => {
        intentionalDisconnect.current = true;
        sendJsonMessage("LEAVE_ROOM");
        if (ws.current) ws.current.close();
        navigate("/");
    };

    // Render logic based on state
    if (gameState === null) {
        return (
            <LobbyScreen
                roomId={roomId}
                players={players}
                onStartGame={startGame}
                isHost={isHost}
                onLeaveRoom={leaveRoom}
                myClientId={clientId}
            />
        );
    }

    return (
        <ErrorBoundary>
            <GameCoordinator
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
