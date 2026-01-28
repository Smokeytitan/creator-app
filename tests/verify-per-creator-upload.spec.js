import { test, expect } from '@playwright/test';

test.describe('Per-Creator Contract Upload - Production Verification', () => {
  test('verify each creator card has its own upload contract button', async ({ page }) => {
    console.log('🌐 Testing per-creator upload buttons...');

    await page.goto('https://content-requests-app.vercel.app/');
    await page.waitForLoadState('networkidle');

    // Navigate to Creator Roster
    const rosterLink = page.locator('text=/creator roster/i').first();
    if (await rosterLink.isVisible().catch(() => false)) {
      await rosterLink.click();
      await page.waitForLoadState('networkidle');
    }

    await page.screenshot({ path: 'tests/screenshots/per-creator-01-roster.png', fullPage: true });

    // Look for creator cards
    const creatorCards = page.locator('.card-editorial');
    const cardCount = await creatorCards.count();
    console.log(`📋 Found ${cardCount} creator cards`);

    if (cardCount === 0) {
      console.log('⚠️  No creator cards found');
      return;
    }

    // Check first few creator cards for Upload Contract buttons
    const cardsToCheck = Math.min(3, cardCount);
    let uploadButtonsFound = 0;

    for (let i = 0; i < cardsToCheck; i++) {
      const card = creatorCards.nth(i);
      const uploadButton = card.locator('button:has-text("Upload Contract")');

      if (await uploadButton.isVisible().catch(() => false)) {
        uploadButtonsFound++;
        console.log(`✅ Creator card ${i + 1}: Upload Contract button found`);

        // Take screenshot of this card
        await card.screenshot({ path: `tests/screenshots/per-creator-02-card-${i + 1}.png` });
      } else {
        console.log(`❌ Creator card ${i + 1}: Upload Contract button NOT found`);
      }
    }

    console.log(`\n📊 Summary: ${uploadButtonsFound}/${cardsToCheck} cards have Upload Contract buttons`);

    // Check that there's NO global upload button in the toolbar
    const toolbarButtons = page.locator('div.flex.flex-wrap button');
    const allButtonTexts = await toolbarButtons.allTextContents();

    const hasGlobalUploadButton = allButtonTexts.some(text =>
      text.includes('Upload Contract') && !text.includes('Excel')
    );

    if (hasGlobalUploadButton) {
      console.log('❌ ERROR: Global Upload Contract button still exists in toolbar');
      await page.screenshot({ path: 'tests/screenshots/per-creator-error-global-button.png', fullPage: true });
    } else {
      console.log('✅ Confirmed: No global Upload Contract button in toolbar');
    }

    // Verify buttons are correctly positioned (should be below "View Posts" button)
    const firstCard = creatorCards.first();
    const viewPostsButton = firstCard.locator('button:has-text("View")').first();
    const uploadButton = firstCard.locator('button:has-text("Upload Contract")').first();

    const viewPostsVisible = await viewPostsButton.isVisible().catch(() => false);
    const uploadVisible = await uploadButton.isVisible().catch(() => false);

    if (viewPostsVisible && uploadVisible) {
      const viewPostsBox = await viewPostsButton.boundingBox();
      const uploadBox = await uploadButton.boundingBox();

      if (viewPostsBox && uploadBox) {
        const isBelow = uploadBox.y > viewPostsBox.y;
        console.log(`📍 Upload button is ${isBelow ? 'below' : 'above'} View Posts button`);
      }
    }

    await page.screenshot({ path: 'tests/screenshots/per-creator-03-final.png', fullPage: true });

    // Assertions
    expect(uploadButtonsFound).toBeGreaterThan(0);
    expect(hasGlobalUploadButton).toBe(false);

    console.log('✅ Per-creator upload buttons verification complete!');
  });

  test('verify upload button functionality on a specific creator', async ({ page }) => {
    console.log('🔍 Testing upload button interaction...');

    await page.goto('https://content-requests-app.vercel.app/');
    await page.waitForLoadState('networkidle');

    // Navigate to Creator Roster
    const rosterLink = page.locator('text=/creator roster/i').first();
    if (await rosterLink.isVisible().catch(() => false)) {
      await rosterLink.click();
      await page.waitForLoadState('networkidle');
    }

    // Find first creator card with an upload button
    const creatorCards = page.locator('.card-editorial');
    const cardCount = await creatorCards.count();

    if (cardCount === 0) {
      console.log('⚠️  No creator cards found');
      return;
    }

    // Get the first card's name
    const firstCard = creatorCards.first();
    const creatorName = await firstCard.locator('h3').first().textContent().catch(() => 'Unknown');
    console.log(`👤 Testing with creator: ${creatorName}`);

    const uploadButton = firstCard.locator('button:has-text("Upload Contract")').first();

    if (await uploadButton.isVisible()) {
      // Check button is enabled
      const isEnabled = await uploadButton.isEnabled();
      console.log(`✅ Upload Contract button enabled: ${isEnabled}`);

      // Check button styling (should be purple-themed for contracts)
      const buttonClass = await uploadButton.getAttribute('class');
      const hasPurpleStyle = buttonClass?.includes('purple');
      console.log(`🎨 Button has purple styling: ${hasPurpleStyle}`);

      await firstCard.screenshot({ path: 'tests/screenshots/per-creator-04-button-detail.png' });

      expect(isEnabled).toBe(true);
    } else {
      console.log('❌ Upload Contract button not found on first creator card');
      throw new Error('Upload button not found');
    }
  });
});
