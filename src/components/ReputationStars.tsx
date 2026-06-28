import React from 'react';
import { Star } from 'lucide-react';

interface ReputationStarsProps {
  score: number | null;
  totalReviews: number;
  className?: string;
  size?: number;
}

export default function ReputationStars({ score, totalReviews, className = '', size = 16 }: ReputationStarsProps) {
  if (score === null || totalReviews === 0) {
    return (
      <div className={`flex items-center gap-1 text-slate-500 text-sm ${className}`}>
        <Star size={size} className="text-slate-600" />
        <span>No reviews yet</span>
      </div>
    );
  }

  const roundedScore = Math.round(score * 10) / 10;
  const fullStars = Math.floor(roundedScore);
  const hasHalfStar = roundedScore - fullStars >= 0.5;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex text-amber-400">
        {[...Array(5)].map((_, i) => {
          if (i < fullStars) {
            return <Star key={i} size={size} fill="currentColor" className="text-amber-400" />;
          }
          if (i === fullStars && hasHalfStar) {
            return (
              <div key={i} className="relative">
                <Star size={size} className="text-slate-600" />
                <div className="absolute inset-0 overflow-hidden w-1/2">
                  <Star size={size} fill="currentColor" className="text-amber-400" />
                </div>
              </div>
            );
          }
          return <Star key={i} size={size} className="text-slate-600" />;
        })}
      </div>
      <div className="flex items-center gap-1 text-sm">
        <span className="font-bold text-slate-200">{roundedScore.toFixed(1)}</span>
        <span className="text-slate-500">({totalReviews})</span>
      </div>
    </div>
  );
}
