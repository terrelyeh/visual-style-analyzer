import React, { useState, useEffect } from 'react';
import { useApiKey } from '../contexts/ApiKeyContext';
import { X, Key, Check, ShieldCheck, AlertCircle } from 'lucide-react';

interface ApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    forceOpen?: boolean;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, forceOpen }) => {
    const { apiKey, setApiKey, removeApiKey, isUsingServerKey } = useApiKey();
    const [inputValue, setInputValue] = useState('');
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (apiKey && !isUsingServerKey) {
            setInputValue(apiKey);
        }
    }, [apiKey, isUsingServerKey]);

    if (!isOpen && !forceOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim()) {
            setApiKey(inputValue.trim());
            if (!forceOpen) onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm transition-opacity">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-zinc-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">

                <div className="px-8 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                    <h3 className="font-bold text-zinc-900 text-lg">
                        {isUsingServerKey ? '系統金鑰設定' : 'API 金鑰配置'}
                    </h3>
                    {!forceOpen && (
                        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 p-2 rounded-lg transition-colors">
                            <X size={20} />
                        </button>
                    )}
                </div>

                <div className="p-8">
                    {isUsingServerKey ? (
                        // Scenario: Host Key Active
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
                                <ShieldCheck size={32} />
                            </div>
                            <h4 className="text-xl font-bold text-zinc-900">系統金鑰已啟用</h4>
                            <p className="text-zinc-500 leading-relaxed">
                                本站已配置全域 API Key，您可以直接免費使用所有功能，無需額外設定。
                            </p>
                            <div className="w-full mt-6 pt-6 border-t border-zinc-100">
                                <button
                                    onClick={onClose}
                                    className="w-full bg-zinc-900 text-white py-3 rounded-xl font-bold hover:bg-zinc-800 transition-colors"
                                >
                                    開始使用
                                </button>
                            </div>
                        </div>
                    ) : (
                        // Scenario: BYOK (User Key Required)
                        <>
                            <div className="flex items-start gap-4 mb-8">
                                <div className={`p-3 rounded-full shrink-0 ${forceOpen ? 'bg-amber-100 text-amber-600' : 'bg-sky-50 text-sky-600'}`}>
                                    {forceOpen ? <AlertCircle size={28} /> : <Key size={28} />}
                                </div>
                                <div>
                                    <h4 className="text-base font-bold text-zinc-900 mb-1">
                                        {forceOpen ? '需要啟動金鑰 (Action Required)' : '設定您的 API Key'}
                                    </h4>
                                    <p className="text-sm text-zinc-500 font-medium leading-relaxed">
                                        {forceOpen
                                            ? '本站未設定全域額度。請輸入您個人的 Google Gemini API Key 以啟用分析功能。您的金鑰僅會儲存在瀏覽器端。'
                                            : '您可以隨時更新或移除儲存在瀏覽器端的個人 API Key。'}
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="text-sm font-bold text-zinc-700 block mb-2 ml-1">
                                        Google Gemini API Key
                                    </label>
                                    <div className="relative">
                                        <Key className="absolute left-4 top-3.5 text-zinc-400" size={18} />
                                        <input
                                            type={isVisible ? "text" : "password"}
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            placeholder="AIzaSy..."
                                            autoFocus={forceOpen}
                                            className="w-full pl-11 pr-16 py-3 bg-white border border-zinc-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400 transition-all placeholder:text-zinc-300 text-zinc-900 font-mono"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setIsVisible(!isVisible)}
                                            className="absolute right-4 top-3.5 text-xs font-bold text-zinc-400 hover:text-zinc-600 uppercase tracking-wide"
                                        >
                                            {isVisible ? '隱藏' : '顯示'}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-2">
                                    <button
                                        type="submit"
                                        disabled={!inputValue.trim()}
                                        className="flex-1 bg-sky-600 text-white py-3.5 rounded-xl text-base font-bold hover:bg-sky-700 active:scale-[0.98] transition-all shadow-lg shadow-sky-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {forceOpen ? '儲存並啟用' : '更新金鑰'}
                                    </button>

                                    {!forceOpen && (
                                        <button
                                            type="button"
                                            onClick={() => { removeApiKey(); setInputValue(''); onClose(); }}
                                            className="px-6 py-3.5 bg-white border border-zinc-200 text-zinc-600 rounded-xl text-base font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors"
                                        >
                                            移除
                                        </button>
                                    )}
                                </div>
                            </form>

                            <div className="mt-8 pt-5 border-t border-zinc-100 text-center">
                                <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-sm text-sky-600 hover:text-sky-800 font-semibold inline-flex items-center gap-1.5 hover:underline">
                                    前往 Google AI Studio 獲取免費 Key
                                </a>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};