const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:8085', {waitUntil: 'networkidle2'});
  
  // click meteo tab
  await page.click('button[data-tab="weatherView"]');
  // wait 500ms
  await new Promise(r => setTimeout(r, 500));
  // click hamburger menu
  await page.click('#sidebarToggleBtn');
  // wait for sidebar transition
  await new Promise(r => setTimeout(r, 500));
  
  await page.screenshot({path: 'screenshot.png'});
  
  await browser.close();
  console.log('Screenshot saved');
})();
