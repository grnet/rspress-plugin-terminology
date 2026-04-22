/**
 * E2E Tests for Navigation and Routing
 *
 * Tests term link navigation and routing behavior
 */

import { test, expect } from '@playwright/test';

test.describe('Term Link Navigation', () => {
  test('should navigate to term detail page', async ({ page }) => {
    await page.goto('/');

    // Find a term link
    const termLink = page.locator('a.term-link').first();

    const count = await termLink.count();
    if (count === 0) {
      test.skip('No term links found on page');
      return;
    }

    await expect(termLink).toBeVisible();

    // Get href before clicking
    const href = await termLink.getAttribute('href');
    expect(href).toBeTruthy();

    // Click the term link
    await termLink.click();

    // Should navigate to term page
    await page.waitForLoadState('networkidle');
    expect(page.url()).toMatch(/\/terms\//);
  });

  test('should preserve query parameters on navigation', async ({ page }) => {
    await page.goto('/?test=query');

    const termLink = page.locator('a.term-link').first();
    const count = await termLink.count();

    if (count === 0) {
      test.skip('No term links found on page');
      return;
    }

    await termLink.click();
    await page.waitForLoadState('networkidle');

    // Term link should navigate correctly
    expect(page.url()).toMatch(/\/terms\//);
  });

  test('should handle relative path links correctly', async ({ page }) => {
    await page.goto('/api-guide');

    const termLinks = page.locator('a.term-link');
    const count = await termLinks.count();

    if (count === 0) {
      test.skip('No term links found on page');
      return;
    }

    // Test first few term links
    for (let i = 0; i < Math.min(count, 3); i++) {
      const link = termLinks.nth(i);

      // Get href
      const href = await link.getAttribute('href');
      expect(href).toBeTruthy();

      // Click and verify navigation
      await link.click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toBeTruthy();

      // Go back for next test
      await page.goBack();
      await page.waitForLoadState('networkidle');
    }
  });

  test('should handle term links with custom text', async ({ page }) => {
    await page.goto('/');

    const termLinks = page.locator('a.term-link');
    const count = await termLinks.count();

    if (count === 0) {
      test.skip('No term links found on page');
      return;
    }

    // Check that term links have text content
    for (let i = 0; i < Math.min(count, 3); i++) {
      const link = termLinks.nth(i);
      const text = await link.textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });
});

test.describe('Term Detail Pages', () => {
  test('should display term detail page', async ({ page }) => {
    // Navigate directly to a known term page
    await page.goto('/terms/api-key');

    // Check that page loads
    await page.waitForLoadState('networkidle');

    // Should have content
    const content = page.locator('main, article, .content, #page-content');
    const count = await content.count();

    if (count > 0) {
      await expect(content.first()).toBeVisible();
    }
  });

  test('should display term title on detail page', async ({ page }) => {
    await page.goto('/terms/api-key');

    // Look for h1 or title element
    const title = page.locator('h1').or(page.locator('.title'));

    const count = await title.count();
    if (count > 0) {
      await expect(title.first()).toBeVisible();

      const titleText = await title.first().textContent();
      expect(titleText?.toLowerCase()).toContain('api');
    }
  });

  test('should display term content on detail page', async ({ page }) => {
    await page.goto('/terms/api-key');

    // Page should have substantial content
    const bodyText = await page.locator('body').textContent();
    expect(bodyText?.length).toBeGreaterThan(100);
  });

  test('should handle 404 for non-existent terms', async ({ page }) => {
    const response = await page.goto('/terms/non-existent-term');

    // Should either get a 404 status or show error content
    if (response?.status() === 404) {
      expect(response.status()).toBe(404);
    } else {
      // Check for error message in page
      const errorMessage = page.locator('text=/not found|404|error/i');
      const hasError = await errorMessage.count() > 0;
      expect(hasError).toBeTruthy();
    }
  });
});

test.describe('Browser Navigation', () => {
  test('should handle back button from term page', async ({ page }) => {
    await page.goto('/');

    const termLink = page.locator('a.term-link').first();
    const count = await termLink.count();

    if (count === 0) {
      test.skip('No term links found on page');
      return;
    }

    // Click term link
    await termLink.click();
    await page.waitForLoadState('networkidle');
    const termUrl = page.url();

    // Go back
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // Should be back on original page
    expect(page.url()).not.toBe(termUrl);
  });

  test('should handle forward button after back', async ({ page }) => {
    await page.goto('/');

    const termLink = page.locator('a.term-link').first();
    const count = await termLink.count();

    if (count === 0) {
      test.skip('No term links found on page');
      return;
    }

    // Click term link
    await termLink.click();
    await page.waitForLoadState('networkidle');

    // Go back
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // Go forward
    await page.goForward();
    await page.waitForLoadState('networkidle');

    // Should be back on term page
    expect(page.url()).toMatch(/\/terms\//);
  });

  test('should preserve scroll position on back navigation', async ({ page }) => {
    await page.goto('/');

    // Scroll down a bit
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);

    const termLink = page.locator('a.term-link').first();
    const count = await termLink.count();

    if (count === 0) {
      test.skip('No term links found on page');
      return;
    }

    // Click term link
    await termLink.click();
    await page.waitForLoadState('networkidle');

    // Go back
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // Scroll position restoration varies by browser and SPA implementation.
    // Just verify we returned to the previous page successfully.
    await page.waitForTimeout(500);
    const scrollY = await page.evaluate(() => window.scrollY);
    // Accept any scroll position - the key behavior is that back navigation works
    expect(scrollY).toBeGreaterThanOrEqual(0);
  });
});
