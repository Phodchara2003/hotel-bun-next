'use client';

import { useStaggerAnimation } from '../hooks/useScrollAnimation';

// Fade In Animation Component
export const FadeInUp = ({ children, delay = 0, className = '' }) => {
  const [ref, isVisible] = useStaggerAnimation(delay);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-8'
      } ${className}`}
    >
      {children}
    </div>
  );
};

// Fade In Left Animation
export const FadeInLeft = ({ children, delay = 0, className = '' }) => {
  const [ref, isVisible] = useStaggerAnimation(delay);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible
          ? 'opacity-100 translate-x-0'
          : 'opacity-0 -translate-x-8'
      } ${className}`}
    >
      {children}
    </div>
  );
};

// Fade In Right Animation
export const FadeInRight = ({ children, delay = 0, className = '' }) => {
  const [ref, isVisible] = useStaggerAnimation(delay);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible
          ? 'opacity-100 translate-x-0'
          : 'opacity-0 translate-x-8'
      } ${className}`}
    >
      {children}
    </div>
  );
};

// Scale Up Animation
export const ScaleIn = ({ children, delay = 0, className = '' }) => {
  const [ref, isVisible] = useStaggerAnimation(delay);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible
          ? 'opacity-100 scale-100'
          : 'opacity-0 scale-95'
      } ${className}`}
    >
      {children}
    </div>
  );
};

// Stagger Container - สำหรับทำให้ child elements แสดงทีละตัว
export const StaggerContainer = ({ children, className = '', staggerDelay = 200 }) => {
  return (
    <div className={className}>
      {Array.isArray(children)
        ? children.map((child, index) => (
            <FadeInUp key={index} delay={index * staggerDelay}>
              {child}
            </FadeInUp>
          ))
        : children}
    </div>
  );
};