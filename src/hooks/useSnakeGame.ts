import { useState, useEffect, useCallback, useRef } from 'react';

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
export type Position = { x: number; y: number };
export type Difficulty = 'easy' | 'normal' | 'hard';
export type GameState = 'idle' | 'playing' | 'paused' | 'gameover';

const GRID_SIZE = 20;

const SPEED_MAP: Record<Difficulty, number> = {
  easy: 180,
  normal: 120,
  hard: 70,
};

const POINTS_MAP: Record<Difficulty, number> = {
  easy: 5,
  normal: 10,
  hard: 20,
};

function getRandomPosition(snake: Position[]): Position {
  let pos: Position;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some(s => s.x === pos.x && s.y === pos.y));
  return pos;
}

function getInitialSnake(): Position[] {
  const mid = Math.floor(GRID_SIZE / 2);
  return [
    { x: mid, y: mid },
    { x: mid - 1, y: mid },
    { x: mid - 2, y: mid },
  ];
}

export function useSnakeGame() {
  const [snake, setSnake] = useState<Position[]>(getInitialSnake());
  const [food, setFood] = useState<Position>(() => getRandomPosition(getInitialSnake()));
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [gameState, setGameState] = useState<GameState>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('snake-high-score');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [lastEaten, setLastEaten] = useState(false);

  const directionRef = useRef<Direction>('RIGHT');
  const gameStateRef = useRef<GameState>('idle');
  const snakeRef = useRef<Position[]>(getInitialSnake());
  const foodRef = useRef<Position>(food);

  useEffect(() => { directionRef.current = direction; }, [direction]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { snakeRef.current = snake; }, [snake]);
  useEffect(() => { foodRef.current = food; }, [food]);

  const moveSnake = useCallback(() => {
    if (gameStateRef.current !== 'playing') return;

    const currentSnake = [...snakeRef.current];
    const head = { ...currentSnake[0] };
    const dir = directionRef.current;

    switch (dir) {
      case 'UP': head.y -= 1; break;
      case 'DOWN': head.y += 1; break;
      case 'LEFT': head.x -= 1; break;
      case 'RIGHT': head.x += 1; break;
    }

    // Check wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      setGameState('gameover');
      return;
    }

    // Check self collision
    if (currentSnake.some(s => s.x === head.x && s.y === head.y)) {
      setGameState('gameover');
      return;
    }

    const newSnake = [head, ...currentSnake];
    const currentFood = foodRef.current;

    // Check food collision
    if (head.x === currentFood.x && head.y === currentFood.y) {
      const points = POINTS_MAP[difficulty];
      setScore(prev => {
        const newScore = prev + points;
        setHighScore(hs => {
          const newHs = Math.max(hs, newScore);
          localStorage.setItem('snake-high-score', String(newHs));
          return newHs;
        });
        return newScore;
      });
      setLastEaten(true);
      setTimeout(() => setLastEaten(false), 300);
      const newFood = getRandomPosition(newSnake);
      setFood(newFood);
      foodRef.current = newFood;
    } else {
      newSnake.pop();
    }

    setSnake(newSnake);
    snakeRef.current = newSnake;
  }, [difficulty]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const speed = SPEED_MAP[difficulty];
    const interval = setInterval(moveSnake, speed);
    return () => clearInterval(interval);
  }, [gameState, difficulty, moveSnake]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ') {
        if (gameStateRef.current === 'playing') {
          setGameState('paused');
        } else if (gameStateRef.current === 'paused') {
          setGameState('playing');
        }
        return;
      }

      if (gameStateRef.current !== 'playing') return;

      const currentDir = directionRef.current;
      let newDir: Direction | null = null;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (currentDir !== 'DOWN') newDir = 'UP';
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (currentDir !== 'UP') newDir = 'DOWN';
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (currentDir !== 'RIGHT') newDir = 'LEFT';
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (currentDir !== 'LEFT') newDir = 'RIGHT';
          break;
      }

      if (newDir) {
        setDirection(newDir);
        directionRef.current = newDir;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const changeDirection = useCallback((newDir: Direction) => {
    if (gameStateRef.current !== 'playing') return;
    const currentDir = directionRef.current;
    const opposites: Record<Direction, Direction> = {
      UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT'
    };
    if (newDir !== opposites[currentDir]) {
      setDirection(newDir);
      directionRef.current = newDir;
    }
  }, []);

  const startGame = useCallback(() => {
    const initialSnake = getInitialSnake();
    setSnake(initialSnake);
    snakeRef.current = initialSnake;
    setFood(getRandomPosition(initialSnake));
    setDirection('RIGHT');
    directionRef.current = 'RIGHT';
    setScore(0);
    setGameState('playing');
  }, []);

  const togglePause = useCallback(() => {
    if (gameStateRef.current === 'playing') {
      setGameState('paused');
    } else if (gameStateRef.current === 'paused') {
      setGameState('playing');
    }
  }, []);

  const restartGame = useCallback(() => {
    startGame();
  }, [startGame]);

  return {
    snake,
    food,
    direction,
    gameState,
    score,
    highScore,
    difficulty,
    lastEaten,
    gridSize: GRID_SIZE,
    setDifficulty,
    changeDirection,
    startGame,
    togglePause,
    restartGame,
  };
}
