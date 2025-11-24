
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { GameState, Player, GameMode, GameContent } from '../types';
import * as RoomService from '../services/room';
import * as GeminiService from '../services/gemini';
import toast from 'react-hot-toast';

interface GameContextType {
    state: GameState | null;
    currentPlayerId: string | null;
    createRoom: (name: string, avatar: string) => Promise<void>;
    joinRoom: (code: string, name: string, avatar: string) => Promise<boolean>;
    startGame: (mode: GameMode) => void;
    nextRound: () => void;
    endGame: () => void;
    returnToLobby: () => void;
    leaveRoom: () => void;
    submitCategoryWord: (word: string) => Promise<{ success: boolean; message?: string; points?: number }>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<GameState | null>(null);
    const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
    // Keep track of the room code we are connected to, independent of state (which might be null briefly)
    const [activeRoomCode, setActiveRoomCode] = useState<string | null>(null);

    // Sync with Firebase
    useEffect(() => {
        if (!activeRoomCode) return;

        const unsubscribe = RoomService.subscribeToRoom(activeRoomCode, (newState) => {
            if (newState) {
                setState(newState);
            } else {
                // Room deleted or unavailable
                toast.error("Room closed or disconnected");
                setState(null);
                setActiveRoomCode(null);
            }
        });

        return () => {
            unsubscribe();
        };
    }, [activeRoomCode]);

    const createRoom = async (name: string, avatar: string) => {
        try {
            const code = await RoomService.createRoom(name, avatar);
            // We need to fetch the state once to get the host's ID, or just infer it
            const initialState = await RoomService.getRoomState(code);
            if (initialState) {
                setState(initialState);
                setCurrentPlayerId(initialState.players[0].id);
                setActiveRoomCode(code);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to create room. Check Firebase config.");
        }
    };

    const joinRoom = async (code: string, name: string, avatar: string): Promise<boolean> => {
        try {
            const result = await RoomService.joinRoom(code, name, avatar);
            if (result.success && result.playerId) {
                setCurrentPlayerId(result.playerId);
                setActiveRoomCode(code);
                return true;
            } else {
                toast.error(result.message || "Failed to join");
                return false;
            }
        } catch (error) {
            console.error(error);
            toast.error("Connection error. Check Firebase config.");
            return false;
        }
    };

    const startGame = async (mode: GameMode) => {
        if (!state) return;
        
        // Optimistic update
        RoomService.updateRoomState(state.roomCode, { 
            status: 'PLAYING', 
            currentMode: mode, 
            isLoadingContent: true,
            categorySubmissions: [] // Clear submissions
        });

        // Generate first round content
        try {
            const content = await GeminiService.generateGameContent(mode, state.players.map(p => p.name));
            
            RoomService.updateRoomState(state.roomCode, {
                currentContent: content,
                isLoadingContent: false,
                currentRound: 1,
                history: [content],
                categorySubmissions: []
            });
        } catch (e) {
            console.error(e);
            toast.error("Content Generation failed.");
            RoomService.updateRoomState(state.roomCode, { isLoadingContent: false, status: 'LOBBY' });
        }
    };

    const nextRound = async () => {
        if (!state || !state.currentMode) return;

        // Auto-end if max rounds reached
        if (state.currentRound >= state.totalRounds) {
            endGame();
            return;
        }

        RoomService.updateRoomState(state.roomCode, { isLoadingContent: true });

        try {
             // Pass history context to avoid repeats
            const historyContext = state.history.map(h => {
                if ('text' in h) return h.text;
                if ('movie' in h) return h.movie;
                if ('statement' in h) return h.statement;
                return '';
            });

            const content = await GeminiService.generateGameContent(state.currentMode, state.players.map(p => p.name), historyContext);
            
            RoomService.updateRoomState(state.roomCode, {
                currentContent: content,
                isLoadingContent: false,
                currentRound: state.currentRound + 1,
                history: [...state.history, content],
                categorySubmissions: [] // Clear for new round
            });
        } catch (e) {
            console.error(e);
            toast.error("Failed to generate next round.");
            RoomService.updateRoomState(state.roomCode, { isLoadingContent: false });
        }
    };

    const endGame = () => {
        if (!state) return;
        RoomService.updateRoomState(state.roomCode, { 
            status: 'FINISHED',
            isLoadingContent: false
        });
    };

    const returnToLobby = () => {
        if (!state) return;
        RoomService.updateRoomState(state.roomCode, { 
            status: 'LOBBY', 
            currentMode: null, 
            currentRound: 0,
            currentContent: null,
            history: []
        });
    };

    const leaveRoom = () => {
        setState(null);
        setCurrentPlayerId(null);
        setActiveRoomCode(null);
    };

    const submitCategoryWord = async (word: string) => {
        if (!state || !currentPlayerId) return { success: false, message: "Not in game" };
        return await RoomService.submitCategoryWord(state.roomCode, currentPlayerId, word);
    };

    return (
        <GameContext.Provider value={{ state, currentPlayerId, createRoom, joinRoom, startGame, nextRound, endGame, returnToLobby, leaveRoom, submitCategoryWord }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
};
