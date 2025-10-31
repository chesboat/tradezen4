import { Resend } from 'resend';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { subject, message, userEmail, userId, displayName } = req.body;

    console.log('📧 Received support request:', { subject, userEmail, userId });

    // Validate required fields
    if (!subject || !message) {
      return res.status(400).json({ message: 'Subject and message are required' });
    }

    // Check if API key exists
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY not found in environment variables');
      return res.status(500).json({ 
        message: 'Email service not configured',
        error: 'Missing API key' 
      });
    }

    // Send email via Resend
    // Note: Use 'onboarding@resend.dev' for testing if domain not verified
    const { data, error } = await resend.emails.send({
      from: 'Refine Support <onboarding@resend.dev>',
      to: 'support@refine.trading',
      replyTo: userEmail || 'noreply@refine.trading',
      subject: `Support Request: ${subject}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a1a; border-bottom: 2px solid #f97316; padding-bottom: 10px;">
            New Support Request
          </h2>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 8px 0;"><strong>From:</strong> ${displayName || 'Unknown User'}</p>
            <p style="margin: 8px 0;"><strong>Email:</strong> ${userEmail || 'Not provided'}</p>
            <p style="margin: 8px 0;"><strong>User ID:</strong> ${userId || 'Anonymous'}</p>
            <p style="margin: 8px 0;"><strong>Subject:</strong> ${subject}</p>
          </div>
          
          <div style="background: white; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h3 style="color: #374151; margin-top: 0;">Message:</h3>
            <p style="color: #1f2937; line-height: 1.6; white-space: pre-wrap;">${message}</p>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              💡 <strong>Tip:</strong> Reply directly to this email to respond to the user.
            </p>
          </div>
        </div>
      `
    });

    if (error) {
      console.error('❌ Resend API error:', JSON.stringify(error, null, 2));
      return res.status(500).json({ 
        message: 'Failed to send email',
        error: error.message || 'Unknown error',
        details: error
      });
    }

    console.log('✅ Support email sent successfully:', data);
    return res.status(200).json({ 
      success: true,
      messageId: data?.id 
    });

  } catch (error: any) {
    console.error('❌ Error sending support email:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return res.status(500).json({ 
      message: 'Failed to send support email',
      error: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

