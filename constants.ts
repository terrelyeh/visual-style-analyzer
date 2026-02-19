import { TargetMedium } from './types';

export const MEDIUM_DESCRIPTIONS: Record<TargetMedium, string> = {
  [TargetMedium.SLIDES]: "針對簡報提案 (NotebookLM Workflow)",
  [TargetMedium.SAAS]: "定義 App Shell、UI 狀態與 Design Tokens",
  [TargetMedium.POSTER]: "針對海報與主視覺 (Aesthetic Impact)",
};

interface BestPractice {
  title: string;
  goldenRatio: string;
  recipe: string[];
  donts: string;
}

export const MEDIUM_BEST_PRACTICES: Record<TargetMedium, BestPractice> = {
  [TargetMedium.SLIDES]: {
    title: "簡報提案 (Slides) 最佳實踐",
    goldenRatio: "建議張數：3 張 (黃金比例)",
    recipe: [
      "1 張 封面主視覺 (定義標題風格與主色調)",
      "1 張 內頁版型 (定義圖文排版與留白邏輯)",
      "1 張 數據圖表 (定義 Chart Sequence 配色)"
    ],
    donts: "請勿混用風格差異過大的圖片 (如極簡風混搭賽博龐克)，這會導致排版邏輯混亂。"
  },
  [TargetMedium.SAAS]: {
    title: "SaaS / SPA 最佳實踐",
    goldenRatio: "建議張數：3-4 張",
    recipe: [
      "1 張 全景結構圖 (Dashboard/Landing，定義 App Shell)",
      "1 張 元件細節 (按鈕、表單，定義 UI States)",
      "1 張 品牌氛圍圖 (不一定是介面，用於提取正確色票)"
    ],
    donts: "若要製作 Dark Mode，請確保 3 張圖皆為深色系，切勿深淺混搭。"
  },
  [TargetMedium.POSTER]: {
    title: "海報視覺 (Poster) 最佳實踐",
    goldenRatio: "建議張數：1-2 張",
    recipe: [
      "1 張 構圖參考 (定義佈局張力)",
      "1 張 紋理參考 (定義紙質或雜訊細節)"
    ],
    donts: "避免上傳充滿純文字的圖片，AI 需要的是視覺構成而非文字內容。"
  }
};

const BASE_INSTRUCTION_PREFIX = `
## Role & Objective
You are the **Visual Spec Architect**. Your mission is to analyze visual inputs and translate their "Visual DNA" into a structured, production-ready **YAML Design Specification**.

## Output Format - CRITICAL
You **MUST** return a single valid JSON object. 
- **DO NOT** use Markdown code blocks.
- The JSON structure must be exactly as follows:

{
  "summary": {
    "mood_keywords": ["English (繁體中文)", "English (繁體中文)", "English (繁體中文)"],
    "primary_colors": ["#Hex1", "#Hex2", "#Hex3", "#Hex4", "#Hex5"],
    "style_description": "A concise, 2-sentence description of the visual style in Traditional Chinese (繁體中文)."
  },
  "image_generation_prompt": "A descriptive English prompt tailored to the specific medium. DO NOT include technical parameter suffixes like '--ar' or '--v'.",
  "yaml_spec": "THE_FULL_YAML_STRING_HERE"
}

## Operational Workflow
1. Analyze the uploaded images.
2. Extract the visual style.
3. Generate the summary. **Important**: 'mood_keywords' MUST be in the format 'English Term (繁體中文)', e.g., 'Minimalist (極簡主義)'.
4. Generate the YAML Spec strictly following the schema below based on the user's selected medium.
`;

const SLIDES_SCHEMA = `
## YAML Schema for SLIDES (Presentation)
Generate the 'yaml_spec' string using this structure. Values should be in English or Traditional Chinese where appropriate:

design_specification:
  meta:
    target_medium: "Slides / Presentation"
    visual_theme: "Name of the theme (e.g., Corporate Clean)"
  
  # [Color Palette for Screens]
  color_scheme:
    backgrounds: { primary: "#...", secondary: "#..." }
    text: { title: "#...", body: "#..." }
    accents: ["#...", "#..."]
    chart_sequence: ["#Data1", "#Data2", "#Data3", "#Data4"]

  # [Typography & Readability]
  typography:
    font_pairing: { heading: "...", body: "..." }
    readability_rules: "Rules for contrast and font sizes..."

  # [Master Slide Layouts]
  layout_templates:
    title_slide:
      composition: "Center/Left-align rules..."
      visual_element: "Description of hero graphic..."
    content_slide:
      grid: "2-column / 3-column..."
      whitespace: "High/Medium/Low..."
    divider_slide:
      style: "Full flood color or Image..."
`;

const SAAS_SCHEMA = `
## YAML Schema for SAAS (Web Application)
Generate the 'yaml_spec' string using this structure. Values should be in English or Traditional Chinese where appropriate:

design_specification:
  meta:
    target_medium: "SaaS / Web App"
    ui_style: "Name of the style (e.g., Modern Dashboard)"

  # [Design Tokens]
  design_tokens:
    colors:
      brand: { primary: "#...", secondary: "#..." }
      surface: { base: "#...", elevated: "#...", border: "#..." }
      functional: { success: "#...", warning: "#...", error: "#..." }
      text: { primary: "#...", secondary: "#...", muted: "#..." }
    spacing: { base_unit: "4px", scale: "..." }
    radius: { button: "...", card: "..." }

  # [Component Specifications]
  components:
    buttons:
      solid: "Style description..."
      outline: "Style description..."
    cards:
      shadow: "..."
      border: "..."
    inputs:
      active_state: "..."
      focus_state: "..."

  # [App Shell & Layout]
  layout_shell:
    navigation: "Sidebar / Topbar / Hybrid..."
    grid_system: "Fluid / Fixed..."
    z_index_strategy: "Layering rules..."
`;

const POSTER_SCHEMA = `
## YAML Schema for POSTER (Key Visual)
Generate the 'yaml_spec' string using this structure. Values should be in English or Traditional Chinese where appropriate:

design_specification:
  meta:
    target_medium: "Poster / Key Visual"
    artistic_style: "Name of the style (e.g., Swiss Style / Cyberpunk)"

  # [Art Direction]
  art_direction:
    mood_keywords: ["English (Chinese)", ...]
    visual_metaphor: "Description of the core concept..."
    texture_quality: "Grain / Noise / Clean / Glossy..."
    lighting_mood: "Soft / Hard / Neon / Natural..."

  # [Composition Guide]
  composition:
    balance: "Symmetrical / Asymmetrical..."
    focal_point: "Center / Rule of Thirds..."
    typography_treatment: "Experimental / Minimal / Bold..."
    negative_space: "Usage rules..."

  # [Generative AI Prompting Helper]
  midjourney_parameters:
    aspect_ratio: "2:3 (Portrait)"
    stylize_value: "High / Medium / Low"
    chaos: "Level of variation..."
    prompt_structure: "[Subject] + [Style Modifiers] + [Environment] + [Lighting]"
`;

export const getSystemInstruction = (medium: TargetMedium): string => {
  let specificSchema = "";
  
  switch (medium) {
    case TargetMedium.SLIDES:
      specificSchema = SLIDES_SCHEMA;
      break;
    case TargetMedium.SAAS:
      specificSchema = SAAS_SCHEMA;
      break;
    case TargetMedium.POSTER:
      specificSchema = POSTER_SCHEMA;
      break;
    default:
      specificSchema = SAAS_SCHEMA;
  }

  return `${BASE_INSTRUCTION_PREFIX}\n\n${specificSchema}`;
};