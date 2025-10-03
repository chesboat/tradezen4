// Lightweight canvas renderer to produce a stable calendar image without html2canvas
// Works consistently across desktop and iOS Safari by avoiding DOM cloning

export interface RenderDay {
  date: Date;
  pnl: number;
  tradesCount: number;
  winRate: number;
  avgRR: number;
  isOtherMonth?: boolean;
  isWeekend?: boolean;
  hasReflection?: boolean;
}

export interface RenderWeekSummary {
  weekNumber: number;
  totalPnl: number;
  activeDays: number;
}

export interface CalendarRenderData {
  monthName: string;
  year: number;
  weeks: RenderDay[][]; // 6 x 7 grid typical
  weeklySummaries: RenderWeekSummary[];
  monthlyPnl: number;
}

export interface RenderOptions {
  width?: number; // default 1200
  height?: number; // default 1000
  theme: 'light' | 'dark';
  accentColor?: 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'pink' | 'mono';
}

// Accent color gradients for social media backgrounds
const accentGradients = {
  blue: {
    dark: ['#1e3a8a', '#1e40af', '#1d4ed8'],  // Deep blue shades
    light: ['#dbeafe', '#bfdbfe', '#93c5fd'], // Light blue shades
  },
  purple: {
    dark: ['#581c87', '#6b21a8', '#7e22ce'],  // Deep purple shades
    light: ['#e9d5ff', '#d8b4fe', '#c084fc'], // Light purple shades
  },
  green: {
    dark: ['#14532d', '#166534', '#15803d'],  // Deep green shades
    light: ['#d1fae5', '#a7f3d0', '#6ee7b7'], // Light green shades
  },
  orange: {
    dark: ['#7c2d12', '#9a3412', '#c2410c'],  // Deep orange shades
    light: ['#fed7aa', '#fdba74', '#fb923c'], // Light orange shades
  },
  red: {
    dark: ['#7f1d1d', '#991b1b', '#b91c1c'],  // Deep red shades
    light: ['#fecaca', '#fca5a5', '#f87171'], // Light red shades
  },
  pink: {
    dark: ['#831843', '#9f1239', '#be123c'],  // Deep pink shades
    light: ['#fce7f3', '#fbcfe8', '#f9a8d4'], // Light pink shades
  },
  mono: {
    dark: ['#171717', '#262626', '#404040'],  // Deep gray shades
    light: ['#f5f5f5', '#e5e5e5', '#d4d4d4'], // Light gray shades
  },
};

export async function renderCalendarToDataURL(data: CalendarRenderData, opts: RenderOptions): Promise<string> {
  const width = opts.width ?? 1200;
  const height = opts.height ?? 750;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  // Colors - Apple-style with eye-catching gradients for social
  const cardBg = opts.theme === 'dark' ? '#0b0b0b' : '#ffffff';
  const border = opts.theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
  const muted = opts.theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';
  const fg = opts.theme === 'dark' ? '#ffffff' : '#0b0b0b';
  const green = '#22c55e';
  const red = '#ef4444';

  // Eye-catching gradient background for social media (personalized with accent color)
  const accentColor = opts.accentColor || 'blue';
  const gradientColors = opts.theme === 'dark' 
    ? accentGradients[accentColor].dark 
    : accentGradients[accentColor].light;
  
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, gradientColors[0]);
  grad.addColorStop(0.5, gradientColors[1]);
  grad.addColorStop(1, gradientColors[2]);
  
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Card
  const pad = 48;
  const cardX = pad, cardY = pad, cardW = width - pad * 2, cardH = height - pad * 2;
  // Rounded rect
  const r = 20;
  ctx.fillStyle = cardBg;
  roundRect(ctx, cardX, cardY, cardW, cardH, r);
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Header
  const title = `${data.monthName} ${data.year}`;
  ctx.fillStyle = fg;
  ctx.font = 'bold 42px ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto';
  ctx.fillText(title, cardX + 24, cardY + 60);

  // Monthly stats
  ctx.font = '600 20px ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto';
  ctx.fillStyle = muted;
  const mp = formatCurrency(data.monthlyPnl);
  ctx.fillText(`Monthly: ${mp}`, cardX + cardW - 24 - ctx.measureText(`Monthly: ${mp}`).width, cardY + 60);

  // Grid metrics - optimized for 6:5 aspect ratio tiles
  const cols = 8; // 7 days + week summary
  const rows = data.weeks.length; // typically 6
  const gridX = cardX + 16;
  const gridY = cardY + 96;
  const gridW = cardW - 32;
  const gridH = cardH - 128;
  const cellW = Math.floor(gridW / cols) - 6;
  const cellH = Math.floor((cellW * 5) / 6); // 6:5 aspect ratio (wider than tall)

  // Day headers
  const headers = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat','Week'];
  ctx.font = '600 16px ui-sans-serif, -apple-system, BlinkMacSystemFont';
  ctx.fillStyle = muted;
  headers.forEach((h, i) => {
    const tx = gridX + i * (cellW + 6) + 8;
    ctx.fillText(h, tx, gridY - 12);
  });

  // Cells
  for (let rIdx = 0; rIdx < rows; rIdx++) {
    const week = data.weeks[rIdx];
    for (let cIdx = 0; cIdx < 7; cIdx++) {
      const d = week[cIdx];
      const x = gridX + cIdx * (cellW + 6);
      const y = gridY + rIdx * (cellH + 6);
      // Cell background
      ctx.fillStyle = d.isOtherMonth ? alpha(cardBg, 0.6) : cardBg;
      roundRect(ctx, x, y, cellW, cellH, 12);
      ctx.fill();
      ctx.strokeStyle = border;
      ctx.stroke();

      // Date
      ctx.fillStyle = d.isOtherMonth ? muted : fg;
      ctx.font = '600 16px ui-sans-serif, -apple-system, BlinkMacSystemFont';
      ctx.fillText(String(d.date.getDate()), x + 10, y + 22);

      if (d.isWeekend) {
        // Weekend label
        ctx.fillStyle = alpha(muted, 0.8);
        ctx.font = '12px ui-sans-serif, -apple-system, BlinkMacSystemFont';
        centerText(ctx, 'Weekend', x, y, cellW, cellH);
        continue;
      }

      // Centered P&L (main metric)
      if (d.pnl !== 0) {
        const pnlText = formatCurrency(d.pnl);
        ctx.fillStyle = d.pnl > 0 ? green : red;
        ctx.font = fitFont(ctx, pnlText, cellW - 16, 16, 22, 'bold');
        centerText(ctx, pnlText, x, y + cellH / 2 - 12, cellW, 20);
      }

      // Centered trade count below P&L
      if (d.tradesCount > 0) {
        const t = `${d.tradesCount} trade${d.tradesCount > 1 ? 's' : ''}`;
        ctx.fillStyle = muted;
        ctx.font = '12px ui-sans-serif, -apple-system, BlinkMacSystemFont';
        centerText(ctx, t, x, y + cellH / 2 + 8, cellW, 16);
      }
    }

    // Weekly summary column
    const ws = data.weeklySummaries[rIdx];
    const sx = gridX + 7 * (cellW + 6);
    const sy = gridY + rIdx * (cellH + 6);
    ctx.fillStyle = cardBg;
    roundRect(ctx, sx, sy, cellW, cellH, 12);
    ctx.fill();
    ctx.strokeStyle = border;
    ctx.stroke();
    ctx.fillStyle = muted;
    ctx.font = '600 14px ui-sans-serif, -apple-system, BlinkMacSystemFont';
    centerText(ctx, `W${ws.weekNumber}`, sx, sy + 2, cellW, 18);
    ctx.fillStyle = ws.totalPnl > 0 ? green : ws.totalPnl < 0 ? red : muted;
    ctx.font = 'bold 14px ui-sans-serif, -apple-system, BlinkMacSystemFont';
    centerText(ctx, formatCurrency(ws.totalPnl), sx, sy + cellH / 2 - 12, cellW, 20);
    ctx.fillStyle = muted;
    ctx.font = '11px ui-sans-serif, -apple-system, BlinkMacSystemFont';
    centerText(ctx, `${ws.activeDays} days`, sx, sy + cellH / 2 + 8, cellW, 16);
  }

  // Subtle branding - bottom center
  const brandY = cardY + cardH - 28;
  ctx.fillStyle = muted;
  ctx.font = '600 14px ui-sans-serif, -apple-system, BlinkMacSystemFont';
  const brandText = '⚡ Refine · refine.trading';
  const brandW = ctx.measureText(brandText).width;
  ctx.fillText(brandText, cardX + (cardW - brandW) / 2, brandY);

  return canvas.toDataURL('image/png');
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function alpha(hexOrRgba: string, a: number): string {
  if (hexOrRgba.startsWith('#')) {
    const c = hexOrRgba.replace('#','');
    const n = parseInt(c.length === 3 ? c.split('').map((ch)=>ch+ch).join('') : c, 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return `rgba(${r},${g},${b},${a})`;
  }
  return hexOrRgba; // assume rgba
}

function centerText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, w: number, h: number) {
  const tw = ctx.measureText(text).width;
  const tx = x + (w - tw) / 2;
  const ty = y + h / 2 + 4;
  ctx.fillText(text, Math.floor(tx), Math.floor(ty));
}

function fitFont(ctx: CanvasRenderingContext2D, text: string, maxW: number, min: number, max: number, weight: 'bold' | '600' | 'normal'): string {
  let size = max;
  for (; size >= min; size -= 1) {
    ctx.font = `${weight} ${size}px ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto`;
    if (ctx.measureText(text).width <= maxW) break;
  }
  return `${weight} ${size}px ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto`;
}

function formatCurrency(n: number): string {
  const sign = n > 0 ? '+' : n < 0 ? '-' : '';
  const v = Math.abs(n);
  
  // Apple-style: abbreviate large numbers, round to whole numbers
  if (v >= 1000000) {
    return `${sign}$${(v / 1000000).toFixed(1)}M`;
  }
  if (v >= 1000) {
    return `${sign}$${(v / 1000).toFixed(1)}k`;
  }
  
  // Round to whole number (no cents)
  return `${sign}$${Math.round(v)}`;
}


