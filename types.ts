
export enum GameMode {
  MOST_LIKELY_TO = 'MOST_LIKELY_TO',
  TRUTH_OR_BLUFF = 'TRUTH_OR_BLUFF',
  BOLLYWOOD_HINTS = 'BOLLYWOOD_HINTS',
  IMPOSTER = 'IMPOSTER',
  TABOO = 'TABOO',
  RAPID_FIRE = 'RAPID_FIRE',
  FINISH_THE_LYRICS = 'FINISH_THE_LYRICS',
  CATEGORY_STORM = 'CATEGORY_STORM',
  WHO_AM_I = 'WHO_AM_I'
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  score: number;
}

export interface CategorySubmission {
  playerId: string;
  word: string; // normalized lowercase
  displayWord: string;
  timestamp: number;
  points: number;
}

export interface GameState {
  roomCode: string;
  players: Player[];
  status: 'LOBBY' | 'PLAYING' | 'FINISHED';
  currentMode: GameMode | null;
  currentRound: number;
  totalRounds: number;
  currentContent: GameContent | null;
  isLoadingContent: boolean;
  history: GameContent[];
  categorySubmissions: CategorySubmission[];
}

// Discriminated union for different game content types
export type GameContent = 
  | { type: GameMode.MOST_LIKELY_TO; text: string }
  | { type: GameMode.TRUTH_OR_BLUFF; statement: string }
  | { type: GameMode.BOLLYWOOD_HINTS; movie: string; hints: string[] }
  | { type: GameMode.TABOO; word: string; forbidden: string[] }
  | { type: GameMode.IMPOSTER; category: string; word: string; imposterWord: string }
  | { type: GameMode.RAPID_FIRE; question: string; answer?: string | null }
  | { type: GameMode.FINISH_THE_LYRICS; line: string; answer: string; song: string }
  | { type: GameMode.CATEGORY_STORM; category: string }
  | { type: GameMode.WHO_AM_I; riddle: string; answer: string }
  | { type: 'GENERIC'; text: string }; 

export const AVATARS = [
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', 
  '🦁', '🐮', '🐷', '🐸', '🐙', '🦄', '🐝', '🐞', '🦋', '🐢'
];

export const GAME_MODE_DETAILS = {
  [GameMode.MOST_LIKELY_TO]: {
    label: "Who's Most Likely To",
    description: 'Vote on who fits the description best.',
    color: 'from-blue-500 to-cyan-500',
    icon: '👉'
  },
  [GameMode.TRUTH_OR_BLUFF]: {
    label: 'Truth or Bluff',
    description: 'Read the statement. Convince them it\'s truth or bluff!',
    color: 'from-green-500 to-emerald-500',
    icon: '🤔'
  },
  [GameMode.BOLLYWOOD_HINTS]: {
    label: 'Bollywood Hints',
    description: 'Guess the movie from 3 weird words.',
    color: 'from-orange-500 to-yellow-500',
    icon: '🎬'
  },
  [GameMode.IMPOSTER]: {
    label: 'Who is the Imposter',
    description: 'Everyone gets a word. The imposter gets a different one.',
    color: 'from-red-500 to-orange-500',
    icon: '🕵️'
  },
  [GameMode.TABOO]: {
    label: 'Taboo',
    description: 'Describe the word without saying forbidden ones.',
    color: 'from-purple-500 to-indigo-500',
    icon: '🙊'
  },
  [GameMode.RAPID_FIRE]: {
    label: 'Rapid Fire',
    description: '5 Seconds to answer. Think fast!',
    color: 'from-rose-500 to-red-600',
    icon: '⚡'
  },
  [GameMode.FINISH_THE_LYRICS]: {
    label: 'Finish the Lyrics',
    description: 'Complete the song line.',
    color: 'from-pink-500 to-rose-400',
    icon: '🎵'
  },
  [GameMode.CATEGORY_STORM]: {
    label: 'Category Storm',
    description: 'Name unique items in the category.',
    color: 'from-teal-400 to-blue-500',
    icon: '🌪️'
  },
  [GameMode.WHO_AM_I]: {
    label: 'Who Am I?',
    description: 'Solve the riddle.',
    color: 'from-indigo-400 to-purple-600',
    icon: '❓'
  }
};
