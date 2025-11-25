
import { GoogleGenAI, Type } from '@google/genai';
import { GameMode, GameContent } from '../types';
import { 
  MOST_LIKELY_TO_LIST, 
  TRUTH_OR_BLUFF_LIST, 
  BOLLYWOOD_HINTS_LIST,
  TABOO_LIST,
  IMPOSTER_LIST,
  RAPID_FIRE_LIST,
  CATEGORY_STORM_LIST,
  FINISH_THE_LYRICS_LIST,
  WHO_AM_I_LIST
} from '../data/gameContent';

// --- SAFE ENVIRONMENT VARIABLE ACCESS ---
// This helper prevents "process is not defined" errors in browser environments (like Vite on Vercel)
const getApiKey = (): string | undefined => {
  // Helper to safely access process.env without crashing
  const getProcessEnv = (key: string) => {
    try {
      // @ts-ignore
      return typeof process !== 'undefined' && process.env ? process.env[key] : undefined;
    } catch {
      return undefined;
    }
  };

  // Helper to safely access import.meta.env (Vite standard)
  const getMetaEnv = (key: string) => {
    try {
      // @ts-ignore
      return typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env[key] : undefined;
    } catch {
      return undefined;
    }
  };

  // Check all possible naming conventions
  return (
    getMetaEnv('VITE_API_KEY') ||
    getMetaEnv('API_KEY') ||
    getProcessEnv('REACT_APP_API_KEY') ||
    getProcessEnv('NEXT_PUBLIC_API_KEY') ||
    getProcessEnv('API_KEY')
  );
};

const API_KEY = getApiKey();

// Initialize with the key if found, or a dummy string to prevent immediate init crash.
// (We handle the missing key check in the generate function)
const ai = new GoogleGenAI({ apiKey: API_KEY || "dummy_key" });

// Hybrid Logic: 
// We want to mix the curated static lists with fresh AI generations.
export const generateGameContent = async (mode: GameMode, players: string[], previousContext: string[] = []): Promise<GameContent> => {
  
  // 50% chance to use AI if API key is present. 
  // If no API key, always use static.
  const useAI = !!API_KEY && Math.random() > 0.5;

  // Note: For the new modes (Rapid Fire, etc), we are currently preferring static lists 
  // because the user provided specific high-quality content. 
  // We can add AI support for them later if needed.
  const isNewMode = [GameMode.RAPID_FIRE, GameMode.CATEGORY_STORM, GameMode.FINISH_THE_LYRICS, GameMode.WHO_AM_I].includes(mode);

  if (useAI && !isNewMode) {
    try {
      return await generateFromAI(mode, players, previousContext);
    } catch (error) {
      console.error("AI Generation failed, falling back to static list", error);
      return generateFromStatic(mode, previousContext);
    }
  } else {
    return generateFromStatic(mode, previousContext);
  }
};

// --- STATIC GENERATION LOGIC ---

function generateFromStatic(mode: GameMode, history: string[]): GameContent {
  switch (mode) {
    case GameMode.MOST_LIKELY_TO:
      return getUniqueContent(MOST_LIKELY_TO_LIST, history, (text) => ({ type: GameMode.MOST_LIKELY_TO, text }));
      
    case GameMode.TRUTH_OR_BLUFF:
      return getUniqueContent(TRUTH_OR_BLUFF_LIST, history, (statement) => ({ type: GameMode.TRUTH_OR_BLUFF, statement }));
      
    case GameMode.BOLLYWOOD_HINTS: {
      const availableMovies = BOLLYWOOD_HINTS_LIST.filter(item => !history.includes(item.movie));
      const selection = availableMovies.length > 0 
        ? availableMovies[Math.floor(Math.random() * availableMovies.length)] 
        : BOLLYWOOD_HINTS_LIST[Math.floor(Math.random() * BOLLYWOOD_HINTS_LIST.length)];
      
      return { 
        type: GameMode.BOLLYWOOD_HINTS, 
        movie: selection.movie, 
        hints: selection.hints 
      };
    }

    case GameMode.TABOO: {
      const availableWords = TABOO_LIST.filter(item => !history.includes(item.word));
      const selection = availableWords.length > 0
        ? availableWords[Math.floor(Math.random() * availableWords.length)]
        : TABOO_LIST[Math.floor(Math.random() * TABOO_LIST.length)];
      return {
        type: GameMode.TABOO,
        word: selection.word,
        forbidden: selection.forbidden
      };
    }

    case GameMode.IMPOSTER: {
      const availableCats = IMPOSTER_LIST.filter(item => !history.includes(item.word));
      const selection = availableCats.length > 0
        ? availableCats[Math.floor(Math.random() * availableCats.length)]
        : IMPOSTER_LIST[Math.floor(Math.random() * IMPOSTER_LIST.length)];
      return {
        type: GameMode.IMPOSTER,
        category: selection.category,
        word: selection.word,
        imposterWord: selection.imposterWord
      };
    }
    
    case GameMode.RAPID_FIRE: {
        const available = RAPID_FIRE_LIST.filter(item => !history.includes(item.question));
        const selection = available.length > 0
            ? available[Math.floor(Math.random() * available.length)]
            : RAPID_FIRE_LIST[Math.floor(Math.random() * RAPID_FIRE_LIST.length)];
        
        return {
            type: GameMode.RAPID_FIRE,
            question: selection.question,
            // Firebase does not accept undefined, so we default to null
            answer: selection.answer ?? null
        };
    }
      
    case GameMode.CATEGORY_STORM:
      return getUniqueContent(CATEGORY_STORM_LIST, history, (category) => ({ type: GameMode.CATEGORY_STORM, category }));

    case GameMode.FINISH_THE_LYRICS: {
        // Filter by line text to check uniqueness
        const available = FINISH_THE_LYRICS_LIST.filter(item => !history.includes(item.line));
        const selection = available.length > 0
            ? available[Math.floor(Math.random() * available.length)]
            : FINISH_THE_LYRICS_LIST[Math.floor(Math.random() * FINISH_THE_LYRICS_LIST.length)];
        
        return {
            type: GameMode.FINISH_THE_LYRICS,
            line: selection.line,
            answer: selection.answer,
            song: selection.song
        };
    }

    case GameMode.WHO_AM_I: {
        const available = WHO_AM_I_LIST.filter(item => !history.includes(item.riddle));
        const selection = available.length > 0
            ? available[Math.floor(Math.random() * available.length)]
            : WHO_AM_I_LIST[Math.floor(Math.random() * WHO_AM_I_LIST.length)];
        
        return {
            type: GameMode.WHO_AM_I,
            riddle: selection.riddle,
            answer: selection.answer
        };
    }

    default:
      return { type: GameMode.MOST_LIKELY_TO, text: "Game content error." };
  }
}

function getUniqueContent<T>(
  list: string[], 
  history: string[], 
  formatter: (item: string) => T
): T {
  const available = list.filter(item => !history.includes(item));
  const text = available.length > 0 
    ? available[Math.floor(Math.random() * available.length)] 
    : list[Math.floor(Math.random() * list.length)];
  
  return formatter(text);
}


// --- AI GENERATION LOGIC ---

async function generateFromAI(mode: GameMode, players: string[], previousContext: string[]): Promise<GameContent> {
  if (!API_KEY) throw new Error("No API Key");

  const contextStr = previousContext.slice(-5).join(" | ");
  
  let systemInstruction = "You are a party game host for Indian college students (21yo). Keep it fun, moderately spicy but safe, and engaging. No emojis in the output text.";
  let prompt = "";
  let schema = null;

  switch (mode) {
    case GameMode.MOST_LIKELY_TO:
      prompt = `Generate a 'Who is most likely to' statement.
      Topics: Future careers, social habits, funny personality traits.
      Avoid these recent topics: ${contextStr}.
      Output JSON with key 'text'.`;
      schema = {
        type: Type.OBJECT,
        properties: { text: { type: Type.STRING } },
        required: ['text']
      };
      break;

    case GameMode.TRUTH_OR_BLUFF:
      prompt = `Generate a first-person statement that sounds plausible but could be a lie.
      The player will read this and others have to guess if it's Truth or Bluff.
      Topics: Weird habits, college secrets, mild embarrassments.
      Avoid these recent topics: ${contextStr}.
      Output JSON with key 'statement'.`;
      schema = {
        type: Type.OBJECT,
        properties: { statement: { type: Type.STRING } },
        required: ['statement']
      };
      break;

    case GameMode.BOLLYWOOD_HINTS:
      prompt = `Generate a Bollywood movie name (mix of classics and modern) and exactly 3 one-word hints that describe it abstractly.
      Avoid these movies: ${contextStr}.
      Output JSON with keys 'movie' and 'hints' (array of 3 strings).`;
      schema = {
        type: Type.OBJECT,
        properties: {
          movie: { type: Type.STRING },
          hints: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['movie', 'hints']
      };
      break;

    case GameMode.TABOO:
      prompt = `Generate a Taboo card.
      Target word: A common object, activity, or concept for college students.
      Forbidden words: 5 words that are commonly associated with the target and cannot be used.
      Output JSON with key 'word' and 'forbidden' (array of 5 strings).`;
      schema = {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          forbidden: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['word', 'forbidden']
      };
      break;

    case GameMode.IMPOSTER:
      prompt = `Generate a category, a main word, and an imposter word for the game 'Who is the Imposter'.
      Category: Broad (e.g. Fruits, Sports, Tech Brands).
      Word: A specific item in that category (e.g. Apple).
      ImposterWord: A different item in the same category that is somewhat similar (e.g. Pear).
      Output JSON with keys 'category', 'word', and 'imposterWord'.`;
      schema = {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          word: { type: Type.STRING },
          imposterWord: { type: Type.STRING }
        },
        required: ['category', 'word', 'imposterWord']
      };
      break;

    default:
        // Fallback or generic handling
        prompt = "Generate a fun party game prompt.";
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: schema || undefined,
      temperature: 1.2 // High creativity
    }
  });

  const json = JSON.parse(response.text || "{}");

  switch (mode) {
    case GameMode.MOST_LIKELY_TO:
      return { type: GameMode.MOST_LIKELY_TO, text: json.text };
    case GameMode.TRUTH_OR_BLUFF:
      return { type: GameMode.TRUTH_OR_BLUFF, statement: json.statement };
    case GameMode.BOLLYWOOD_HINTS:
      return { type: GameMode.BOLLYWOOD_HINTS, movie: json.movie, hints: json.hints };
    case GameMode.TABOO:
      return { type: GameMode.TABOO, word: json.word, forbidden: json.forbidden };
    case GameMode.IMPOSTER:
      return { type: GameMode.IMPOSTER, category: json.category, word: json.word, imposterWord: json.imposterWord };
    default:
        throw new Error("Invalid mode for AI generation");
  }
}
