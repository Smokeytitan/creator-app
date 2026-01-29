import { test } from '@playwright/test';

test('test flash campaign upload', async ({ page }) => {
  // Listen to ALL console logs for debugging
  page.on('console', msg => {
    console.log('BROWSER:', msg.text());
  });

  // Go to the app
  console.log('Opening app...');
  await page.goto('https://content-requests-app.vercel.app/');
  
  // Wait for page to load
  await page.waitForTimeout(3000);

  console.log('Page loaded, looking for Campaigns in sidebar...');

  // Click on Campaigns in the sidebar navigation
  const campaignsSidebarButton = page.locator('nav a:has-text("Campaigns"), nav button:has-text("Campaigns")').first();
  await campaignsSidebarButton.click();
  await page.waitForTimeout(3000);

  console.log('Campaigns page loaded, looking for Flash Campaigns tab...');

  // Click on Flash Campaigns tab
  const flashTab = page.locator('button:has-text("Flash Campaigns")').first();
  await flashTab.click();
  await page.waitForTimeout(2000);
  
  console.log('Looking for completed campaigns...');
  
  // Find a completed campaign to test upload
  const campaignCard = page.locator('.card-editorial').first();
  await campaignCard.click();
  await page.waitForTimeout(2000);
  
  console.log('Campaign opened, looking for Upload button...');
  
  // Find the Upload Tweets button
  const uploadButton = page.locator('text=Upload Tweets').first();
  if (await uploadButton.isVisible()) {
    console.log('Upload button found!');
    
    // Set up file chooser
    const fileChooserPromise = page.waitForEvent('filechooser');
    await uploadButton.click();
    const fileChooser = await fileChooserPromise;
    
    console.log('Uploading file...');
    await fileChooser.setFiles('/Users/ntruslow/Downloads/flash-campaign-tweets.xlsx');
    
    // Wait for upload to complete (up to 2 minutes)
    console.log('Waiting for upload to complete...');
    await page.waitForTimeout(120000);
    
  } else {
    console.log('Upload button not found!');
  }
  
  // Take a screenshot
  await page.screenshot({ path: '/tmp/flash-campaign-upload.png', fullPage: true });
  console.log('Screenshot saved to /tmp/flash-campaign-upload.png');
});
