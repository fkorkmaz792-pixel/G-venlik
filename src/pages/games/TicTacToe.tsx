import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';

export default function TicTacToe() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);

  const calculateWinner = (squares: any[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
      [0, 4, 8], [2, 4, 6]             // diagonals
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const handleClick = (i: number) => {
    if (calculateWinner(board) || board[i]) return;
    const newBoard = [...board];
    newBoard[i] = xIsNext ? 'X' : 'O';
    setBoard(newBoard);
    setXIsNext(!xIsNext);
  };

  const winner = calculateWinner(board);
  const isDraw = !winner && board.every(s => s !== null);
  const status = winner 
    ? `Kazanan: ${winner}` 
    : isDraw 
      ? 'Berabere!' 
      : `Sıradaki Oyuncu: ${xIsNext ? 'X' : 'O'}`;

  return (
    <div className="flex flex-col items-center justify-center space-y-8 p-4">
      <h2 className="text-2xl font-bold text-gray-800">XOX Oyunu</h2>
      
      <div className="text-lg font-medium text-gray-600 bg-white px-6 py-2 rounded-full shadow-sm">
        {status}
      </div>

      <div className="grid grid-cols-3 gap-2 bg-gray-200 p-2 rounded-2xl shadow-inner">
        {board.map((square, i) => (
          <button
            key={i}
            className={`w-24 h-24 bg-white rounded-xl text-5xl font-bold flex items-center justify-center shadow-sm transition-colors hover:bg-gray-50 ${square === 'X' ? 'text-blue-500' : 'text-red-500'}`}
            onClick={() => handleClick(i)}
          >
            {square}
          </button>
        ))}
      </div>

      <button 
        onClick={() => { setBoard(Array(9).fill(null)); setXIsNext(true); }}
        className="flex items-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-xl font-medium hover:bg-gray-700 transition-colors"
      >
        <RefreshCw size={20} /> Yeniden Başlat
      </button>
    </div>
  );
}
