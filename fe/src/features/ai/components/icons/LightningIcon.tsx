import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

const LightningIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => {
  return (
    <svg className={className} width={size} height={size} fill="currentColor" viewBox="0 0 20 20">
      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
};

export default LightningIcon;
