import React, { useRef, useState, useEffect, useCallback } from 'react';
import { RotateCcw, RotateCw, Trash2, Paintbrush, Eraser, Sparkles, PenTool } from 'lucide-react';
import { soundManager } from './SoundManager';
import { DrawingTool } from '../types';

interface StrokePoint {
  x: number;
  y: number;
  size: number;
  tool: DrawingTool;
  pressure: number;
  time: number;
}

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

export default function DrawingCanvas({ onDrawingChange }: DrawingCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [activeTool, setActiveTool] = useState<DrawingTool>('pencil');
  const [pencilSize, setPencilSize] = useState<number>(8);
  const [eraserSize, setEraserSize] = useState<number>(20);
  const [isDrawingUI, setIsDrawingUI] = useState(false);
  const [isStylusActive, setIsStylusActive] = useState(false);

  // Synchronous refs for high-performance, non-stale drawing state
  const isDrawingRef = useRef<boolean>(false);
  const currentStrokeRef = useRef<StrokePoint[]>([]);
  const strokeHistoryRef = useRef<StrokePoint[][]>([]);

  const [strokeHistory, setStrokeHistory] = useState<StrokePoint[][]>([]);
  const [redoStack, setRedoStack] = useState<StrokePoint[][]>([]);

  const [dimensions, setDimensions] = useState({ width: 500, height: 420 });

  // Handle ResizeObserver to keep canvas responsive
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(entries => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      const w = Math.max(300, Math.floor(width));
      const h = Math.max(300, Math.floor(height));
      setDimensions({ width: w, height: h });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Sync state & refs on stroke history update
  const updateStrokeHistory = (newHistory: StrokePoint[][]) => {
    strokeHistoryRef.current = newHistory;
    setStrokeHistory(newHistory);
  };

  // Redraw full canvas cleanly from history
  const redrawCanvas = useCallback((historyToRedraw: StrokePoint[][]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    historyToRedraw.forEach(stroke => {
      if (!stroke || stroke.length === 0) return;

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const firstPoint = stroke[0];
      if (firstPoint.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = '#1e293b'; // Slate 800
        ctx.fillStyle = '#1e293b';
      }

      if (stroke.length === 1) {
        ctx.beginPath();
        ctx.arc(stroke[0].x, stroke[0].y, stroke[0].size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        for (let i = 0; i < stroke.length - 1; i++) {
          const p1 = stroke[i];
          const p2 = stroke[i + 1];
          const avgSize = (p1.size + p2.size) / 2;

          ctx.lineWidth = avgSize;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
    });

    ctx.globalCompositeOperation = 'source-over';
  }, [dimensions]);

  // Resize canvas according to high DPI / dimensions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    
    redrawCanvas(strokeHistoryRef.current);
  }, [dimensions, redrawCanvas]);

  // Notify parent of drawing change for ML recognition
  const triggerAnalysis = useCallback((historyToUse: StrokePoint[][]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const formattedPoints = historyToUse
      .filter(stroke => stroke.length > 0 && stroke[0].tool === 'pencil')
      .map(stroke => stroke.map(p => ({ x: p.x, y: p.y })));

    onDrawingChange(ctx, dimensions.width, dimensions.height, formattedPoints.length, formattedPoints);
  }, [dimensions, onDrawingChange]);

  // Get point attributes with accurate coordinate scaling & stylus pressure calculation
  const getPointAttributes = (
    e: React.PointerEvent<HTMLCanvasElement>,
    lastPoint?: StrokePoint
  ): StrokePoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;

    // Account for CSS scale differences vs internal canvas resolution
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = e.clientX;
    const clientY = e.clientY;
    const pe = e.nativeEvent;

    let rawPressure = 0.5;
    let isStylus = false;

    if (pe.pointerType === 'pen') {
      isStylus = true;
      rawPressure = pe.pressure > 0 ? pe.pressure : 0.5;
    } else if (pe.pressure > 0 && pe.pressure !== 0.5) {
      rawPressure = pe.pressure;
    }

    if (isStylus !== isStylusActive) {
      setIsStylusActive(isStylus);
    }

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    // Sanity check coordinates
    if (isNaN(x) || isNaN(y) || x < -50 || y < -50 || x > canvas.width + 50 || y > canvas.height + 50) {
      return null;
    }

    const now = Date.now();
    const baseSize = activeTool === 'pencil' ? pencilSize : eraserSize;
    let computedPressure = 0.6;

    if (isStylus && rawPressure !== 0.5) {
      computedPressure = Math.max(0.15, Math.min(1.0, rawPressure));
    } else if (lastPoint && now > lastPoint.time) {
      const dist = Math.hypot(x - lastPoint.x, y - lastPoint.y);
      const dt = Math.max(1, now - lastPoint.time);
      const speed = dist / dt;

      const targetVelPressure = Math.max(0.25, Math.min(1.0, 1.05 - (speed / 2.0) * 0.7));
      computedPressure = lastPoint.pressure * 0.6 + targetVelPressure * 0.4;
    }

    let calculatedSize = baseSize;
    if (activeTool === 'pencil') {
      const sizeMultiplier = 0.35 + 1.25 * computedPressure;
      calculatedSize = Math.max(2, baseSize * sizeMultiplier);
    } else {
      const sizeMultiplier = 0.8 + 0.4 * computedPressure;
      calculatedSize = Math.max(6, baseSize * sizeMultiplier);
    }

    return {
      x,
      y,
      size: calculatedSize,
      tool: activeTool,
      pressure: computedPressure,
      time: now
    };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set pointer capture so all events map to this canvas until release
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // Fallback if not supported
    }

    const newPoint = getPointAttributes(e);
    if (!newPoint) return;

    isDrawingRef.current = true;
    setIsDrawingUI(true);
    setRedoStack([]);

    currentStrokeRef.current = [newPoint];

    if (activeTool === 'pencil') {
      soundManager.playDraw();
    } else {
      soundManager.playEraser();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#1e293b';
    }

    // Render initial start point
    ctx.beginPath();
    ctx.arc(newPoint.x, newPoint.y, newPoint.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();

    // Check if primary mouse button was released while dragging outside canvas
    if ('buttons' in e.nativeEvent && e.nativeEvent.buttons === 0 && e.pointerType === 'mouse') {
      stopDrawing(e);
      return;
    }

    const currentPoints = currentStrokeRef.current;
    if (currentPoints.length === 0) return;

    const lastPoint = currentPoints[currentPoints.length - 1];
    const newPoint = getPointAttributes(e, lastPoint);
    if (!newPoint) return;

    // Filter sudden massive jumps (e.g., > 100px in one tick) to prevent accidental long diagonal/vertical connecting lines
    const distFromLast = Math.hypot(newPoint.x - lastPoint.x, newPoint.y - lastPoint.y);
    if (distFromLast > 120) {
      stopDrawing(e);
      return;
    }

    currentStrokeRef.current.push(newPoint);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#1e293b';
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const avgSize = (lastPoint.size + newPoint.size) / 2;
    ctx.lineWidth = avgSize;
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(newPoint.x, newPoint.y);
    ctx.stroke();

    ctx.globalCompositeOperation = 'source-over';

    if (currentStrokeRef.current.length % 6 === 0) {
      if (activeTool === 'pencil') soundManager.playDraw();
      else soundManager.playEraser();
    }

    triggerAnalysis([...strokeHistoryRef.current, currentStrokeRef.current]);
  };

  const stopDrawing = (e?: React.PointerEvent<HTMLCanvasElement>) => {
    if (e && canvasRef.current) {
      try {
        if (canvasRef.current.hasPointerCapture(e.pointerId)) {
          canvasRef.current.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Fallback
      }
    }

    if (!isDrawingRef.current) return;

    isDrawingRef.current = false;
    setIsDrawingUI(false);

    const finishedStroke = [...currentStrokeRef.current];
    currentStrokeRef.current = [];

    if (finishedStroke.length > 0) {
      const newHistory = [...strokeHistoryRef.current, finishedStroke];
      updateStrokeHistory(newHistory);
      triggerAnalysis(newHistory);
    }
  };

  // Global event listener safety net for pointerup or window blur
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (isDrawingRef.current) {
        stopDrawing();
      }
    };

    const handleWindowBlur = () => {
      if (isDrawingRef.current) {
        stopDrawing();
      }
    };

    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, []);

  const undo = useCallback(() => {
    const history = strokeHistoryRef.current;
    if (history.length === 0) return;

    const lastStroke = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    
    updateStrokeHistory(newHistory);
    setRedoStack(prev => [...prev, lastStroke]);
    
    redrawCanvas(newHistory);
    triggerAnalysis(newHistory);
    soundManager.playClick();
  }, [redrawCanvas, triggerAnalysis]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const strokeToRestore = redoStack[redoStack.length - 1];
    const newRedo = redoStack.slice(0, -1);
    const newHistory = [...strokeHistoryRef.current, strokeToRestore];

    updateStrokeHistory(newHistory);
    setRedoStack(newRedo);

    redrawCanvas(newHistory);
    triggerAnalysis(newHistory);
    soundManager.playClick();
  }, [redoStack, redrawCanvas, triggerAnalysis]);

  const clearCanvas = useCallback(() => {
    isDrawingRef.current = false;
    currentStrokeRef.current = [];
    updateStrokeHistory([]);
    setRedoStack([]);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    onDrawingChange(ctx, dimensions.width, dimensions.height, 0, []);
    soundManager.playClick();
  }, [dimensions, onDrawingChange]);

  // Keyboard Shortcuts: Ctrl+Z (Undo), Ctrl+Shift+Z/Ctrl+Y (Redo), E (Eraser), B (Pencil), Delete (Clear)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if (e.key.toLowerCase() === 'e') {
        setActiveTool('eraser');
        soundManager.playClick();
      } else if (e.key.toLowerCase() === 'b') {
        setActiveTool('pencil');
        soundManager.playClick();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        clearCanvas();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, clearCanvas]);

  return (
    <div className="flex flex-col h-full w-full select-none">
      {/* Actual Canvas Container */}
      <div 
        ref={containerRef}
        className="relative flex-1 min-h-[320px] border border-slate-200/50 bg-white shadow-inner rounded-[1.8rem] overflow-hidden cursor-crosshair touch-none select-none"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
          onPointerLeave={stopDrawing}
          className="absolute inset-0 w-full h-full touch-none select-none"
          style={{ touchAction: 'none' }}
          id="drawing-canvas-element"
        />

        {strokeHistory.length === 0 && !isDrawingUI && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 pointer-events-none select-none p-6 text-center">
            <Paintbrush className="w-10 h-10 stroke-[1.5] mb-2 animate-bounce text-indigo-400/80" />
            <p className="text-sm font-bold text-slate-600">Draw your challenge here</p>
            <p className="text-xs text-slate-400 mt-1">Shortcuts: [B] Brush, [E] Eraser, [Ctrl+Z] Undo, [Delete] Clear</p>
          </div>
        )}

        {/* Dynamics Status Badge */}
        <div className="absolute top-3 right-3 pointer-events-none flex items-center gap-1.5 px-2.5 py-1 bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-full text-[10px] font-extrabold text-slate-600 shadow-2xs">
          {isStylusActive ? (
            <>
              <PenTool className="w-3 h-3 text-emerald-500" />
              <span>Stylus Pressure Active</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3 h-3 text-indigo-500" />
              <span>Organic Stroke Dynamics</span>
            </>
          )}
        </div>
      </div>

      {/* Toolbar & Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-3 px-1">
        
        {/* Tool Mode (Pencil vs Eraser) */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60 backdrop-blur-sm">
          <button
            onClick={() => { setActiveTool('pencil'); soundManager.playClick(); }}
            className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
              activeTool === 'pencil'
                ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Pencil Brush [B]"
          >
            <Paintbrush className="w-3.5 h-3.5" />
            <span>Pencil</span>
          </button>

          <button
            onClick={() => { setActiveTool('eraser'); soundManager.playClick(); }}
            className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
              activeTool === 'eraser'
                ? 'bg-white text-rose-600 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Eraser [E]"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Eraser</span>
          </button>
        </div>

        {/* Size Preset Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            {activeTool === 'pencil' ? 'Brush Size' : 'Eraser Size'}
          </span>
          <div className="flex gap-1.5">
            {activeTool === 'pencil'
              ? [4, 8, 12, 18].map(size => (
                  <button
                    key={size}
                    onClick={() => { setPencilSize(size); soundManager.playClick(); }}
                    className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all ${
                      pencilSize === size
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-xs'
                        : 'border-slate-200 bg-white/60 text-slate-400 hover:bg-white'
                    }`}
                  >
                    <div className="rounded-full bg-current" style={{ width: size + 'px', height: size + 'px' }} />
                  </button>
                ))
              : [12, 20, 30, 42].map(size => (
                  <button
                    key={size}
                    onClick={() => { setEraserSize(size); soundManager.playClick(); }}
                    className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all ${
                      eraserSize === size
                        ? 'border-rose-600 bg-rose-50 text-rose-600 shadow-xs'
                        : 'border-slate-200 bg-white/60 text-slate-400 hover:bg-white'
                    }`}
                  >
                    <div className="rounded-full bg-current" style={{ width: Math.min(18, size / 2) + 'px', height: Math.min(18, size / 2) + 'px' }} />
                  </button>
                ))}
          </div>
        </div>

        {/* Action Controls (Undo, Redo, Clear) */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={undo}
            disabled={strokeHistory.length === 0}
            className={`cursor-pointer p-2 rounded-xl border transition-all ${
              strokeHistory.length > 0
                ? 'bg-white border-slate-200 text-slate-700 shadow-xs hover:bg-slate-50'
                : 'bg-slate-100/50 border-slate-200/50 text-slate-300 pointer-events-none'
            }`}
            title="Undo [Ctrl+Z]"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={redo}
            disabled={redoStack.length === 0}
            className={`cursor-pointer p-2 rounded-xl border transition-all ${
              redoStack.length > 0
                ? 'bg-white border-slate-200 text-slate-700 shadow-xs hover:bg-slate-50'
                : 'bg-slate-100/50 border-slate-200/50 text-slate-300 pointer-events-none'
            }`}
            title="Redo [Ctrl+Shift+Z]"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={clearCanvas}
            disabled={strokeHistory.length === 0 && currentStrokeRef.current.length === 0}
            className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold border transition-all ${
              strokeHistory.length > 0 || currentStrokeRef.current.length > 0
                ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100 shadow-xs'
                : 'bg-slate-100/50 border-slate-200/50 text-slate-300 pointer-events-none'
            }`}
            title="Clear Canvas [Delete]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>

      </div>
    </div>
  );
}


