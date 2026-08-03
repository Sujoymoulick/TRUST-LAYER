import React from 'react';
import { motion } from 'framer-motion';

interface TrustScoreCircleProps {
  score: number;
  maxScore?: number;
}

const TrustScoreCircle: React.FC<TrustScoreCircleProps> = ({ score, maxScore = 1000 }) => {
  const percentage = (score / maxScore) * 100;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-64 h-64">
      <svg className="w-full h-full transform -rotate-90">
        {/* Background Circle */}
        <circle
          cx="128"
          cy="128"
          r={radius}
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth="12"
          fill="transparent"
        />
        {/* Progress Circle */}
        <motion.circle
          cx="128"
          cy="128"
          r={radius}
          stroke="url(#scoreGradient)"
          strokeWidth="12"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 2, ease: "easeOut" }}
          strokeLinecap="round"
          fill="transparent"
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-6xl font-bold text-white tracking-tighter"
        >
          {score}
        </motion.span>
        <motion.span 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.8 }}
          className="text-sm uppercase tracking-widest text-slate-400 font-medium"
        >
          Trust Score
        </motion.span>
      </div>
      
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-3xl -z-10" />
    </div>
  );
};

export default TrustScoreCircle;
