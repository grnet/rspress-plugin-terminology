/**
 * Reusable Tooltip Component
 *
 * Uses a React portal to render tooltips at document.body level,
 * ensuring they escape all parent stacking contexts (e.g. tables).
 */

import React, {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
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

const TOOLTIP_GAP = 8; // px, gap between trigger and tooltip

/**
 * Native React Tooltip component
 * Renders via portal to document.body so the tooltip is never clipped
 * by parent overflow or stacking contexts.
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
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const tooltipId = useId();

  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

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

  const updatePosition = useCallback(() => {
    const triggerEl = triggerRef.current;
    const tooltipEl = tooltipRef.current;
    if (!triggerEl || !tooltipEl) return;

    const triggerRect = triggerEl.getBoundingClientRect();
    const tooltipRect = tooltipEl.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    let top = 0;
    let left = 0;

    switch (placement) {
      case "top":
        top = triggerRect.top + scrollY - tooltipRect.height - TOOLTIP_GAP;
        left =
          triggerRect.left +
          scrollX +
          triggerRect.width / 2 -
          tooltipRect.width / 2;
        break;
      case "bottom":
        top = triggerRect.bottom + scrollY + TOOLTIP_GAP;
        left =
          triggerRect.left +
          scrollX +
          triggerRect.width / 2 -
          tooltipRect.width / 2;
        break;
      case "left":
        top =
          triggerRect.top +
          scrollY +
          triggerRect.height / 2 -
          tooltipRect.height / 2;
        left = triggerRect.left + scrollX - tooltipRect.width - TOOLTIP_GAP;
        break;
      case "right":
        top =
          triggerRect.top +
          scrollY +
          triggerRect.height / 2 -
          tooltipRect.height / 2;
        left = triggerRect.right + scrollX + TOOLTIP_GAP;
        break;
    }

    setPosition({ top, left });
  }, [placement]);

  const handleMouseEnter = useCallback(() => {
    clearTimers();
    showTimerRef.current = setTimeout(() => {
      setVisible(true);
    }, mouseEnterDelay) as unknown as ReturnType<typeof setTimeout>;
  }, [mouseEnterDelay, clearTimers]);

  const handleMouseLeave = useCallback(() => {
    clearTimers();
    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
    }, mouseLeaveDelay) as unknown as ReturnType<typeof setTimeout>;
  }, [mouseLeaveDelay, clearTimers]);

  // Position the tooltip after it renders
  useEffect(() => {
    if (!visible) return;

    const frame = requestAnimationFrame(() => {
      updatePosition();
    });
    return () => cancelAnimationFrame(frame);
  }, [visible, updatePosition]);

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

  const tooltipContent =
    visible && typeof document !== "undefined"
      ? createPortal(
          <div
            className={`rspress-plugin-terminology-tooltip-wrapper rspress-plugin-terminology-tooltip-wrapper-${placement}`}
            style={{
              position: "absolute",
              top: position.top,
              left: position.left,
              zIndex: 10000,
            }}
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
          </div>,
          document.body,
        )
      : null;

  return (
    <span ref={triggerRef} style={{ display: "inline" }}>
      {clonedChild}
      {tooltipContent}
    </span>
  );
}

export default Tooltip;
