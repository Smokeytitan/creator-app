import { test } from '@playwright/test';

test('check per-creator upload buttons in production', async ({ page }) => {
  console.log('🌐 Checking production site after deployment...');

  await page.goto('https://content-requests-app.vercel.app/');
  await page.waitForLoadState('networkidle');

  // Navigate to Creator Roster
  const rosterLink = page.locator('text=/creator roster/i').first();
  if (await rosterLink.isVisible().catch(() => false)) {
    await rosterLink.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Extra wait
  }

  await page.screenshot({ path: 'tests/screenshots/per-creator-check-01-page.png', fullPage: true });

  // Check toolbar for global button
  const toolbarText = await page.locator('div.flex.flex-wrap').first().textContent();
  console.log('📋 Toolbar buttons:', toolbarText);

  // Check creator cards
  const creatorCards = page.locator('.card-editorial');
  const cardCount = await creatorCards.count();
  console.log(`📋 Found ${cardCount} creator cards`);

  if (cardCount > 0) {
    // Look at first card in detail
    const firstCard = creatorCards.first();

    // Try to scroll card into view
    await firstCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    await firstCard.screenshot({ path: 'tests/screenshots/per-creator-check-02-first-card.png' });

    // Get all button text in first card
    const cardButtons = firstCard.locator('button');
    const buttonTexts = await cardButtons.allTextContents();
    console.log('📋 Buttons in first card:', buttonTexts);

    // Look for Upload Contract specifically
    const hasUploadButton = buttonTexts.some(text => text.includes('Upload Contract'));
    console.log(`📤 First card has Upload Contract button: ${hasUploadButton}`);

    // Check if there's a file input for contracts
    const fileInputs = await firstCard.locator('input[type="file"]').count();
    console.log(`📄 File inputs in first card: ${fileInputs}`);
  }

  console.log('✅ Screenshot check complete');
});
