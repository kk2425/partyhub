
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { GameMode, GAME_MODE_DETAILS } from '../types';
import Button from '../components/Button';
import { Copy, Check, Crown } from 'lucide-react';
import toast from 'react-hot-toast';

const Lobby: React.FC = () => {
  const { state, currentPlayerId, startGame, leaveRoom } = useGame();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  // If no state, redirect home
  React.useEffect(() => {
    if (!state) navigate('/');
  }, [state, navigate]);

  if (!state) return null;

  const isHost = state.players.find(p => p.id === currentPlayerId)?.isHost;

  const copyCode = () => {
    navigator.clipboard.writeText(state.roomCode);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStart = (mode: GameMode) => {
    startGame(mode);
    navigate('/game');
  };

  // Redirect to game if status changes (for non-hosts)
  React.useEffect(() => {
    if (state.status === 'PLAYING') {
        navigate('/game');
    }
  }, [state.status, navigate]);

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full pb-20">
      <div className="grid md:grid-cols-2 gap-8 h-full">
        
        {/* Left Col: Room Info & Players */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl text-center">
            <p className="text-slate-400 text-sm mb-2 uppercase tracking-wider">Room Code</p>
            <div 
                onClick={copyCode}
                className="text-6xl md:text-7xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 cursor-pointer hover:scale-105 transition-transform flex items-center justify-center gap-3 py-4"
            >
                {state.roomCode}
                {copied ? <Check size={32} className="text-green-400"/> : <Copy size={32} className="text-slate-600"/>}
            </div>
            <p className="text-xs text-slate-500">Tap to copy</p>
          </div>

          <div className="glass-panel p-6 rounded-2xl flex-grow min-h-[300px]">
            <h3 className="text-xl font-bold mb-4 flex items-center justify-between">
                <span>Players</span>
                <span className="bg-indigo-600/30 text-indigo-300 text-sm px-3 py-1 rounded-full">{state.players.length}</span>
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {state.players.map(player => (
                <div key={player.id} className="flex flex-col items-center p-3 bg-white/5 rounded-xl border border-white/5 animate-fade-in-up">
                  <div className="text-4xl mb-2 relative">
                    {player.avatar}
                    {player.isHost && <Crown size={16} className="absolute -top-1 -right-1 text-yellow-400 fill-yellow-400"/>}
                  </div>
                  <div className="font-bold text-sm truncate w-full text-center">{player.name}</div>
                </div>
              ))}
              {Array.from({ length: Math.max(0, 3 - state.players.length) }).map((_, i) => (
                 <div key={`empty-${i}`} className="flex flex-col items-center p-3 border-2 border-dashed border-white/10 rounded-xl opacity-30">
                    <div className="w-10 h-10 rounded-full bg-white/10 mb-2"></div>
                    <div className="h-4 w-12 bg-white/10 rounded"></div>
                 </div>
              ))}
            </div>
          </div>
          
          <Button variant="secondary" onClick={() => { leaveRoom(); navigate('/'); }} className="w-full">
            Leave Room
          </Button>
        </div>

        {/* Right Col: Game Selection (Host Only) or Waiting msg */}
        <div className="flex flex-col justify-center">
          {isHost ? (
            <div className="space-y-4">
              <h3 className="text-2xl font-bold mb-2">Select a Game Mode</h3>
              <div className="grid gap-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                {Object.values(GameMode).map((mode) => {
                  const details = GAME_MODE_DETAILS[mode];
                  return (
                    <button
                      key={mode}
                      onClick={() => handleStart(mode)}
                      className={`relative p-4 rounded-xl text-left transition-all hover:scale-[1.02] active:scale-95 group overflow-hidden`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-r ${details.color} opacity-20 group-hover:opacity-30 transition-opacity`}></div>
                      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${details.color}`}></div>
                      <div className="relative z-10 flex items-start gap-4">
                        <div className="text-3xl bg-white/10 p-2 rounded-lg">{details.icon}</div>
                        <div>
                          <h4 className="font-bold text-lg">{details.label}</h4>
                          <p className="text-sm text-slate-300 leading-tight">{details.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center p-8 space-y-6">
                <div className="inline-block p-6 rounded-full bg-white/5 animate-pulse">
                    <span className="text-6xl">⏳</span>
                </div>
                <h3 className="text-2xl font-bold">Waiting for Host...</h3>
                <p className="text-slate-400">The host is selecting a game mode. Prepare yourself!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Lobby;
