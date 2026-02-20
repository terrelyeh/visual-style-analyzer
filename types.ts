export enum TargetMedium {
  SLIDES = 'Slides',
  SAAS = 'SaaS',
  POSTER = 'Poster'
}

export interface AnalysisSummary {
  mood_keywords: string[];
  primary_colors: string[];
  style_description: string;
}

export interface AnalysisResult {
  yaml: string;
  summary: AnalysisSummary;
  image_generation_prompt: string;
  source_medium: TargetMedium;
  style_guide: StyleGuideSummary;
}

export interface StyleGuideSummary {
  design_characteristics: string[];
  typography: {
    heading: string;
    body: string;
    rationale: string;
  };
  layout_logic: string[];
  cautions: string[];
}

export interface AnalysisState {
  isLoading: boolean;
  result: AnalysisResult | null;
  error: string | null;
}

export interface VisualAsset {
  id: string;
  type: 'file' | 'url';
  file?: File;
  url?: string;
  previewUrl: string;
}

export interface SlidePreview {
  type: string;
  label: string;
  image: string | null;
  isLoading: boolean;
  error: string | null;
}

export const SLIDE_TYPES = [
  {
    type: 'title',
    label: '封面頁 (Title Slide)',
    promptPrefix: 'Presentation title slide, hero visual, large bold heading, subtitle text, speaker info area, flat UI screenshot, no device frame, no realistic background',
  },
  {
    type: 'divider',
    label: '章節分隔頁 (Section Divider)',
    promptPrefix: 'Section divider slide, bold color block, minimal centered text, dramatic whitespace, flat UI screenshot, no device frame, no realistic background',
  },
  {
    type: 'content',
    label: '標題 + 內文 (Content Layout)',
    promptPrefix: 'Content slide with heading, body text paragraphs, bullet points, clean readable layout, flat UI screenshot, no device frame, no realistic background',
  },
  {
    type: 'chart',
    label: '數據圖表 (Data & Chart)',
    promptPrefix: 'Data visualization slide, charts, graphs, statistics, KPI numbers, infographic layout, flat UI screenshot, no device frame, no realistic background',
  },
] as const;