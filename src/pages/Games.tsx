import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, X } from 'lucide-react';

const HTML5_GAMES = [
  { id: 1, title: 'XOX', type: 'internal', path: '/games/tictactoe', icon: '❌', color: 'bg-purple-100 text-purple-600' },
  { id: 2, title: 'Hafıza', type: 'internal', path: '/games/memory', icon: '🧠', color: 'bg-indigo-100 text-indigo-600' },
  { id: 3, title: 'Yılan', type: 'internal', path: '/games/snake', icon: '🐍', color: 'bg-green-100 text-green-600' },
];

export default function Games() {
  const [activeGame, setActiveGame] = useState<string | null>(null);

  return (
    <div className="space-y-6 pb-10">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Oyunlar</h2>
        <p className="text-gray-500 dark:text-gray-400">Nöbet molalarında vakit geçirmek için çevrimdışı mini oyunlar.</p>
      </div>
      
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
        {HTML5_GAMES.map(game => (
          <Link key={game.id} to={game.path} className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-2 ${game.color}`}>
              {game.icon}
            </div>
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 text-center truncate w-full">{game.title}</span>
          </Link>
        ))}
      </div>

      {/* Game Modal */}
      {activeGame && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
            <span className="font-bold flex items-center gap-2"><Gamepad2 size={20}/> Oyun Modu</span>
            <button onClick={() => setActiveGame(null)} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700">
              <X size={20} />
            </button>
          </div>
          <iframe 
            src={activeGame} 
            className="w-full flex-1 border-none bg-white"
            title="Game"
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        </div>
      )}
    </div>
  );
}
