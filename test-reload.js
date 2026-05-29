const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to test page...');
    await page.goto('http://localhost:7594/pages/index-ghs-onboarding.html');
    
    // Set a marker on window to detect reload
    await page.evaluate(() => { window.__reload_marker = true; });
    console.log('Marker set.');

    // Wait for the button to be visible
    await page.waitForSelector('ir-custom-button:has-text("Apply")');
    console.log('Apply button found.');

    // Click the Apply button
    // We need to click the actual button inside the shadow DOM if it exists, 
    // or just click the custom element if it handles it.
    await page.click('ir-custom-button:has-text("Apply")');
    console.log('Apply button clicked.');

    // Wait a bit for potential reload
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if marker still exists
    const markerExists = await page.evaluate(() => window.__reload_marker);
    
    if (markerExists) {
      console.log('SUCCESS: Page did NOT reload.');
    } else {
      console.error('FAILURE: Page reloaded!');
    }
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    await browser.close();
  }
})();
