import React from 'react';
import { Clock } from 'lucide-react';

interface CircularTimerProps {
  timeSpent: number;
  maxTime: number;
}

export default function CircularTimer({ timeSpent, maxTime }: CircularTimerProps) {
  const timeLeft = Math.max(0, maxTime - timeSpent);
  const ratio = Math.min(1, Math.max(0, timeLeft / maxTime));

  const size = 64;
  const strokeWidth = 5;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - ratio);

  // Color transition based on time ratio
  let strokeColor = '#10b981'; // Green
  let textColor = 'text-emerald-600';
  let bgColor = 'bg-emerald-50';
  let borderColor = 'border-emerald-200';

  if (ratio <= 0.15 || timeLeft <= 5) {
    strokeColor = '#ef4444'; // Red
    textColor = 'text-rose-600';
    bgColor = 'bg-rose-50';
    borderColor = 'border-rose-300';
  } else if (ratio <= 0.35) {
    strokeColor = '#f97316'; // Orange
    textColor = 'text-orange-600';
    bgColor = 'bg-orange-50';
    borderColor = 'border-orange-200';
  } else if (ratio <= 0.55) {
    strokeColor = '#eab308'; // Yellow
    textColor = 'text-amber-600';
    bgColor = 'bg-amber-50';
    borderColor = 'border-amber-200';
  }

  const isLowTime = timeLeft <= 5 && timeLeft > 0;

  return (
    <div className={`relative flex items-center gap-3 px-3.5 py-2 rounded-2xl border transition-all shadow-xs ${bgColor} ${borderColor} ${isLowTime ? 'animate-pulse scale-105 ring-2 ring-rose-400/50' : ''}`}>
      {/* SVG Ring */}
      <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
        <svg width={size} height={size} className="w-12 h-12 -rotate-90">
          {/* Background Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-200/80"
          />
          {/* Progress Ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-300 ease-linear"
          />
        </svg>

        <span className={`absolute font-mono font-black text-xs ${textColor}`}>
          {timeLeft}s
        </span>
      </div>

      <div className="text-left font-mono pr-1">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block leading-none mb-0.5">
          Timer
        </span>
        <span className={`text-xs font-extrabold flex items-center gap-1 ${textColor}`}>
          <Clock className={`w-3 h-3 ${isLowTime ? 'animate-bounce' : ''}`} />
          {timeLeft <= 5 ? 'Hurry Up!' : 'Per Sketch'}
        </span>
      </div>
    </div>
  );
}
