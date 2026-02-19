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
  source_medium: TargetMedium; // New field to track data origin
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