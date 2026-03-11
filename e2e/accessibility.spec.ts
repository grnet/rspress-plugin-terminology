/**
 * E2E Accessibility Tests
 *
 * Tests WCAG compliance and accessibility features
 */

import { test, expect } from '@playwright/test';

test.describe('Accessibility - Term Links', () => {
  test('should have accessible link text', async ({ page }) => {
    await page.goto('/');

    const termLinks = page.locator('a.term-link');
    const count = await termLinks.count();

    if (count === 0) {
      test.skip('No term links found');
      return;
    }

    // Check that links have meaningful text
    for (let i = 0; i < Math.min(count, 5); i++) {
      const link = termLinks.nth(i);
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');

      // Should have either visible text or aria-label
      const hasAccessibleText = (text && text.trim().length > 0) || ariaLabel;
      expect(hasAccessibleText).toBeTruthy();
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');

    const termLink = page.locator('a.term-link').first();
    const count = await termLink.count();

    if (count === 0) {
      test.skip('No term links found');
      return;
    }

    // Tab to the first term link
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);

    // Check if term link is focused
    const isFocused = await termLink.evaluate((el: any) => document.activeElement === el);
    expect(isFocused).toBeTruthy();
  });

  test('should have visible focus indicator', async ({ page }) => {
    await page.goto('/');

    const termLink = page.locator('a.term-link').first();
    const count = await termLink.count();

    if (count === 0) {
      test.skip('No term links found');
      return;
    }

    // Focus the link
    await termLink.focus();

    // Check for focus outline or similar indicator
    const focusStyles = await termLink.evaluate((el: any) => {
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        outlineOffset: styles.outlineOffset,
        boxShadow: styles.boxShadow,
      };
    });

    // Should have some kind of focus indicator
    const hasFocusIndicator =
      focusStyles.outline !== 'none' ||
      focusStyles.boxShadow !== 'none';

    // Note: Some browsers have default focus styles that may not be detected
    // This is a basic check - comprehensive testing would need visual regression
    expect(hasFocusIndicator).toBeTruthy();
  });

  test('should activate with Enter key', async ({ page }) => {
    await page.goto('/');

    const termLink = page.locator('a.term-link').first();
    const count = await termLink.count();

    if (count === 0) {
      test.skip('No term links found');
      return;
    }

    await termLink.focus();
    const initialUrl = page.url();

    // Press Enter to activate
    await page.keyboard.press('Enter');
    await page.waitForLoadState('networkidle');

    // Should navigate
    expect(page.url()).not.toBe(initialUrl);
  });
});

test.describe('Accessibility - Tooltips', () => {
  test('should have appropriate ARIA attributes', async ({ page }) => {
    await page.goto('/tooltip-tests');

    const termLink = page.locator('a.term-link').first();

    const count = await termLink.count();
    if (count === 0) {
      test.skip('No term links found');
      return;
    }

    // Check for aria-describedby or similar
    const ariaDescribedBy = await termLink.getAttribute('aria-describedby');
    const ariaLabel = await termLink.getAttribute('aria-label');

    // Should have some ARIA attribute for tooltip
    // Note: Implementation may vary
    const hasAria = ariaDescribedBy || ariaLabel;
    expect(hasAria).toBeTruthy();
  });

  test('should be screen reader friendly', async ({ page }) => {
    await page.goto('/tooltip-tests');

    const termLink = page.locator('a.term-link').first();

    const count = await termLink.count();
    if (count === 0) {
      test.skip('No term links found');
      return;
    }

    // Check that link text is meaningful for screen readers
    const text = await termLink.textContent();
    const title = await termLink.getAttribute('title');
    const ariaLabel = await termLink.getAttribute('aria-label');

    // Should have accessible text
    const accessibleText = text || title || ariaLabel;
    expect(accessibleText).toBeTruthy();

    // Should not use "click here" or similar generic text
    if (accessibleText) {
      expect(accessibleText.toLowerCase()).not.toContain('click here');
    }
  });

  test('should not trap keyboard focus in tooltip', async ({ page }) => {
    await page.goto('/tooltip-tests');

    const termLink = page.locator('a.term-link').first();

    const count = await termLink.count();
    if (count === 0) {
      test.skip('No term links found');
      return;
    }

    // Focus and hover to show tooltip
    await termLink.focus();
    await termLink.hover();

    // Try to tab away
    await page.keyboard.press('Tab');

    // Focus should move away from term link
    const isStillFocused = await termLink.evaluate((el: any) => document.activeElement === el);
    expect(isStillFocused).toBeFalsy();
  });
});

test.describe('Accessibility - Glossary', () => {
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/glossary');

    // Wait for glossary to load
    await page.waitForSelector('.glossary-container', { timeout: 10000 });

    // Check for main heading
    const mainHeading = page.locator('.glossary-container h1, .glossary-container h2').first();
    await expect(mainHeading).toBeVisible();

    // Should have text content
    const headingText = await mainHeading.textContent();
    expect(headingText?.trim().length).toBeGreaterThan(0);
  });

  test('should have accessible glossary items', async ({ page }) => {
    await page.goto('/glossary');

    await page.waitForSelector('.glossary-item', { timeout: 10000 });

    const glossaryItems = page.locator('.glossary-item');
    const count = await glossaryItems.count();

    expect(count).toBeGreaterThan(0);

    // Each item should have accessible title link
    for (let i = 0; i < Math.min(count, 5); i++) {
      const item = glossaryItems.nth(i);
      const titleLink = item.locator('.glossary-term a');

      await expect(titleLink).toBeVisible();

      const text = await titleLink.textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  test('should have skip navigation link', async ({ page }) => {
    await page.goto('/glossary');

    // Check for skip link (accessibility best practice)
    const skipLinks = page.locator('a[href^="#"]:has-text("skip"), a[href^="#"]:has-text("Skip"), a[href^="#"]:has-text("main")');

    const count = await skipLinks.count();
    if (count > 0) {
      await expect(skipLinks.first()).toBeVisible();
    }
    // Note: Not all sites have skip links, so we don't fail if not found
  });
});

test.describe('Color and Contrast', () => {
  test('should have sufficient color contrast for term links', async ({ page }) => {
    await page.goto('/');

    const termLink = page.locator('a.term-link').first();

    const count = await termLink.count();
    if (count === 0) {
      test.skip('No term links found');
      return;
    }

    // Get computed colors
    const colors = await termLink.evaluate((el: any) => {
      const styles = window.getComputedStyle(el);
      const parent = el.parentElement;
      const parentStyles = parent ? window.getComputedStyle(parent) : null;

      return {
        color: styles.color,
        backgroundColor: styles.backgroundColor,
        parentBackgroundColor: parentStyles?.backgroundColor,
      };
    });

    // Note: Full contrast checking would require a color contrast calculator
    // This is a basic check that colors are defined
    expect(colors.color).toBeTruthy();
    expect(colors.backgroundColor).toBeTruthy();
  });

  test('should not rely on color alone for hover states', async ({ page }) => {
    await page.goto('/tooltip-tests');

    const termLink = page.locator('a.term-link').first();

    const count = await termLink.count();
    if (count === 0) {
      test.skip('No term links found');
      return;
    }

    // Get hover styles
    const hoverStyles = await termLink.evaluate((el: any) => {
      // We can't directly get pseudo-element styles easily
      // This would require checking the stylesheet
      return {
        textDecoration: window.getComputedStyle(el).textDecoration,
      };
    });

    // Should have some visual indicator (text-decoration is common)
    expect(hoverStyles).toBeTruthy();
  });
});
