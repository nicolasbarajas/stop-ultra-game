import React from 'react';
import ModPreparing from './game/ModPreparing';
import PlayingScreen from './game/PlayingScreen';
import EvaluationScreen from './game/EvaluationScreen';
import ScoreboardScreen from './game/ScoreboardScreen';

// gameState: PREPARING | PLAYING | EVALUATING | SCORES
const GameCoordinator = ({
    gameState,
    gameData, // { letter, category, answers, moderator_id, ... }
    myClientId,
    players,
    isHost,
    sendAction
}) => {

    // Derived Roles
    const isMod = gameData.moderator_id === myClientId;

    // Derived Data
    const modPlayer = players.find(p => p.id === gameData.moderator_id);
    const modName = modPlayer ? modPlayer.nickname : "Moderador";

    if (gameState === 'PREPARING') {
        return (
            <ModPreparing
                letter={gameData.letter}
                category={gameData.category}
                isMod={isMod}
                modName={modName}
                onSpin={() => sendAction("SPIN")}
                onStartRound={() => sendAction("START_ROUND")}
            />
        );
    }

    if (gameState === 'PLAYING') {
        return (
            <div className="h-full w-full relative">
                {/* Exit Button (Persistent) */}
                <button
                    onClick={() => {
                        if (confirm("¿Seguro que quieres salir de la sala?")) onLeaveRoom();
                    }}
                    className="absolute top-2 right-2 z-50 p-2 text-white/50 hover:text-white transition-colors bg-black/20 rounded-xl h-8 w-8 flex items-center justify-center font-bold"
                    title="Salir de la partida"
                >
                    ✕
                </button>

                {/* Game Screen Content */}
                <PlayingScreen
                    isMod={isMod}
                    isHost={isHost}
                    letter={gameData.letter}
                    category={gameData.category}
                    answers={gameData.answers}
                    onSubmitWord={(word) => sendAction("SUBMIT_ANSWER", { answer: word })}
                    onForceEnd={() => sendAction("FORCE_END_ROUND")}
                    initialTime={gameData.time_limit || 60}
                />
            </div>
        );
    }

    if (gameState === 'EVALUATING') {
        return (
            <EvaluationScreen
                answers={gameData.answers || []}
                players={players}
                isMod={isMod}
                isHost={isHost}
                modName={modName}
                onSelectWinner={(winnerId) => sendAction("SELECT_WINNER", { winner_id: winnerId })}
                onRestartRound={() => sendAction("RESTART_ROUND")} // Using backend fallback
                onEndGame={() => sendAction("END_GAME")}
            />
        );
    }

    if (gameState === 'SCORES' || gameState === 'FINAL_SCORES') {
        return (
            <ScoreboardScreen
                players={players}
                isMod={isMod}
                isHost={isHost}
                isFinal={gameState === 'FINAL_SCORES'}
                modName={modName}
                onContinue={() => sendAction("CONTINUE_GAME")}
                onBackToLobby={() => sendAction("RETURN_TO_LOBBY")}
                onEndGame={() => sendAction("END_GAME")}
            />
        );
    }

    return <div className="p-10 text-center">Estado Desconocido: {gameState}</div>;
};

export default GameCoordinator;
