import React from 'react';
import { useApiKey } from '../contexts/ApiKeyContext';
import { Settings, Key, Command, ShieldCheck, User } from 'lucide-react';

interface HeaderProps {
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  const { isConfigured, isUsingServerKey } = useApiKey();

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-zinc-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 text-zinc-900">
          <div className="p-2 rounded-lg bg-slate-900 text-sky-400 shadow-sm">
            <Command size={20} strokeWidth={3} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight leading-none text-zinc-900">
              Visual Style Analyzer
            </h1>
            <span className="text-[10px] text-zinc-400 font-bold tracking-wider uppercase mt-0.5">視覺風格解析儀 v1.1</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSettings}
            className={`
               flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all border
               ${isConfigured
                ? isUsingServerKey
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 cursor-default'
                  : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-white hover:text-zinc-900 hover:border-zinc-300 shadow-sm'
                : 'bg-sky-50 border-sky-100 text-sky-700 hover:bg-sky-100'}
             `}
          >
            {isUsingServerKey ? <ShieldCheck size={14} /> : (isConfigured ? <User size={14} /> : <Key size={14} />)}
            <span>
              {isUsingServerKey
                ? '系統金鑰已啟用'
                : (isConfigured ? '使用個人金鑰' : '尚未設定 API Key')}
            </span>
            {(!isUsingServerKey || !isConfigured) && <Settings size={14} className="ml-1 opacity-50" />}
          </button>
        </div>
      </div>
    </header>
  );
};