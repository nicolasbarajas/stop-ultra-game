from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Optional
import json
import random
import string
import time
from pydantic import BaseModel
import asyncio
import firebase_admin
from firebase_admin import credentials, firestore
import datetime

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
LETTERS = [c for c in string.ascii_uppercase if c not in ['K', 'W', 'X']]
CATEGORIES = [
    ("Herramienta", "Instrumento-Utensilio-Arma"), ("Animal", "Clase-Orden-Familia-Especie"), ("Cuerpo Humano", "Partes-Fluidos-Enfermedades-Síntomas"),
    ("Adjetivo", "Cualidad-Defecto"), ("Ciudad", "Municipio"), ("País", "Existente actualmente"),
    ("Profesión", "Ocupación-Oficio"), ("Deporte", "Disciplina Deportiva"), ("Alimento", "Comida-Bebida-Fruver"), ("Cantante", "Grupo Musical"),
    ("Película", "En español o idioma original"), ("Serie de TV", "En español o idioma original"), ("Famoso", "Nombre o Alias"), ("Marca", "Empresa")
]

BIGRAMS = [("DE", 1), ("LA", 1), ("QU",1), ("EN",1), ("EL",1), ("ES",1), ("SE",1), ("LO",1), ("UN",1), ("PO",1), ("PA",1), ("PR",1), ("SU",1), ("HA",1), ("NO",1), ("CA",1), ("RE",1), ("AL",1), ("SI",1), ("PE",1), ("IN",1), ("ME",1), ("MA",1), ("DI",1), ("CU",1), ("MI",1), ("SO",1), ("TE",1), ("MU",1), ("TO",1), ("LE",1), ("TR",1), ("PU",1), ("VE",1), ("TA",1), ("VI",1), ("FU",1), ("DO",1), ("AC",1), ("SA",1), ("EX",1), ("TI",2), ("AN",2), ("CI",2), ("MO",2), ("NU",2), ("OT",2), ("GR",2), ("JU",2), ("HO",2), ("NA",2), ("VA",2), ("AS",2), ("BA",2), ("FI",2), ("CR",2), ("NI",2), ("AU",3), ("AÑ",3), ("LU",3), ("HE",3), ("AP",3), ("ER",3), ("EM",3), ("OB",3), ("FA",3), ("CE",2), ("IM",3), ("AM",2), ("FO",2), ("HI",3), ("FR",3), ("LI",3), ("AR",2), ("AD",2), ("GE",3), ("DA",2), ("YA",3), ("PI",2), ("OR",2), ("PL",3), ("NE",2), ("GO",3), ("RA",2), ("DU",3), ("RO",2), ("AB",3), ("CL",2), ("AQ",3), ("VO",3), ("HU",3), ("BU",2), ("AG",3), ("FE",2), ("GU",3), ("BI",3), ("YO",3), ("GA",2), ("AH",3), ("OC",3), ("TU",2), ("JO",2), ("EJ",3), ("AY",3), ("OP",2), ("BO",2), ("RI",2), ("EC",2), ("US",2), ("AT",2), ("ED",2), ("ID",2), ("OF",2), ("AF",2), ("BR",2), ("EF",2), ("IG",3), ("CH",2), ("BE",2), ("RU",2), ("EV",3), ("JA",2), ("ET",3), ("EQ",3), ("IR",3), ("VU",3), ("AV",3), ("JE",3), ("BL",3), ("OJ",3), ("ZO",3), ("AI",3), ("OL",3), ("FL",3), ("IS",3), ("OS",3), ("UR",3), ("AZ",3), ("GI",3), ("IZ",3), ("DR",3), ("GL",3), ("KI",3), ("IL",3), ("AJ",3), ("ON",3), ("ZA",3), ("EP",3), ("UB",3), ("JI",3), ("AE",3), ("OD",3), ("OX",3), ("YU",3), ("EG",3), ("CO",1)]

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

def get_expiration_time():
    return datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24)

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

def get_game_state_payload(room_data: dict, force_reveal=False):
    """
    Constructs a consistent game state payload with all necessary fields.
    """
    return {
        "state": room_data.get("state"),
        "moderator_id": room_data.get("moderator_id"),
        "letter": room_data.get("current_letter"),
        "category": room_data.get("current_category"),
        "category_description": room_data.get("current_category_description"),
        "answers": room_data.get("round_answers", []),
        "time_limit": room_data.get("time_limit", 60),
        "round_start_time": room_data.get("round_start_time"),
        # Include winning info if available, critical for re-joins/refreshes
        "last_winning_word": room_data.get("last_winning_word"),
        "last_winning_time": room_data.get("last_winning_time"),
        "winners_history": room_data.get("winners_history", []),
        "game_mode": room_data.get("game_mode", "UNIQUE_LETTERS"),
        "current_round_type": room_data.get("current_round_type", "LETTER"),
        "server_time": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

# --- HTTP Endpoints ---

class JoinRequest(BaseModel):
    room_id: str
    nickname: str
    client_id: Optional[str] = None

@app.post("/create-room")
async def create_room_endpoint():
    # SIMULACIÓN DE COLD START (Borrar después)
    # time.sleep(15)
    
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
        "current_category_description": None,
        "round_answers": [],
        "winners_history": [],
        "inactive_players": {},
        "round_start_time": None,
        "time_limit": 60,
        "game_mode": "UNIQUE_LETTERS",
        "current_round_type": "LETTER",
        "created_at": firestore.SERVER_TIMESTAMP,
        "expire_at": get_expiration_time()
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
         # Return rejoin status if applicable, otherwise allow join (late join)
         players = data.get("players", {})
         client_id = req.client_id
         
         if client_id and client_id in players:
             return {"valid": True, "rejoin": True}
             
         # Allow late join
         return {"valid": True, "in_progress": True}
        
    return {"valid": True}

@app.get("/sync-time")
async def sync_time_endpoint():
    return {"server_time": datetime.datetime.now(datetime.timezone.utc).isoformat()}

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
                
                # Check for duplicate nickname
                original_nickname = nickname
                count = 1
                while any(p["nickname"].lower() == nickname.lower() for pid, p in players.items() if pid != client_id):
                    nickname = f"{original_nickname}{count}"
                    count += 1

                # RECOVER SCORE FROM INACTIVE (KICKED) PLAYERS
                inactive_players = room_data.get("inactive_players", {})
                recovered_score = 0
                if client_id in inactive_players:
                    recovered_score = inactive_players[client_id]["score"]
                    # Remove from inactive since they are back
                    del inactive_players[client_id]

                # Update/Add player
                players[client_id] = {
                    "nickname": nickname,
                    "score": players.get(client_id, {}).get("score", recovered_score), 
                    "is_host": is_host or players.get(client_id, {}).get("is_host", False),
                    "connected": True
                }
                
                updates = {"players": players, "inactive_players": inactive_players, "expire_at": get_expiration_time()}
                if is_host:
                    updates["host_id"] = client_id
                
                doc_ref.update(updates)
                room_data.update(updates) # Local update for response
                should_broadcast_player_list = True

                # [FIX] Send immediate game state to rejoining player
                if room_data["state"] != "LOBBY":
                    # Send direct message to this socket, not broadcast
                    try:
                        await websocket.send_text(json.dumps({
                            "type": "GAME_STATE_UPDATE",
                            "payload": get_game_state_payload(room_data)
                        }))
                    except:
                        pass

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
                        
                        room_data["expire_at"] = get_expiration_time()
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
                            
                        room_data["expire_at"] = get_expiration_time()
                        doc_ref.set(room_data)
                        should_broadcast_player_list = True
                        
            elif action == "START_GAME":
                if len(players) >= 3:
                     game_mode = payload.get("game_mode", "UNIQUE_LETTERS")
                     initial_round_type = "LETTER"
                     if game_mode == "DOUBLE_LETTERS":
                         initial_round_type = "BIGRAM"
                     elif game_mode == "MIXED_RANDOM":
                         initial_round_type = random.choice(["LETTER", "BIGRAM"])
                     elif game_mode == "MIXED_INTERLEAVED":
                         initial_round_type = "LETTER" # Starts with LETTER

                     updates = {
                         "expire_at": get_expiration_time(),
                         "state": "PREPARING",
                         "moderator_id": room_data.get("host_id"), # Start with host
                         "time_limit": payload.get("time_limit", 60),
                         "game_mode": game_mode,
                         "current_round_type": initial_round_type,
                         "current_letter": None,
                         "current_category": None,
                         "current_category_description": None,
                         "round_answers": [],
                         "winners_history": []
                     }
                     doc_ref.update(updates)
                     room_data.update(updates)
                     should_broadcast_game_state = True

            elif action == "SPIN":
                if room_data.get("moderator_id") == client_id and room_data["state"] == "PREPARING":
                    # 1. Update with result immediately so clients can start animation
                    # Note: We do NOT set state to PLAYING yet, we keep it in PREPARING
                    # but with a letter/category set.
                    # Frontend will see letter/category and play animation.
                    
                    current_round_type = room_data.get("current_round_type", "LETTER")
                    if current_round_type == "BIGRAM":
                        # Tupla value to probability weight: 1 -> 4, 2 -> 2, 3 -> 1
                        weights = []
                        for bg, val in BIGRAMS:
                            if val == 1: weights.append(4)
                            elif val == 2: weights.append(2)
                            else: weights.append(1)  # Assumes val == 3
                        chosen_letter = random.choices(BIGRAMS, weights=weights, k=1)[0][0]
                    else:
                        chosen_letter = random.choice(LETTERS)

                    # Handle tuple (Name, Desc)
                    chosen_cat_tuple = random.choice(CATEGORIES)
                    if isinstance(chosen_cat_tuple, tuple):
                        chosen_category = chosen_cat_tuple[0]
                        chosen_category_desc = chosen_cat_tuple[1]
                    else:
                        chosen_category = chosen_cat_tuple
                        chosen_category_desc = None
                    
                    updates = {
                        "expire_at": get_expiration_time(),
                        "current_letter": chosen_letter,
                        "current_category": chosen_category,
                        "current_category_description": chosen_category_desc
                    }
                    doc_ref.update(updates)
                    room_data.update(updates)
                    
                        # Broadcast the "Spin Result" (still in PREPARING)
                    await manager.broadcast(room_id, {
                        "type": "GAME_STATE_UPDATE",
                        "payload": get_game_state_payload(room_data)
                    })

                    # 2. Wait for animation (3.5 seconds)
                    # Use asyncio.sleep to not block the event loop
                    await asyncio.sleep(4)

                    # 3. Automatically start the round
                    # Refetch to ensure state hasn't changed (e.g. game ended)
                    # Although simple check is enough for now
                    doc = doc_ref.get()
                    if doc.exists:
                         current_rd = doc.to_dict()
                         # Ensure we are still in PREPARING and same letter (not reset)
                         if current_rd.get("state") == "PREPARING" and current_rd.get("current_letter") == chosen_letter:
                             updates = {
                                 "state": "PLAYING", 
                                 "expire_at": get_expiration_time(),
                                 "round_start_time": datetime.datetime.now(datetime.timezone.utc).isoformat()
                             }
                             doc_ref.update(updates)
                             room_data.update(updates)
                             
                             # Broadcast "PLAYING" state
                             await manager.broadcast(room_id, {
                                "type": "GAME_STATE_UPDATE",
                                "payload": get_game_state_payload(room_data)
                            })

            elif action == "START_ROUND":
                if room_data.get("moderator_id") == client_id and room_data["state"] == "PREPARING":
                     if room_data.get("current_letter"):
                         updates = {
                             "state": "PLAYING", 
                             "expire_at": get_expiration_time(),
                             "round_start_time": datetime.datetime.now(datetime.timezone.utc).isoformat()
                         }
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
                            "answer": payload.get("answer", "").upper().strip(),
                            "time_taken": payload.get("time_taken", 999.0) # Default high if missing
                         }
                         current_answers.append(new_answer)
                         
                         # SORT BY TIME_TAKEN
                         current_answers.sort(key=lambda x: x.get("time_taken", 999.0))
                         
                         updates = {"round_answers": current_answers, "expire_at": get_expiration_time()}
                         
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
                    updates = {"state": "EVALUATING", "expire_at": get_expiration_time()}
                    doc_ref.update(updates)
                    room_data.update(updates)
                    should_broadcast_game_state = True

            elif action == "SELECT_WINNER":
                if client_id == room_data.get("moderator_id") and room_data["state"] == "EVALUATING":
                    winner_id = payload.get("winner_id")
                    if winner_id and winner_id in players:
                        # Find winner index in round_answers
                        round_answers = room_data.get("round_answers", [])
                        winner_index = -1
                        for idx, ans in enumerate(round_answers):
                            if ans["client_id"] == winner_id:
                                winner_index = idx
                                break

                        # Penalize players who answered BEFORE the winner
                        if winner_index > 0:
                            for i in range(winner_index):
                                p_id = round_answers[i]["client_id"]
                                if p_id in players:
                                    players[p_id]["score"] -= 1

                        players[winner_id]["score"] += 1
                        
                        # Get winning word and time
                        winning_word = ""
                        winning_time = 0.0
                        if winner_index >= 0:
                             winning_word = round_answers[winner_index]["answer"]
                             winning_time = round_answers[winner_index].get("time_taken", 0.0)

                        # 1. SHOW WINNER REVEAL
                        winners_history = room_data.get("winners_history", [])
                        if winning_word:
                             winners_history.append({
                                 "category": room_data.get("current_category", "Desconocida"),
                                 "word": winning_word,
                                 "winner": players[winner_id]["nickname"]
                             })

                        updates = {
                            "expire_at": get_expiration_time(),
                            "players": players,
                            "moderator_id": winner_id,
                            "last_winning_word": winning_word,
                            "last_winning_time": winning_time,
                            "winners_history": winners_history,
                            "state": "WINNER_REVEAL"
                        }
                        doc_ref.update(updates)
                        room_data.update(updates)
                        should_broadcast_player_list = True
                        
                        # Broadcast immediately
                        await manager.broadcast(room_id, {
                            "type": "GAME_STATE_UPDATE",
                            "payload": get_game_state_payload(room_data)
                        })

                        # REMOVED AUTOMATIC TRANSITION TO SCORES
                        # Moderator must click "Continue/Skip" to proceed.

            elif action == "SKIP_WINNER_REVEAL":
                 if client_id == room_data.get("moderator_id") and room_data["state"] == "WINNER_REVEAL":
                     updates = {
                         "state": "SCORES",
                         "expire_at": get_expiration_time()
                     }
                     doc_ref.update(updates)
                     room_data.update(updates)
                     should_broadcast_game_state = True

            elif action == "CONTINUE_GAME":
                # Start new round
                if client_id == room_data.get("moderator_id") and room_data["state"] == "SCORES":
                    game_mode = room_data.get("game_mode", "UNIQUE_LETTERS")
                    prev_round_type = room_data.get("current_round_type", "LETTER")
                    next_round_type = prev_round_type

                    if game_mode == "MIXED_INTERLEAVED":
                        next_round_type = "BIGRAM" if prev_round_type == "LETTER" else "LETTER"
                    elif game_mode == "MIXED_RANDOM":
                        next_round_type = random.choice(["LETTER", "BIGRAM"])

                    updates = {
                        "expire_at": get_expiration_time(),
                        "state": "PREPARING",
                        "current_round_type": next_round_type,
                        "current_letter": None,
                        "current_category": None,
                        "current_category_description": None,
                        "round_answers": []
                    }
                    doc_ref.update(updates)
                    room_data.update(updates)
                    should_broadcast_game_state = True

            elif action == "RESTART_ROUND":
                 if client_id == room_data.get("moderator_id") and room_data["state"] == "EVALUATING":
                    updates = {
                        "expire_at": get_expiration_time(),
                        "state": "PREPARING",
                        "current_letter": None,
                        "current_category": None,
                        "current_category_description": None,
                        "round_answers": []
                    }
                    doc_ref.update(updates)
                    room_data.update(updates)
                    should_broadcast_game_state = True
            
            elif action == "END_GAME":
                if room_data.get("moderator_id") == client_id:
                     updates = {"state": "FINAL_SCORES", "expire_at": get_expiration_time()}
                     doc_ref.update(updates)
                     room_data.update(updates)
                     should_broadcast_game_state = True

            elif action == "RETURN_TO_LOBBY":
                 if players.get(client_id, {}).get("is_host") and room_data["state"] == "FINAL_SCORES":
                     # Reset scores
                     for pid in players: players[pid]["score"] = 0
                     updates = {
                         "expire_at": get_expiration_time(),
                         "state": "LOBBY",
                         "players": players,
                         "round_answers": [],
                         "current_letter": None,
                         "current_category": None,
                         "current_category_description": None
                     }
                     doc_ref.update(updates)
                     room_data.update(updates)
                     should_broadcast_player_list = True
                     should_broadcast_game_state = True

            elif action == "KICK_PLAYER":
                target_id = payload.get("target_id")
                if (client_id == room_data.get("moderator_id") or client_id == room_data.get("host_id")) and target_id in players:
                    if target_id == client_id:
                        continue # Cannot kick self

                    # Move to inactive to preserve score
                    inactive_players = room_data.get("inactive_players", {})
                    inactive_players[target_id] = {
                        "nickname": players[target_id]["nickname"],
                        "score": players[target_id]["score"]
                    }
                    
                    # Remove from active players
                    del players[target_id]
                    
                    # Reassign roles if necessary
                    if room_data.get("host_id") == target_id:
                         new_host = next(iter(players)) if players else None
                         room_data["host_id"] = new_host
                         if new_host:
                             players[new_host]["is_host"] = True

                    if room_data.get("moderator_id") == target_id:
                         room_data["moderator_id"] = room_data["host_id"]
                         should_broadcast_game_state = True

                    updates = {
                        "players": players, 
                        "inactive_players": inactive_players,
                        "host_id": room_data.get("host_id"),
                        "moderator_id": room_data.get("moderator_id"),
                        "expire_at": get_expiration_time()
                    }
                    doc_ref.update(updates)
                    room_data.update(updates)
                    should_broadcast_player_list = True

            # --- Broadcast Updates ---
            if should_broadcast_player_list:
                await manager.broadcast(room_id, {
                    "type": "PLAYER_LIST_UPDATE",
                    "payload": get_player_list(room_data)
                })
            
            if should_broadcast_game_state:
                await manager.broadcast(room_id, {
                    "type": "GAME_STATE_UPDATE",
                    "payload": get_game_state_payload(room_data)
                })

    except WebSocketDisconnect:
        manager.disconnect(room_id, client_id)
        # Optional: Auto-remove from players if desired, but we keep them for reconnection logic
        # per previous requirements.
        doc_ref = get_room_doc(room_id)
        doc = doc_ref.get()
        if doc.exists:
            room_data = doc.to_dict()
            players = room_data.get("players", {})
            if client_id in players:
                players[client_id]["connected"] = False
                doc_ref.update({"players": players})
    except Exception as e:
        print(f"CRITICAL WS ERROR: {e}")
        import traceback
        traceback.print_exc()
        manager.disconnect(room_id, client_id)