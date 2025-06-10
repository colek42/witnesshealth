import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    console.log('Console:', msg.type(), msg.text());
  });
  
  // Listen for page errors
  page.on('pageerror', error => {
    console.error('Page error:', error.message);
  });
  
  // Listen for request failures
  page.on('requestfailed', request => {
    console.error('Request failed:', request.url(), request.failure().errorText);
  });
  
  try {
    await page.goto('http://localhost:5173/witnesshealth/', { waitUntil: 'networkidle0' });
    console.log('Page loaded successfully');
    
    // Wait a bit for any async errors
    await page.waitForTimeout(2000);
    
    // Check if the app mounted
    const appContent = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root ? root.innerHTML.substring(0, 100) : 'No root element';
    });
    
    console.log('App content:', appContent);
  } catch (error) {
    console.error('Navigation error:', error);
  }
  
  await browser.close();
})();