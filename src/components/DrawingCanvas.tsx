import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, Trash2, Paintbrush, CircleHelp } from 'lucide-react';
import { soundManager } from './SoundManager';

interface DrawingCanvasProps {
  onDrawingChange: (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    strokeCount: number,
    strokePoints: { x: number; y: number }[][]
  ) => void;
  targetObjectTip?: string;
}

export default function DrawingCanvas({ onDrawingChange, targetObjectTip }: DrawingCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState<number>(8);
  const [strokeHistory, setStrokeHistory] = useState<{ x: number; y: number; size: number }[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number; size: number }[]>([]);
  const [dimensions, setDimensions] = useState({ width: 450, height: 400 });

  // Handle ResizeObserver to keep canvas responsive
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const resizeObserver = new ResizeObserver(entries => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      
      // Calculate a comfortable size for the box, clamping to square-ish limits
      const w = Math.max(300, Math.floor(width));
      const h = Math.max(300, Math.floor(height));
      
      setDimensions({ width: w, height: h });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Set canvas scale correctly for high DPI retina screens and dimensions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    
    // Clear and redraw when dimensions change
    redrawCanvas();
  }, [dimensions, strokeHistory]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    
    // Check if it's a touch event
    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;

    setIsDrawing(true);
    const newPoint = { x: coords.x, y: coords.y, size: brushSize };
    setCurrentStroke([newPoint]);
    
    // Play drawing scratch sound
    soundManager.playDraw();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e293b'; // Slate 800
    ctx.lineWidth = brushSize;
    ctx.moveTo(coords.x, coords.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Line drawing
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = brushSize;

    const prevPoint = currentStroke[currentStroke.length - 1];
    if (prevPoint) {
      ctx.beginPath();
      ctx.moveTo(prevPoint.x, prevPoint.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }

    const newPoint = { x: coords.x, y: coords.y, size: brushSize };
    setCurrentStroke(prev => [...prev, newPoint]);

    // Periodically play drawing sound to feel organic
    if (currentStroke.length % 5 === 0) {
      soundManager.playDraw();
    }

    // Trigger dynamic prediction changes
    triggerChangeNotification();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentStroke.length > 0) {
      const updatedHistory = [...strokeHistory, currentStroke];
      setStrokeHistory(updatedHistory);
      setCurrentStroke([]);
    }
  };

  const triggerChangeNotification = (historyToUse = [...strokeHistory, currentStroke]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Convert raw stroke points to simple coordinate points for ML analysis
    const formattedPoints = historyToUse.map(stroke => stroke.map(p => ({ x: p.x, y: p.y })));
    
    // Notify main game container to predict the drawing
    onDrawingChange(ctx, dimensions.width, dimensions.height, historyToUse.length, formattedPoints);
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Redraw all strokes from history
    strokeHistory.forEach(stroke => {
      if (stroke.length === 0) return;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#1e293b';

      ctx.beginPath();
      ctx.lineWidth = stroke[0].size;
      ctx.moveTo(stroke[0].x, stroke[0].y);

      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      ctx.stroke();
    });
  };

  const clearCanvas = () => {
    setStrokeHistory([]);
    setCurrentStroke([]);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Notify of blank canvas
    onDrawingChange(ctx, dimensions.width, dimensions.height, 0, []);
  };

  const undoLastStroke = () => {
    if (strokeHistory.length === 0) return;
    const updated = strokeHistory.slice(0, -1);
    setStrokeHistory(updated);
    
    // Redraw and trigger analysis on updated strokes
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const formattedPoints = updated.map(stroke => stroke.map(p => ({ x: p.x, y: p.y })));
      onDrawingChange(ctx, dimensions.width, dimensions.height, updated.length, formattedPoints);
    }, 0);
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Target prompt Tip */}
      {targetObjectTip && (
        <div className="flex items-start gap-2 px-4 py-3 bg-white/40 backdrop-blur-sm border border-white/60 rounded-2xl mb-4 text-xs text-blue-800 leading-relaxed font-medium shadow-sm">
          <CircleHelp className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <span><strong>Doodling Hint:</strong> {targetObjectTip}</span>
        </div>
      )}

      {/* Actual Drawing Area */}
      <div 
        ref={containerRef}
        className="relative flex-1 min-h-[300px] border border-slate-200/40 bg-white/90 shadow-inner rounded-2xl overflow-hidden cursor-crosshair touch-none"
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="absolute inset-0 w-full h-full"
          id="drawing-canvas-element"
        />
        {strokeHistory.length === 0 && !isDrawing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 pointer-events-none select-none">
            <Paintbrush className="w-12 h-12 stroke-[1.2] mb-2 animate-bounce text-slate-300" />
            <p className="text-sm font-medium">Draw your challenge here...</p>
            <p className="text-xs text-slate-400/80">Predictions will update instantly in real-time</p>
          </div>
        )}
      </div>

      {/* Controls and Brush Sliders */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-4 px-1">
        {/* Brush size Selector */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Brush Size:</span>
          <div className="flex gap-2">
            {[4, 8, 12, 16].map(size => (
              <button
                key={size}
                onClick={() => setBrushSize(size)}
                className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                  brushSize === size
                    ? 'border-blue-600 bg-blue-50/60 text-blue-600 shadow-sm'
                    : 'border-white/40 bg-white/40 backdrop-blur-sm text-slate-500 hover:bg-white'
                }`}
                title={`Brush size ${size}px`}
              >
                <div 
                  className="rounded-full bg-current" 
                  style={{ width: size + 'px', height: size + 'px' }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Undo / Clear controls */}
        <div className="flex gap-2.5">
          <button
            onClick={undoLastStroke}
            disabled={strokeHistory.length === 0}
            className={`cursor-pointer inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all select-none border border-white/40 ${
              strokeHistory.length > 0
                ? 'bg-white/60 backdrop-blur-sm hover:bg-white text-slate-700 shadow-sm'
                : 'bg-white/20 text-slate-300 pointer-events-none'
            }`}
            title="Undo last line"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Undo</span>
          </button>
          
          <button
            onClick={clearCanvas}
            disabled={strokeHistory.length === 0 && currentStroke.length === 0}
            className={`cursor-pointer inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all select-none border ${
              strokeHistory.length > 0 || currentStroke.length > 0
                ? 'bg-rose-50/60 backdrop-blur-sm border-rose-100/80 hover:bg-rose-50 text-rose-600 shadow-sm'
                : 'bg-white/20 border-white/10 text-slate-300 pointer-events-none'
            }`}
            title="Clear drawing"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Canvas</span>
          </button>
        </div>
      </div>
    </div>
  );
}
