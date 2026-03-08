import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

const ICONS = ['🍎', '🍌', '🍇', '🍉', '🍓', '🍒', '🍍', '🥝'];

export default function MemoryGame() {
  const [cards, setCards] = useState<any[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [solved, setSolved] = useState<number[]>([]);
  const [disabled, setDisabled] = useState(false);
  const [moves, setMoves] = useState(0);

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    const shuffled = [...ICONS, ...ICONS]
      .sort(() => Math.random() - 0.5)
      .map((icon, id) => ({ id, icon }));
    setCards(shuffled);
    setFlipped([]);
    setSolved([]);
    setMoves(0);
  };

  const handleClick = (id: number) => {
    if (disabled || flipped.includes(id) || solved.includes(id)) return;

    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setDisabled(true);
      setMoves(m => m + 1);
      
      const [first, second] = newFlipped;
      if (cards[first].icon === cards[second].icon) {
        setSolved([...solved, first, second]);
        setFlipped([]);
        setDisabled(false);
      } else {
        setTimeout(() => {
          setFlipped([]);
          setDisabled(false);
        }, 1000);
      }
    }
  };

  const isGameOver = solved.length === cards.length && cards.length > 0;

  return (
    <div className="flex flex-col items-center space-y-6 p-4">
      <h2 className="text-2xl font-bold text-gray-800">Hafıza Oyunu</h2>
      
      <div className="flex justify-between w-full max-w-xs text-gray-600 font-medium">
        <span>Hamle: {moves}</span>
        {isGameOver && <span className="text-green-600 font-bold">Tebrikler!</span>}
      </div>

      <div className="grid grid-cols-4 gap-3">
        {cards.map((card, i) => {
          const isFlipped = flipped.includes(i) || solved.includes(i);
          return (
            <button
              key={i}
              onClick={() => handleClick(i)}
              className={`w-16 h-16 sm:w-20 sm:h-20 text-3xl flex items-center justify-center rounded-xl shadow-sm transition-all duration-300 transform ${
                isFlipped 
                  ? 'bg-white rotate-y-180' 
                  : 'bg-indigo-500 hover:bg-indigo-600'
              }`}
            >
              {isFlipped ? card.icon : ''}
            </button>
          );
        })}
      </div>

      <button 
        onClick={initializeGame}
        className="flex items-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-xl font-medium hover:bg-gray-700 transition-colors mt-8"
      >
        <RefreshCw size={20} /> Yeniden Başlat
      </button>
    </div>
  );
}
