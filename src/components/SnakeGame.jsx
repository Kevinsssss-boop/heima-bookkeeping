import { useRef, useEffect, useState, useCallback } from 'react';

// ===== 游戏配置 =====
const GRID_SIZE = 20;          // 每个格子的像素大小
const BOARD_WIDTH = 20;        // 游戏区域宽度（格子数）
const BOARD_HEIGHT = 16;       // 游戏区域高度（格子数）
const INITIAL_SPEED = 150;     // 初始速度（毫秒/帧），越小越快
const SPEED_STEP = 10;         // 每吃一个加速多少
const MIN_SPEED = 60;          // 最快速度上限

// 方向向量
const DIRECTIONS = {
  UP:    { x: 0, y: -1 },
  DOWN:  { x: 0, y: 1 },
  LEFT:  { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

// 反方向映射（防止掉头撞自己）
const OPPOSITE = {
  UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT',
};

// ===== 修复 #12：getRandomFood 加最大迭代保护 =====
function getRandomFood(snake, width, height) {
  const snakeSet = new Set(snake.map(s => `${s.x},${s.y}`));
  const maxAttempts = width * height * 2; // 上限：格子数 × 2
  let pos;
  let attempts = 0;
  do {
    pos = {
      x: Math.floor(Math.random() * width),
      y: Math.floor(Math.random() * height),
    };
    attempts++;
    if (attempts > maxAttempts) return null; // 修复 #12：棋盘几乎满时返回 null 而非死循环
  } while (snakeSet.has(`${pos.x},${pos.y}`));
  return pos;
}

function initSnake() {
  return [
    { x: 5, y: 8 },
    { x: 4, y: 8 },
    { x: 3, y: 8 },
  ];
}

// ===== 修复 #4：roundRect 兼容性 polyfill =====
function drawRoundRect(ctx, x, y, w, h, r) {
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
  } else {
    // 手动绘制圆角矩形（兼容旧浏览器）
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

export default function SnakeGame() {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('idle');     // idle | playing | paused | gameover
  const [score, setScore] = useState(0);

  // ===== 修复 #1 + #11：highScore 移入 gameRef 避免 stale closure + 减少监听器重建 =====
  const [highScore, setHighScore] = useState(() => {
    try { return parseInt(localStorage.getItem('snake-highscore') || '0', 10); }
    catch { return 0; }
  });
  const [speed, setSpeed] = useState(INITIAL_SPEED);

  // 游戏状态引用（避免闭包过期问题）
  const gameRef = useRef({
    snake: initSnake(),
    direction: DIRECTIONS.RIGHT,
    nextDirection: DIRECTIONS.RIGHT,
    food: null,
    score: 0,
    speed: INITIAL_SPEED,
    state: 'idle',
    timerId: null,
    highScore: 0, // 修复 #1：highScore 也放 ref，tick 从这里读
  });

  // 同步 highScore 到 ref（当外部 state 变化时）
  useEffect(() => {
    gameRef.current.highScore = highScore;
  }, [highScore]);

  // ===== 修复 #5：提取游戏结束逻辑为公共函数（同时修复 #3 定时器泄漏）=====
  const handleGameOver = useCallback(() => {
    const g = gameRef.current;
    g.state = 'gameover';
    clearInterval(g.timerId); // 修复 #3：游戏结束时清除定时器
    g.timerId = null;

    // 修复 #1：从 ref 读 highScore，不再依赖闭包
    if (g.score > g.highScore) {
      g.highScore = g.score;
      setHighScore(g.score);
      try { localStorage.setItem('snake-highscore', String(g.score)); }
      catch (err) { console.error('保存贪吃蛇最高分失败：', err); } // 修复 #6：不再静默吞错
    }
    setScore(g.score);
    setGameState('gameover');

    const canvas = canvasRef.current;
    // 修复 #8：canvasRef 空指针保护
    if (canvas) draw(canvas.getContext('2d'));
  }, []); // 修复 #11：无 highScore 依赖，不会因破纪录而重建

  // 绘制游戏画面
  const draw = useCallback((ctx) => {
    // 修复 #8：canvas 可能为空（组件卸载后残留 tick 调用）
    if (!ctx) return;

    const g = gameRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width;
    const h = canvas.height;

    // 背景
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);

    // 网格线（淡淡的）
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= BOARD_WIDTH; i++) {
      ctx.beginPath(); ctx.moveTo(i * GRID_SIZE, 0); ctx.lineTo(i * GRID_SIZE, h); ctx.stroke();
    }
    for (let j = 0; j <= BOARD_HEIGHT; j++) {
      ctx.beginPath(); ctx.moveTo(0, j * GRID_SIZE); ctx.lineTo(w, j * GRID_SIZE); ctx.stroke();
    }

    // 食物 🍎
    if (g.food) {
      ctx.font = `${GRID_SIZE - 4}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🍎', g.food.x * GRID_SIZE + GRID_SIZE / 2, g.food.y * GRID_SIZE + GRID_SIZE / 2);
    }

    // 蛇身
    g.snake.forEach((seg, idx) => {
      const x = seg.x * GRID_SIZE;
      const y = seg.y * GRID_SIZE;
      const padding = 1;

      if (idx === 0) {
        // 蛇头 — 带圆角和渐变
        const grad = ctx.createLinearGradient(x, y, x + GRID_SIZE, y + GRID_SIZE);
        grad.addColorStop(0, '#4ade80');
        grad.addColorStop(1, '#22c55e');
        ctx.fillStyle = grad;
        // 修复 #4：使用兼容性安全的 drawRoundRect
        drawRoundRect(ctx, x + padding, y + padding, GRID_SIZE - padding * 2, GRID_SIZE - padding * 2, 6);
        ctx.fill();

        // 眼睛 👀
        ctx.fillStyle = '#fff';
        const eyeSize = 3;
        const eyeOffset = 5;
        let e1x, e1y, e2x, e2y;
        if (g.direction === DIRECTIONS.RIGHT) {
          e1x = x + GRID_SIZE - eyeOffset; e1y = y + eyeOffset;
          e2x = x + GRID_SIZE - eyeOffset; e2y = y + GRID_SIZE - eyeOffset;
        } else if (g.direction === DIRECTIONS.LEFT) {
          e1x = x + eyeOffset; e1y = y + eyeOffset;
          e2x = x + eyeOffset; e2y = y + GRID_SIZE - eyeOffset;
        } else if (g.direction === DIRECTIONS.UP) {
          e1x = x + eyeOffset; e1y = y + eyeOffset;
          e2x = x + GRID_SIZE - eyeOffset; e2y = y + eyeOffset;
        } else {
          e1x = x + eyeOffset; e1y = y + GRID_SIZE - eyeOffset;
          e2x = x + GRID_SIZE - eyeOffset; e2y = y + GRID_SIZE - eyeOffset;
        }
        ctx.beginPath(); ctx.arc(e1x, e1y, eyeSize, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(e2x, e2y, eyeSize, 0, Math.PI * 2); ctx.fill();
      } else {
        // 蛇身 — 渐变变淡
        const alpha = 1 - (idx / g.snake.length) * 0.5;
        ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`;
        // 修复 #4：使用兼容性安全的 drawRoundRect
        drawRoundRect(ctx, x + padding, y + padding, GRID_SIZE - padding * 2, GRID_SIZE - padding * 2, 4);
        ctx.fill();
      }
    });

    // 游戏结束遮罩
    if (g.state === 'gameover') {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('💀 游戏结束', w / 2, h / 2 - 20); // 修复 CLAUDE.md 5.2 中文界面
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#aaa';
      ctx.fillText(`得分：${g.score}`, w / 2, h / 2 + 15);
    }

    // 暂停遮罩
    if (g.state === 'paused') {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⏸️ 已暂停', w / 2, h / 2);
    }
  }, []);

  // 游戏主循环一步
  const tick = useCallback(() => {
    const g = gameRef.current;
    if (g.state !== 'playing') return;

    // 应用方向
    g.direction = g.nextDirection;

    // 计算新头部位置
    const head = g.snake[0];
    const newHead = {
      x: head.x + g.direction.x,
      y: head.y + g.direction.y,
    };

    // 碰撞检测 — 撞墙
    if (newHead.x < 0 || newHead.x >= BOARD_WIDTH || newHead.y < 0 || newHead.y >= BOARD_HEIGHT) {
      handleGameOver(); // 修复 #5：使用公共函数
      return;
    }

    // 碰撞检测 — 撞自己
    for (let i = 0; i < g.snake.length; i++) {
      if (g.snake[i].x === newHead.x && g.snake[i].y === newHead.y) {
        handleGameOver(); // 修复 #5：使用公共函数
        return;
      }
    }

    // 移动蛇
    g.snake.unshift(newHead);

    // 吃到食物？
    if (g.food && newHead.x === g.food.x && newHead.y === g.food.y) {
      g.score += 10;
      setScore(g.score);
      g.food = getRandomFood(g.snake, BOARD_WIDTH, BOARD_HEIGHT);

      // 加速
      const newSpeed = Math.max(MIN_SPEED, g.speed - SPEED_STEP);
      g.speed = newSpeed;
      setSpeed(newSpeed);

      // 重启定时器（用新速度）
      clearInterval(g.timerId);
      g.timerId = setInterval(tick, newSpeed);
    } else {
      g.snake.pop();
    }

    // 绘制
    const canvas = canvasRef.current;
    if (canvas) draw(canvas.getContext('2d')); // 修复 #8：空指针保护
  }, [draw, handleGameOver]); // 修复 #1 + #11：不再依赖 highScore

  // ===== 修复 #7 + #10：键盘控制（加 activeElement 检查 + preventDefault）=====
  useEffect(() => {
    const handleKeyDown = (e) => {
      const g = gameRef.current;

      // 修复 #7：如果焦点在输入框/文本区域，不拦截按键
      const tag = document.activeElement?.tagName?.toLowerCase();
      const isInput = tag === 'input' || tag === 'textarea' || document.activeElement?.isContentEditable;
      if (isInput && (e.key.startsWith('Arrow') || /^[wasd]$/.test(e.key.toLowerCase()))) {
        return; // 让输入框正常处理按键
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          // 修复 #10：加 preventDefault
          e.preventDefault();
          if (g.direction !== DIRECTIONS.DOWN && g.state === 'playing')
            g.nextDirection = DIRECTIONS.UP;
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault(); // 修复 #10
          if (g.direction !== DIRECTIONS.UP && g.state === 'playing')
            g.nextDirection = DIRECTIONS.DOWN;
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault(); // 修复 #10
          if (g.direction !== DIRECTIONS.RIGHT && g.state === 'playing')
            g.nextDirection = DIRECTIONS.LEFT;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault(); // 修复 #10
          if (g.direction !== DIRECTIONS.LEFT && g.state === 'playing')
            g.nextDirection = DIRECTIONS.RIGHT;
          break;
        case ' ':  // 空格键：暂停/继续
          e.preventDefault();
          if (g.state === 'playing') {
            pauseGameInternal();
          } else if (g.state === 'paused') {
            resumeGameInternal();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tick, draw]); // 修复 #11：不再因 highScore 变化而重建

  // ===== 修复 #2：标签页可见性处理（防止切走回来 tick 爆发）=====
  useEffect(() => {
    const handleVisibilityChange = () => {
      const g = gameRef.current;
      if (document.hidden && g.state === 'playing') {
        // 标签页隐藏时自动暂停
        pauseGameInternal();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // 内部暂停/继续函数（供键盘和 visibility 共用，避免重复）
  const pauseGameInternal = useCallback(() => {
    const g = gameRef.current;
    if (g.state === 'playing') {
      g.state = 'paused';
      setGameState('paused');
      clearInterval(g.timerId);
      g.timerId = null;
      const canvas = canvasRef.current;
      if (canvas) draw(canvas.getContext('2d'));
    }
  }, [draw]);

  const resumeGameInternal = useCallback(() => {
    const g = gameRef.current;
    if (g.state === 'paused') {
      g.state = 'playing';
      setGameState('playing');
      g.timerId = setInterval(tick, g.speed);
    }
  }, [tick]);

  // 初始化画布
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return; // 修复 #8：空指针保护
    canvas.width = BOARD_WIDTH * GRID_SIZE;
    canvas.height = BOARD_HEIGHT * GRID_SIZE;
    const ctx = canvas.getContext('2d');

    const g = gameRef.current;
    g.food = getRandomFood(g.snake, BOARD_WIDTH, BOARD_HEIGHT);
    draw(ctx);
  }, [draw]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (gameRef.current.timerId) {
        clearInterval(gameRef.current.timerId);
        gameRef.current.timerId = null;
      }
    };
  }, []);

  // ===== 操作按钮 =====

  const startGame = useCallback(() => {
    const g = gameRef.current;
    if (g.timerId) {
      clearInterval(g.timerId);
      g.timerId = null;
    }

    g.snake = initSnake();
    g.direction = DIRECTIONS.RIGHT;
    g.nextDirection = DIRECTIONS.RIGHT;
    g.food = getRandomFood(g.snake, BOARD_WIDTH, BOARD_HEIGHT);
    g.score = 0;
    g.speed = INITIAL_SPEED;
    g.state = 'playing';

    setScore(0);
    setSpeed(INITIAL_SPEED);
    setGameState('playing');

    const canvas = canvasRef.current;
    if (canvas) draw(canvas.getContext('2d'));

    g.timerId = setInterval(tick, INITIAL_SPEED);
  }, [tick, draw]);

  const pauseGame = useCallback(() => {
    pauseGameInternal();
  }, [pauseGameInternal]);

  const resumeGame = useCallback(() => {
    resumeGameInternal();
  }, [resumeGameInternal]);

  // 移动端触控按钮
  const handleDirBtn = (dir) => {
    const g = gameRef.current;
    if (g.state !== 'playing') return;
    const dirVec = DIRECTIONS[dir];
    const currentDirName =
      g.direction === DIRECTIONS.UP ? 'UP' :
      g.direction === DIRECTIONS.DOWN ? 'DOWN' :
      g.direction === DIRECTIONS.LEFT ? 'LEFT' : 'RIGHT';
    if (OPPOSITE[dir] !== currentDirName) {
      g.nextDirection = dirVec;
    }
  };

  return (
    <div className="snake-game-page">
      {/* 标题栏 */}
      <div className="snake-header">
        <div className="snake-title">🐍 贪吃蛇</div>
        <div className="snake-scores">
          <div className="snake-score-item">
            <span className="snake-score-label">得分</span>
            <span className="snake-score-value">{score}</span>
          </div>
          <div className="snake-score-item">
            <span className="snake-score-label">最高</span>
            <span className="snake-score-value snake-score-high">{highScore}</span>
          </div>
        </div>
      </div>

      {/* 游戏画布 */}
      <div className="snake-canvas-wrap">
        <canvas ref={canvasRef} className="snake-canvas" />
      </div>

      {/* 控制按钮 */}
      <div className="snake-controls">
        {gameState === 'idle' || gameState === 'gameover' ? (
          <button className="snake-btn snake-btn-start" onClick={startGame}>
            {gameState === 'gameover' ? '🔄 再来一局' : '▶️ 开始游戏'}
          </button>
        ) : (
          <>
            {gameState === 'playing' ? (
              <button className="snake-btn snake-btn-pause" onClick={pauseGame}>⏸️ 暂停</button>
            ) : (
              <button className="snake-btn snake-btn-resume" onClick={resumeGame}>▶️ 继续</button>
            )}
          </>
        )}
      </div>

      {/* 移动端方向键 */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <div className="snake-dpad">
          <button className="snake-dpad-btn snake-dpad-up" onClick={() => handleDirBtn('UP')}>▲</button>
          <button className="snake-dpad-btn snake-dpad-left" onClick={() => handleDirBtn('LEFT')}>◀</button>
          <button className="snake-dpad-btn snake-dpad-center">●</button>
          <button className="snake-dpad-btn snake-dpad-right" onClick={() => handleDirBtn('RIGHT')}>▶</button>
          <button className="snake-dpad-btn snake-dpad-down" onClick={() => handleDirBtn('DOWN')}>▼</button>
        </div>
      )}

      {/* 操作提示 */}
      <div className="snake-tips">
        <p>⌨️ 键盘：↑↓←→ 或 WASD 控制方向，空格键暂停</p>
        <p>📱 手机：点击下方方向按钮操作</p>
      </div>
    </div>
  );
}
