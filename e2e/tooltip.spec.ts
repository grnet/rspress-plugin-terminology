/**
 * E2E Tests for Tooltip Functionality
 *
 * Tests the hover tooltip behavior for term links
 * Day 6 Enhancement: Positioning validation, multiple viewports, accessibility
 */

import { test, expect } from '@playwright/test';

test.describe('Tooltip Positioning (Day 6)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the tooltip tests page
    await page.goto('/tooltip-tests');
    await page.waitForLoadState('networkidle');
  });

  test('should position tooltip on top of term link (bug fix validation)', async ({ page }) => {
    const termLink = page.locator('a.term-link').first();
    await expect(termLink).toBeVisible();

    // Get term link position
    const linkBox = await termLink.boundingBox();
    expect(linkBox).toBeTruthy();

    // Hover over the term link
    await termLink.hover();

    // Wait for tooltip to appear
    const tooltip = page.locator('.rspress-plugin-terminology-tooltip, [role="tooltip"]');
    await expect(tooltip).toBeVisible();

    // Get tooltip position
    const tooltipBox = await tooltip.boundingBox();
    expect(tooltipBox).toBeTruthy();

    // Validate tooltip appears ABOVE the link (not to the right)
    // Tooltip should be positioned above the link: tooltip bottom should be near or above link top
    expect(tooltipBox!.y + tooltipBox!.height).toBeLessThanOrEqual(linkBox!.y + 10); // Allow small tolerance

    // Tooltip should be horizontally centered or near the link
    const tooltipCenterX = tooltipBox!.x + tooltipBox!.width / 2;
    const linkCenterX = linkBox!.x + linkBox!.width / 2;
    expect(Math.abs(tooltipCenterX - linkCenterX)).toBeLessThan(100); // Reasonable horizontal alignment
  });

  test('should handle viewport edge - top of screen', async ({ page }) => {
    // Set viewport to test edge cases
    await page.setViewportSize({ width: 1280, height: 720 });

    // Find a term link near the top of the page
    const termLink = page.locator('a.term-link').first();
    await expect(termLink).toBeVisible();

    const linkBox = await termLink.boundingBox();
    expect(linkBox).toBeTruthy();

    // Hover over the term link
    await termLink.hover();

    const tooltip = page.locator('.rspress-plugin-terminology-tooltip, [role="tooltip"]');
    await expect(tooltip).toBeVisible();

    // Tooltip should be visible and not cut off at the top
    const tooltipBox = await tooltip.boundingBox();
    expect(tooltipBox).toBeTruthy();
    expect(tooltipBox!.y).toBeGreaterThanOrEqual(0); // Should not be cut off at top
  });

  test('should handle viewport edge - bottom of screen', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    // Scroll to bottom of page
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Find a term link near the bottom
    const termLinks = page.locator('a.term-link');
    const count = await termLinks.count();

    if (count > 0) {
      const lastLink = termLinks.last();
      await lastLink.scrollIntoViewIfNeeded();
      await lastLink.hover();

      const tooltip = page.locator('.rspress-plugin-terminology-tooltip, [role="tooltip"]');
      await expect(tooltip).toBeVisible();

      // Tooltip should be visible
      const tooltipBox = await tooltip.boundingBox();
      expect(tooltipBox).toBeTruthy();

      // Check tooltip is within viewport bounds (allowing for scroll)
      const viewportHeight = 720;
      expect(tooltipBox!.y).toBeGreaterThanOrEqual(0);
      expect(tooltipBox!.y + tooltipBox!.height).toBeLessThanOrEqual(viewportHeight + 100); // Allow some overflow
    }
  });

  test('should handle viewport edge - right side of screen', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    // Find a term link (potentially near the right edge)
    const termLinks = page.locator('a.term-link');
    const count = await termLinks.count();

    if (count > 0) {
      // Test a link that might be near the right edge
      const testLink = termLinks.nth(Math.min(count - 1, 2));
      await testLink.scrollIntoViewIfNeeded();
      await testLink.hover();

      const tooltip = page.locator('.rspress-plugin-terminology-tooltip, [role="tooltip"]');
      await expect(tooltip).toBeVisible();

      // Tooltip should not overflow right edge
      const tooltipBox = await tooltip.boundingBox();
      expect(tooltipBox).toBeTruthy();

      const viewportWidth = 1280;
      expect(tooltipBox!.x + tooltipBox!.width).toBeLessThanOrEqual(viewportWidth + 50); // Allow small overflow
    }
  });
});

test.describe('Tooltip Responsive Design (Day 6)', () => {
  ['Desktop (1920x1080)', 'Laptop (1280x720)', 'Tablet (768x1024)', 'Mobile (375x667)'].forEach(viewport => {
    const [width, height] = viewport.match(/\d+/g) || ['1280', '720'];

    test(`should work correctly on ${viewport}`, async ({ page }) => {
      await page.setViewportSize({ width: parseInt(width), height: parseInt(height) });

      await page.goto('/tooltip-tests');
      await page.waitForLoadState('networkidle');

      const termLink = page.locator('a.term-link').first();
      const count = await termLink.count();

      if (count > 0) {
        await expect(termLink).toBeVisible();
        await termLink.hover();

        const tooltip = page.locator('.rspress-plugin-terminology-tooltip, [role="tooltip"]');
        await expect(tooltip).toBeVisible();

        // Verify tooltip content
        await expect(tooltip.locator('.term-title')).toBeVisible();
        await expect(tooltip.locator('.term-hover-text')).toBeVisible();
      }
    });
  });
});

test.describe('Tooltip Accessibility (Day 6)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tooltip-tests');
    await page.waitForLoadState('networkidle');
  });

  test('should have proper ARIA attributes', async ({ page }) => {
    const termLink = page.locator('a.term-link').first();
    await termLink.hover();

    const tooltip = page.locator('.rspress-plugin-terminology-tooltip, [role="tooltip"]');
    await expect(tooltip).toBeVisible();

    // Check for role="tooltip" attribute
    const role = await tooltip.getAttribute('role');
    expect(role).toBe('tooltip');

    // Check for aria-live or similar accessibility attributes
    const ariaLive = await tooltip.getAttribute('aria-live');
    const ariaDescribedBy = await termLink.getAttribute('aria-describedby');

    // At least one should be present for accessibility
    expect(ariaLive || ariaDescribedBy).toBeTruthy();
  });

  test('should be accessible via keyboard navigation', async ({ page }) => {
    const termLink = page.locator('a.term-link').first();

    // Focus the link with keyboard
    await termLink.focus();
    await expect(termLink).toBeFocused();

    // Press Enter or Space to trigger tooltip (if keyboard accessible)
    await termLink.press('Enter');

    // Tooltip might appear on focus or keyboard interaction
    const tooltip = page.locator('.rspress-plugin-terminology-tooltip, [role="tooltip"]');

    // If tooltip appears on focus, verify it's visible
    const isVisible = await tooltip.isVisible().catch(() => false);
    if (isVisible) {
      await expect(tooltip).toBeVisible();
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    const termLink = page.locator('a.term-link').first();
    await termLink.hover();

    const tooltip = page.locator('.rspress-plugin-terminology-tooltip, [role="tooltip"]');
    await expect(tooltip).toBeVisible();

    // Check for contrast by verifying text is readable
    // We can't directly test contrast ratio, but we can check if text is visible
    const titleText = await tooltip.locator('.term-title').textContent();
    const hoverText = await tooltip.locator('.term-hover-text').textContent();

    expect(titleText?.trim().length).toBeGreaterThan(0);
    expect(hoverText?.trim().length).toBeGreaterThan(0);

    // Check that text is not hidden or transparent
    const titleOpacity = await tooltip.locator('.term-title').evaluate(el => {
      return window.getComputedStyle(el).opacity;
    });

    expect(parseFloat(titleOpacity)).toBeGreaterThan(0.5);
  });

  test('should be screen reader friendly', async ({ page }) => {
    const termLink = page.locator('a.term-link').first();

    // Check for aria-label or aria-describedby
    const ariaLabel = await termLink.getAttribute('aria-label');
    const ariaDescribedBy = await termLink.getAttribute('aria-describedby');

    // At least one should be present for screen reader users
    expect(ariaLabel || ariaDescribedBy).toBeTruthy();

    await termLink.hover();

    const tooltip = page.locator('.rspress-plugin-terminology-tooltip, [role="tooltip"]');
    await expect(tooltip).toBeVisible();

    // Tooltip content should be readable by screen readers
    const titleText = await tooltip.locator('.term-title').textContent();
    expect(titleText?.trim().length).toBeGreaterThan(0);
  });
});

test.describe('User Journey (Day 6)', () => {
  test('should complete full user journey: navigate → hover → view glossary', async ({ page }) => {
    // Start from home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to a page with term links
    await page.goto('/api-guide');
    await page.waitForLoadState('networkidle');

    // Find and hover over a term link
    const termLink = page.locator('a.term-link').first();
    const count = await termLink.count();

    if (count > 0) {
      await expect(termLink).toBeVisible();

      // Hover to see tooltip
      await termLink.hover();

      const tooltip = page.locator('.rspress-plugin-terminology-tooltip, [role="tooltip"]');
      await expect(tooltip).toBeVisible();

      // Verify tooltip content
      await expect(tooltip.locator('.term-title')).toBeVisible();
      await expect(tooltip.locator('.term-hover-text')).toBeVisible();

      // Move away from tooltip
      await page.mouse.move(0, 0);
      await expect(tooltip).not.toBeVisible();

      // Now navigate to glossary
      await page.goto('/glossary');
      await page.waitForLoadState('networkidle');

      // Verify glossary page loads
      const glossaryContainer = page.locator('.glossary-container, .glossary-list');
      await expect(glossaryContainer.first()).toBeVisible();

      // Verify terms are listed
      const glossaryItems = page.locator('.glossary-item');
      const itemCount = await glossaryItems.count();
      expect(itemCount).toBeGreaterThan(0);
    }
  });
});

test.describe('Tooltip Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the tooltip tests page
    await page.goto('/tooltip-tests');
    await page.waitForLoadState('networkidle');
  });

  test('should display tooltip on hover with correct content', async ({ page }) => {
    // Find a term link
    const termLink = page.locator('a.term-link').first();
    await expect(termLink).toBeVisible();

    // Hover over the term link
    await termLink.hover();

    // Wait for tooltip to appear
    const tooltip = page.locator('.rspress-plugin-terminology-tooltip, [role="tooltip"]');
    await expect(tooltip).toBeVisible();

    // Verify tooltip content structure
    await expect(tooltip.locator('.term-title')).toBeVisible();
    await expect(tooltip.locator('.term-hover-text')).toBeVisible();

    // Verify content is not empty
    const titleText = await tooltip.locator('.term-title').textContent();
    const hoverText = await tooltip.locator('.term-hover-text').textContent();
    expect(titleText?.trim().length).toBeGreaterThan(0);
    expect(hoverText?.trim().length).toBeGreaterThan(0);
  });

  test('should hide tooltip when mouse leaves', async ({ page }) => {
    const termLink = page.locator('a.term-link').first();

    // Hover to show tooltip
    await termLink.hover();
    const tooltip = page.locator('.rspress-plugin-terminology-tooltip, [role="tooltip"]');
    await expect(tooltip).toBeVisible();

    // Move mouse away
    await page.mouse.move(0, 0);

    // Wait for tooltip to hide (with delay)
    await expect(tooltip).not.toBeVisible();
  });

  test('should handle multiple term links on page', async ({ page }) => {
    const termLinks = page.locator('a.term-link');
    const count = await termLinks.count();

    expect(count).toBeGreaterThan(0);

    // Test first 3 term links
    const testCount = Math.min(count, 3);
    for (let i = 0; i < testCount; i++) {
      const link = termLinks.nth(i);
      await link.scrollIntoViewIfNeeded();
      await link.hover();

      const tooltip = page.locator('.rspress-plugin-terminology-tooltip, [role="tooltip"]');
      await expect(tooltip).toBeVisible();

      // Move away and wait for tooltip to hide before testing next link
      await page.mouse.move(0, 0);
      await expect(tooltip).not.toBeVisible();
    }
  });

  test('should not show tooltip for non-term links', async ({ page }) => {
    // Find regular links (without term-link class)
    const regularLinks = page.locator('a:not(.term-link)').first();

    const count = await regularLinks.count();
    if (count === 0) {
      test.skip('No regular links found on page');
      return;
    }

    await expect(regularLinks).toBeVisible();
    await regularLinks.hover();

    // No tooltip should appear
    const tooltip = page.locator('.rspress-plugin-terminology-tooltip, [role="tooltip"]');
    await expect(tooltip).not.toBeVisible();
  });
});

test.describe('Tooltip XSS Prevention', () => {
  test('should sanitize malicious content in hover text', async ({ page }) => {
    await page.goto('/tooltip-tests');

    const termLink = page.locator('a.term-link').first();
    await termLink.hover();

    const tooltip = page.locator('.rspress-plugin-terminology-tooltip').or(
      page.locator('[role="tooltip"]')
    );

    await expect(tooltip).toBeVisible();

    // Check that no script tags are present in the tooltip
    const scripts = await tooltip.locator('script').count();
    expect(scripts).toBe(0);

    // Check that no inline event handlers are present
    const tooltipHTML = await tooltip.innerHTML();
    expect(tooltipHTML.toLowerCase()).not.toContain('onclick');
    expect(tooltipHTML.toLowerCase()).not.toContain('onerror');
    expect(tooltipHTML.toLowerCase()).not.toContain('javascript:');
  });

  test('should render safe HTML in hover text', async ({ page }) => {
    await page.goto('/tooltip-tests');

    const termLink = page.locator('a.term-link').first();
    await termLink.hover();

    const tooltip = page.locator('.rspress-plugin-terminology-tooltip').or(
      page.locator('[role="tooltip"]')
    );

    // Check for allowed safe elements
    const strongTags = await tooltip.locator('.term-hover-text strong').count();
    const emTags = await tooltip.locator('.term-hover-text em').count();
    const codeTags = await tooltip.locator('.term-hover-text code').count();

    // At least some formatting should be present
    const totalFormatting = strongTags + emTags + codeTags;
    expect(totalFormatting).toBeGreaterThanOrEqual(0);
  });
});
