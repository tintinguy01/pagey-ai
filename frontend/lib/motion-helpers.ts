'use client';

import { 
  motion, 
  HTMLMotionProps 
} from 'framer-motion';
import { ComponentType, ForwardRefExoticComponent, RefAttributes } from 'react';

/**
 * Create a motion component using the newer API (motion.create) instead of 
 * the deprecated motion() function.
 * 
 * This is a helper to transition away from deprecated API.
 * 
 * @param Component The component to create a motion version of
 * @returns A motion component
 */
export function createMotionComponent<
  P extends object,
  RefType = unknown
>(
  Component: ComponentType<P> | ForwardRefExoticComponent<P & RefAttributes<RefType>>
) {
  return motion(Component);
}

// Common motion component types for type safety
export type MotionDivProps = HTMLMotionProps<'div'>;
export type MotionButtonProps = HTMLMotionProps<'button'>;
export type MotionSpanProps = HTMLMotionProps<'span'>;
export type MotionParagraphProps = HTMLMotionProps<'p'>; 