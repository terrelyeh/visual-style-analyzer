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

    const { prompt, aspectRatio } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Missing required field: prompt' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const extractImage = (response: any): string | null => {
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        return null;
    };

    // Try Pro first, fallback to Flash
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: { parts: [{ text: prompt }] },
            config: {
                imageConfig: { aspectRatio, imageSize: '1K' },
            },
        });
        const img = extractImage(response);
        if (img) return res.status(200).json({ image: img });
        throw new Error('No image in Pro response');
    } catch {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: prompt }] },
                config: {
                    imageConfig: { aspectRatio },
                },
            });
            const img = extractImage(response);
            if (img) return res.status(200).json({ image: img });
            throw new Error('No image in Flash response');
        } catch (err: any) {
            console.error('Image generation error:', err);
            return res.status(500).json({ error: '圖片生成失敗：' + err.message });
        }
    }
}
