import React from 'react';
import { motion } from 'motion/react';
import { PencilLine, Grid, Activity, Brain, Sparkles } from 'lucide-react';

interface EducationPanelProps {
  isLoading?: boolean;
}

export default function EducationPanel({ isLoading = false }: EducationPanelProps) {
  const steps = [
    {
      num: 1,
      title: 'Canvas Drawing',
      desc: 'You draw lines on the screen. The computer tracks the raw X and Y coordinate paths of your brush.',
      icon: <PencilLine className="w-5 h-5 text-blue-600" />
    },
    {
      num: 2,
      title: 'Pixel Downsampling',
      desc: 'The drawing area is scaled down to a 28×28 pixel grid. This uniform shape normalizes position and size.',
      icon: <Grid className="w-5 h-5 text-indigo-600" />
    },
    {
      num: 3,
      title: 'Feature Extraction',
      desc: 'The ML model calculates structural metrics like circularity, aspect ratio, symmetry, and loops.',
      icon: <Activity className="w-5 h-5 text-purple-600" />
    },
    {
      num: 4,
      title: 'Softmax Prediction',
      desc: 'A classifier uses learned weights to compare features and output a final probability list.',
      icon: <Brain className="w-5 h-5 text-pink-600" />
    }
  ];

  if (isLoading) {
    return (
      <div className="bg-white/60 backdrop-blur-md border border-white/60 shadow-sm rounded-[2rem] p-6 h-full flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <motion.div
              className="w-5 h-5 rounded-md bg-indigo-200"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <motion.div
              className="h-5 w-48 bg-slate-200 rounded-md"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.1 }}
            />
          </div>
          <motion.div
            className="h-3 w-full bg-slate-200/70 rounded-md mb-6"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
          />

          {/* Skeleton Steps */}
          <div className="space-y-5">
            {[1, 2, 3, 4].map((step, idx) => (
              <div key={step} className="flex gap-4 relative">
                {idx < 3 && (
                  <div className="absolute left-[18px] top-9 bottom-[-16px] w-0.5 bg-slate-200/60" />
                )}
                
                <motion.div
                  className="w-9 h-9 rounded-xl bg-slate-200/80 flex items-center justify-center shrink-0 shadow-xs"
                  animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.98, 1.02, 0.98] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: idx * 0.15 }}
                />

                <div className="flex-1 space-y-1.5 pt-0.5">
                  <motion.div
                    className="h-2.5 w-16 bg-indigo-200 rounded-md"
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: idx * 0.15 + 0.1 }}
                  />
                  <motion.div
                    className="h-3.5 w-32 bg-slate-200 rounded-md"
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: idx * 0.15 + 0.2 }}
                  />
                  <motion.div
                    className="h-3 w-full bg-slate-200/60 rounded-md"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: idx * 0.15 + 0.3 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100">
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500 animate-spin" />
            <span className="text-xs font-semibold text-indigo-700">Updating pipeline feature vectors...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/60 backdrop-blur-md border border-white/60 shadow-sm rounded-[2rem] p-6 h-full flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-2 flex items-center gap-2">
          <Brain className="w-5 h-5 text-indigo-600" />
          <span>What is Machine Learning?</span>
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          How does the computer look at a sketch and guess what it is? It follows a pipeline modeled after biological neural networks:
        </p>

        {/* 4 Step Timeline */}
        <div className="space-y-5">
          {steps.map((step, idx) => (
            <div key={step.num} className="flex gap-4 relative">
              {idx < steps.length - 1 && (
                <div className="absolute left-[18px] top-9 bottom-[-16px] w-0.5 bg-slate-200" />
              )}
              
              <div className="w-9 h-9 rounded-xl bg-white/60 border border-white/80 flex items-center justify-center shrink-0 shadow-sm backdrop-blur-sm">
                {step.icon}
              </div>

              <div>
                <span className="text-[10px] font-bold font-mono text-indigo-600 uppercase tracking-wider block">
                  Step {step.num}
                </span>
                <h4 className="text-xs font-bold text-slate-800 mb-0.5">
                  {step.title}
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100">
        <div className="bg-white/40 backdrop-blur-sm border border-white/60 rounded-xl p-3 flex flex-col gap-1.5 shadow-sm">
          <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">AI Tip for Orientation</span>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Machine Learning models look for <strong>abstract patterns</strong> rather than matching pixels literally. Toggle <strong>AI Vision Mode</strong> during gameplay to see exactly what features the classifier is calculating!
          </p>
        </div>
      </div>
    </div>
  );
}

