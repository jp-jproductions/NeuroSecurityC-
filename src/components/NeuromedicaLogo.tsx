import React, { useState } from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const NeuromedicaLogo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
}) => {
  const [imgSrc, setImgSrc] = useState('/assets/logo.png');
  const [hasError, setHasError] = useState(false);

  const heightClasses = {
    sm: 'h-7',
    md: 'h-9',
    lg: 'h-11',
    xl: 'h-14',
  };

  const handleImageError = () => {
    if (imgSrc === '/assets/logo.png') {
      setImgSrc('/assets/aistudio/logo_neuromedica_dbc6c102.webp');
    } else {
      setHasError(true);
    }
  };

  return (
    <div className={`flex items-center select-none ${className}`}>
      {!hasError ? (
        <img
          src={imgSrc}
          alt="NEUROMÉDICA"
          className={`${heightClasses[size]} w-auto object-contain`}
          onError={handleImageError}
        />
      ) : (
        <div className="flex items-center gap-1 font-sans">
          <span className="font-extrabold text-2xl tracking-tight text-[#00a6e4]">Neuro</span>
          <span className="font-extrabold text-2xl tracking-tight text-[#1a1a37]">médica</span>
          <span className="text-[#00a6e4] text-2xl font-light">)</span>
        </div>
      )}
    </div>
  );
};
