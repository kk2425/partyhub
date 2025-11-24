
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { GameMode, GameContent } from '../types';
import Button from '../components/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle, XCircle, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';

const GameRoom: React.FC = () => {
  const { state, currentPlayerId, nextRound, endGame, submitCategoryWord } = useGame();
  const navigate = useNavigate();
  const [showAnswer, setShowAnswer] = useState(false);
  const [timer, setTimer] = useState<number | null>(null);
  
  // Category Storm Specific State
  const [categoryInput, setCategoryInput] = useState("");
  const [inputStatus, setInputStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  // Watch for game finish
  useEffect(() => {
    if (state?.status === 'FINISHED') {
        navigate('/game-over');
    }
  }, [state?.status, navigate]);

  // Reset local state when content changes
  useEffect(() => {
    setShowAnswer(false);
    setCategoryInput("");
    setInputStatus('idle');
    
    // Set timers based on mode
    if (state?.currentContent?.type === GameMode.RAPID_FIRE) {
        setTimer(5);
    } else if (state?.currentContent?.type === GameMode.CATEGORY_STORM) {
        setTimer(60);
    } else if (state?.currentContent?.type === GameMode.FINISH_THE_LYRICS) {
        setTimer(45);
    } else {
        setTimer(null);
    }
  }, [state?.currentContent, state?.currentRound]);

  // Countdown timer logic
  useEffect(() => {
    if (timer === null || timer <= 0) return;
    
    const interval = setInterval(() => {
        setTimer(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  if (!state || !state.currentContent) {
    return (
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
        </div>
    );
  }

  const isHost = state.players.find(p => p.id === currentPlayerId)?.isHost;
  const content = state.currentContent;

  const handleNext = () => {
    setShowAnswer(false);
    nextRound();
  };

  const handleEnd = () => {
    endGame();
    // Navigation is handled by useEffect
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!categoryInput.trim()) return;
      if (!timer || timer <= 0) {
          toast.error("Time's up!");
          return;
      }

      // Check client-side duplicate first for instant feedback
      const isDuplicate = state.categorySubmissions?.some(s => s.word === categoryInput.trim().toLowerCase());
      if (isDuplicate) {
          setInputStatus('error');
          toast.error("Already taken!");
          setCategoryInput("");
          return;
      }

      const wordToSend = categoryInput;
      setCategoryInput(""); // clear immediately
      
      const result = await submitCategoryWord(wordToSend);
      if (result.success) {
          setInputStatus('success');
          setTimeout(() => setInputStatus('idle'), 1000);
      } else {
          setInputStatus('error');
          toast.error(result.message || "Failed");
      }
  };

  // Render content based on game mode
  const renderContent = () => {
    switch (content.type) {
        case GameMode.MOST_LIKELY_TO:
            return (
                <div className="text-center space-y-8 animate-fade-in-up">
                    <div className="text-xl text-cyan-400 uppercase tracking-widest font-bold">Who is most likely to...</div>
                    <div className="text-3xl md:text-5xl font-bold leading-tight max-w-2xl mx-auto">
                        "{content.text}"
                    </div>
                    <div className="text-slate-400 text-lg">
                        <span className="text-2xl block mb-2">👉</span>
                        On the count of 3, point to the person!
                    </div>
                </div>
            );

        case GameMode.TRUTH_OR_BLUFF:
            return (
                <div className="text-center space-y-8 animate-fade-in-up max-w-2xl mx-auto">
                    <div className="text-xl text-emerald-400 uppercase tracking-widest font-bold">Truth or Bluff?</div>
                    
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-3xl border border-emerald-500/30 shadow-2xl shadow-emerald-900/20">
                        <p className="text-2xl md:text-4xl font-medium leading-relaxed font-serif italic text-emerald-50">
                            "{content.statement}"
                        </p>
                    </div>

                    <div className="bg-white/5 p-6 rounded-xl text-left space-y-3 border border-white/10">
                        <h4 className="font-bold text-emerald-400 border-b border-white/10 pb-2 mb-2">Instructions</h4>
                        <ol className="list-decimal list-inside text-slate-300 space-y-2 text-sm md:text-base">
                            <li>Read the statement aloud to the group.</li>
                            <li>Tell them it is <strong>TRUE</strong> (tell a short story) OR <strong>BLUFF</strong> (make up a lie).</li>
                            <li>The group votes on whether they believe you.</li>
                        </ol>
                    </div>
                </div>
            );
        
        case GameMode.BOLLYWOOD_HINTS:
            return (
                <div className="text-center space-y-8 animate-fade-in-up max-w-2xl mx-auto">
                    <div className="text-xl text-yellow-400 uppercase tracking-widest font-bold">Guess the Movie 🎬</div>
                    
                    <div className="flex flex-col gap-4">
                        <div className="text-slate-400 text-sm uppercase tracking-wider">Hints</div>
                        <div className="flex flex-wrap justify-center gap-4">
                            {content.hints.map((hint, i) => (
                                <div key={i} className="bg-white/10 backdrop-blur-md px-8 py-6 rounded-2xl text-2xl md:text-3xl font-bold border border-white/20 shadow-lg min-w-[150px]">
                                    {hint}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="h-32 flex items-center justify-center mt-8">
                        {!showAnswer ? (
                             <div className="text-slate-500 italic flex flex-col items-center gap-2">
                                <span className="text-4xl">🫣</span>
                                <span>No peaking! Guess first.</span>
                             </div>
                        ) : (
                            <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-orange-300 to-yellow-200 animate-scale-in drop-shadow-2xl">
                                {content.movie}
                            </div>
                        )}
                    </div>
                    
                    {isHost && !showAnswer && (
                        <div className="flex justify-center">
                            <Button variant="secondary" onClick={() => setShowAnswer(true)} className="mx-auto">
                                Reveal Movie
                            </Button>
                        </div>
                    )}
                </div>
            );

        case GameMode.TABOO:
            const speakerIndex = (state.currentRound - 1) % state.players.length;
            const speaker = state.players[speakerIndex];
            // Safe check if speaker is undefined (should not happen in normal game flow)
            if (!speaker) return <div>Loading player...</div>;
            
            const isSpeaker = speaker.id === currentPlayerId;

            return (
                <div className="text-center space-y-8 animate-fade-in-up max-w-md mx-auto">
                    <div className="text-xl text-purple-400 uppercase tracking-widest font-bold">Taboo 🙊</div>
                    
                    {isSpeaker ? (
                        <div className="bg-white text-slate-900 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-4 bg-purple-500"></div>
                            <h3 className="text-4xl font-black mb-6 uppercase tracking-tight border-b-2 border-slate-200 pb-4">
                                {content.word}
                            </h3>
                            <div className="space-y-3">
                                <p className="text-xs text-slate-500 uppercase font-bold">Do not say:</p>
                                {content.forbidden.map((word, i) => (
                                    <div key={i} className="font-bold text-xl text-red-600 bg-red-50 py-1 rounded">
                                        {word}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white/5 p-8 rounded-3xl border border-white/10 flex flex-col items-center gap-4">
                            <div className="text-6xl animate-bounce">👂</div>
                            <h3 className="text-2xl font-bold">Listen to {speaker.name}!</h3>
                            <p className="text-slate-400">They are describing the word. Guess it fast!</p>
                        </div>
                    )}
                </div>
            );

        case GameMode.IMPOSTER:
            // Deterministic imposter selection based on round and room code
            const hash = state.roomCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + state.currentRound;
            const imposterIndex = hash % state.players.length;
            const imposterPlayer = state.players[imposterIndex];
            if (!imposterPlayer) return <div>Loading...</div>;

            const isImposter = imposterPlayer.id === currentPlayerId;
            const myWord = isImposter ? content.imposterWord : content.word;

            return (
                 <div className="text-center space-y-8 animate-fade-in-up max-w-md mx-auto">
                    <div className="text-xl text-red-400 uppercase tracking-widest font-bold">Who is the Imposter? 🕵️</div>
                    
                    <div className="bg-slate-800 p-8 rounded-3xl border border-white/10 shadow-2xl">
                         <p className="text-sm text-slate-400 uppercase mb-2">Category</p>
                         <h3 className="text-2xl font-bold text-white mb-8">{content.category}</h3>
                         
                         <div className="p-6 bg-black/40 rounded-xl">
                            <p className="text-sm text-slate-400 mb-2">Your Secret Word</p>
                            <div className={`font-bold text-3xl ${isImposter ? 'text-orange-400' : 'text-green-400'}`}>
                                {myWord}
                            </div>
                         </div>
                    </div>
                    
                    <div className="p-4 bg-white/5 rounded-xl text-sm text-slate-300">
                        <p>Describe your word without being too obvious.</p>
                        <p className="mt-2 text-xs text-slate-500">One person has a slightly different word...</p>
                    </div>
                </div>
            );
            
        case GameMode.RAPID_FIRE:
            return (
                 <div className="text-center space-y-8 animate-fade-in-up">
                    <div className="text-xl text-red-500 uppercase tracking-widest font-bold flex items-center justify-center gap-2">
                        <span className="animate-pulse">⚡</span> Rapid Fire
                    </div>
                    
                    <div className="text-4xl md:text-6xl font-bold leading-tight max-w-3xl mx-auto">
                        "{content.question}"
                    </div>
                    
                    <div className={`text-9xl font-black font-mono my-8 transition-colors ${
                        (timer || 0) <= 2 ? 'text-red-500 scale-110' : 'text-white'
                    }`}>
                        {timer}
                    </div>
                    
                    <p className="text-slate-400">Answer before the timer hits zero!</p>
                </div>
            );

        case GameMode.FINISH_THE_LYRICS:
            return (
                <div className="text-center space-y-8 animate-fade-in-up max-w-2xl mx-auto">
                    <div className="text-xl text-pink-400 uppercase tracking-widest font-bold">Finish the Lyrics 🎵</div>
                    
                    <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 p-8 rounded-3xl border border-pink-500/20">
                        <p className="text-3xl md:text-4xl font-serif italic text-pink-100 leading-normal">
                            "{content.line}"
                        </p>
                    </div>

                    <div className={`text-6xl font-black font-mono my-4 transition-colors ${
                        (timer || 0) <= 10 ? 'text-red-500 scale-110' : 'text-pink-200'
                    }`}>
                        {timer}
                    </div>

                    {!showAnswer ? (
                         <div className="h-32 flex flex-col items-center justify-center gap-4">
                            <div className="w-16 h-1 bg-white/20 rounded-full animate-pulse"></div>
                            <div className="w-24 h-1 bg-white/20 rounded-full animate-pulse delay-75"></div>
                             <p className="text-slate-400 text-sm">Sing the next line...</p>
                         </div>
                    ) : (
                        <div className="space-y-4 animate-scale-in">
                            <div className="text-2xl md:text-3xl font-bold text-white bg-white/10 p-6 rounded-xl inline-block">
                                {content.answer}
                            </div>
                            <div className="text-pink-300 font-bold">
                                💿 {content.song}
                            </div>
                        </div>
                    )}
                    
                    {isHost && !showAnswer && (
                        <div className="flex justify-center">
                            <Button variant="secondary" onClick={() => setShowAnswer(true)} className="mx-auto">
                                Reveal Lyrics
                            </Button>
                        </div>
                    )}
                </div>
            );
            
        case GameMode.CATEGORY_STORM:
            const roundOver = (timer || 0) === 0;
            const mySubmissions = state.categorySubmissions?.filter(s => s.playerId === currentPlayerId) || [];
            
            // Calculate round leaderboard
            const roundStats = state.players.map(p => {
                const subs = state.categorySubmissions?.filter(s => s.playerId === p.id) || [];
                const points = subs.reduce((acc, curr) => acc + curr.points, 0);
                return { ...p, roundPoints: points, wordCount: subs.length };
            }).sort((a, b) => b.roundPoints - a.roundPoints);

            if (roundOver) {
                return (
                     <div className="text-center space-y-6 animate-fade-in-up w-full max-w-md mx-auto">
                        <h2 className="text-3xl font-bold text-blue-300 uppercase tracking-widest">Time's Up!</h2>
                        
                        <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/10">
                            <div className="bg-blue-600/20 p-4 border-b border-white/10">
                                <h3 className="font-bold flex items-center justify-center gap-2"><Trophy size={18}/> Round Results</h3>
                            </div>
                            <div className="max-h-[50vh] overflow-y-auto">
                                {roundStats.map((p, i) => (
                                    <div key={p.id} className="flex items-center justify-between p-4 border-b border-white/5 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-slate-500 font-bold text-sm">#{i+1}</span>
                                            <div className="text-2xl">{p.avatar}</div>
                                            <div className="text-left">
                                                <div className="font-bold text-sm">{p.name}</div>
                                                <div className="text-xs text-slate-400">{p.wordCount} words</div>
                                            </div>
                                        </div>
                                        <div className="font-bold text-blue-400">+{p.roundPoints}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                     </div>
                );
            }

            return (
                <div className="text-center space-y-8 animate-fade-in-up w-full max-w-md mx-auto">
                    <div className="flex justify-between items-start">
                        <div className="text-left">
                            <div className="text-xs text-blue-400 uppercase tracking-widest font-bold">Category</div>
                            <div className="text-2xl md:text-3xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-cyan-200 leading-tight">
                                {content.category}
                            </div>
                        </div>
                        <div className="relative w-16 h-16 flex-shrink-0">
                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                                <circle cx="32" cy="32" r="28" stroke="rgba(255,255,255,0.1)" strokeWidth="4" fill="none" />
                                <circle 
                                    cx="32" cy="32" r="28" 
                                    stroke={ (timer || 0) < 10 ? '#ef4444' : '#3b82f6' } 
                                    strokeWidth="4" fill="none" 
                                    strokeDasharray={175}
                                    strokeDashoffset={175 - (175 * (timer || 0)) / 60}
                                    className="transition-all duration-1000 linear"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center font-mono font-bold">{timer}</div>
                        </div>
                    </div>
                    
                    {/* Input Area */}
                    <div className="relative">
                        <form onSubmit={handleCategorySubmit} className="relative z-10">
                            <input 
                                type="text" 
                                value={categoryInput}
                                onChange={(e) => setCategoryInput(e.target.value)}
                                placeholder="Type a word..."
                                className={`w-full bg-slate-800/80 backdrop-blur-md border-2 rounded-xl px-4 py-4 pr-12 text-white focus:outline-none transition-all ${
                                    inputStatus === 'error' ? 'border-red-500 animate-shake' : 
                                    inputStatus === 'success' ? 'border-green-500' : 
                                    'border-white/10 focus:border-blue-500'
                                }`}
                                autoFocus
                            />
                            <button 
                                type="submit" 
                                className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition-colors"
                            >
                                <Send size={20} />
                            </button>
                        </form>
                    </div>

                    {/* Feedback / Cloud */}
                    {isHost ? (
                         <div className="bg-white/5 rounded-2xl p-4 min-h-[200px] flex flex-wrap gap-2 content-start">
                            <p className="w-full text-xs text-slate-500 text-center uppercase mb-2">Live Submissions</p>
                            <AnimatePresence>
                                {(state.categorySubmissions || []).slice().reverse().map((sub, i) => {
                                    const p = state.players.find(pl => pl.id === sub.playerId);
                                    return (
                                        <motion.div 
                                            key={`${sub.word}-${sub.timestamp}`}
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="bg-white/10 px-3 py-1 rounded-full text-sm flex items-center gap-2 border border-white/10"
                                        >
                                            <span>{p?.avatar}</span>
                                            <span className="font-bold">{sub.displayWord}</span>
                                            <span className="text-xs text-blue-300">+{sub.points}</span>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                         </div>
                    ) : (
                        <div className="bg-white/5 rounded-2xl p-4 min-h-[200px]">
                            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                                <span className="text-xs text-slate-400 uppercase">My Words</span>
                                <span className="font-bold text-blue-400">{mySubmissions.length} words</span>
                            </div>
                            <div className="flex flex-col-reverse gap-2">
                                {mySubmissions.map((sub, i) => (
                                    <div key={i} className="flex justify-between items-center text-sm">
                                        <span>{sub.displayWord}</span>
                                        <span className="text-green-400 font-mono">+{sub.points}</span>
                                    </div>
                                ))}
                                {mySubmissions.length === 0 && (
                                    <p className="text-slate-500 text-sm text-center py-4">Start typing! No duplicates allowed.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            );
            
        case GameMode.WHO_AM_I:
            return (
                 <div className="text-center space-y-6 animate-fade-in-up max-w-xl mx-auto">
                    <div className="text-xl text-indigo-400 uppercase tracking-widest font-bold">Who Am I? ❓</div>
                    
                    <div className="bg-indigo-950/40 p-8 rounded-3xl border border-indigo-500/20 shadow-xl whitespace-pre-line text-lg md:text-xl leading-relaxed text-indigo-100 font-medium">
                        {content.riddle}
                    </div>

                     {!showAnswer ? (
                         <div className="h-24 flex items-center justify-center">
                             <p className="text-slate-500 italic">Thinking...</p>
                         </div>
                    ) : (
                        <div className="text-4xl font-bold text-white animate-scale-in p-6 bg-white/5 rounded-2xl border border-white/10">
                            {content.answer}
                        </div>
                    )}
                    
                    {isHost && !showAnswer && (
                        <div className="flex justify-center">
                            <Button variant="secondary" onClick={() => setShowAnswer(true)} className="mx-auto">
                                Reveal Answer
                            </Button>
                        </div>
                    )}
                </div>
            );

        default:
            return <div>Unknown Mode</div>;
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="bg-white/10 px-4 py-2 rounded-full text-sm font-bold backdrop-blur-md border border-white/10">
            Round {state.currentRound} / {state.totalRounds}
        </div>
        <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400 hidden sm:inline">Hosted by</span>
            <span className="font-bold text-indigo-300">{state.players.find(p => p.isHost)?.name}</span>
        </div>
      </div>

      {/* Main Game Area with padding for bottom bar */}
      <div className="flex-grow flex items-center justify-center relative w-full pb-32">
        {renderContent()}
      </div>

      {/* Host Controls - Sticky Footer on Mobile */}
      {isHost && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/90 backdrop-blur-xl border-t border-white/10 z-50 flex items-center justify-center gap-4 shadow-2xl pb-6 md:pb-4">
             <Button variant="danger" onClick={handleEnd} disabled={state.isLoadingContent} className="px-4">
                End
             </Button>
             <Button 
                onClick={handleNext} 
                isLoading={state.isLoadingContent}
                className="flex-grow max-w-sm text-lg py-4 shadow-xl shadow-indigo-500/20"
            >
                {state.currentRound >= state.totalRounds ? 'Finish Game' : 'Next Round →'}
             </Button>
        </div>
      )}
      
      {!isHost && (
         <div className="fixed bottom-8 left-0 right-0 text-center px-4">
            <div className="bg-black/40 backdrop-blur-md py-3 px-6 rounded-full inline-block border border-white/5 text-slate-400 animate-pulse">
                Waiting for host...
            </div>
         </div>
      )}
    </div>
  );
};

export default GameRoom;
