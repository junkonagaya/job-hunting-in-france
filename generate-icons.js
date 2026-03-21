import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateIcons() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const htmlPath = path.join(__dirname, 'chrome-extension', 'icon-preview.html');
  const fileUrl = `file://${htmlPath}`;

  console.log(`Loading ${fileUrl}...`);
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  const sizes = [
    { size: 16, name: 'icon16.png' },
    { size: 48, name: 'icon48.png' },
    { size: 128, name: 'icon128.png' }
  ];

  for (const { size, name } of sizes) {
    console.log(`Generating ${name} (${size}x${size})...`);

    // Set viewport to exact size
    await page.setViewport({ width: size, height: size });

    // Take screenshot of the icon element
    const element = await page.$('.icon');
    const outputPath = path.join(__dirname, 'chrome-extension', name);

    await element.screenshot({
      path: outputPath,
      omitBackground: false
    });

    console.log(`✓ Created ${name}`);
  }

  await browser.close();
  console.log('\n✅ All icons generated successfully!');
  console.log('Icons saved to: chrome-extension/');
}

generateIcons().catch(console.error);
