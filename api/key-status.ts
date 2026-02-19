import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
    const hasServerKey = !!(
        process.env.GEMINI_API_KEY &&
        process.env.GEMINI_API_KEY.length > 0 &&
        !process.env.GEMINI_API_KEY.startsWith('PLACEHOLDER')
    );
    res.status(200).json({ hasServerKey });
}
