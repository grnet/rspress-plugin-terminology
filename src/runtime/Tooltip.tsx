/**
 * Reusable Tooltip Component
 *
 * Lightweight native React tooltip implementation
 * No external dependencies required
 */

import React, {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import "./styles.css";

export interface TooltipProps {
  /** Content to display in the tooltip */
  overlay: ReactNode;
  /** Element that triggers the tooltip */
  children: React.ReactElement;
  /** Tooltip placement */
  placement?: "top" | "bottom" | "left" | "right";
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
  placement = "top",
  className = "",
  mouseEnterDelay = 300,
  mouseLeaveDelay = 100,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);

  // Generate a unique ID for ARIA relationship between trigger and tooltip
  const tooltipId = useId();

  const tooltipRef = useRef<HTMLDivElement>(null);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

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

  // Clone child and add event handlers + ARIA attributes
  const clonedChild = React.cloneElement(children, {
    "aria-describedby": tooltipId,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  } as React.HTMLAttributes<HTMLElement>);

  // Render tooltip only when visible (conditional rendering for performance)
  // ARIA: aria-describedby on child always points to tooltipId
  const tooltipContent = visible ? (
    <div
      className={`rspress-plugin-terminology-tooltip-wrapper rspress-plugin-terminology-tooltip-wrapper-${placement}`}
    >
      <div
        ref={tooltipRef}
        id={tooltipId}
        role="tooltip"
        className={`rspress-plugin-terminology-tooltip rspress-plugin-terminology-tooltip-visible ${className}`}
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
    <span style={{ position: "relative", display: "inline-block" }}>
      {clonedChild}
      {tooltipContent}
    </span>
  );
}

export default Tooltip;
