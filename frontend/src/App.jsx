import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import HomeScreen from './components/HomeScreen';
import GameRoom from './components/GameRoom';
import { setStoredNickname, getClientId } from './utils/auth';

function App() {
    const navigate = useNavigate();
    const isProd = import.meta.env.PROD;
    const BACKEND_URL = isProd
        ? "https://stop-ultra-backend.onrender.com"
        : `http://${window.location.hostname}:8000`;

    const createRoom = async (nick) => {
        try {
            const res = await fetch(`${BACKEND_URL}/create-room`, { method: "POST" });
            const data = await res.json();
            setStoredNickname(nick);
            navigate(`/room/${data.room_id}`);
        } catch (e) {
            console.error("Error creating room:", e);
            throw new Error("Error creando sala");
        }
    };

    const joinRoom = async (code, nick) => {
        try {
            const res = await fetch(`${BACKEND_URL}/check-room`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    room_id: code,
                    nickname: nick,
                    client_id: getClientId()
                })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail);
            }
            setStoredNickname(nick);
            navigate(`/room/${code}`);
        } catch (e) {
            console.error("Error joining room:", e);
            if (e.message !== "Failed to fetch") throw e; // Pass through backend error details
            throw new Error("Error conectando al servidor");
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[#1a1a2e] text-white overflow-hidden font-sans">
            <Routes>
                <Route path="/" element={<HomeScreen onCreateRoom={createRoom} onJoinRoom={joinRoom} />} />
                <Route path="/room/:roomId" element={<GameRoom />} />
            </Routes>
        </div>
    );
}

export default App;
