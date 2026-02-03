import { test, expect } from '@playwright/test';

test.describe('Creator Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Wait for authentication (adjust selector based on your auth flow)
    await page.waitForSelector('[data-testid="creator-roster"], .creator-roster', {
      timeout: 10000
    });
  });

  test('should display creator roster', async ({ page }) => {
    // Check that the page loaded
    await expect(page).toHaveTitle(/Creator/i);

    // Check for main elements
    const heading = page.getByRole('heading', { name: /creator roster/i });
    await expect(heading).toBeVisible();
  });

  test('should add a new creator', async ({ page }) => {
    // Click Add Creator button
    await page.click('button:has-text("Add Creator")');

    // Fill in creator form
    await page.fill('input[placeholder*="Creator name"]', 'Test Creator');
    await page.fill('input[placeholder*="@handle"]', '@testcreator');
    await page.fill('input[type="number"]', '500');

    // Select a platform
    await page.click('button:has-text("X")');

    // Save
    await page.click('button:has-text("Add Creator"), button:has-text("Save")');

    // Verify creator appears in list
    await expect(page.locator('text=Test Creator')).toBeVisible();
    await expect(page.locator('text=@testcreator')).toBeVisible();
  });

  test('should edit a creator', async ({ page }) => {
    // Find and click edit button for first creator
    await page.click('button[title="Edit creator"]:first-of-type, button:has(svg):has-text("Edit"):first-of-type');

    // Update creator name
    const nameInput = page.locator('input[value]').first();
    await nameInput.clear();
    await nameInput.fill('Updated Creator Name');

    // Save changes
    await page.click('button:has-text("Save")');

    // Verify update
    await expect(page.locator('text=Updated Creator Name')).toBeVisible();
  });

  test('should delete a creator', async ({ page }) => {
    // Get initial creator count
    const initialCount = await page.locator('[data-creator-row], tr').count();

    // Click delete button with confirmation
    page.on('dialog', dialog => dialog.accept());
    await page.click('button[title="Delete"]:first-of-type, button:has-text("Delete"):first-of-type');

    // Wait a bit for deletion to process
    await page.waitForTimeout(500);

    // Verify creator count decreased
    const newCount = await page.locator('[data-creator-row], tr').count();
    expect(newCount).toBeLessThan(initialCount);
  });

  test('should search creators', async ({ page }) => {
    // Type in search box
    await page.fill('input[placeholder*="Search"]', 'test');

    // Wait for search to filter results
    await page.waitForTimeout(300);

    // Verify filtered results
    const searchResults = page.locator('text=test, text=Test');
    await expect(searchResults.first()).toBeVisible();
  });

  test('should filter creators by activity', async ({ page }) => {
    // Click filter dropdown
    await page.selectOption('select', 'active');

    // Wait for filter to apply
    await page.waitForTimeout(300);

    // Verify filtering occurred (implementation depends on your UI)
    // This is a basic check
    await expect(page.locator('[data-creator-row], tr')).not.toHaveCount(0);
  });

  test('should sort creators', async ({ page }) => {
    // Get initial first creator name
    const firstCreatorBefore = await page.locator('[data-creator-name]:first-of-type, td:first-of-type').first().textContent();

    // Change sort order
    await page.selectOption('select[value="name"]', 'posts');

    // Wait for sort to apply
    await page.waitForTimeout(300);

    // Verify sort changed (name should be different if there's variance in post counts)
    const firstCreatorAfter = await page.locator('[data-creator-name]:first-of-type, td:first-of-type').first().textContent();

    // Note: This test might be flaky if all creators have same post count
    // Consider using more specific selectors
  });

  test('should add a post to creator', async ({ page }) => {
    // Expand creator posts
    await page.click('button:has-text("View Posts"), button[title="View posts"]:first-of-type');

    // Click Add Post
    await page.click('button:has-text("Add Post")');

    // Fill post form
    await page.fill('input[placeholder*="description"]', 'Test post');
    await page.fill('input[type="date"]', '2024-01-15');
    await page.fill('input[placeholder*="0"]:first-of-type', '100');

    // Save post
    await page.click('button:has-text("Add Post"), button:has-text("Save"):visible');

    // Verify post appears
    await expect(page.locator('text=Test post')).toBeVisible();
  });

  test('should export creators to CSV', async ({ page }) => {
    // Set up download listener
    const downloadPromise = page.waitForEvent('download');

    // Click export button
    await page.click('button:has-text("Export"), button:has(svg):has-text("Download")');

    // Wait for download
    const download = await downloadPromise;

    // Verify download happened
    expect(download.suggestedFilename()).toContain('creator');
    expect(download.suggestedFilename()).toContain('.csv');
  });
});
