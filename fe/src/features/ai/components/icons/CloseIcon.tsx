import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

const CloseIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size }) => {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
};

export default CloseIcon;
