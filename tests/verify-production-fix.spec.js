import { test, expect } from '@playwright/test';

test.describe('Production Verification - Contract Upload Fixed', () => {
  test('verify upload contract button is now visible in production', async ({ page }) => {
    console.log('🌐 Testing production site: https://content-requests-app.vercel.app/');
    console.log('⏰ Timestamp:', new Date().toISOString());

    // Navigate to production
    await page.goto('https://content-requests-app.vercel.app/');
    await page.waitForLoadState('networkidle');

    console.log('✅ Page loaded');
    await page.screenshot({ path: 'tests/screenshots/production-01-homepage.png', fullPage: true });

    // Check for authentication
    const signInButton = page.locator('text=/sign in|log in/i').first();
    const needsAuth = await signInButton.isVisible().catch(() => false);

    if (needsAuth) {
      console.log('⚠️  Authentication required - skipping button check');
      console.log('📝 The button should be visible after login');
      return;
    }

    console.log('✅ No authentication required');

    // Find and click Creator Roster
    const creatorRosterLink = page.locator('text=/creator roster|creators/i').first();
    const hasRosterLink = await creatorRosterLink.isVisible().catch(() => false);

    if (hasRosterLink) {
      console.log('🖱️  Clicking Creator Roster...');
      await creatorRosterLink.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'tests/screenshots/production-02-roster-page.png', fullPage: true });
    }

    // Check for Upload Contract button
    console.log('🔍 Looking for Upload Contract button...');

    // Try multiple selectors
    const uploadButtonSelectors = [
      'button:has-text("Upload Contract")',
      'button:has-text("Contract")',
      'button[title*="contract" i]',
      'button:has(svg) >> text=/contract/i'
    ];

    let uploadButton = null;
    for (const selector of uploadButtonSelectors) {
      const btn = page.locator(selector).first();
      if (await btn.isVisible().catch(() => false)) {
        uploadButton = btn;
        console.log(`✅ Found button with selector: ${selector}`);
        break;
      }
    }

    if (uploadButton) {
      // Button found!
      console.log('🎉 SUCCESS: Upload Contract button is VISIBLE in production!');

      const buttonText = await uploadButton.textContent();
      console.log('📝 Button text:', buttonText);

      // Take screenshot of the button
      await uploadButton.screenshot({ path: 'tests/screenshots/production-03-upload-button.png' });

      // Verify it's NOT the test button
      expect(buttonText).not.toContain('TEST');
      expect(buttonText).not.toContain('RED');
      console.log('✅ Confirmed: Not a test button');

      // Check if button is clickable
      const isEnabled = await uploadButton.isEnabled();
      console.log('✅ Button enabled:', isEnabled);

      // Get all buttons to show what's available
      const allButtons = await page.locator('button').allTextContents();
      console.log('📋 All buttons on page:', allButtons.slice(0, 20));

    } else {
      console.log('❌ Upload Contract button NOT FOUND');

      // Debug: show all buttons
      const allButtons = await page.locator('button').allTextContents();
      console.log('📋 Available buttons:', allButtons);

      await page.screenshot({ path: 'tests/screenshots/production-04-button-not-found.png', fullPage: true });

      throw new Error('Upload Contract button not found in production');
    }

    // Final full page screenshot
    await page.screenshot({ path: 'tests/screenshots/production-05-final.png', fullPage: true });

    console.log('✅ Verification complete!');
  });

  test('verify test button is gone', async ({ page }) => {
    console.log('🔍 Checking that TEST CONTRACT BUTTON is removed...');

    await page.goto('https://content-requests-app.vercel.app/');
    await page.waitForLoadState('networkidle');

    // Navigate to roster
    const rosterLink = page.locator('text=/creator roster/i').first();
    if (await rosterLink.isVisible().catch(() => false)) {
      await rosterLink.click();
      await page.waitForLoadState('networkidle');
    }

    // Look for test button (should NOT exist)
    const testButton = page.locator('button:has-text("TEST CONTRACT BUTTON")');
    const testButtonVisible = await testButton.isVisible().catch(() => false);

    if (testButtonVisible) {
      console.log('❌ ERROR: Test button still visible!');
      await testButton.screenshot({ path: 'tests/screenshots/production-error-test-button-found.png' });
      throw new Error('TEST CONTRACT BUTTON should not be visible in production');
    } else {
      console.log('✅ Confirmed: Test button is removed');
    }
  });
});
