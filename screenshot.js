const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 915 });
  
  await page.goto('http://localhost:8085', {waitUntil: 'networkidle2'});
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({path: 'screenshot.png'});
  
  await browser.close();
  console.log('Screenshot saved');
})();
