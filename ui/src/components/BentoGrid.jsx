import React from 'react';

/**
 * BentoGrid Component
 * Responsive "bento" layout wrapper for dashboard cards.
 */
const BentoGrid = ({ children, className = '' }) => {
  return (
    <div
      className={[
        'grid grid-cols-1 gap-4',
        // Fixed row sizing on large screens so the dashboard fits the viewport.
        'lg:grid-cols-4 lg:grid-rows-[repeat(3,minmax(180px,1fr))_auto]',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
};

export default BentoGrid;
