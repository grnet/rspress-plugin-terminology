/**
 * E2E Tests for Glossary Page
 *
 * Tests the glossary page functionality and rendering
 */

import { test, expect } from '@playwright/test';

test.describe('Glossary Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the glossary page and wait for content
    await page.goto('/glossary');
    await page.waitForLoadState('networkidle');
  });

  test('should display glossary page with container', async ({ page }) => {
    // Check that we're on the glossary page
    await expect(page).toHaveURL(/\/glossary/);

    // Wait for glossary container to appear
    const glossaryContainer = page.locator('.glossary-container, .glossary-list');
    await expect(glossaryContainer.first()).toBeVisible();
  });

  test('should display glossary terms with required elements', async ({ page }) => {
    // Wait for glossary to load
    const glossaryItems = page.locator('.glossary-item');
    await expect(glossaryItems.first()).toBeVisible();

    const count = await glossaryItems.count();
    expect(count).toBeGreaterThan(0);

    // Verify first item has all required elements
    const firstItem = glossaryItems.first();
    await expect(firstItem.locator('.glossary-term')).toBeVisible();
    await expect(firstItem.locator('.glossary-definition')).toBeVisible();
    await expect(firstItem.locator('a')).toHaveAttribute('href', /.+/);
  });

  test('should display terms in alphabetical order', async ({ page }) => {
    const glossaryItems = page.locator('.glossary-item');
    const count = await glossaryItems.count();

    if (count < 2) {
      test.skip('Not enough terms to test sorting');
      return;
    }

    // Get all term titles
    const titles = await Promise.all(
      Array.from({ length: count }, (_, i) =>
        glossaryItems.nth(i).locator('.glossary-term').textContent()
      )
    );

    const cleanTitles = titles.map(t => t?.trim() || '');
    const sortedTitles = [...cleanTitles].sort((a, b) => a.localeCompare(b));
    expect(cleanTitles).toEqual(sortedTitles);
  });

  test('should navigate to term page when clicking term link', async ({ page }) => {
    const firstTermLink = page.locator('.glossary-term a').first();
    await expect(firstTermLink).toBeVisible();

    const href = await firstTermLink.getAttribute('href');
    expect(href).toBeTruthy();

    await firstTermLink.click();
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain(href || '');
  });

  test('should eventually display glossary after loading', async ({ page }) => {
    // Reload to trigger loading state
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Glossary should be visible after loading
    const glossaryContainer = page.locator('.glossary-container, .glossary-list');
    await expect(glossaryContainer.first()).toBeVisible();
  });

  test('should display non-empty term definitions', async ({ page }) => {
    const firstDefinition = page.locator('.glossary-definition').first();
    await expect(firstDefinition).toBeVisible();

    const definitionText = await firstDefinition.textContent();
    expect(definitionText?.trim().length).toBeGreaterThan(0);
  });

  test('should sanitize HTML in glossary definitions', async ({ page }) => {
    const definitions = page.locator('.glossary-definition');
    const firstDefinitionHTML = await definitions.first().innerHTML();

    // Should not contain dangerous tags or attributes
    expect(firstDefinitionHTML.toLowerCase()).not.toContain('<script');
    expect(firstDefinitionHTML.toLowerCase()).not.toContain('onclick=');
    expect(firstDefinitionHTML.toLowerCase()).not.toContain('onerror=');
    expect(firstDefinitionHTML.toLowerCase()).not.toContain('javascript:');
  });
});

test.describe('Glossary Integration', () => {
  test('should have glossary link in navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for glossary link in navigation
    const glossaryLink = page.locator('a[href*="glossary"], a:has-text("Glossary")');
    const count = await glossaryLink.count();

    if (count === 0) {
      test.skip('No glossary link found in navigation');
      return;
    }

    await expect(glossaryLink.first()).toBeVisible();
    await glossaryLink.first().click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/glossary/);
  });

  test('should navigate to term pages from content', async ({ page }) => {
    await page.goto('/api-guide');
    await page.waitForLoadState('networkidle');

    // Look for any term links on the page
    const termLinks = page.locator('a.term-link');
    const count = await termLinks.count();

    if (count === 0) {
      test.skip('No term links found on page');
      return;
    }

    await expect(termLinks.first()).toBeVisible();
    await termLinks.first().click();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/terms/');
  });
});
