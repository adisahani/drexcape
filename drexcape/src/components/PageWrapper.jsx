import React from 'react';

const PageWrapper = ({ children, className = '', containerClass = 'container' }) => {
  return (
    <div className={`page-wrapper ${className}`}>
      <div className={containerClass}>
        {children}
      </div>
    </div>
  );
};

export default PageWrapper; 