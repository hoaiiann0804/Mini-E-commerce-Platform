import React, { ReactNode } from 'react';

interface ButtonGroupProps {
  children: ReactNode;
  className?: string;
  vertical?: boolean;
  attached?: boolean;
  fullWidth?: boolean;
}

const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  className = '',
  vertical = false,
  attached = true,
  fullWidth = false,
}) => {
  const baseClasses = 'inline-flex';
  const directionClasses = vertical ? 'flex-col' : 'flex-row';
  const widthClasses = fullWidth ? 'w-full' : '';

  const groupClasses =
    `${baseClasses} ${directionClasses} ${widthClasses} ${className}`.trim();

  const processedChildren = React.Children.map(children, (child, index) => {
    if (!React.isValidElement(child)) return child;

    const isFirst = index === 0;
    const isLast = index === React.Children.count(children) - 1;
    const isMiddle = !isFirst && !isLast;

    let additionalClasses = '';

    if (attached) {
      if (vertical) {
        if (isFirst) additionalClasses = 'rounded-b-none';
        else if (isLast) additionalClasses = 'rounded-t-none -mt-px';
        else if (isMiddle) additionalClasses = 'rounded-none -mt-px';
      } else {
        if (isFirst) additionalClasses = 'rounded-r-none';
        else if (isLast) additionalClasses = 'rounded-l-none -ml-px';
        else if (isMiddle) additionalClasses = 'rounded-none -ml-px';
      }
    }

    return React.cloneElement(child, {
      className: `${child.props.className || ''} ${additionalClasses}`.trim(),
    });
  });

  return <div className={groupClasses}>{processedChildren}</div>;
};

export default ButtonGroup;
