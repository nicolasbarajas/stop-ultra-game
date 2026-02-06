import React, { useState, useEffect, useRef } from 'react';
import VirtualKeyboard from './components/VirtualKeyboard';
import HomeScreen from './components/HomeScreen';
import LobbyScreen from './components/LobbyScreen';
import GameCoordinator from './components/GameCoordinator';

function App() {
    // Screen State: 'HOME' | 'LOBBY' | 'GAME'
    const [screen, setScreen] = useState('HOME');

    // Game Logic State
    const [roomId, setRoomId] = useState("");
    const [nickname, setNickname] = useState("");
    const [isHost, setIsHost] = useState(false);
    const [clientId] = useState(() => {
        const stored = localStorage.getItem("client_id");
        if (stored) return stored;
        const newId = "user_" + Math.random().toString(36).substr(2, 9);
        localStorage.setItem("client_id", newId);
        return newId;
    });
    const [players, setPlayers] = useState([]);

    // Core Game Loop State
    const [gameState, setGameState] = useState(null); // Backend State
    const [gameData, setGameData] = useState({}); // { letter, category, answers, moderator_id, ... }

    const ws = useRef(null);
    const intentionalDisconnect = useRef(false);
    const isProd = import.meta.env.PROD;
    const BACKEND_URL = isProd
        ? "https://stop-ultra-backend.onrender.com"
        : `http://${window.location.hostname}:8000`;

    const WS_BASE_URL = isProd
        ? "wss://stop-ultra-backend.onrender.com"
        : `ws://${window.location.hostname}:8000`;

    // Reconnection on visibility change
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && screen !== 'HOME' && roomId) {
                if (!ws.current || ws.current.readyState === WebSocket.CLOSED) {
                    console.log("App active: Reconnecting WebSocket...");
                    connectWebSocket(roomId, nickname);
                }
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [roomId, nickname, screen]);

    // --- API Actions ---
    const createRoom = async (nick) => {
        console.log("App: createRoom called with", nick);
        try {
            console.log("App: Fetching create-room...");
            const res = await fetch(`${BACKEND_URL}/create-room`, { method: "POST" });
            console.log("App: Fetch response status:", res.status);
            const data = await res.json();
            console.log("App: Room created:", data);
            setRoomId(data.room_id);
            setIsHost(true);
            console.log("App: Entering lobby...");
            enterLobby(data.room_id, nick);
        } catch (e) {
            console.error("App: Error creating room:", e);
            alert("Error creando sala");
        }
    };

    const joinRoom = async (code, nick) => {
        console.log("App: joinRoom called with", code, nick);
        try {
            console.log("App: Checking room...");
            const res = await fetch(`${BACKEND_URL}/check-room`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ room_id: code, nickname: nick })
            });
            console.log("App: Check room status:", res.status);
            if (!res.ok) {
                const err = await res.json();
                console.error("App: Room check failed:", err);
                alert(err.detail);
                return;
            }
            console.log("App: Room valid. Entering lobby...");
            setIsHost(false);
            enterLobby(code, nick);
        } catch (e) {
            console.error("App: Error joining room:", e);
            alert("Error conectando al servidor");
        }
    };

    const enterLobby = (code, nick) => {
        setRoomId(code);
        setNickname(nick);
        connectWebSocket(code, nick);
        setScreen('LOBBY');
    };

    const connectWebSocket = (code, nick) => {
        if (ws.current) ws.current.close();

        intentionalDisconnect.current = false;
        ws.current = new WebSocket(`${WS_BASE_URL}/ws/${code}/${clientId}`);

        ws.current.onopen = () => {
            console.log("WS Connected");
            sendJsonMessage("JOIN", { nickname: nick });
        };

        ws.current.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            handleServerMessage(msg);
        };

        ws.current.onclose = () => {
            console.log("Desconectado");
            if (intentionalDisconnect.current) {
                setScreen('HOME');
                setRoomId("");
                setPlayers([]);
            } else {
                console.log("Desconexión inesperada. Intentando reconectar si es visible...");
                // If the user is looking at the screen, try to reconnect automatically
                if (document.visibilityState === 'visible') {
                    setTimeout(() => connectWebSocket(code, nick), 2000);
                }
                // If backgrounded, the visibilitychange listener will handle reconnect on resume
            }
        };
    };

    const handleServerMessage = (msg) => {
        // console.log("RX:", msg);
        switch (msg.type) {
            case "PLAYER_LIST_UPDATE":
                setPlayers(msg.payload);
                // Sync Host Status strictly from server source of truth
                const me = msg.payload.find(p => p.id === clientId);
                if (me) {
                    setIsHost(me.is_host);
                }
                break;

            case "GAME_STATE_UPDATE":
                const { state, ...data } = msg.payload;
                // Map backend state to frontend view if needed, or pass directly
                if (state === "LOBBY") {
                    setScreen("LOBBY");
                    setGameState(null);
                } else {
                    setScreen("GAME");
                    setGameState(state); // PREPARING | PLAYING | EVALUATING
                    setGameData(prev => ({ ...prev, ...data }));
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
        setRoomId("");
        setNickname("");
        setPlayers([]);
        setGameState(null);
        setIsHost(false);
        setScreen('HOME');
    };


    // --- RENDER ---
    return (
        <div className="flex flex-col h-screen bg-[#1a1a2e] text-white overflow-hidden font-sans">
            {screen === 'HOME' && (
                <HomeScreen onCreateRoom={createRoom} onJoinRoom={joinRoom} />
            )}

            {screen === 'LOBBY' && (
                <LobbyScreen
                    roomId={roomId}
                    players={players}
                    onStartGame={startGame}
                    isHost={isHost}
                    onLeaveRoom={leaveRoom}
                />
            )}

            {screen === 'GAME' && (
                <GameCoordinator
                    gameState={gameState}
                    gameData={gameData}
                    myClientId={clientId}
                    players={players}
                    isHost={isHost}
                    sendAction={sendJsonMessage}
                    onLeaveRoom={leaveRoom}
                />
            )}
        </div>
    );
}

export default App;
