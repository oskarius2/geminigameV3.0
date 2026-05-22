import React, { useEffect } from 'react';
import { getStageIntroLabel } from '../content/survivalStages';

const DISPLAY_MS = 3000;

interface StageIntroOverlayProps {
  stage: number;
  onComplete?: () => void;
}

export const StageIntroOverlay: React.FC<StageIntroOverlayProps> = ({
  stage,
  onComplete,
}) => {
  useEffect(() => {
    const timer = window.setTimeout(() => onComplete?.(), DISPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="absolute inset-0 z-[120] pointer-events-none flex items-center justify-center overflow-hidden">
      <div className="stage-intro-overlay absolute inset-0" aria-hidden />
      <p className="stage-intro-text relative px-6 text-center select-none">
        {getStageIntroLabel(stage)}
      </p>
    </div>
  );
};
