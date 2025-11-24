
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, update, onValue, runTransaction } from 'firebase/database';
import { GameState, Player } from '../types';

// --- CONFIGURATION ---
// 1. Go to console.firebase.google.com
// 2. Create a project -> Add a Web App
// 3. Paste the config object below
const firebaseConfig = {
  apiKey: "AIzaSyAIyQU4QTFY-dcl0IKFdbWQPv47hYOMCjw",
  authDomain: "party-hub-3fabe.firebaseapp.com",
  databaseURL: "https://party-hub-3fabe-default-rtdb.firebaseio.com",
  projectId: "party-hub-3fabe",
  storageBucket: "party-hub-3fabe.firebasestorage.app",
  messagingSenderId: "225141267084",
  appId: "1:225141267084:web:57dea58ee851a6cad479a9",
  measurementId: "G-CZMS6L530W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export const createRoom = async (hostName: string, hostAvatar: string): Promise<string> => {
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    const hostPlayer: Player = {
        id: Math.random().toString(36).substr(2, 9),
        name: hostName,
        avatar: hostAvatar,
        isHost: true,
        score: 0
    };

    const initialState: GameState = {
        roomCode: code,
        players: [hostPlayer],
        status: 'LOBBY',
        currentMode: null,
        currentRound: 0,
        totalRounds: 10,
        currentContent: null,
        isLoadingContent: false,
        history: [],
        categorySubmissions: []
    };

    await set(ref(db, 'rooms/' + code), initialState);
    return code;
};

export const joinRoom = async (code: string, playerName: string, avatar: string): Promise<{ success: boolean, message?: string, playerId?: string }> => {
    const roomRef = ref(db, `rooms/${code}`);
    const newPlayerId = Math.random().toString(36).substr(2, 9);
    
    try {
        // Use transaction to prevent race conditions when multiple people join at once
        const transactionResult = await runTransaction(roomRef, (currentData) => {
            if (currentData === null) return null; // Room doesn't exist, abort

            if (currentData.players) {
                const nameTaken = currentData.players.some((p: any) => p.name.toLowerCase() === playerName.toLowerCase());
                if (nameTaken) return; // Abort if name taken
            }

            const newPlayer: Player = {
                id: newPlayerId,
                name: playerName,
                avatar,
                isHost: false,
                score: 0
            };

            if (!currentData.players) currentData.players = [];
            currentData.players.push(newPlayer);
            
            return currentData;
        });

        if (transactionResult.committed) {
            return { success: true, playerId: newPlayerId };
        } else {
            // Check why it failed
            const snapshot = await get(roomRef);
            if (!snapshot.exists()) return { success: false, message: "Room not found" };
            return { success: false, message: "Name already taken or room unavailable" };
        }
    } catch (e) {
        console.error("Join Room Error", e);
        return { success: false, message: "Connection failed" };
    }
};

export const updateRoomState = async (code: string, updates: Partial<GameState>) => {
    const roomRef = ref(db, `rooms/${code}`);
    await update(roomRef, updates);
};

export const getRoomState = async (code: string): Promise<GameState | null> => {
    const snapshot = await get(ref(db, `rooms/${code}`));
    return snapshot.exists() ? snapshot.val() : null;
};

// Real-time listener
export const subscribeToRoom = (code: string, callback: (state: GameState | null) => void) => {
    const roomRef = ref(db, `rooms/${code}`);
    
    const unsubscribe = onValue(roomRef, (snapshot) => {
        const data = snapshot.val();
        callback(data);
    });

    return unsubscribe;
};

// Submit a word for Category Storm
export const submitCategoryWord = async (code: string, playerId: string, word: string): Promise<{ success: boolean, message?: string, points?: number }> => {
    const roomRef = ref(db, `rooms/${code}`);
    const normalizedWord = word.trim().toLowerCase();

    try {
        const result = await runTransaction(roomRef, (room) => {
            if (!room) return null;
            
            // Check if duplicate globally in this room
            const submissions = room.categorySubmissions || [];
            if (submissions.some((s: any) => s.word === normalizedWord)) {
                return; // Abort transaction (returns undefined, so committed is false)
            }

            // Calculate score: Start at 500, decay by 10 per word, min 50.
            // This rewards speed.
            const points = Math.max(50, 500 - (submissions.length * 10));
            
            const newSubmission = {
                playerId,
                word: normalizedWord,
                displayWord: word.trim(),
                timestamp: Date.now(),
                points
            };

            if (!room.categorySubmissions) room.categorySubmissions = [];
            room.categorySubmissions.push(newSubmission);

            // Immediately update player score
            const pIdx = room.players.findIndex((p: any) => p.id === playerId);
            if (pIdx >= 0) {
                if (!room.players[pIdx].score) room.players[pIdx].score = 0;
                room.players[pIdx].score += points;
            }

            return room;
        });

        if (result.committed) {
            // Helper to find what points we just assigned
            const newRoom = result.snapshot.val();
            const mySub = newRoom.categorySubmissions?.find((s: any) => s.word === normalizedWord);
            return { success: true, points: mySub?.points || 0 };
        } else {
            return { success: false, message: "Duplicate! Word already taken." };
        }
    } catch (e) {
        console.error("Submission error", e);
        return { success: false, message: "Network error" };
    }
};
