import React, { useState, useEffect } from 'react';
import { TargetMedium } from '../types';
import { MEDIUM_DESCRIPTIONS, MEDIUM_BEST_PRACTICES } from '../constants';
import { Info, Layout, Layers, Image as ImageIcon, CheckCircle2 } from 'lucide-react';

interface MediumSelectorProps {
  selectedMedium: TargetMedium;
  onSelect: (medium: TargetMedium) => void;
}

const MEDIUM_ICONS: Record<TargetMedium, React.ReactNode> = {
    [TargetMedium.SLIDES]: <Layers size={20} />,
    [TargetMedium.SAAS]: <Layout size={20} />,
    [TargetMedium.POSTER]: <ImageIcon size={20} />
};

export const MediumSelector: React.FC<MediumSelectorProps> = ({ selectedMedium, onSelect }) => {
  const [activeInfo, setActiveInfo] = useState<TargetMedium | null>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveInfo(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const toggleInfo = (e: React.MouseEvent, medium: TargetMedium) => {
    e.stopPropagation();
    setActiveInfo(activeInfo === medium ? null : medium);
  };

  return (
    <div className="w-full relative mt-6">
      <div className="flex items-center gap-2 mb-4">
        <label className="text-sm font-bold text-zinc-700">
          選擇目標載體 (Target Medium)
        </label>
      </div>

      {activeInfo && (
        <div 
          className="fixed inset-0 z-30 bg-transparent"
          onClick={() => setActiveInfo(null)}
        />
      )}
      
      <div className="flex flex-col gap-3">
        {Object.values(TargetMedium).map((medium) => (
          <div key={medium} className="relative group">
            <button
              onClick={() => onSelect(medium)}
              className={`
                w-full relative p-4 text-left border-2 rounded-xl transition-all duration-200 flex items-center gap-4
                ${selectedMedium === medium 
                  ? 'bg-sky-50/50 border-sky-500 shadow-md shadow-sky-100/50 z-10' 
                  : 'bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-sm text-zinc-500'}
              `}
            >
              <div className={`
                p-2.5 rounded-lg transition-colors
                ${selectedMedium === medium ? 'bg-sky-100 text-sky-700' : 'bg-zinc-100 text-zinc-400 group-hover:bg-zinc-200 group-hover:text-zinc-600'}
              `}>
                {MEDIUM_ICONS[medium]}
              </div>

              <div className="flex-1">
                 <div className="flex items-center justify-between">
                    <h3 className={`text-base font-bold ${selectedMedium === medium ? 'text-zinc-900' : 'text-zinc-700'}`}>
                        {medium === TargetMedium.SLIDES ? "簡報提案 (Slides)" : 
                         medium === TargetMedium.SAAS ? "網頁應用 (SaaS UI)" : "主視覺海報 (Poster Art)"}
                    </h3>
                    {selectedMedium === medium && <CheckCircle2 size={18} className="text-sky-600 fill-white" />}
                 </div>
                 <p className={`text-sm mt-1 font-medium ${selectedMedium === medium ? 'text-sky-900/70' : 'text-zinc-400'}`}>
                    {MEDIUM_DESCRIPTIONS[medium]}
                 </p>
              </div>
            </button>

            {/* Info Button */}
            <button
              onClick={(e) => toggleInfo(e, medium)}
              className={`
                absolute top-4 right-12 p-1.5 rounded-md hover:bg-zinc-100 text-zinc-300 hover:text-zinc-600 transition-colors z-20
                ${activeInfo === medium ? 'bg-zinc-100 text-zinc-600' : ''}
              `}
            >
              <Info size={16} />
            </button>

            {/* Notion-style Popover */}
            {activeInfo === medium && (
              <div className="absolute left-0 right-0 top-full mt-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                 <div className="bg-white border border-zinc-200 shadow-2xl shadow-zinc-900/10 rounded-xl p-5 relative text-zinc-800 ring-1 ring-zinc-900/5">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-100">
                      <span className="bg-zinc-100 text-zinc-600 text-xs font-bold px-2.5 py-1 rounded-md border border-zinc-200">GUIDE</span>
                      <h4 className="font-bold text-base text-zinc-900">{MEDIUM_BEST_PRACTICES[medium].title}</h4>
                    </div>

                    <div className="space-y-4">
                       <div className="flex items-start gap-2.5 text-sm font-medium text-zinc-700">
                          <span className="text-sky-500 text-lg leading-none">★</span>
                          <span>{MEDIUM_BEST_PRACTICES[medium].goldenRatio}</span>
                       </div>
                       
                       <div className="bg-zinc-50 rounded-lg p-4 text-sm border border-zinc-100">
                          <p className="font-bold text-zinc-500 mb-2 uppercase text-xs tracking-wider">配方 (Recipe)</p>
                          <ul className="space-y-2 pl-4 list-disc text-zinc-600 marker:text-zinc-300">
                            {MEDIUM_BEST_PRACTICES[medium].recipe.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                       </div>
                       
                       <div className="text-sm bg-red-50 text-red-800 p-3 rounded-lg border border-red-100 flex gap-2">
                          <span className="font-bold">注意:</span>
                          <span className="opacity-90">{MEDIUM_BEST_PRACTICES[medium].donts}</span>
                       </div>
                    </div>
                 </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};