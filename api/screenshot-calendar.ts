import type { VercelRequest, VercelResponse } from '@vercel/node';
import chromium from '@sparticuz/chromium-min';
import puppeteer from 'puppeteer-core';

// GET /api/screenshot-calendar?url=https://your.app/share/calendar&width=1200&height=1000
// Returns image/png
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const url = (req.query.url as string) || '';
    if (!url || !/^https?:\/\//i.test(url)) {
      res.status(400).json({ error: 'Missing or invalid url parameter' });
      return;
    }
    const width = Math.min(2400, Math.max(600, Number(req.query.width) || 1200));
    const height = Math.min(2000, Math.max(400, Number(req.query.height) || 1000));

    const executablePath = await chromium.executablePath();
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width, height, deviceScaleFactor: 2 },
      executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(30000);
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Wait for the calendar card wrapper to exist
    // You can adjust this selector to match the share page container
    const selector = req.query.selector as string || '[data-share-calendar-card]';
    await page.waitForSelector(selector, { timeout: 15000 });

    const element = await page.$(selector);
    if (!element) {
      await browser.close();
      res.status(404).json({ error: 'Calendar element not found' });
      return;
    }

    const png = await element.screenshot({ type: 'png' }) as Buffer;
    await browser.close();

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(png);
  } catch (error: any) {
    console.error('screenshot-calendar error', error);
    res.status(500).json({ error: 'Failed to render screenshot', detail: String(error?.message || error) });
  }
}


