import React, { useState, useRef, useEffect } from 'react';
import { motion, PanInfo, useAnimation, useMotionValue } from 'motion/react';
import { Hexagon } from './components/Hexagon';
import { 
  BoardState, createInitialBoard, generatePiece, PieceDef, 
  getPixelCoords, getAxialCoords, processMerges, checkGameOver,
  DX, DY, W, H
} from './lib/hexUtils';
import { RotateCw, RefreshCw, Trophy } from 'lucide-react';

export default function App() {
  const [board, setBoard] = useState<BoardState>(createInitialBoard());
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [currentPiece, setCurrentPiece] = useState<PieceDef>(generatePiece());
  const [dragTarget, setDragTarget] = useState<{ q: number, r: number } | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [refreshes, setRefreshes] = useState(3);

  const svgRef = useRef<SVGSVGElement>(null);
  const pieceRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  useEffect(() => {
    const saved = localStorage.getItem('hexa-highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('hexa-highscore', score.toString());
    }
  }, [score, highScore]);

  useEffect(() => {
    if (checkGameOver(board, currentPiece)) {
      setGameOver(true);
    }
  }, [board, currentPiece]);

  const handleDrag = (e: any, info: PanInfo) => {
    if (!pieceRef.current || !svgRef.current || !currentPiece) return;

    const pieceRect = pieceRef.current.getBoundingClientRect();
    const centerX = pieceRect.left + pieceRect.width / 2;
    const centerY = pieceRect.top + pieceRect.height / 2;

    const svgRect = svgRef.current.getBoundingClientRect();
    const scaleX = 300 / svgRect.width;
    const scaleY = 400 / svgRect.height;

    const svgX = (centerX - svgRect.left) * scaleX;
    const svgY = (centerY - svgRect.top) * scaleY;

    const px = svgX - DX;
    const py = svgY - DY;

    const { q, r } = getAxialCoords(px, py);

    let canPlace = true;
    for (const block of currentPiece.blocks) {
      const tq = q + block.dq;
      const tr = r + block.dr;
      const key = `${tq},${tr}`;
      if (!board.has(key) || board.get(key) !== null) {
        canPlace = false;
        break;
      }
    }

    if (canPlace) {
      setDragTarget({ q, r });
    } else {
      setDragTarget(null);
    }
  };

  const handleDragEnd = (e: any, info: PanInfo) => {
    if (dragTarget) {
      // Place piece
      const newBoard = new Map(board);
      const placedCells = [];
      for (const block of currentPiece.blocks) {
        const tq = dragTarget.q + block.dq;
        const tr = dragTarget.r + block.dr;
        newBoard.set(`${tq},${tr}`, block.value);
        placedCells.push({ q: tq, r: tr, value: block.value });
      }

      const { newBoard: mergedBoard, scoreGained } = processMerges(newBoard, placedCells);
      
      setBoard(mergedBoard);
      setScore(s => s + scoreGained);
      setCurrentPiece(generatePiece());
      setDragTarget(null);
      
      // Reset position instantly
      x.set(0);
      y.set(0);
    } else {
      // Snap back
      x.set(0);
      y.set(0);
    }
  };

  const handleRefresh = () => {
    if (refreshes > 0) {
      setCurrentPiece(generatePiece());
      setRefreshes(r => r - 1);
    }
  };

  const restartGame = () => {
    setBoard(createInitialBoard());
    setScore(0);
    setCurrentPiece(generatePiece());
    setGameOver(false);
    setRefreshes(3);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center font-sans overflow-hidden touch-none">
      {/* Header */}
      <div className="w-full max-w-md p-6 flex justify-between items-center">
        <div className="flex items-center gap-2 bg-gray-800/50 px-4 py-2 rounded-full">
          <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
            <span className="text-black font-bold text-xs">$</span>
          </div>
          <span className="font-bold">{score}</span>
        </div>
        
        <div className="flex gap-8 text-center">
          <div>
            <div className="text-gray-400 text-xs font-bold tracking-wider mb-1">TODAY</div>
            <div className="text-teal-400 font-bold text-xl">{score}</div>
          </div>
          <div>
            <div className="text-gray-400 text-xs font-bold tracking-wider mb-1">HIGHEST</div>
            <div className="text-white font-bold text-xl">{highScore}</div>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 w-full max-w-md relative flex flex-col items-center justify-center">
        <svg 
          ref={svgRef}
          viewBox="0 0 300 400" 
          className="w-full h-auto max-h-[60vh]"
          style={{ filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.5))' }}
        >
          <g transform={`translate(${DX}, ${DY})`}>
            {/* Render Board */}
            {Array.from(board.entries()).map(([key, value]) => {
              const [q, r] = key.split(',').map(Number);
              const { x: px, y: py } = getPixelCoords(q, r);
              return (
                <Hexagon key={key} x={px} y={py} value={value} />
              );
            })}

            {/* Render Ghost Piece */}
            {dragTarget && currentPiece.blocks.map((b, i) => {
              const tq = dragTarget.q + b.dq;
              const tr = dragTarget.r + b.dr;
              const { x: px, y: py } = getPixelCoords(tq, tr);
              return <Hexagon key={`ghost-${i}`} x={px} y={py} value={b.value} isGhost={true} />;
            })}
          </g>
        </svg>

        {/* Game Over Overlay */}
        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
            <h2 className="text-4xl font-bold text-white mb-2">Game Over</h2>
            <p className="text-gray-300 mb-6">Final Score: {score}</p>
            <button 
              onClick={restartGame}
              className="bg-teal-500 hover:bg-teal-400 text-white font-bold py-3 px-8 rounded-full transition-transform active:scale-95"
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      {/* Bottom Area (Piece & Controls) */}
      <div className="w-full max-w-md h-48 relative flex items-center justify-center">
        {/* Refresh Button */}
        <button 
          onClick={handleRefresh}
          disabled={refreshes === 0}
          className={`absolute right-8 top-1/2 -translate-y-1/2 p-3 rounded-xl border-2 
            ${refreshes > 0 ? 'border-teal-500/50 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20' : 'border-gray-700 bg-gray-800 text-gray-600'} 
            transition-colors`}
        >
          <RefreshCw size={24} />
          {refreshes > 0 && (
            <div className="absolute -top-2 -right-2 w-5 h-5 bg-blue-500 rounded-full text-xs flex items-center justify-center text-white font-bold">
              {refreshes}
            </div>
          )}
        </button>

        {/* Draggable Piece */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          <motion.div
            ref={pieceRef}
            drag
            dragMomentum={false}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            style={{ x, y }}
            className="absolute z-40 cursor-grab active:cursor-grabbing"
            whileDrag={{ scale: 1.1 }}
          >
            <svg width="200" height="200" viewBox="-100 -100 200 200" className="overflow-visible">
              {currentPiece.blocks.map((b, i) => {
                const { x: px, y: py } = getPixelCoords(b.dq, b.dr);
                return <Hexagon key={`piece-${i}`} x={px} y={py} value={b.value} />;
              })}
            </svg>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
