import { test, expect } from '@playwright/test';

test.describe('Campaign Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Wait for authentication
    await page.waitForSelector('[data-testid="campaigns"], .campaigns', {
      timeout: 10000
    });

    // Navigate to Campaigns tab
    await page.click('button:has-text("Campaigns"), a:has-text("Campaigns")');
  });

  test('should display campaigns list', async ({ page }) => {
    // Check for campaigns heading
    const heading = page.getByRole('heading', { name: /campaigns/i });
    await expect(heading).toBeVisible();
  });

  test('should create a new campaign', async ({ page }) => {
    // Click Create Campaign button
    await page.click('button:has-text("Create Campaign"), button:has-text("New Campaign")');

    // Fill in campaign form
    await page.fill('input[placeholder*="title"], input[placeholder*="name"]', 'Test Campaign');
    await page.fill('textarea[placeholder*="description"]', 'Test campaign description');

    // Select creators (implementation specific)
    // await page.click('input[type="checkbox"]:first-of-type');

    // Save campaign
    await page.click('button:has-text("Create"), button:has-text("Save")');

    // Verify campaign appears
    await expect(page.locator('text=Test Campaign')).toBeVisible();
  });

  test('should view campaign details', async ({ page }) => {
    // Click on first campaign
    await page.click('[data-campaign-item]:first-of-type, tr:first-of-type');

    // Verify campaign details are visible
    await expect(page.locator('text=/creators/i')).toBeVisible();
    await expect(page.locator('text=/estimated/i')).toBeVisible();
  });

  test('should update campaign status', async ({ page }) => {
    // Find status dropdown/button
    await page.click('select[value="pending"]:first-of-type, button:has-text("Status")');

    // Change status
    await page.click('option:has-text("In Progress"), button:has-text("In Progress")');

    // Verify status changed
    await expect(page.locator('text=/in progress/i')).toBeVisible();
  });

  test('should filter campaigns by status', async ({ page }) => {
    // Apply filter
    await page.selectOption('select', 'completed');

    // Wait for filter
    await page.waitForTimeout(300);

    // Verify filtered results
    await expect(page.locator('text=/completed/i')).toBeVisible();
  });

  test('should calculate campaign metrics', async ({ page }) => {
    // Click on a campaign
    await page.click('[data-campaign-item]:first-of-type, tr:first-of-type');

    // Verify metrics are displayed
    await expect(page.locator('text=/total cost/i, text=/estimated cost/i')).toBeVisible();
    await expect(page.locator('text=/impressions/i')).toBeVisible();
  });

  test('should export campaign data', async ({ page }) => {
    // Set up download listener
    const downloadPromise = page.waitForEvent('download');

    // Click export button
    await page.click('button:has-text("Export")');

    // Wait for download
    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toContain('campaign');
  });
});
