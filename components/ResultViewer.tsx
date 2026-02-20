import React, { useState, useEffect } from 'react';
import { AnalysisState, TargetMedium, PreviewItem, MEDIUM_PREVIEW_TYPES } from '../types';
import { generateVisualPreview, generateMultiPreviews } from '../services/gemini';
import { useApiKey } from '../contexts/ApiKeyContext';
import { Copy, Check, Image as ImageIcon, Code, Palette, Zap, Download, ZoomIn, Loader2, AlertTriangle, X, Files, RefreshCw, ChevronLeft, ChevronRight, BookOpen, Type, LayoutGrid } from 'lucide-react';

interface ResultViewerProps {
  state: AnalysisState;
  medium: TargetMedium;
  onReAnalyze: () => void;
}

export const ResultViewer: React.FC<ResultViewerProps> = ({ state, medium, onReAnalyze }) => {
  const { apiKey } = useApiKey();
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Image Generation
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Multi-type previews (all mediums)
  const [previews, setPreviews] = useState<PreviewItem[]>([]);

  const result = state.result;
  const summary = result?.summary;
  const yaml = result?.yaml;
  const isStale = result && result.source_medium !== medium;

  // 1. Prompt for Slides (NotebookLM / Outline)
  const slideInstruction = `Role: Design Consultant & Content Strategist
Task: Analyze the attached 'design_specification' YAML and the user's content to create a structured presentation outline.

[Rules]
1. Logic: Apply the 'layout_mapping_logic' from the YAML.
2. Mood: "${summary?.style_description || ''}".
3. Density: Keep text density low (One concept per slide).
4. Output: detailed slide-by-slide breakdown.`;

  // 2. Prompt for Web App (Frontend Code)
  const saasInstruction = `Role: Senior Frontend Engineer
Task: Build a high-fidelity UI based strictly on the attached Design Specification.

[Requirements]
1. Framework: React + Tailwind CSS + Lucide React.
2. Tokens: Strictly adhere to 'color_system' and 'typography' in YAML.
3. Mood: "${summary?.style_description || ''}".
4. Layout: Implement the 'app_shell' structure defined in the spec.`;

  // 3. Prompt for Poster (Midjourney / Graphic Design)
  const posterInstruction = `Role: AI Art Director & Prompt Engineer
Task: Deconstruct the attached 'design_specification' to create a high-fidelity Generative AI prompt (for Midjourney v6 or DALL-E 3).

[Requirements]
1. Composition: Describe the visual hierarchy based on 'layout_system'.
2. Style: Incorporate keywords: ${summary?.mood_keywords.join(', ') || ''}.
3. Colors: Use the 'color_system' palette.
4. Output Format: Provide a raw prompt string: "/imagine prompt: [Subject] + [Art Style] + [Lighting/Color] + [Parameters]"`;

  // Dynamic Selection
  const getActiveInstruction = () => {
    switch (medium) {
      case TargetMedium.SLIDES: return slideInstruction;
      case TargetMedium.SAAS: return saasInstruction;
      case TargetMedium.POSTER: return posterInstruction;
      default: return saasInstruction;
    }
  };

  const activeInstruction = getActiveInstruction();
  const fullBundle = `${activeInstruction}\n\n[Attached Design Specification]\n${yaml || ''}`;

  const getPromptLabel = () => {
    switch (medium) {
      case TargetMedium.SLIDES: return "NotebookLM 指令";
      case TargetMedium.SAAS: return "Frontend Developer 指令";
      case TargetMedium.POSTER: return "AI Art Director 指令";
      default: return "AI 指令";
    }
  };

  useEffect(() => {
    setGeneratedImageUrl(null);
    setImageError(null);
    setIsGeneratingImage(false);
    setPreviews([]);
  }, [state.result, medium]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleGeneratePreview = async () => {
    if (!state.result?.image_generation_prompt) return;

    const previewTypes = MEDIUM_PREVIEW_TYPES[medium];
    const initialPreviews: PreviewItem[] = previewTypes.map(pt => ({
      type: pt.type,
      label: pt.label,
      image: null,
      isLoading: true,
      error: null,
    }));
    setPreviews(initialPreviews);
    setIsGeneratingImage(true);
    setGeneratedImageUrl(null);
    setImageError(null);

    await generateMultiPreviews(
      state.result.image_generation_prompt,
      medium,
      apiKey,
      (index, result) => {
        setPreviews(prev => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            image: result.image || null,
            error: result.error || null,
            isLoading: false,
          };
          return updated;
        });
      }
    );
    setIsGeneratingImage(false);
  };

  if (state.isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-zinc-400 min-h-[500px] border-2 border-dashed border-zinc-200 rounded-2xl bg-white/50 animate-in fade-in duration-300">
        <div className="bg-white p-6 rounded-2xl shadow-xl shadow-sky-100/50 mb-8 border border-zinc-100 relative">
          <div className="absolute inset-0 rounded-2xl border-t-2 border-sky-600 animate-spin"></div>
          <Loader2 className="w-10 h-10 text-sky-600" />
        </div>
        <p className="font-bold text-xl text-zinc-900">正在解析視覺風格</p>
        <p className="text-base mt-3 text-zinc-500 font-medium">提取配色、結構與設計規範中...</p>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 bg-red-50 border border-red-100 rounded-2xl text-center shadow-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-red-900 mb-3">分析失敗</h3>
          <p className="text-base text-red-700/80 leading-relaxed">{state.error}</p>
        </div>
      </div>
    );
  }

  if (!state.result) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-zinc-400 p-12 border-2 border-dashed border-zinc-300 rounded-3xl bg-zinc-50/50 min-h-[400px]">
        <div className="w-16 h-16 bg-white border border-zinc-200 rounded-2xl shadow-sm flex items-center justify-center mb-6">
          <Zap className="w-8 h-8 text-zinc-300" />
        </div>
        <p className="font-bold text-lg text-zinc-500">準備就緒</p>
        <p className="text-base mt-2 font-medium">上傳圖片以生成您的設計規範</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">

      {/* Stale Data Overlay */}
      {isStale && (
        <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-sm rounded-3xl border-2 border-sky-100 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
          <div className="max-w-md p-8 bg-white shadow-2xl shadow-sky-900/10 rounded-2xl border border-zinc-100">
            <div className="w-14 h-14 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-5">
              <RefreshCw size={24} className="animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-2">請更新設計規範</h3>
            <p className="text-zinc-500 mb-6 text-sm font-medium leading-relaxed">
              您將載體切換為 <span className="font-bold text-zinc-800">{medium === TargetMedium.SLIDES ? '簡報' : medium === TargetMedium.SAAS ? 'Web App' : '海報'}</span>，
              但目前的報告是針對 <span className="font-bold text-zinc-800 line-through decoration-red-400 decoration-2">{result.source_medium === TargetMedium.SLIDES ? '簡報' : result.source_medium === TargetMedium.SAAS ? 'Web App' : '海報'}</span> 生成的。
              請重新分析以獲取正確的結構。
            </p>
            <button
              onClick={onReAnalyze}
              className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-lg shadow-sky-200 hover:shadow-sky-300 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              <span>重新分析風格 (Re-Analyze)</span>
            </button>
          </div>
        </div>
      )}

      {/* 1. Summary Card */}
      <div className={`bg-white border-2 border-zinc-200 rounded-2xl shadow-lg shadow-zinc-200/50 p-8 relative overflow-hidden group ${isStale ? 'blur-[2px] opacity-50 pointer-events-none' : ''}`}>
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-slate-500 to-sky-500"></div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-slate-100 text-slate-600 rounded-lg border border-slate-200">
            <Palette className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-zinc-900">視覺風格基因 (Visual DNA)</h2>
        </div>

        <p className="text-zinc-800 text-xl leading-relaxed mb-8 font-medium">
          {summary?.style_description}
        </p>

        <div className="space-y-8">
          {/* Colors */}
          <div>
            <span className="text-xs font-bold text-zinc-400 mb-4 block uppercase tracking-wider">核心色票 (點擊複製)</span>
            <div className="flex flex-wrap gap-4">
              {summary?.primary_colors.map((color, idx) => (
                <div key={idx} className="group/color relative">
                  <button
                    onClick={() => copyToClipboard(color, `color-${idx}`)}
                    className="w-14 h-14 rounded-2xl border-2 border-zinc-100 shadow-sm transition-transform hover:scale-110 focus:outline-none ring-2 ring-transparent hover:ring-zinc-300 hover:shadow-md cursor-pointer"
                    style={{ backgroundColor: color }}
                  />
                  <div className="absolute left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover/color:opacity-100 transition-opacity bg-zinc-900 text-white text-xs py-1 px-2 rounded font-mono font-medium shadow-lg pointer-events-none z-10">
                    {color}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Keywords */}
          <div>
            <span className="text-xs font-bold text-zinc-400 mb-4 block uppercase tracking-wider">風格關鍵字 (點擊複製)</span>
            <div className="flex flex-wrap gap-3">
              {summary?.mood_keywords.map((keyword, idx) => (
                <button
                  key={idx}
                  onClick={() => copyToClipboard(keyword, `keyword-${idx}`)}
                  className="relative group/keyword px-4 py-2 text-sm font-semibold bg-zinc-50 text-zinc-700 rounded-lg border border-zinc-200 shadow-sm hover:bg-sky-50 hover:text-sky-700 hover:border-sky-200 transition-all active:scale-95 cursor-pointer"
                >
                  {keyword}
                  {copiedSection === `keyword-${idx}` && (
                    <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-xs py-1 px-2 rounded shadow-lg animate-in fade-in zoom-in duration-200 whitespace-nowrap z-20">
                      Copied!
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Action Bridge */}
      <div className={`bg-white border-2 border-zinc-200 rounded-2xl shadow-lg shadow-zinc-200/50 overflow-hidden group ${isStale ? 'blur-[2px] opacity-50 pointer-events-none' : ''}`}>
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-zinc-500 to-zinc-700"></div>

        <div className="px-6 py-5 border-b border-zinc-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-zinc-200 text-zinc-700 rounded-lg">
              <Code className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wide">
                {getPromptLabel()}
              </h3>
              <span className="text-[10px] text-zinc-400 font-bold">搭配下方 Spec 一起使用</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Primary Combined Copy Button */}
            <button
              onClick={() => copyToClipboard(fullBundle, 'full_bundle')}
              className="text-xs flex items-center gap-2 bg-zinc-900 text-white hover:bg-zinc-800 font-bold transition-all px-4 py-2 rounded-lg shadow-sm hover:shadow active:scale-95"
            >
              {copiedSection === 'full_bundle' ? <Check size={16} /> : <Files size={16} />}
              {copiedSection === 'full_bundle' ? '已複製完整內容' : '複製完整指令 (含 Spec)'}
            </button>

            {/* Secondary Single Copy Button */}
            <button
              onClick={() => copyToClipboard(activeInstruction, 'bridge')}
              className="text-xs flex items-center gap-2 text-zinc-500 hover:text-zinc-900 font-bold transition-colors px-3 py-2 hover:bg-zinc-200 rounded-lg border border-transparent hover:border-zinc-300"
              title="僅複製 Prompt 指令"
            >
              {copiedSection === 'bridge' ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        <div className="p-6 bg-white">
          <div className="text-zinc-600 text-sm font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-[240px] overflow-y-auto bg-zinc-50 p-5 rounded-xl border border-zinc-200/80">
            {activeInstruction}
          </div>
        </div>
      </div>

      {/* 3. YAML Spec */}
      <div className={`bg-white border-2 border-zinc-200 rounded-2xl shadow-lg shadow-zinc-200/50 overflow-hidden flex flex-col group ${isStale ? 'blur-[2px] opacity-50 pointer-events-none' : ''}`}>
        <div className="px-6 py-5 border-b border-zinc-200 flex justify-between items-center bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[10px] bg-zinc-800 text-white px-2 py-1 rounded shadow-sm">YAML</span>
            <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wide">設計規格 (Design Spec)</h3>
          </div>
          <button
            onClick={() => copyToClipboard(yaml || '', 'yaml')}
            className="text-xs flex items-center gap-2 text-zinc-500 hover:text-zinc-900 font-bold transition-colors px-3 py-1.5 hover:bg-zinc-200 rounded-lg border border-transparent hover:border-zinc-300"
          >
            {copiedSection === 'yaml' ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
            {copiedSection === 'yaml' ? '已複製' : '複製 YAML'}
          </button>
        </div>
        <div className="bg-[#1c1c1e] overflow-hidden">
          <pre className="p-6 text-sm text-[#d4d4d8] font-mono leading-loose overflow-x-auto custom-scrollbar max-h-[500px]">
            {yaml}
          </pre>
        </div>
      </div>

      {/* 3.5 Style Quick Look */}
      {result.style_guide && result.style_guide.design_characteristics?.length > 0 && (
        <div className={`bg-white border-2 border-zinc-200 rounded-2xl shadow-lg shadow-zinc-200/50 overflow-hidden group ${isStale ? 'blur-[2px] opacity-50 pointer-events-none' : ''}`}>
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 to-orange-500"></div>
          <div className="px-6 py-5 border-b border-zinc-200 bg-amber-50/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 text-amber-700 rounded-lg border border-amber-200">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wide">設計風格速覽 (Style Quick Look)</h3>
                <span className="text-[10px] text-zinc-400 font-bold">YAML Spec 的人類可讀版摘要</span>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Design Characteristics */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Palette className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">風格特點</span>
              </div>
              <ul className="space-y-2">
                {result.style_guide.design_characteristics.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-zinc-700 leading-relaxed">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Typography */}
            {result.style_guide.typography?.heading && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Type className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">字體建議</span>
                </div>
                <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase w-10 shrink-0">標題</span>
                    <span className="text-sm font-semibold text-zinc-800">{result.style_guide.typography.heading}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase w-10 shrink-0">內文</span>
                    <span className="text-sm font-semibold text-zinc-800">{result.style_guide.typography.body}</span>
                  </div>
                  {result.style_guide.typography.rationale && (
                    <p className="text-xs text-zinc-500 leading-relaxed pt-2 border-t border-zinc-100 mt-2">
                      {result.style_guide.typography.rationale}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Layout Logic */}
            {result.style_guide.layout_logic?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <LayoutGrid className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">版面邏輯</span>
                </div>
                <ul className="space-y-2">
                  {result.style_guide.layout_logic.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-zinc-700 leading-relaxed">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-zinc-300 shrink-0"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Cautions */}
            {result.style_guide.cautions?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">注意事項</span>
                </div>
                <ul className="space-y-2">
                  {result.style_guide.cautions.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-red-600/80 leading-relaxed">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-300 shrink-0"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Visual Lab */}
      <div className={`bg-white border-2 border-zinc-200 rounded-2xl shadow-lg shadow-zinc-200/50 p-8 relative overflow-hidden group ${isStale ? 'blur-[2px] opacity-50 pointer-events-none' : ''}`}>
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-sky-500 to-blue-600"></div>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-50 text-sky-600 rounded-lg border border-sky-100">
              <ImageIcon className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900">視覺模擬預覽 (Simulation)</h2>
          </div>
          <span className="text-xs bg-zinc-100 text-zinc-500 px-3 py-1 rounded-full font-bold uppercase tracking-wide border border-zinc-200">實驗性功能</span>
        </div>

        <div className="flex flex-col gap-8">
          {/* Prompt & Controls Area */}
          <div className="flex flex-col gap-5">
            <div className="bg-sky-50/30 border border-sky-100/80 rounded-xl p-6">
              <span className="text-xs text-sky-700/70 font-bold uppercase tracking-wider mb-3 block">生成提示詞 (Simulated Prompt)</span>
              <p className="text-sm text-zinc-700 leading-relaxed font-mono font-medium">
                {state.result.image_generation_prompt}
              </p>
            </div>

            <button
              onClick={handleGeneratePreview}
              disabled={isGeneratingImage}
              className={`
                    w-full py-4 px-6 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-3
                    ${isGeneratingImage
                  ? 'bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed'
                  : 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg shadow-zinc-300 transform active:scale-[0.98]'}
                  `}
            >
              {isGeneratingImage ? <Loader2 className="animate-spin w-5 h-5" /> : <Zap className="w-5 h-5 text-sky-400 fill-sky-400" />}
              {isGeneratingImage
                ? `正在繪製 ${MEDIUM_PREVIEW_TYPES[medium].length} 種預覽圖...`
                : `生成 ${MEDIUM_PREVIEW_TYPES[medium].length} 種${medium === TargetMedium.SLIDES ? '投影片版型' : medium === TargetMedium.SAAS ? '頁面類型' : '尺寸變體'}預覽`}
            </button>
          </div>

          {/* ── Multi-Preview Grid (All Mediums) ── */}
          {previews.length > 0 && (() => {
            const previewConfigs = MEDIUM_PREVIEW_TYPES[medium];
            const isPoster = medium === TargetMedium.POSTER;

            const getAspectClass = (aspectRatio: string) => {
              switch (aspectRatio) {
                case '16:9': return 'aspect-video';
                case '2:3': return 'aspect-[2/3]';
                case '3:4': return 'aspect-[3/4]';
                case '9:16': return 'aspect-[9/16]';
                case '1:1': return 'aspect-square';
                default: return 'aspect-video';
              }
            };

            return (
              <div className={isPoster ? 'grid grid-cols-2 md:grid-cols-4 gap-4' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}>
                {previews.map((item, idx) => (
                  <div key={item.type} className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide px-1">{item.label}</span>
                    <div className={`relative rounded-xl overflow-hidden border-2 border-zinc-200 bg-zinc-100 flex items-center justify-center shadow-inner ${getAspectClass(previewConfigs[idx]?.aspectRatio || '16:9')}`}>
                      {item.isLoading && (
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 text-zinc-400 animate-spin mx-auto mb-2" />
                          <span className="text-xs text-zinc-500 font-semibold">AI 算圖中...</span>
                        </div>
                      )}
                      {item.error && (
                        <div className="p-4 text-center text-red-500 text-xs bg-red-50 w-full h-full flex flex-col items-center justify-center">
                          <AlertTriangle className="w-6 h-6 mb-2 opacity-50" />
                          {item.error}
                        </div>
                      )}
                      {item.image && (
                        <div className="absolute inset-0 group/preview">
                          <img src={item.image} className="w-full h-full object-contain bg-zinc-900/5" alt={item.label} />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                            <button
                              onClick={() => { setLightboxIndex(idx); setIsLightboxOpen(true); }}
                              className="p-2.5 bg-white text-zinc-900 rounded-full shadow-lg hover:scale-110 transition-transform"
                            >
                              <ZoomIn size={16} />
                            </button>
                            <a
                              href={item.image}
                              download={`${medium.toLowerCase()}-${item.type}.png`}
                              className="p-2.5 bg-white text-zinc-900 rounded-full shadow-lg hover:scale-110 transition-transform"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Download size={16} />
                            </a>
                          </div>
                        </div>
                      )}
                      {!item.image && !item.isLoading && !item.error && (
                        <div className="text-center text-zinc-400">
                          <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Lightbox */}
      {isLightboxOpen && (() => {
        const lightboxImages = previews
          .filter(p => p.image)
          .map(p => ({ url: p.image!, label: p.label }));

        if (lightboxImages.length === 0) return null;

        const currentIdx = Math.min(lightboxIndex, lightboxImages.length - 1);
        const current = lightboxImages[currentIdx];
        const hasMultiple = lightboxImages.length > 1;

        return (
          <div
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-8"
            onClick={() => setIsLightboxOpen(false)}
          >
            {hasMultiple && (
              <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm text-white text-sm font-bold px-4 py-2 rounded-full">
                {current.label} ({currentIdx + 1}/{lightboxImages.length})
              </div>
            )}

            <img
              src={current.url}
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl ring-1 ring-white/10"
              onClick={(e) => e.stopPropagation()}
            />

            {hasMultiple && (
              <>
                <button
                  className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-sm"
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => (prev - 1 + lightboxImages.length) % lightboxImages.length); }}
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-sm"
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => (prev + 1) % lightboxImages.length); }}
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            <div className="absolute top-8 right-8 flex items-center gap-3">
              <a
                href={current.url}
                download={`slide-${currentIdx + 1}.png`}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <Download size={20} />
              </a>
              <button
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-sm"
                onClick={() => setIsLightboxOpen(false)}
              >
                <X size={24} />
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};