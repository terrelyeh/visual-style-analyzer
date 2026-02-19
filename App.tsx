import React, { useState } from 'react';
import { Header } from './components/Header';
import { AssetUploader } from './components/AssetUploader';
import { MediumSelector } from './components/MediumSelector';
import { ResultViewer } from './components/ResultViewer';
import { analyzeImage } from './services/gemini';
import { AnalysisState, TargetMedium, VisualAsset } from './types';
import { ApiKeyProvider, useApiKey } from './contexts/ApiKeyContext';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ArrowRight, Sparkles } from 'lucide-react';

const AppContent: React.FC = () => {
  const { apiKey, isConfigured, isLoading } = useApiKey();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [assets, setAssets] = useState<VisualAsset[]>([]);
  const [medium, setMedium] = useState<TargetMedium>(TargetMedium.SLIDES);
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    isLoading: false,
    result: null,
    error: null,
  });

  const handleAnalyze = async () => {
    if (assets.length === 0) return;
    if (!apiKey) {
      setIsSettingsOpen(true);
      return;
    }

    setAnalysisState({ isLoading: true, result: null, error: null });

    try {
      const yamlResult = await analyzeImage(assets, medium, apiKey);
      setAnalysisState({ isLoading: false, result: yamlResult, error: null });
    } catch (err: any) {
      setAnalysisState({
        isLoading: false,
        result: null,
        error: err.message || "Unknown error occurred"
      });
    }
  };

  const handleReset = () => {
    setAssets([]);
    setAnalysisState({ isLoading: false, result: null, error: null });
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-100 text-zinc-900 font-sans selection:bg-sky-100 selection:text-sky-900">
      <Header onOpenSettings={() => setIsSettingsOpen(true)} />

      <ApiKeyModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        forceOpen={!isLoading && !isConfigured}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">

        {/* Left Column: Input Panel */}
        <section className="lg:col-span-5 flex flex-col gap-8">
          <div className="sticky top-24">
            <div className="mb-6 pl-1">
              <h2 className="text-2xl font-bold text-zinc-800 tracking-tight mb-2">
                輸入參數 (Input)
              </h2>
              <p className="text-sm text-zinc-500 font-medium">
                設定您的視覺來源與目標格式。
              </p>
            </div>

            {/* Stronger Block Container */}
            <div className="bg-white rounded-xl border-2 border-zinc-200 shadow-lg shadow-zinc-200/50 p-6 space-y-8">
              <AssetUploader
                assets={assets}
                onAssetsChange={setAssets}
                onReset={handleReset}
              />

              <div className="w-full h-px bg-zinc-100"></div>

              <MediumSelector
                selectedMedium={medium}
                onSelect={setMedium}
              />

              <div className="pt-4">
                <button
                  onClick={handleAnalyze}
                  disabled={assets.length === 0 || analysisState.isLoading}
                  className={`
                     w-full py-4 px-6 font-bold text-base rounded-xl transition-all duration-200
                     flex items-center justify-center gap-3 shadow-md
                     ${assets.length === 0 || analysisState.isLoading
                      ? 'bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed shadow-none'
                      : 'bg-sky-600 text-white border border-sky-700 hover:bg-sky-700 hover:shadow-sky-500/25 transform active:scale-[0.98]'}
                   `}
                >
                  {analysisState.isLoading ? (
                    <>
                      <Sparkles size={20} className="animate-spin" />
                      <span>正在解析風格...</span>
                    </>
                  ) : (
                    <>
                      <span>開始風格分析</span>
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Output Panel */}
        <section className="lg:col-span-7 pt-2">
          <div className="mb-6 pl-1 lg:hidden">
            <h2 className="text-2xl font-bold text-zinc-800 tracking-tight">
              輸出結果 (Output)
            </h2>
          </div>
          <ResultViewer state={analysisState} medium={medium} onReAnalyze={handleAnalyze} />
        </section>

      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ApiKeyProvider>
      <AppContent />
    </ApiKeyProvider>
  );
};

export default App;