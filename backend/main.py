from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Optional
import json
import random
import string
from pydantic import BaseModel
import asyncio
import firebase_admin
from firebase_admin import credentials, firestore

# --- Firebase Initialization ---
# Ensure credentials file exists in root or backend/
cred = credentials.Certificate("firebase_credentials.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Constants ---
LETTERS = [c for c in string.ascii_uppercase if c not in ['K', 'W']]
CATEGORIES = [
    "Herramienta", "Animal", "Cuerpo humano", "Adjetivo", "Ciudad", "País",
    "Profesión", "Deporte", "Alimento", "Cantante o grupo musical", 
    "Película", "Serie de TV", "Persona famosa", "Marca"
]

# --- Connection Manager (WebSockets only) ---
class ConnectionManager:
    def __init__(self):
        # room_id -> {client_id: WebSocket}
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}

    async def connect(self, room_id: str, client_id: str, websocket: WebSocket):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = {}
        self.active_connections[room_id][client_id] = websocket

    def disconnect(self, room_id: str, client_id: str):
        if room_id in self.active_connections:
            if client_id in self.active_connections[room_id]:
                del self.active_connections[room_id][client_id]
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

    async def broadcast(self, room_id: str, message: dict):
        if room_id in self.active_connections:
            json_msg = json.dumps(message)
            # Create a copy of values to avoid Runtime error if dictionary changes size during iteration
            for connection in list(self.active_connections[room_id].values()):
                try:
                    await connection.send_text(json_msg)
                except Exception:
                    pass

manager = ConnectionManager()

# --- Helpers ---

def get_room_doc(room_id: str):
    return db.collection("rooms").document(room_id)

def get_player_list(room_data: dict):
    # Convert players dict to list for frontend
    players = room_data.get("players", {})
    moderator_id = room_data.get("moderator_id")
    return [
        {
            "id": pid,
            "nickname": p["nickname"],
            "score": p["score"],
            "is_host": p.get("is_host", False),
            "is_moderator": (pid == moderator_id)
        }
        for pid, p in players.items()
    ]

# --- HTTP Endpoints ---

class JoinRequest(BaseModel):
    room_id: str
    nickname: str

@app.post("/create-room")
async def create_room_endpoint():
    room_id = ''.join(random.choices(string.ascii_uppercase, k=4))
    
    # Ensure uniqueness (simple check, collision rare)
    doc_ref = get_room_doc(room_id)
    while doc_ref.get().exists:
        room_id = ''.join(random.choices(string.ascii_uppercase, k=4))
        doc_ref = get_room_doc(room_id)

    # Initialize Room in Firestore
    room_data = {
        "room_id": room_id,
        "host_id": None, # Will be set on first join
        "players": {}, # client_id -> {nickname, score, is_host, connected}
        "state": "LOBBY",
        "moderator_id": None,
        "current_letter": None,
        "current_category": None,
        "round_answers": [],
        "time_limit": 60,
        "created_at": firestore.SERVER_TIMESTAMP
    }
    doc_ref.set(room_data)
    
    return {"room_id": room_id}

@app.post("/check-room")
async def check_room(req: JoinRequest):
    room_id = req.room_id.upper()
    doc_ref = get_room_doc(room_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Sala no encontrada")
    
    data = doc.to_dict()
    if data.get("state") != "LOBBY":
         # Allow rejoin if player exists? For now, stick to simple valid check
        raise HTTPException(status_code=400, detail="Partida en progreso")
        
    return {"valid": True}

# --- WebSocket ---

@app.websocket("/ws/{room_id}/{client_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, client_id: str):
    room_id = room_id.upper()
    
    # 1. Connect WS
    await manager.connect(room_id, client_id, websocket)

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            action = message.get("action")
            payload = message.get("payload", {})
            
            # Fetch latest room state for every action to ensure consistency
            # Transaction could be better but for simplicity and speed of request,
            # we will use direct gets/updates or simple atomic updates where possible.
            # For game logic, we'll fetch-modify-save.
            
            doc_ref = get_room_doc(room_id)
            doc = doc_ref.get()
            
            if not doc.exists:
                await websocket.close(code=4000, reason="Room deleted")
                return

            room_data = doc.to_dict()
            players = room_data.get("players", {})
            
            should_broadcast_player_list = False
            should_broadcast_game_state = False

            if action == "JOIN":
                nickname = payload.get("nickname", "Unknown")
                
                # Check if first player -> Host
                is_host = (len(players) == 0)
                
                # Update/Add player
                players[client_id] = {
                    "nickname": nickname,
                    "score": players.get(client_id, {}).get("score", 0), # Keep score if rejoining
                    "is_host": is_host or players.get(client_id, {}).get("is_host", False),
                    "connected": True
                }
                
                updates = {"players": players}
                if is_host:
                    updates["host_id"] = client_id
                
                doc_ref.update(updates)
                room_data.update(updates) # Local update for response
                should_broadcast_player_list = True

            elif action == "LEAVE_ROOM":
                # Mark as disconnected or remove?
                # For Lobby, maybe remove. For game, keep but mark disconnected.
                if client_id in players:
                    if room_data["state"] == "LOBBY":
                        del players[client_id]
                        
                        # Reassign host if needed
                        if room_data.get("host_id") == client_id:
                            new_host = next(iter(players)) if players else None
                            room_data["host_id"] = new_host
                            if new_host:
                                players[new_host]["is_host"] = True
                        
                        doc_ref.set(room_data) # Full rewrite simpler for dict deletion
                        should_broadcast_player_list = True
                    else:
                        # In game, just mark disconnected?
                        # For now, let's just remove to keep logic simple consistent with previous version
                        # Or per request: "Mantén los WebSockets... refactoriza funciones... crea y unirse"
                        # The previous code removed player on explicit LEAVE_ROOM.
                        del players[client_id]
                        if room_data.get("host_id") == client_id and players:
                             new_host = next(iter(players))
                             room_data["host_id"] = new_host
                             players[new_host]["is_host"] = True
                        
                        if room_data.get("moderator_id") == client_id and players:
                            room_data["moderator_id"] = room_data["host_id"]
                            should_broadcast_game_state = True
                            
                        doc_ref.set(room_data)
                        should_broadcast_player_list = True
                        
            elif action == "START_GAME":
                if len(players) >= 3:
                     updates = {
                         "state": "PREPARING",
                         "moderator_id": room_data.get("host_id"), # Start with host
                         "time_limit": payload.get("time_limit", 60),
                         "current_letter": None,
                         "current_category": None,
                         "round_answers": []
                     }
                     doc_ref.update(updates)
                     room_data.update(updates)
                     should_broadcast_game_state = True

            elif action == "SPIN":
                if room_data.get("moderator_id") == client_id and room_data["state"] == "PREPARING":
                    updates = {
                        "current_letter": random.choice(LETTERS),
                        "current_category": random.choice(CATEGORIES)
                    }
                    doc_ref.update(updates)
                    room_data.update(updates)
                    should_broadcast_game_state = True

            elif action == "START_ROUND":
                if room_data.get("moderator_id") == client_id and room_data["state"] == "PREPARING":
                     if room_data.get("current_letter"):
                         updates = {"state": "PLAYING"}
                         doc_ref.update(updates)
                         room_data.update(updates)
                         should_broadcast_game_state = True

            elif action == "SUBMIT_ANSWER":
                if room_data["state"] == "PLAYING" and client_id != room_data.get("moderator_id"):
                     current_answers = room_data.get("round_answers", [])
                     # Check if answered
                     if not any(a["client_id"] == client_id for a in current_answers):
                         new_answer = {
                            "client_id": client_id,
                            "nickname": players[client_id]["nickname"],
                            "answer": payload.get("answer", "").upper().strip()
                         }
                         current_answers.append(new_answer)
                         
                         updates = {"round_answers": current_answers}
                         
                         # Check if all answered
                         active_players_count = len([p for p in players if p != room_data.get("moderator_id")])
                         # Note: logic might be slightly off if we count disconnected players.
                         # Assuming 'players' dict matches active participants mostly.
                         
                         if len(current_answers) >= active_players_count:
                             updates["state"] = "EVALUATING"
                         
                         doc_ref.update(updates)
                         room_data.update(updates)
                         should_broadcast_game_state = True

            elif action == "FORCE_END_ROUND":
                if room_data["state"] == "PLAYING":
                    updates = {"state": "EVALUATING"}
                    doc_ref.update(updates)
                    room_data.update(updates)
                    should_broadcast_game_state = True

            elif action == "SELECT_WINNER":
                if client_id == room_data.get("moderator_id") and room_data["state"] == "EVALUATING":
                    winner_id = payload.get("winner_id")
                    if winner_id and winner_id in players:
                        players[winner_id]["score"] += 1
                        updates = {
                            "players": players,
                            "moderator_id": winner_id,
                            "state": "SCORES"
                        }
                        doc_ref.update(updates)
                        room_data.update(updates)
                        should_broadcast_player_list = True
                        should_broadcast_game_state = True

            elif action == "CONTINUE_GAME":
                # Start new round
                if client_id == room_data.get("moderator_id") and room_data["state"] == "SCORES":
                    updates = {
                        "state": "PREPARING",
                        "current_letter": None,
                        "current_category": None,
                        "round_answers": []
                    }
                    doc_ref.update(updates)
                    room_data.update(updates)
                    should_broadcast_game_state = True

            elif action == "RESTART_ROUND":
                 if client_id == room_data.get("moderator_id") and room_data["state"] == "EVALUATING":
                    updates = {
                        "state": "PREPARING",
                        "current_letter": None,
                        "current_category": None,
                        "round_answers": []
                    }
                    doc_ref.update(updates)
                    room_data.update(updates)
                    should_broadcast_game_state = True
            
            elif action == "END_GAME":
                if room_data.get("moderator_id") == client_id:
                     updates = {"state": "FINAL_SCORES"}
                     doc_ref.update(updates)
                     room_data.update(updates)
                     should_broadcast_game_state = True

            elif action == "RETURN_TO_LOBBY":
                 if players.get(client_id, {}).get("is_host") and room_data["state"] == "FINAL_SCORES":
                     # Reset scores
                     for pid in players: players[pid]["score"] = 0
                     updates = {
                         "state": "LOBBY",
                         "players": players,
                         "round_answers": [],
                         "current_letter": None,
                         "current_category": None
                     }
                     doc_ref.update(updates)
                     room_data.update(updates)
                     should_broadcast_player_list = True
                     should_broadcast_game_state = True

            # --- Broadcast Updates ---
            if should_broadcast_player_list:
                await manager.broadcast(room_id, {
                    "type": "PLAYER_LIST_UPDATE",
                    "payload": get_player_list(room_data)
                })
            
            if should_broadcast_game_state:
                await manager.broadcast(room_id, {
                    "type": "GAME_STATE_UPDATE",
                    "payload": {
                        "state": room_data.get("state"),
                        "moderator_id": room_data.get("moderator_id"),
                        "letter": room_data.get("current_letter"),
                        "category": room_data.get("current_category"),
                        "answers": room_data.get("round_answers", []),
                        "time_limit": room_data.get("time_limit", 60)
                    }
                })

    except WebSocketDisconnect:
        manager.disconnect(room_id, client_id)
        # Handle disconnect in Firestore?
        # Ideally wait a bit before removing, but for now let's just mark connected=False
        # Fetch fresh to avoid overwrites
        doc_ref = get_room_doc(room_id)
        doc = doc_ref.get()
        if doc.exists:
            room_data = doc.to_dict()
            players = room_data.get("players", {})
            if client_id in players:
                players[client_id]["connected"] = False
                doc_ref.update({"players": players})

