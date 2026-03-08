import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const INITIAL_FOOD = { x: 5, y: 5 };

export default function Snake() {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState(INITIAL_FOOD);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const moveSnake = useCallback(() => {
    if (gameOver || isPaused) return;

    setSnake(prevSnake => {
      const newHead = {
        x: prevSnake[0].x + direction.x,
        y: prevSnake[0].y + direction.y
      };

      // Check collision with walls
      if (
        newHead.x < 0 ||
        newHead.x >= GRID_SIZE ||
        newHead.y < 0 ||
        newHead.y >= GRID_SIZE
      ) {
        setGameOver(true);
        return prevSnake;
      }

      // Check collision with self
      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setGameOver(true);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check food collision
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        setFood({
          x: Math.floor(Math.random() * GRID_SIZE),
          y: Math.floor(Math.random() * GRID_SIZE)
        });
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, gameOver, isPaused]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          if (direction.y !== 1) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
          if (direction.y !== -1) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
          if (direction.x !== 1) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
          if (direction.x !== -1) setDirection({ x: 1, y: 0 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [direction]);

  useEffect(() => {
    const interval = setInterval(moveSnake, 150);
    return () => clearInterval(interval);
  }, [moveSnake]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood(INITIAL_FOOD);
    setGameOver(false);
    setScore(0);
    setIsPaused(false);
  };

  const handleControlClick = (newDir: {x: number, y: number}) => {
    if (direction.x === -newDir.x && direction.y === -newDir.y) return; // Prevent reversing
    setDirection(newDir);
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6 p-4">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Yılan Oyunu</h2>
      
      <div className="flex justify-between w-full max-w-[300px] px-4">
        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">Skor: {score}</div>
        <div className="text-lg font-bold text-red-500">{gameOver ? 'Oyun Bitti!' : ''}</div>
      </div>

      <div 
        className="bg-gray-200 dark:bg-gray-800 border-4 border-gray-300 dark:border-gray-700 rounded-lg relative"
        style={{ width: 300, height: 300 }}
      >
        {snake.map((segment, i) => (
          <div
            key={i}
            className="absolute bg-green-500 rounded-sm"
            style={{
              left: `${(segment.x / GRID_SIZE) * 100}%`,
              top: `${(segment.y / GRID_SIZE) * 100}%`,
              width: `${100 / GRID_SIZE}%`,
              height: `${100 / GRID_SIZE}%`
            }}
          />
        ))}
        <div
          className="absolute bg-red-500 rounded-full"
          style={{
            left: `${(food.x / GRID_SIZE) * 100}%`,
            top: `${(food.y / GRID_SIZE) * 100}%`,
            width: `${100 / GRID_SIZE}%`,
            height: `${100 / GRID_SIZE}%`
          }}
        />
      </div>

      {/* On-screen controls for mobile */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        <div />
        <button onClick={() => handleControlClick({x: 0, y: -1})} className="p-4 bg-gray-200 dark:bg-gray-700 rounded-xl active:bg-gray-300 dark:active:bg-gray-600 flex justify-center"><ArrowUp className="text-gray-700 dark:text-gray-200" /></button>
        <div />
        <button onClick={() => handleControlClick({x: -1, y: 0})} className="p-4 bg-gray-200 dark:bg-gray-700 rounded-xl active:bg-gray-300 dark:active:bg-gray-600 flex justify-center"><ArrowLeft className="text-gray-700 dark:text-gray-200" /></button>
        <button onClick={() => handleControlClick({x: 0, y: 1})} className="p-4 bg-gray-200 dark:bg-gray-700 rounded-xl active:bg-gray-300 dark:active:bg-gray-600 flex justify-center"><ArrowDown className="text-gray-700 dark:text-gray-200" /></button>
        <button onClick={() => handleControlClick({x: 1, y: 0})} className="p-4 bg-gray-200 dark:bg-gray-700 rounded-xl active:bg-gray-300 dark:active:bg-gray-600 flex justify-center"><ArrowRight className="text-gray-700 dark:text-gray-200" /></button>
      </div>

      <div className="flex gap-4">
        <button 
          onClick={() => setIsPaused(!isPaused)}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          {isPaused ? 'Devam Et' : 'Duraklat'}
        </button>
        <button 
          onClick={resetGame}
          className="flex items-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-xl font-medium hover:bg-gray-700 transition-colors"
        >
          <RefreshCw size={20} /> Yeniden Başlat
        </button>
      </div>
    </div>
  );
}
