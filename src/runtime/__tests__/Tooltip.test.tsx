/**
 * Unit Tests for Tooltip Component
 *
 * Tests the tooltip overlay functionality with hover delays and positioning
 */

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import Tooltip from "../Tooltip";

describe("Tooltip Component", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe("basic rendering", () => {
    it("should render children without tooltip initially", () => {
      render(
        <Tooltip overlay={<div>Tooltip content</div>}>
          <button>Trigger</button>
        </Tooltip>,
      );

      const trigger = screen.getByRole("button", { name: "Trigger" });
      expect(trigger).toBeInTheDocument();

      // Tooltip should not be visible initially
      const tooltip = screen.queryByText("Tooltip content");
      expect(tooltip).not.toBeInTheDocument();
    });

    it("should show tooltip on hover after delay", async () => {
      render(
        <Tooltip overlay={<div>Tooltip content</div>} mouseEnterDelay={300}>
          <button>Trigger</button>
        </Tooltip>,
      );

      const trigger = screen.getByRole("button", { name: "Trigger" });

      // Hover over trigger
      fireEvent.mouseEnter(trigger);

      // Tooltip should not show immediately
      expect(screen.queryByText("Tooltip content")).not.toBeInTheDocument();

      // Advance timers past the delay
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Tooltip should now be visible
      await waitFor(() => {
        expect(screen.getByText("Tooltip content")).toBeInTheDocument();
      });
    });

    it("should hide tooltip on mouse leave after delay", async () => {
      render(
        <Tooltip
          overlay={<div>Tooltip content</div>}
          mouseEnterDelay={100}
          mouseLeaveDelay={200}
        >
          <button>Trigger</button>
        </Tooltip>,
      );

      const trigger = screen.getByRole("button", { name: "Trigger" });

      // Show tooltip
      fireEvent.mouseEnter(trigger);
      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(screen.getByText("Tooltip content")).toBeInTheDocument();
      });

      // Mouse leave
      fireEvent.mouseLeave(trigger);

      // Tooltip should still be visible (delay not passed)
      expect(screen.getByText("Tooltip content")).toBeInTheDocument();

      // Advance past hide delay
      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Tooltip should be hidden
      await waitFor(() => {
        expect(screen.queryByText("Tooltip content")).not.toBeInTheDocument();
      });
    });
  });

  describe("placement", () => {
    it("should apply correct class for top placement", async () => {
      render(
        <Tooltip
          overlay={<div>Tooltip content</div>}
          placement="top"
          mouseEnterDelay={0}
        >
          <button>Trigger</button>
        </Tooltip>,
      );

      fireEvent.mouseEnter(screen.getByRole("button"));

      await waitFor(() => {
        const wrapper = document.querySelector(
          ".rspress-plugin-terminology-tooltip-wrapper-top",
        );
        expect(wrapper).toBeInTheDocument();
      });
    });

    it("should apply correct class for bottom placement", async () => {
      render(
        <Tooltip
          overlay={<div>Tooltip content</div>}
          placement="bottom"
          mouseEnterDelay={0}
        >
          <button>Trigger</button>
        </Tooltip>,
      );

      fireEvent.mouseEnter(screen.getByRole("button"));

      await waitFor(() => {
        const wrapper = document.querySelector(
          ".rspress-plugin-terminology-tooltip-wrapper-bottom",
        );
        expect(wrapper).toBeInTheDocument();
      });
    });

    it("should apply correct class for left placement", async () => {
      render(
        <Tooltip
          overlay={<div>Tooltip content</div>}
          placement="left"
          mouseEnterDelay={0}
        >
          <button>Trigger</button>
        </Tooltip>,
      );

      fireEvent.mouseEnter(screen.getByRole("button"));

      await waitFor(() => {
        const wrapper = document.querySelector(
          ".rspress-plugin-terminology-tooltip-wrapper-left",
        );
        expect(wrapper).toBeInTheDocument();
      });
    });

    it("should apply correct class for right placement", async () => {
      render(
        <Tooltip
          overlay={<div>Tooltip content</div>}
          placement="right"
          mouseEnterDelay={0}
        >
          <button>Trigger</button>
        </Tooltip>,
      );

      fireEvent.mouseEnter(screen.getByRole("button"));

      await waitFor(() => {
        const wrapper = document.querySelector(
          ".rspress-plugin-terminology-tooltip-wrapper-right",
        );
        expect(wrapper).toBeInTheDocument();
      });
    });
  });

  describe("delay configuration", () => {
    it("should respect custom mouseEnterDelay", async () => {
      render(
        <Tooltip overlay={<div>Tooltip content</div>} mouseEnterDelay={500}>
          <button>Trigger</button>
        </Tooltip>,
      );

      fireEvent.mouseEnter(screen.getByRole("button"));

      // Should not show at 300ms
      act(() => {
        jest.advanceTimersByTime(300);
      });
      expect(screen.queryByText("Tooltip content")).not.toBeInTheDocument();

      // Should show at 500ms
      act(() => {
        jest.advanceTimersByTime(200);
      });

      await waitFor(() => {
        expect(screen.getByText("Tooltip content")).toBeInTheDocument();
      });
    });

    it("should respect custom mouseLeaveDelay", async () => {
      render(
        <Tooltip
          overlay={<div>Tooltip content</div>}
          mouseEnterDelay={0}
          mouseLeaveDelay={500}
        >
          <button>Trigger</button>
        </Tooltip>,
      );

      const trigger = screen.getByRole("button");

      // Show tooltip
      fireEvent.mouseEnter(trigger);
      await waitFor(() => {
        expect(screen.getByText("Tooltip content")).toBeInTheDocument();
      });

      // Start hiding
      fireEvent.mouseLeave(trigger);

      // Should still be visible at 300ms
      act(() => {
        jest.advanceTimersByTime(300);
      });
      expect(screen.getByText("Tooltip content")).toBeInTheDocument();

      // Should be hidden at 500ms
      act(() => {
        jest.advanceTimersByTime(200);
      });

      await waitFor(() => {
        expect(screen.queryByText("Tooltip content")).not.toBeInTheDocument();
      });
    });
  });

  describe("interactive tooltip", () => {
    it("should keep tooltip visible when hovering over it", async () => {
      render(
        <Tooltip
          overlay={<div>Tooltip content</div>}
          mouseEnterDelay={0}
          mouseLeaveDelay={200}
        >
          <button>Trigger</button>
        </Tooltip>,
      );

      const trigger = screen.getByRole("button");

      // Show tooltip
      fireEvent.mouseEnter(trigger);
      await waitFor(() => {
        expect(screen.getByText("Tooltip content")).toBeInTheDocument();
      });

      // Mouse leave trigger
      fireEvent.mouseLeave(trigger);

      // Before hide delay, hover over tooltip
      const tooltip = document.querySelector(
        ".rspress-plugin-terminology-tooltip",
      );
      expect(tooltip).toBeInTheDocument();

      act(() => {
        fireEvent.mouseEnter(tooltip!);
      });

      // Advance timers - tooltip should still be visible
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(screen.getByText("Tooltip content")).toBeInTheDocument();
    });

    it("should hide tooltip when leaving tooltip itself", async () => {
      render(
        <Tooltip
          overlay={<div>Tooltip content</div>}
          mouseEnterDelay={0}
          mouseLeaveDelay={100}
        >
          <button>Trigger</button>
        </Tooltip>,
      );

      const trigger = screen.getByRole("button");

      // Show tooltip
      fireEvent.mouseEnter(trigger);
      await waitFor(() => {
        expect(screen.getByText("Tooltip content")).toBeInTheDocument();
      });

      const tooltip = document.querySelector(
        ".rspress-plugin-terminology-tooltip",
      );

      // Mouse leave tooltip
      fireEvent.mouseLeave(tooltip!);

      // Advance past hide delay
      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(screen.queryByText("Tooltip content")).not.toBeInTheDocument();
      });
    });
  });

  describe("custom className", () => {
    it("should apply custom className to tooltip", async () => {
      render(
        <Tooltip
          overlay={<div>Tooltip content</div>}
          className="custom-tooltip"
          mouseEnterDelay={0}
        >
          <button>Trigger</button>
        </Tooltip>,
      );

      fireEvent.mouseEnter(screen.getByRole("button"));

      await waitFor(() => {
        const tooltip = document.querySelector(
          ".rspress-plugin-terminology-tooltip.custom-tooltip",
        );
        expect(tooltip).toBeInTheDocument();
      });
    });
  });

  describe("cleanup", () => {
    it("should clear timers on unmount", () => {
      const clearTimeoutSpy = jest.spyOn(window, "clearTimeout");

      const { unmount } = render(
        <Tooltip overlay={<div>Tooltip content</div>}>
          <button>Trigger</button>
        </Tooltip>,
      );

      const trigger = screen.getByRole("button");
      fireEvent.mouseEnter(trigger);

      unmount();

      // Should have cleared the timer
      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });

    it("should cancel pending show on quick mouse leave", () => {
      render(
        <Tooltip overlay={<div>Tooltip content</div>} mouseEnterDelay={300}>
          <button>Trigger</button>
        </Tooltip>,
      );

      const trigger = screen.getByRole("button");

      // Start hover
      fireEvent.mouseEnter(trigger);

      // Leave before delay
      act(() => {
        jest.advanceTimersByTime(100);
      });
      fireEvent.mouseLeave(trigger);

      // Advance past original show delay
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Tooltip should not have shown
      expect(screen.queryByText("Tooltip content")).not.toBeInTheDocument();
    });
  });

  describe("overlay content", () => {
    it("should render complex overlay content", async () => {
      render(
        <Tooltip
          overlay={
            <div>
              <h4>Title</h4>
              <p>Description</p>
            </div>
          }
          mouseEnterDelay={0}
        >
          <button>Trigger</button>
        </Tooltip>,
      );

      fireEvent.mouseEnter(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("Title")).toBeInTheDocument();
        expect(screen.getByText("Description")).toBeInTheDocument();
      });
    });

    it("should handle null overlay", () => {
      render(
        <Tooltip overlay={null} mouseEnterDelay={0}>
          <button>Trigger</button>
        </Tooltip>,
      );

      fireEvent.mouseEnter(screen.getByRole("button"));

      // Tooltip wrapper should still render but without content
      act(() => {
        jest.advanceTimersByTime(0);
      });

      const wrapper = document.querySelector(
        ".rspress-plugin-terminology-tooltip-wrapper",
      );
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe("positioning calculations", () => {
    it("should apply top wrapper positioning for top placement", async () => {
      render(
        <Tooltip
          overlay={<div>Tooltip content</div>}
          placement="top"
          mouseEnterDelay={0}
        >
          <button>Trigger</button>
        </Tooltip>,
      );

      fireEvent.mouseEnter(screen.getByRole("button"));

      await waitFor(() => {
        // Verify wrapper has top placement class
        const wrapper = document.querySelector(
          ".rspress-plugin-terminology-tooltip-wrapper-top",
        );
        expect(wrapper).toBeInTheDocument();

        // Verify tooltip is inside wrapper
        const tooltip = wrapper?.querySelector(
          ".rspress-plugin-terminology-tooltip",
        );
        expect(tooltip).toBeInTheDocument();
      });
    });

    it("should apply bottom wrapper positioning for bottom placement", async () => {
      render(
        <Tooltip
          overlay={<div>Tooltip content</div>}
          placement="bottom"
          mouseEnterDelay={0}
        >
          <button>Trigger</button>
        </Tooltip>,
      );

      fireEvent.mouseEnter(screen.getByRole("button"));

      await waitFor(() => {
        // Verify wrapper has bottom placement class
        const wrapper = document.querySelector(
          ".rspress-plugin-terminology-tooltip-wrapper-bottom",
        );
        expect(wrapper).toBeInTheDocument();

        // Verify tooltip is inside wrapper
        const tooltip = wrapper?.querySelector(
          ".rspress-plugin-terminology-tooltip",
        );
        expect(tooltip).toBeInTheDocument();
      });
    });

    it("should apply left wrapper positioning for left placement", async () => {
      render(
        <Tooltip
          overlay={<div>Tooltip content</div>}
          placement="left"
          mouseEnterDelay={0}
        >
          <button>Trigger</button>
        </Tooltip>,
      );

      fireEvent.mouseEnter(screen.getByRole("button"));

      await waitFor(() => {
        // Verify wrapper has left placement class
        const wrapper = document.querySelector(
          ".rspress-plugin-terminology-tooltip-wrapper-left",
        );
        expect(wrapper).toBeInTheDocument();

        // Verify tooltip is inside wrapper
        const tooltip = wrapper?.querySelector(
          ".rspress-plugin-terminology-tooltip",
        );
        expect(tooltip).toBeInTheDocument();
      });
    });

    it("should apply right wrapper positioning for right placement", async () => {
      render(
        <Tooltip
          overlay={<div>Tooltip content</div>}
          placement="right"
          mouseEnterDelay={0}
        >
          <button>Trigger</button>
        </Tooltip>,
      );

      fireEvent.mouseEnter(screen.getByRole("button"));

      await waitFor(() => {
        // Verify wrapper has right placement class
        const wrapper = document.querySelector(
          ".rspress-plugin-terminology-tooltip-wrapper-right",
        );
        expect(wrapper).toBeInTheDocument();

        // Verify tooltip is inside wrapper
        const tooltip = wrapper?.querySelector(
          ".rspress-plugin-terminology-tooltip",
        );
        expect(tooltip).toBeInTheDocument();
      });
    });

    it("should render tooltip with correct structure for centering", async () => {
      render(
        <Tooltip
          overlay={<div>Tooltip content</div>}
          placement="top"
          mouseEnterDelay={0}
        >
          <button>Trigger</button>
        </Tooltip>,
      );

      fireEvent.mouseEnter(screen.getByRole("button"));

      await waitFor(() => {
        // Verify complete structure: span > wrapper > tooltip
        const span = document.querySelector(
          'span[style*="position: relative"]',
        );
        expect(span).toBeInTheDocument();

        const wrapper = span?.querySelector(
          ".rspress-plugin-terminology-tooltip-wrapper",
        );
        expect(wrapper).toBeInTheDocument();

        const tooltip = wrapper?.querySelector(
          ".rspress-plugin-terminology-tooltip",
        );
        expect(tooltip).toBeInTheDocument();
      });
    });

    it("should apply default top placement when placement prop is not specified", async () => {
      render(
        <Tooltip overlay={<div>Tooltip content</div>} mouseEnterDelay={0}>
          <button>Trigger</button>
        </Tooltip>,
      );

      fireEvent.mouseEnter(screen.getByRole("button"));

      await waitFor(() => {
        // Should default to top placement
        const wrapper = document.querySelector(
          ".rspress-plugin-terminology-tooltip-wrapper-top",
        );
        expect(wrapper).toBeInTheDocument();
      });
    });
  });
});
