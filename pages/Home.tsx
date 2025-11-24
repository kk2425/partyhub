import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { AVATARS } from '../types';
import Button from '../components/Button';
import { User, Users, Play, Radio } from 'lucide-react';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { createRoom, joinRoom } = useGame();
  
  const [mode, setMode] = useState<'menu' | 'host' | 'join'>('menu');
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);

  const handleHost = () => {
    if (!name.trim()) return;
    createRoom(name, selectedAvatar);
    navigate('/lobby');
  };

  const handleJoin = () => {
    if (!name.trim() || !roomCode.trim()) return;
    const success = joinRoom(roomCode.toUpperCase(), name, selectedAvatar);
    if (success) {
      navigate('/lobby');
    }
  };

  if (mode === 'menu') {
    return (
      <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto w-full space-y-8 animate-fade-in-up">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Let's Get This <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">Party Started</span>
          </h2>
          <p className="text-slate-400 text-lg">
            Gather your friends (virtually or IRL) for AI-generated chaos.
          </p>
        </div>

        <div className="w-full grid gap-4">
          <button 
            onClick={() => setMode('host')}
            className="group relative p-6 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 text-left overflow-hidden border border-white/10"
          >
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2"><Play className="fill-white" size={20}/> Host a Room</h3>
                <p className="text-indigo-200 text-sm mt-1">Create a new game and invite friends</p>
              </div>
              <div className="bg-white/20 p-3 rounded-full">
                <Users size={24} />
              </div>
            </div>
          </button>

          <button 
            onClick={() => setMode('join')}
            className="group relative p-6 bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-left border border-white/10"
          >
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2"><Radio size={20}/> Join a Room</h3>
                <p className="text-slate-400 text-sm mt-1">Enter a code to join an existing game</p>
              </div>
              <div className="bg-slate-700 p-3 rounded-full">
                <User size={24} />
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Avatar Selection Component
  const AvatarGrid = () => (
    <div className="mb-6">
      <label className="text-sm text-slate-400 mb-2 block">Choose your vibe</label>
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mask-linear">
        {AVATARS.map(emoji => (
          <button
            key={emoji}
            onClick={() => setSelectedAvatar(emoji)}
            className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-transform ${
              selectedAvatar === emoji ? 'bg-indigo-600 scale-110 ring-2 ring-indigo-400' : 'bg-slate-800 hover:bg-slate-700'
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto w-full">
      <div className="w-full glass-panel p-8 rounded-3xl shadow-2xl animate-fade-in-up">
        <button 
          onClick={() => setMode('menu')} 
          className="text-slate-400 hover:text-white mb-6 text-sm flex items-center gap-1"
        >
          ← Back
        </button>
        
        <h2 className="text-2xl font-bold mb-6">
          {mode === 'host' ? 'Create a Room' : 'Join a Room'}
        </h2>

        <div className="space-y-6">
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Your Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Party Animal"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-600"
              maxLength={12}
            />
          </div>

          <AvatarGrid />

          {mode === 'join' && (
             <div>
                <label className="text-sm text-slate-400 mb-2 block">Room Code</label>
                <input 
                  type="text" 
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="ABCD"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-600 font-mono tracking-widest uppercase text-center text-lg"
                  maxLength={4}
                />
            </div>
          )}

          <Button 
            className="w-full"
            onClick={mode === 'host' ? handleHost : handleJoin}
            disabled={!name || (mode === 'join' && roomCode.length < 4)}
          >
            {mode === 'host' ? 'Create Room' : 'Enter Room'}
          </Button>
        </div>
      </div>
      
      {mode === 'host' && (
        <p className="mt-4 text-xs text-slate-500 max-w-xs text-center">
            Tip: You can simulate multiplayer by opening this app in a new tab and joining your own room code.
        </p>
      )}
    </div>
  );
};

export default Home;