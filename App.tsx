import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { GameProvider, useGame } from './context/GameContext';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import GameRoom from './pages/GameRoom';
import GameOver from './pages/GameOver';
import { Toaster } from 'react-hot-toast';
import { Sparkles } from 'lucide-react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-black text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none"></div>
      
      {/* Ambient background orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="relative z-10 container mx-auto px-4 py-6 min-h-screen flex flex-col">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-lg shadow-lg shadow-purple-500/30">
                <Sparkles size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-pink-200 neon-text">
              NUKKAD GAMES
            </h1>
          </div>
        </header>
        
        <main className="flex-grow flex flex-col">
          {children}
        </main>

        <footer className="mt-8 text-center text-slate-500 text-sm py-4">
           Powered by Google Gemini • Online Multiplayer Active
        </footer>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
    return (
        <Layout>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/lobby" element={<Lobby />} />
                <Route path="/game" element={<GameRoom />} />
                <Route path="/game-over" element={<GameOver />} />
            </Routes>
        </Layout>
    );
}

const App: React.FC = () => {
  return (
    <HashRouter>
      <GameProvider>
        <AppContent />
        <Toaster 
            position="top-center"
            toastOptions={{
                style: {
                    background: '#1e293b',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.1)'
                }
            }}
        />
      </GameProvider>
    </HashRouter>
  );
};

export default App;