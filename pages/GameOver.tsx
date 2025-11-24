import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import Button from '../components/Button';
import { Trophy, Medal, Crown, RotateCcw } from 'lucide-react';
import { GAME_MODE_DETAILS } from '../types';

const GameOver: React.FC = () => {
  const { state, currentPlayerId, returnToLobby } = useGame();
  const navigate = useNavigate();

  useEffect(() => {
    if (!state) {
        navigate('/');
    } else if (state.status === 'LOBBY') {
        navigate('/lobby');
    } else if (state.status === 'PLAYING') {
        navigate('/game');
    }
  }, [state, navigate]);

  if (!state) return null;

  const isHost = state.players.find(p => p.id === currentPlayerId)?.isHost;
  const sortedPlayers = [...state.players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];
  const modeDetails = state.currentMode ? GAME_MODE_DETAILS[state.currentMode] : null;

  return (
    <div className="flex flex-col items-center justify-center max-w-2xl mx-auto w-full animate-fade-in-up">
      {/* Header */}
      <div className="text-center mb-10 space-y-4">
        <div className="inline-block p-4 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 shadow-xl shadow-orange-500/20 mb-4 animate-bounce">
            <Trophy size={48} className="text-white fill-white" />
        </div>
        <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
          Game Over!
        </h2>
        <p className="text-slate-400 text-lg">
           {modeDetails?.label || "The Session"} has ended.
        </p>
      </div>

      {/* Leaderboard */}
      <div className="w-full glass-panel rounded-3xl overflow-hidden mb-8 shadow-2xl">
        <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-center">
            <h3 className="font-bold text-lg flex items-center gap-2">
                <Medal size={20} className="text-yellow-400"/> Scoreboard
            </h3>
            <span className="text-xs text-slate-400 uppercase tracking-widest">Final Results</span>
        </div>
        
        <div className="divide-y divide-white/5">
            {sortedPlayers.map((player, index) => (
                <div 
                    key={player.id} 
                    className={`flex items-center justify-between p-4 px-6 hover:bg-white/5 transition-colors ${index === 0 ? 'bg-gradient-to-r from-yellow-500/10 to-transparent' : ''}`}
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 flex items-center justify-center font-mono font-bold rounded-full ${
                            index === 0 ? 'bg-yellow-400 text-black' : 
                            index === 1 ? 'bg-slate-300 text-slate-900' : 
                            index === 2 ? 'bg-amber-600 text-white' : 
                            'text-slate-500'
                        }`}>
                            {index + 1}
                        </div>
                        <div className="text-3xl relative">
                            {player.avatar}
                            {index === 0 && <Crown size={16} className="absolute -top-2 -right-2 text-yellow-400 fill-yellow-400 animate-pulse"/>}
                        </div>
                        <div>
                            <div className={`font-bold ${index === 0 ? 'text-yellow-400' : 'text-white'}`}>
                                {player.name}
                            </div>
                            {index === 0 && <div className="text-xs text-yellow-500/80">MVP</div>}
                        </div>
                    </div>
                    <div className="font-mono text-xl font-bold text-slate-300">
                        {player.score} <span className="text-xs text-slate-500 font-sans font-normal">pts</span>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col w-full max-w-sm gap-4 text-center">
        {isHost ? (
            <Button onClick={returnToLobby} className="w-full">
                <RotateCcw size={20} /> Return to Lobby
            </Button>
        ) : (
            <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-slate-400 animate-pulse">
                Waiting for host to return to lobby...
            </div>
        )}
      </div>
    </div>
  );
};

export default GameOver;