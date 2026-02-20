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

export interface PreviewItem {
  type: string;
  label: string;
  image: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface PreviewTypeConfig {
  type: string;
  label: string;
  promptPrefix: string;
  aspectRatio: string;
}

export const MEDIUM_PREVIEW_TYPES: Record<TargetMedium, PreviewTypeConfig[]> = {
  [TargetMedium.SLIDES]: [
    {
      type: 'title',
      label: '封面頁 (Title Slide)',
      promptPrefix: 'Presentation title slide, hero visual, large bold heading, subtitle text, speaker info area, flat UI screenshot, no device frame, no realistic background',
      aspectRatio: '16:9',
    },
    {
      type: 'divider',
      label: '章節分隔頁 (Section Divider)',
      promptPrefix: 'Section divider slide, bold color block, minimal centered text, dramatic whitespace, flat UI screenshot, no device frame, no realistic background',
      aspectRatio: '16:9',
    },
    {
      type: 'content',
      label: '標題 + 內文 (Content Layout)',
      promptPrefix: 'Content slide with heading, body text paragraphs, bullet points, clean readable layout, flat UI screenshot, no device frame, no realistic background',
      aspectRatio: '16:9',
    },
    {
      type: 'chart',
      label: '數據圖表 (Data & Chart)',
      promptPrefix: 'Data visualization slide, charts, graphs, statistics, KPI numbers, infographic layout, flat UI screenshot, no device frame, no realistic background',
      aspectRatio: '16:9',
    },
  ],
  [TargetMedium.SAAS]: [
    {
      type: 'dashboard',
      label: '儀表板 (Dashboard)',
      promptPrefix: 'Modern web application dashboard, KPI cards, charts, sidebar navigation, clean data-driven UI, flat UI screenshot, no device frame, no monitor, no realistic background',
      aspectRatio: '16:9',
    },
    {
      type: 'settings',
      label: '設定頁 (Settings)',
      promptPrefix: 'Web application settings page, form inputs, toggle switches, section headers, clean organized layout, flat UI screenshot, no device frame, no monitor, no realistic background',
      aspectRatio: '16:9',
    },
    {
      type: 'table',
      label: '表格列表 (Data Table)',
      promptPrefix: 'Web application data table view, sortable columns, pagination, search bar, filter controls, rows of data, flat UI screenshot, no device frame, no monitor, no realistic background',
      aspectRatio: '16:9',
    },
    {
      type: 'detail',
      label: '詳情頁 (Detail Page)',
      promptPrefix: 'Web application detail page, content area with metadata sidebar, tabs, action buttons, breadcrumb navigation, flat UI screenshot, no device frame, no monitor, no realistic background',
      aspectRatio: '16:9',
    },
  ],
  [TargetMedium.POSTER]: [
    {
      type: 'portrait',
      label: '直式海報 (Portrait 2:3)',
      promptPrefix: 'Vertical poster art, graphic design key visual, bold typography layout, print design quality, artistic composition',
      aspectRatio: '2:3',
    },
    {
      type: 'landscape',
      label: '橫式主視覺 (Landscape 16:9)',
      promptPrefix: 'Horizontal key visual banner, wide cinematic composition, bold typography, graphic design quality, artistic layout',
      aspectRatio: '16:9',
    },
    {
      type: 'square',
      label: '正方形 (Square 1:1)',
      promptPrefix: 'Square format poster design, centered composition, social media ready, balanced typography, graphic design quality',
      aspectRatio: '1:1',
    },
    {
      type: 'story',
      label: '限動尺寸 (Story 9:16)',
      promptPrefix: 'Vertical story format design, mobile-first composition, bold vertical typography, immersive visual, graphic design quality',
      aspectRatio: '9:16',
    },
  ],
};