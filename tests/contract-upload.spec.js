import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Contract Upload Investigation', () => {
  let consoleErrors = [];
  let networkErrors = [];

  test.beforeEach(async ({ page }) => {
    // Capture console errors
    consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('❌ Console Error:', msg.text());
      }
      if (msg.type() === 'warning') {
        console.log('⚠️  Console Warning:', msg.text());
      }
    });

    // Capture network errors
    networkErrors = [];
    page.on('requestfailed', request => {
      networkErrors.push({
        url: request.url(),
        failure: request.failure()?.errorText
      });
      console.log('❌ Network Error:', request.url(), request.failure()?.errorText);
    });

    // Capture responses with errors
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log(`❌ HTTP ${response.status()}: ${response.url()}`);
      }
    });
  });

  test('investigate contract upload button visibility and functionality', async ({ page }) => {
    // Navigate to production app
    console.log('📱 Navigating to production app...');
    await page.goto('https://content-requests-app.vercel.app/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/01-homepage.png', fullPage: true });

    // Check if we need to sign in
    const signInButton = page.locator('text=/sign in|log in/i').first();
    const isSignInVisible = await signInButton.isVisible().catch(() => false);

    console.log('🔐 Sign-in required:', isSignInVisible);

    if (isSignInVisible) {
      await page.screenshot({ path: 'tests/screenshots/02-auth-required.png', fullPage: true });
      console.log('⚠️  Authentication required - cannot proceed with upload test');
      console.log('📝 Note: Contract upload requires authentication');

      // Check for any visible error messages
      const errorMessages = await page.locator('[role="alert"], .error, .alert-error').allTextContents();
      if (errorMessages.length > 0) {
        console.log('❌ Error messages on page:', errorMessages);
      }

      return; // Exit test - we can't proceed without auth
    }

    // Look for Creator Roster or navigation
    console.log('🔍 Looking for Creator Roster...');
    await page.screenshot({ path: 'tests/screenshots/03-after-auth.png', fullPage: true });

    // Try to find navigation to Creator Roster
    const creatorRosterLink = page.locator('text=/creator roster|creators/i').first();
    const isRosterLinkVisible = await creatorRosterLink.isVisible().catch(() => false);

    if (isRosterLinkVisible) {
      console.log('✅ Found Creator Roster link');
      await creatorRosterLink.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'tests/screenshots/04-creator-roster.png', fullPage: true });
    }

    // Look for Upload Contract button
    console.log('🔍 Looking for Upload Contract button...');
    const uploadContractButton = page.locator('button:has-text("Upload Contract"), button:has-text("Contract")').first();
    const isUploadButtonVisible = await uploadContractButton.isVisible().catch(() => false);

    console.log('📤 Upload Contract button visible:', isUploadButtonVisible);

    if (!isUploadButtonVisible) {
      console.log('❌ Upload Contract button not found');
      console.log('📝 Available buttons:', await page.locator('button').allTextContents());
      await page.screenshot({ path: 'tests/screenshots/05-no-upload-button.png', fullPage: true });
    } else {
      console.log('✅ Found Upload Contract button');
      await uploadContractButton.screenshot({ path: 'tests/screenshots/05-upload-button.png' });

      // Click the button
      console.log('🖱️  Clicking Upload Contract button...');
      await uploadContractButton.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'tests/screenshots/06-after-click.png', fullPage: true });

      // Check if file input appeared
      const fileInput = page.locator('input[type="file"]');
      const isFileInputVisible = await fileInput.isVisible().catch(() => false);
      console.log('📁 File input visible:', isFileInputVisible);

      if (isFileInputVisible) {
        // Try to find file input that might be hidden
        const fileInputs = await page.locator('input[type="file"]').all();
        console.log('📁 Number of file inputs found:', fileInputs.length);

        if (fileInputs.length > 0) {
          // Create a dummy PDF file for testing
          const testFilePath = path.join(__dirname, 'test-contract.pdf');

          console.log('📄 Attempting to upload test file...');

          // Try to set the file - this will fail gracefully if no real file exists
          try {
            await fileInputs[0].setInputFiles(testFilePath);
            console.log('✅ File input accepted');
            await page.waitForTimeout(1000);
            await page.screenshot({ path: 'tests/screenshots/07-file-selected.png', fullPage: true });
          } catch (error) {
            console.log('⚠️  Could not set file (test file may not exist):', error.message);
          }
        }
      } else {
        console.log('⚠️  File input not visible or not found');
        console.log('📝 Modal or dialog might have opened:');
        const dialogs = await page.locator('[role="dialog"], .modal, .popup').allTextContents();
        console.log('Dialog content:', dialogs);
      }
    }

    // Check for Supabase related errors
    console.log('\n📊 ERROR SUMMARY:');
    console.log('Console Errors:', consoleErrors.length);
    consoleErrors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));

    console.log('Network Errors:', networkErrors.length);
    networkErrors.forEach((err, i) => console.log(`  ${i + 1}. ${err.url} - ${err.failure}`));

    // Check localStorage for any error states
    const localStorageData = await page.evaluate(() => {
      const data = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        data[key] = localStorage.getItem(key);
      }
      return data;
    });
    console.log('\n💾 LocalStorage keys:', Object.keys(localStorageData));

    // Check for Supabase configuration
    const supabaseUrl = await page.evaluate(() => window.localStorage.getItem('supabase.url') || 'Not found');
    console.log('🗄️  Supabase URL in localStorage:', supabaseUrl);
  });

  test('check Supabase Storage bucket configuration', async ({ page, context }) => {
    // This test will try to make a direct request to check Supabase storage
    console.log('🔍 Checking Supabase Storage configuration...');

    await page.goto('https://content-requests-app.vercel.app/');
    await page.waitForLoadState('networkidle');

    // Intercept and log all Supabase API calls
    const supabaseApiCalls = [];
    page.on('request', request => {
      if (request.url().includes('supabase')) {
        supabaseApiCalls.push({
          method: request.method(),
          url: request.url(),
          headers: request.headers()
        });
        console.log(`🗄️  Supabase API: ${request.method()} ${request.url()}`);
      }
    });

    // Wait to capture any initial API calls
    await page.waitForTimeout(3000);

    console.log(`\n📊 Total Supabase API calls: ${supabaseApiCalls.length}`);

    // Check if storage API is being called
    const storageCalls = supabaseApiCalls.filter(call => call.url.includes('/storage/'));
    console.log(`📦 Storage API calls: ${storageCalls.length}`);
    storageCalls.forEach(call => {
      console.log(`  - ${call.method} ${call.url}`);
    });
  });

  test('check environment variables and configuration', async ({ page }) => {
    console.log('⚙️  Checking environment configuration...');

    await page.goto('https://content-requests-app.vercel.app/');
    await page.waitForLoadState('networkidle');

    // Check for environment variables exposed to client
    const envVars = await page.evaluate(() => {
      return {
        hasClaudeKey: !!import.meta.env.VITE_CLAUDE_API_KEY,
        hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
        hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        mode: import.meta.env.MODE,
        // Don't log actual values for security
      };
    }).catch(() => ({ error: 'Could not access env vars' }));

    console.log('🔧 Environment Check:', envVars);

    // Check for any initialization errors in the console
    await page.waitForTimeout(2000);

    console.log('\n📋 Final console errors:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.log('Errors:');
      consoleErrors.forEach(err => console.log(`  - ${err}`));
    }
  });
});
