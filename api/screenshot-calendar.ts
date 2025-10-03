import type { VercelRequest, VercelResponse } from '@vercel/node';
import chromium from '@sparticuz/chromium';
import puppeteer, { Browser } from 'puppeteer-core';

// GET /api/screenshot-calendar?url=https://your.app/share/calendar&width=1200&height=1000
// Returns image/png
export default async function handler(req: VercelRequest, res: VercelResponse) {
  let browser: Browser | null = null;
  try {
    console.log('[Screenshot API] Request received:', { 
      url: req.query.url, 
      width: req.query.width, 
      height: req.query.height,
      selector: req.query.selector 
    });

    const url = (req.query.url as string) || '';
    if (!url || !/^https?:\/\//i.test(url)) {
      console.error('[Screenshot API] Invalid URL:', url);
      res.status(400).json({ error: 'Missing or invalid url parameter' });
      return;
    }
    const width = Math.min(2400, Math.max(600, Number(req.query.width) || 1200));
    const height = Math.min(2000, Math.max(400, Number(req.query.height) || 1000));

    console.log('[Screenshot API] Getting chromium executable...');
    const executablePath = await chromium.executablePath();
    console.log('[Screenshot API] Executable path:', executablePath);

    console.log('[Screenshot API] Launching browser...');
    browser = await puppeteer.launch({
      args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width, height, deviceScaleFactor: 2 },
      executablePath,
      headless: true,
    });
    console.log('[Screenshot API] Browser launched');

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(30000);
    
    console.log('[Screenshot API] Navigating to:', url);
    await page.goto(url, { waitUntil: 'networkidle2' });
    console.log('[Screenshot API] Page loaded');

    // Optional selector - if not provided, screenshot entire viewport
    const selector = req.query.selector as string;
    
    let png: Buffer;
    if (selector) {
      console.log('[Screenshot API] Waiting for selector:', selector);
      await page.waitForSelector(selector, { timeout: 15000 });
      console.log('[Screenshot API] Selector found');

      const element = await page.$(selector);
      if (!element) {
        console.error('[Screenshot API] Element not found after waitForSelector');
        await browser.close();
        res.status(404).json({ error: 'Calendar element not found' });
        return;
      }

      console.log('[Screenshot API] Taking screenshot of element...');
      png = await element.screenshot({ type: 'png' }) as Buffer;
    } else {
      // No selector - screenshot entire viewport
      console.log('[Screenshot API] Taking full page screenshot...');
      png = await page.screenshot({ type: 'png', fullPage: false }) as Buffer;
    }
    
    console.log('[Screenshot API] Screenshot taken, size:', png.length);

    await browser.close();
    console.log('[Screenshot API] Browser closed, sending response');

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(png);
  } catch (error: any) {
    console.error('[Screenshot API] Error:', error);
    console.error('[Screenshot API] Stack:', error?.stack);
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.error('[Screenshot API] Failed to close browser:', e);
      }
    }
    res.status(500).json({ error: 'Failed to render screenshot', detail: String(error?.message || error), stack: error?.stack });
  }
}


