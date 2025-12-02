const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  // Replace with your local dev server or deployed URL
  await page.goto('http://localhost:3000/print-report', { waitUntil: 'networkidle0' });

  // Wait for the report to render
  await page.waitForSelector('#client-report');

  await page.pdf({
    path: 'client-report.pdf',
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' }
  });

  await browser.close();
})(); 