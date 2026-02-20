import { GoogleGenAI } from "@google/genai";
import { getSystemInstruction } from '../constants';
import { TargetMedium, AnalysisResult, VisualAsset } from '../types';

const SERVER_KEY_SENTINEL = '__server__';

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      resolve(base64String.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function urlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      resolve(base64String.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function cleanJsonString(text: string): string {
  let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return cleaned;
}

// ──────────────────────────────────────────────
// Analyze Image
// ──────────────────────────────────────────────

export const analyzeImage = async (
  assets: VisualAsset[],
  medium: TargetMedium,
  apiKey: string | null
): Promise<AnalysisResult> => {

  if (assets.length === 0) {
    throw new Error("未提供圖片素材，請先上傳圖片。");
  }

  // Build parts (base64 images) — needed for both proxy and direct calls
  const parts: any[] = [];

  for (const asset of assets) {
    try {
      if (asset.type === 'file' && asset.file) {
        const base64Data = await fileToBase64(asset.file);
        parts.push({ inlineData: { mimeType: asset.file.type, data: base64Data } });
      } else if (asset.type === 'url' && asset.url) {
        try {
          const base64Data = await urlToBase64(asset.url);
          parts.push({ inlineData: { mimeType: 'image/jpeg', data: base64Data } });
        } catch {
          console.warn(`CORS blocked: ${asset.url} — sending as URL text instead`);
          parts.push({ text: `[Image URL Source]: ${asset.url}` });
        }
      }
    } catch (e) {
      console.error("Error processing asset", asset, e);
    }
  }

  const promptText = `
    Analyze the attached visual assets (Moodboard).
    Target Medium: ${medium}
    
    Output valid JSON containing the summary, the image_generation_prompt, and the YAML specification.
    Ensure the 'yaml_spec' strictly follows the schema defined for ${medium}.
  `;
  parts.push({ text: promptText });

  const systemInstruction = getSystemInstruction(medium);

  const parseResponse = (responseText: string): AnalysisResult => {
    const cleaned = cleanJsonString(responseText);
    const parsedData = JSON.parse(cleaned);
    return {
      yaml: parsedData.yaml_spec || "# 錯誤: AI 未能生成 YAML 欄位",
      summary: parsedData.summary || {
        mood_keywords: [],
        primary_colors: [],
        style_description: "無法取得摘要。"
      },
      image_generation_prompt: parsedData.image_generation_prompt || "Abstract geometric composition.",
      source_medium: medium
    };
  };

  // ── Path A: Use server-side proxy ──
  if (apiKey === SERVER_KEY_SENTINEL) {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parts, systemInstruction, medium }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: '伺服器錯誤' }));
      throw new Error(err.error || '分析失敗');
    }

    const { text } = await res.json();
    try {
      return parseResponse(text);
    } catch {
      throw new Error("解析失敗：AI 回傳的格式並非有效的 JSON，請重試。");
    }
  }

  // ── Path B: BYOK — call Gemini directly ──
  if (!apiKey) {
    throw new Error("缺少 API Key，請在設定中配置您的金鑰。");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        systemInstruction,
        temperature: 0.4,
        responseMimeType: "application/json",
      }
    });

    const responseText = response.text;
    if (!responseText) throw new Error("AI 回應為空，請稍後再試。");

    try {
      return parseResponse(responseText);
    } catch {
      throw new Error("解析失敗：AI 回傳的格式並非有效的 JSON，請重試。");
    }
  } catch (error: any) {
    let msg = "分析失敗，請檢查您的 API Key 或稍後再試。";
    if (error.message?.includes("API_KEY")) msg = "API Key 無效或過期，請檢查設定。";
    if (error.message?.includes("429")) msg = "請求過於頻繁 (Rate Limit)，請稍候再試。";
    throw new Error(msg);
  }
};

// ──────────────────────────────────────────────
// Generate Visual Preview
// ──────────────────────────────────────────────

export const generateVisualPreview = async (
  prompt: string,
  medium: TargetMedium,
  apiKey: string | null
): Promise<string> => {

  let aspectRatio = "1:1";
  let enhancedPrompt = prompt;

  switch (medium) {
    case TargetMedium.SLIDES:
      aspectRatio = "16:9";
      enhancedPrompt = `Presentation Slide Design, Corporate Deck Layout, flat UI screenshot, direct interface view, no device frame, no monitor, no laptop, no desk, no realistic background, no mockup scene, High Resolution :: ${prompt}`;
      break;
    case TargetMedium.SAAS:
      aspectRatio = "16:9";
      enhancedPrompt = `Modern Desktop Web Application UI, Dashboard Interface, flat UI screenshot, direct interface view, no device frame, no monitor, no laptop, no phone, no desk, no realistic background, no mockup scene, High Fidelity, User Experience Design, Clean Lines :: ${prompt}`;
      break;
    case TargetMedium.POSTER:
      aspectRatio = "3:4";
      enhancedPrompt = `Vertical Poster Art, Graphic Design Key Visual, Typography Layout, Print Design quality :: ${prompt}`;
      break;
  }

  // ── Path A: Use server-side proxy ──
  if (apiKey === SERVER_KEY_SENTINEL) {
    const res = await fetch('/api/generate-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: enhancedPrompt, aspectRatio }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: '伺服器錯誤' }));
      throw new Error(err.error || '圖片生成失敗');
    }

    const { image } = await res.json();
    return image;
  }

  // ── Path B: BYOK — call Gemini directly ──
  if (!apiKey) {
    throw new Error("缺少 API Key，請在設定中配置。");
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

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: enhancedPrompt }] },
      config: { imageConfig: { aspectRatio, imageSize: "1K" } },
    });
    const img = extractImage(response);
    if (img) return img;
    throw new Error("Pro 模型未回傳圖片。");
  } catch (proErr: any) {
    console.warn("Pro image failed, trying Flash:", proErr);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: enhancedPrompt }] },
        config: { imageConfig: { aspectRatio } },
      });
      const img = extractImage(response);
      if (img) return img;
      throw new Error("Flash 模型未回傳圖片。");
    } catch (flashErr: any) {
      let msg = "圖片生成失敗。";
      if (proErr.message?.includes("403") || proErr.message?.includes("PERMISSION")) {
        msg += " (API Key 可能不支援圖片生成模型)";
      } else {
        msg += ` ${flashErr.message}`;
      }
      throw new Error(msg);
    }
  }
};