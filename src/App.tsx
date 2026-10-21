import { useSnakeGame, Direction } from './hooks/useSnakeGame';
import { useSwipe } from './hooks/useSwipe';
import { useMemo } from 'react';

function App() {
  const {
    snake,
    food,
    direction,
    gameState,
    score,
    highScore,
    difficulty,
    lastEaten,
    gridSize,
    setDifficulty,
    changeDirection,
    startGame,
    togglePause,
    restartGame,
  } = useSnakeGame();

  const swipeRef = useSwipe({ onSwipe: (dir: Direction) => changeDirection(dir) });

  const grid = useMemo(() => {
    const cells: { key: string; type: 'empty' | 'snake-head' | 'snake-body' | 'food'; isHead?: boolean }[] = [];
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const key = `${x}-${y}`;
        const isHead = snake[0]?.x === x && snake[0]?.y === y;
        const isBody = !isHead && snake.some(s => s.x === x && s.y === y);
        const isFood = food.x === x && food.y === y;

        let type: 'empty' | 'snake-head' | 'snake-body' | 'food' = 'empty';
        if (isHead) type = 'snake-head';
        else if (isBody) type = 'snake-body';
        else if (isFood) type = 'food';

        cells.push({ key, type, isHead });
      }
    }
    return cells;
  }, [snake, food, gridSize]);

  const getRotation = () => {
    switch (direction) {
      case 'UP': return 'rotate(-90deg)';
      case 'DOWN': return 'rotate(90deg)';
      case 'LEFT': return 'rotate(180deg)';
      case 'RIGHT': return 'rotate(0deg)';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-4 select-none overflow-hidden">
      {/* Header */}
      <div className="w-full max-w-lg mb-4">
        <h1 className="text-3xl md:text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 mb-2">
          🐍 Snake Game
        </h1>

        {/* Score Display */}
        <div className="flex justify-between items-center mb-3 px-2">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm font-medium">Score</span>
            <span className={`text-2xl font-bold text-white transition-transform duration-200 ${lastEaten ? 'scale-125' : 'scale-100'}`}>
              {score}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm font-medium">Best</span>
            <span className="text-2xl font-bold text-yellow-400">
              {highScore}
            </span>
          </div>
        </div>

        {/* Difficulty Selector */}
        <div className="flex justify-center gap-2 mb-3">
          {(['easy', 'normal', 'hard'] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              disabled={gameState === 'playing' || gameState === 'paused'}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                difficulty === d
                  ? d === 'easy'
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                    : d === 'normal'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Game Board */}
      <div
        ref={swipeRef}
        className="relative w-full max-w-lg aspect-square rounded-xl overflow-hidden shadow-2xl shadow-black/50 border border-gray-700/50"
        style={{ touchAction: 'none' }}
      >
        {/* Grid Background */}
        <div
          className="absolute inset-0 grid"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            gridTemplateRows: `repeat(${gridSize}, 1fr)`,
          }}
        >
          {grid.map((cell) => (
            <div
              key={cell.key}
              className={`relative transition-all duration-75 ${
                cell.type === 'snake-head'
                  ? 'bg-green-400 rounded-sm shadow-md shadow-green-400/50 z-10 animate-snake-glow'
                  : cell.type === 'snake-body'
                  ? 'bg-green-500 rounded-sm'
                  : cell.type === 'food'
                  ? 'bg-red-400 rounded-full scale-90 animate-pulse-food shadow-md shadow-red-400/50'
                  : 'bg-gray-800/40'
              }`}
            >
              {cell.type === 'snake-head' && (
                <div
                  className="absolute inset-0 flex items-center justify-center text-[0.5rem] md:text-xs transition-transform duration-100"
                  style={{ transform: getRotation() }}
                >
                  <span className="opacity-80">▶</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Grid Lines Overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: `${100 / gridSize}% ${100 / gridSize}%`,
          }}
        />

        {/* Overlays */}
        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-20 animate-fade-in">
            <div className="text-6xl mb-4 animate-bounce">🐍</div>
            <h2 className="text-2xl font-bold text-white mb-2">Ready to Play?</h2>
            <p className="text-gray-300 text-sm mb-6 text-center px-4">
              Use arrow keys, WASD, or swipe to control
            </p>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-full shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105 transition-all duration-200"
            >
              Start Game
            </button>
          </div>
        )}

        {gameState === 'paused' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-20">
            <div className="text-5xl mb-4">⏸️</div>
            <h2 className="text-2xl font-bold text-white mb-6">Paused</h2>
            <button
              onClick={togglePause}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-full shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 transition-all duration-200"
            >
              Resume
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-20">
            <div className="text-5xl mb-4">💀</div>
            <h2 className="text-2xl font-bold text-white mb-1">Game Over!</h2>
            <p className="text-gray-300 mb-1">
              Score: <span className="text-green-400 font-bold">{score}</span>
            </p>
            {score >= highScore && score > 0 && (
              <p className="text-yellow-400 font-bold text-sm mb-3 animate-pulse">
                🏆 New High Score!
              </p>
            )}
            <button
              onClick={restartGame}
              className="mt-3 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-full shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105 transition-all duration-200"
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="w-full max-w-lg mt-4">
        {/* Action Buttons */}
        <div className="flex justify-center gap-3 mb-4">
          {gameState === 'playing' && (
            <button
              onClick={togglePause}
              className="px-5 py-2 bg-gray-700 text-gray-200 rounded-lg font-medium hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              <span>⏸</span> Pause
            </button>
          )}
          {(gameState === 'playing' || gameState === 'paused') && (
            <button
              onClick={restartGame}
              className="px-5 py-2 bg-gray-700 text-gray-200 rounded-lg font-medium hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              <span>🔄</span> Restart
            </button>
          )}
        </div>

        {/* Touch D-Pad for Mobile */}
        <div className="md:hidden flex flex-col items-center gap-1 mt-2">
          <button
            onTouchStart={(e) => { e.preventDefault(); changeDirection('UP'); }}
            className="w-14 h-14 bg-gray-700/80 rounded-xl flex items-center justify-center text-white text-2xl active:bg-gray-600 active:scale-95 transition-all shadow-lg border border-gray-600/50"
          >
            ↑
          </button>
          <div className="flex gap-1">
            <button
              onTouchStart={(e) => { e.preventDefault(); changeDirection('LEFT'); }}
              className="w-14 h-14 bg-gray-700/80 rounded-xl flex items-center justify-center text-white text-2xl active:bg-gray-600 active:scale-95 transition-all shadow-lg border border-gray-600/50"
            >
              ←
            </button>
            <div className="w-14 h-14" />
            <button
              onTouchStart={(e) => { e.preventDefault(); changeDirection('RIGHT'); }}
              className="w-14 h-14 bg-gray-700/80 rounded-xl flex items-center justify-center text-white text-2xl active:bg-gray-600 active:scale-95 transition-all shadow-lg border border-gray-600/50"
            >
              →
            </button>
          </div>
          <button
            onTouchStart={(e) => { e.preventDefault(); changeDirection('DOWN'); }}
            className="w-14 h-14 bg-gray-700/80 rounded-xl flex items-center justify-center text-white text-2xl active:bg-gray-600 active:scale-95 transition-all shadow-lg border border-gray-600/50"
          >
            ↓
          </button>
        </div>

        {/* Desktop Controls Hint */}
        <div className="hidden md:flex justify-center gap-4 text-gray-500 text-xs mt-2">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-gray-300 text-xs">↑↓←→</kbd> or
            <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-gray-300 text-xs">WASD</kbd> Move
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-gray-300 text-xs">Space</kbd> Pause
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;
