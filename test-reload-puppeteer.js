const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to test page...');
    await page.goto('http://localhost:7594/pages/index-ghs-onboarding.html');
    
    // Set a marker on window to detect reload
    await page.evaluate(() => { window.__reload_marker = true; });
    console.log('Marker set.');

    // Wait for the component and button
    await page.waitForSelector('ir-ghs-onboarding');
    console.log('Component rendered.');

    // Wait a bit for the button to be deep-rendered
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Find and click the Apply button
    // Stencil components use shadow DOM or scoped CSS. 
    // Since scoped: true is used, we can just find it.
    const buttons = await page.$$('ir-custom-button');
    let applyButton = null;
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Apply')) {
        applyButton = btn;
        break;
      }
    }

    if (applyButton) {
      console.log('Apply button found. Clicking...');
      await applyButton.click();
      console.log('Apply button clicked.');
    } else {
      console.error('Apply button NOT found!');
    }

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
