import OpenAI from 'openai';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { checkRateLimit, extractUserId } from './_lib/rateLimit';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract user ID for rate limiting
    const userId = extractUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check rate limit
    const rateLimitResult = await checkRateLimit(userId, 'generate-ai-summary');
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', rateLimitResult.limit.toString());
    res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    res.setHeader('X-RateLimit-Reset', rateLimitResult.resetAt.toISOString());
    
    if (!rateLimitResult.allowed) {
      return res.status(429).json({ 
        error: rateLimitResult.message || 'Rate limit exceeded',
        remaining: rateLimitResult.remaining,
        limit: rateLimitResult.limit,
        resetAt: rateLimitResult.resetAt.toISOString(),
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    const openai = new OpenAI({ apiKey });
    
    const { prompt, data, model = 'gpt-4o-mini' } = req.body;

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: prompt,
        },
        {
          role: 'user',
          content: JSON.stringify(data, null, 2),
        },
      ],
      max_completion_tokens: 700,
    });

    const content = completion.choices[0]?.message?.content || '';
    
    return res.status(200).json({ content });
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate AI summary',
      message: error?.message 
    });
  }
}

