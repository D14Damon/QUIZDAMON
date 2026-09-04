import { AnimationPreset } from '../types';

export interface MotionConfig {
  initial: Record<string, any>;
  animate: Record<string, any>;
  exit?: Record<string, any>;
  transition: Record<string, any>;
  optionHover?: Record<string, any>;
  optionTap?: Record<string, any>;
}

export const getAnimationConfig = (preset: AnimationPreset = 'fade-slide'): MotionConfig => {
  switch (preset) {
    case 'slide-horizontal':
      return {
        initial: { opacity: 0, x: 40 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -40 },
        transition: { type: 'spring', stiffness: 320, damping: 28 },
        optionHover: { x: 4, transition: { duration: 0.15 } },
        optionTap: { scale: 0.98 },
      };

    case 'spring-pop':
      return {
        initial: { opacity: 0, scale: 0.88, y: 15 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.95 },
        transition: { type: 'spring', stiffness: 400, damping: 20 },
        optionHover: { scale: 1.025, transition: { type: 'spring', stiffness: 450, damping: 18 } },
        optionTap: { scale: 0.95 },
      };

    case 'gentle-float':
      return {
        initial: { opacity: 0, y: 24 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -16 },
        transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1] },
        optionHover: { y: -3, transition: { duration: 0.2, ease: 'easeOut' } },
        optionTap: { y: 0, scale: 0.99 },
      };

    case 'flip-card':
      return {
        initial: { opacity: 0, rotateX: 20, y: 20 },
        animate: { opacity: 1, rotateX: 0, y: 0 },
        exit: { opacity: 0, rotateX: -15 },
        transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
        optionHover: { scale: 1.015, y: -2, transition: { duration: 0.15 } },
        optionTap: { scale: 0.97 },
      };

    case 'stagger-reveal':
      return {
        initial: { opacity: 0, scale: 0.92, y: 10 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.9 },
        transition: { type: 'spring', stiffness: 500, damping: 26 },
        optionHover: { scale: 1.02, transition: { type: 'spring', stiffness: 600, damping: 22 } },
        optionTap: { scale: 0.96 },
      };

    case 'glitch-tech':
      return {
        initial: { opacity: 0, x: -15, filter: 'blur(3px)' },
        animate: { opacity: 1, x: 0, filter: 'blur(0px)' },
        exit: { opacity: 0, x: 15, filter: 'blur(3px)' },
        transition: { duration: 0.25, ease: 'easeInOut' },
        optionHover: { x: 3, transition: { duration: 0.1 } },
        optionTap: { scale: 0.97 },
      };

    case 'cinema-zoom':
      return {
        initial: { opacity: 0, scale: 0.94, filter: 'blur(3px)' },
        animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
        exit: { opacity: 0, scale: 1.04 },
        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
        optionHover: { scale: 1.02, transition: { duration: 0.18 } },
        optionTap: { scale: 0.97 },
      };

    case 'elastic-snap':
      return {
        initial: { opacity: 0, y: -20, scale: 0.96 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 20 },
        transition: { type: 'spring', stiffness: 450, damping: 25 },
        optionHover: { scale: 1.015, x: 2, transition: { duration: 0.1 } },
        optionTap: { scale: 0.96 },
      };

    case 'paper-unfold':
      return {
        initial: { opacity: 0, y: 12, scaleY: 0.95 },
        animate: { opacity: 1, y: 0, scaleY: 1 },
        exit: { opacity: 0, y: -8, scaleY: 0.97 },
        transition: { duration: 0.42, ease: [0.19, 1, 0.22, 1] },
        optionHover: { y: -2, transition: { duration: 0.15 } },
        optionTap: { scale: 0.985 },
      };

    case 'fade-slide':
    default:
      return {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -12 },
        transition: { duration: 0.32, ease: 'easeOut' },
        optionHover: { y: -2, transition: { duration: 0.15 } },
        optionTap: { scale: 0.98 },
      };
  }
};
