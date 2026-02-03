import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should show sign in page when not authenticated', async ({ page }) => {
    // Clear any stored auth
    await page.context().clearCookies();

    // Navigate to app
    await page.goto('/');

    // Should see sign in UI
    await expect(page.locator('text=/sign in/i, text=/login/i')).toBeVisible();
  });

  test('should redirect to app after sign in', async ({ page }) => {
    await page.goto('/');

    // If already signed in, test passes
    const isSignedIn = await page.locator('[data-testid="creator-roster"]').isVisible().catch(() => false);

    if (!isSignedIn) {
      // Sign in process (adjust based on your auth provider)
      // This is a placeholder - actual implementation depends on Clerk setup
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'testpassword');
      await page.click('button[type="submit"]');

      // Should redirect to main app
      await expect(page).toHaveURL(/\/(roster|campaigns|analytics)/);
    }
  });

  test('should show user profile menu when authenticated', async ({ page }) => {
    await page.goto('/');

    // Wait for auth to load
    await page.waitForTimeout(2000);

    // Look for user menu/profile button
    const userButton = page.locator('[data-testid="user-button"], button:has-text("Profile"), .user-menu');
    await expect(userButton.first()).toBeVisible();
  });

  test('should sign out successfully', async ({ page }) => {
    await page.goto('/');

    // Wait for app to load
    await page.waitForTimeout(2000);

    // Click user menu
    await page.click('[data-testid="user-button"], .user-menu');

    // Click sign out
    await page.click('text=/sign out/i, text=/logout/i');

    // Should see sign in page again
    await expect(page.locator('text=/sign in/i')).toBeVisible();
  });
});
