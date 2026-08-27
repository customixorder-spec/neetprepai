import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';
import { GoogleGenAI } from '@google/genai';

// In-memory OTP storage for serverless execution
// In serverless, memory persists across warm invocations; client also carries secure token fallback
const otpStore = new Map<string, { code: string; expiresAt: number }>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.url || '';
  const cleanUrl = url.split('?')[0];

  // Route: /api/health
  if (cleanUrl.endsWith('/health')) {
    return res.status(200).json({ status: 'ok', time: new Date().toISOString(), platform: 'vercel-serverless' });
  }

  // Route: /api/auth/smtp-status
  if (cleanUrl.endsWith('/smtp-status')) {
    const rawUser = process.env.SMTP_USER || process.env.GMAIL_USER || '';
    const rawPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || '';
    const hasUser = !!rawUser.trim();
    const hasPass = !!rawPass.trim();

    return res.status(200).json({
      configured: hasUser && hasPass,
      smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
      smtpPort: Number(process.env.SMTP_PORT) || 587,
      userConfigured: hasUser ? `${rawUser.trim().slice(0, 3)}***@${rawUser.trim().split('@')[1] || 'gmail.com'}` : null,
      instructions: 'To configure SMTP: Set SMTP_USER and SMTP_PASS (16-character Google App Password) in Vercel Settings > Environment Variables.'
    });
  }

  // Route: /api/auth/send-otp
  if (cleanUrl.endsWith('/send-otp') && req.method === 'POST') {
    try {
      const { email } = req.body || {};
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ success: false, error: 'Valid email address is required.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail.endsWith('@gmail.com')) {
        return res.status(400).json({ success: false, error: 'Only @gmail.com email addresses are allowed.' });
      }

      // Generate 6-digit numeric OTP
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

      otpStore.set(cleanEmail, { code, expiresAt });

      // Check environment variables
      const rawUser = process.env.SMTP_USER || process.env.GMAIL_USER || '';
      const rawPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || '';
      const smtpUser = rawUser.trim();
      const smtpPass = rawPass.replace(/\s+/g, ''); // Strip spaces from Google App Password
      const smtpHost = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
      const smtpPort = Number(process.env.SMTP_PORT) || 587;
      const smtpFrom = (process.env.SMTP_FROM || smtpUser || `"NEET UG AI Prep" <${smtpUser || 'no-reply@neetprepai.org'}>`).trim();

      let sentViaEmail = false;
      let emailError: string | null = null;

      if (smtpUser && smtpPass) {
        try {
          const isGmail = smtpHost.includes('gmail') || smtpUser.toLowerCase().endsWith('@gmail.com');

          const transporter = isGmail
            ? nodemailer.createTransport({
                service: 'gmail',
                auth: {
                  user: smtpUser,
                  pass: smtpPass,
                },
                connectionTimeout: 10000,
                greetingTimeout: 8000,
                socketTimeout: 15000,
              })
            : nodemailer.createTransport({
                host: smtpHost,
                port: smtpPort,
                secure: smtpPort === 465,
                auth: {
                  user: smtpUser,
                  pass: smtpPass,
                },
                connectionTimeout: 10000,
                greetingTimeout: 8000,
                socketTimeout: 15000,
                tls: {
                  rejectUnauthorized: false,
                },
              });

          await transporter.sendMail({
            from: smtpFrom,
            to: cleanEmail,
            subject: `[NEET UG AI Prep] Your 6-Digit OTP Code: ${code}`,
            text: `Your NEET UG AI Prep verification OTP code is ${code}. It is valid for 5 minutes. Do not share it with anyone.`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <h2 style="color: #4f46e5; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">NEET UG AI Prep Verification</h2>
                  <p style="color: #64748b; font-size: 13px; margin-top: 6px;">Secure Email OTP Authentication</p>
                </div>
                
                <p style="font-size: 14px; color: #334155; margin-bottom: 16px;">Hello NEET Aspirant,</p>
                <p style="font-size: 14px; color: #334155; margin-bottom: 24px; line-height: 1.6;">
                  Use the 6-digit verification code below to log in / verify your account on <strong>NEET UG AI Prep</strong>:
                </p>

                <div style="text-align: center; margin: 32px 0;">
                  <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #4338ca; background-color: #f5f3ff; padding: 18px 24px; border-radius: 14px; border: 2px solid #c7d2fe; display: inline-block;">
                    ${code}
                  </div>
                </div>

                <p style="font-size: 13px; color: #64748b; line-height: 1.5; text-align: center; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                  ⏰ This code will expire in <strong>5 minutes</strong>.<br />
                  If you did not request this OTP, you can safely ignore this email.
                </p>
              </div>
            `,
          });

          sentViaEmail = true;
        } catch (err: any) {
          console.error('[SMTP ERROR]', err);
          emailError = err?.message || 'SMTP transmission error. Please check your credentials.';
        }
      } else {
        emailError = 'SMTP credentials (SMTP_USER / SMTP_PASS) not configured in environment variables.';
      }

      return res.status(200).json({
        success: true,
        message: sentViaEmail
          ? `OTP sent directly to your Gmail inbox (${cleanEmail}).`
          : `OTP code generated for ${cleanEmail}. (SMTP not configured in environment)`,
        sentViaEmail,
        emailError,
        otpCode: sentViaEmail ? null : code,
        expiresInSeconds: 300,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Failed to generate OTP code.' });
    }
  }

  // Route: /api/auth/verify-otp
  if (cleanUrl.endsWith('/verify-otp') && req.method === 'POST') {
    try {
      const { email, otp } = req.body || {};
      if (!email || !otp) {
        return res.status(400).json({ success: false, error: 'Email address and 6-digit OTP code are required.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const record = otpStore.get(cleanEmail);

      if (!record) {
        return res.status(400).json({ success: false, error: 'No OTP was requested for this email or it has expired. Please request a new code.' });
      }

      if (Date.now() > record.expiresAt) {
        otpStore.delete(cleanEmail);
        return res.status(400).json({ success: false, error: 'OTP code has expired. Please request a new code.' });
      }

      if (record.code !== otp.trim()) {
        return res.status(400).json({ success: false, error: 'Incorrect OTP code entered. Please check and try again.' });
      }

      otpStore.delete(cleanEmail);
      return res.status(200).json({ success: true, message: 'Email OTP verified successfully!' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Verification error.' });
    }
  }

  // Route: /api/gemini/generate
  if (cleanUrl.endsWith('/gemini/generate') && req.method === 'POST') {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ success: false, error: 'GEMINI_API_KEY environment variable is missing.' });
      }

      const ai = new GoogleGenAI({ apiKey });
      const { prompt, systemInstruction, model } = req.body || {};

      const response = await ai.models.generateContent({
        model: model || 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: systemInstruction || undefined,
        },
      });

      return res.status(200).json({ success: true, text: response.text });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Gemini API execution error.' });
    }
  }

  return res.status(404).json({ error: `Route not found: ${req.url}` });
}
