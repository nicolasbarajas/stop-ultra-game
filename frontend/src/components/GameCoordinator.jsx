import React from 'react';
import ModPreparing from './game/ModPreparing';
import PlayingScreen from './game/PlayingScreen';
import EvaluationScreen from './game/EvaluationScreen';
import ScoreboardScreen from './game/ScoreboardScreen';
import WinnerRevealScreen from './game/WinnerRevealScreen';
import ConfirmModal from './ConfirmModal';
import { useConfirm } from '../hooks/useConfirm';

// gameState: PREPARING | PLAYING | EVALUATING | SCORES
const GameCoordinator = ({
    roomId, // Added roomId to props
    gameState,
    gameData, // { letter, category, answers, moderator_id, ... }
    myClientId,
    players,
    isHost,
    sendAction,
    onLeaveRoom,
    serverOffset
}) => {
    const isProd = import.meta.env.PROD;

    // Derived Roles
    const isMod = gameData.moderator_id === myClientId;

    // Derived Data
    const modPlayer = players.find(p => p.id === gameData.moderator_id);
    const modName = modPlayer ? modPlayer.nickname : "Moderador";

    const { confirmConfig, requestConfirm, closeConfirm } = useConfirm();

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
                        requestConfirm("¿Deseas salir de la sala?", onLeaveRoom, { confirmText: "Salir", isDanger: true });
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
                    categoryDescription={gameData.category_description}
                    answers={gameData.answers}
                    onSubmitWord={(word, timeTaken) => sendAction("SUBMIT_ANSWER", { answer: word, time_taken: timeTaken })}
                    onForceEnd={() => sendAction("FORCE_END_ROUND")}
                    initialTime={gameData.time_limit || 60}
                    startTime={gameData.round_start_time}
                    serverOffset={serverOffset}
                />

                <ConfirmModal {...confirmConfig} onClose={closeConfirm} />
            </div>
        );
    }

    if (gameState === 'EVALUATING') {
        return (
            <EvaluationScreen
                answers={gameData.answers || []}
                players={players}
                letter={gameData.letter}
                category={gameData.category} // Ensure category is passed if not already (it wasn't in previous snippet, let me check file!)
                categoryDescription={gameData.category_description}
                isMod={isMod}
                isHost={isHost}
                modName={modName}
                onSelectWinner={(winnerId) => sendAction("SELECT_WINNER", { winner_id: winnerId })}
                onRestartRound={() => sendAction("RESTART_ROUND")} // Using backend fallback
                onEndGame={() => sendAction("END_GAME")}
                winnersHistory={gameData.winners_history || []}
            />
        );
    }

    if (gameState === 'WINNER_REVEAL') {
        return (
            <WinnerRevealScreen
                winnerName={modName}
                winningWord={gameData.last_winning_word || "..."}
                winningTime={gameData.last_winning_time || 0}
                isMeNextMod={isMod}
                nextModName={modName}
                onSkip={() => sendAction("SKIP_WINNER_REVEAL")}
            />
        );
    }

    if (gameState === 'SCORES' || gameState === 'FINAL_SCORES') {
        return (
            <ScoreboardScreen
                roomId={roomId}
                players={players}
                isMod={isMod}
                isHost={isHost}
                isFinal={gameState === 'FINAL_SCORES'}
                modName={modName}
                onContinue={() => sendAction("CONTINUE_GAME")}
                onBackToLobby={() => sendAction("RETURN_TO_LOBBY")}
                onEndGame={() => sendAction("END_GAME")}
                onKickPlayer={(targetId) => sendAction("KICK_PLAYER", { target_id: targetId })}
                myClientId={myClientId}
            />
        );
    }

    return <div className="p-10 text-center">Estado Desconocido: {gameState}</div>;
};

export default GameCoordinator;
