import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.startsWith('PLACEHOLDER')) {
        return res.status(503).json({ error: 'No server-side API key configured' });
    }

    const { parts, systemInstruction, medium } = req.body;

    if (!parts || !systemInstruction) {
        return res.status(400).json({ error: 'Missing required fields: parts, systemInstruction' });
    }

    try {
        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts },
            config: {
                systemInstruction,
                temperature: 0.4,
                responseMimeType: 'application/json',
            },
        });

        const text = response.text;
        if (!text) {
            return res.status(500).json({ error: 'AI 回應為空' });
        }

        res.status(200).json({ text });
    } catch (err: any) {
        console.error('Gemini analyze error:', err);
        let message = '分析失敗';
        if (err.message?.includes('429')) message = '請求過於頻繁，請稍候再試';
        if (err.message?.includes('API_KEY')) message = 'API Key 無效';
        res.status(500).json({ error: message });
    }
}
