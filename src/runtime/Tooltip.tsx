/**
 * Reusable Tooltip Component
 *
 * Lightweight native React tooltip implementation
 * No external dependencies required
 */

import React, { ReactNode, useState, useRef, useEffect, useCallback } from 'react';
import './styles.css';

export interface TooltipProps {
  /** Content to display in the tooltip */
  overlay: ReactNode;
  /** Element that triggers the tooltip */
  children: React.ReactElement;
  /** Tooltip placement */
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** Additional CSS class for tooltip */
  className?: string;
  /** Delay before showing tooltip (ms) */
  mouseEnterDelay?: number;
  /** Delay before hiding tooltip (ms) */
  mouseLeaveDelay?: number;
}

/**
 * Native React Tooltip component
 * Uses CSS positioning for lightweight tooltip functionality
 */
export function Tooltip({
  overlay,
  children,
  placement = 'top',
  className = '',
  mouseEnterDelay = 300,
  mouseLeaveDelay = 100,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);

  const tooltipRef = useRef<HTMLDivElement>(null);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Clear any pending timers
  const clearTimers = useCallback(() => {
    if (showTimerRef.current !== undefined) {
      window.clearTimeout(showTimerRef.current);
      showTimerRef.current = undefined;
    }
    if (hideTimerRef.current !== undefined) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = undefined;
    }
  }, []);

  // Handle mouse enter - start delay timer
  const handleMouseEnter = useCallback(() => {
    clearTimers();
    showTimerRef.current = setTimeout(() => {
      setVisible(true);
    }, mouseEnterDelay) as unknown as ReturnType<typeof setTimeout>;
  }, [mouseEnterDelay, clearTimers]);

  // Handle mouse leave - start hide delay timer
  const handleMouseLeave = useCallback(() => {
    clearTimers();
    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
    }, mouseLeaveDelay) as unknown as ReturnType<typeof setTimeout>;
  }, [mouseLeaveDelay, clearTimers]);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  // Clone child and add event handlers
  const clonedChild = React.cloneElement(children, {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  } as React.HTMLAttributes<HTMLElement>);

  // Render tooltip when visible
  const tooltipContent = visible ? (
    <div
      className={`rspress-terminology-tooltip-wrapper rspress-terminology-tooltip-wrapper-${placement}`}
    >
      <div
        ref={tooltipRef}
        className={`rspress-terminology-tooltip ${className}`}
        onMouseEnter={() => {
          clearTimers();
        }}
        onMouseLeave={handleMouseLeave}
      >
        {overlay}
      </div>
    </div>
  ) : null;

  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      {clonedChild}
      {tooltipContent}
    </span>
  );
}

export default Tooltip;
