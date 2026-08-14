import React, { useRef, useEffect, useState } from 'react';
import './canvas.css';

export default function DrawingCanvas({ onImageReady, isDisabled }) {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const contextRef = useRef(null);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const context = canvas.getContext('2d');
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = 10;
    context.strokeStyle = '#000000';

    contextRef.current = context;
  }, []);

  const startDrawing = (e) => {
    if (isDisabled) return;

    const { offsetX, offsetY } = getEventCoordinates(e);
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    isDrawingRef.current = true;
  };

  const draw = (e) => {
    if (!isDrawingRef.current || isDisabled) return;

    const { offsetX, offsetY } = getEventCoordinates(e);
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();

    setIsEmpty(false);
  };

  const stopDrawing = () => {
    contextRef.current.closePath();
    isDrawingRef.current = false;
  };

  const getEventCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    let offsetX, offsetY;

    if (e.touches) {
      // Touch event
      const touch = e.touches[0];
      offsetX = touch.clientX - rect.left;
      offsetY = touch.clientY - rect.top;
    } else {
      // Mouse event
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
    }

    return { offsetX, offsetY };
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const handleSubmit = () => {
    if (isEmpty) {
      alert('Please draw something first');
      return;
    }

    const canvas = canvasRef.current;
    canvas.toBlob((blob) => {
      onImageReady(blob);
    }, 'image/png');
  };

  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        className="drawing-canvas"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />

      <div className="canvas-controls">
        <button
          className="btn btn-secondary"
          onClick={handleClear}
          disabled={isEmpty || isDisabled}
        >
          Clear
        </button>
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={isEmpty || isDisabled}
        >
          Done
        </button>
      </div>
    </div>
  );
}
