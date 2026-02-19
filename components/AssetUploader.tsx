import React, { useRef } from 'react';
import { VisualAsset } from '../types';
import { Upload, X, Plus } from 'lucide-react';

interface AssetUploaderProps {
  assets: VisualAsset[];
  onAssetsChange: (assets: VisualAsset[]) => void;
  onReset: () => void;
}

export const AssetUploader: React.FC<AssetUploaderProps> = ({ assets, onAssetsChange, onReset }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newAssets: VisualAsset[] = Array.from(files).map(file => ({
      id: generateId(),
      type: 'file',
      file,
      previewUrl: URL.createObjectURL(file)
    }));
    onAssetsChange([...assets, ...newAssets]);
  };

  const removeAsset = (id: string) => {
    onAssetsChange(assets.filter(a => a.id !== id));
  };

  const handleInternalReset = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onReset();
  };

  return (
    <div className="w-full space-y-5">
      <div className="flex items-center justify-between pb-1">
        <label className="text-sm font-bold text-zinc-700 flex items-center gap-2.5">
          上傳參考素材 (Assets)
          <span className={`text-xs px-2.5 py-0.5 rounded-md font-bold transition-colors ${assets.length > 0 ? 'bg-sky-100 text-sky-800' : 'bg-zinc-100 text-zinc-500'}`}>
            {assets.length}
          </span>
        </label>
        
        {assets.length > 0 && (
          <button
            onClick={handleInternalReset}
            className="text-sm font-bold text-zinc-400 hover:text-red-500 transition-colors uppercase tracking-wide text-[10px]"
          >
            清除全部
          </button>
        )}
      </div>
      
      {/* Grid View */}
      {assets.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
          {assets.map((asset) => (
            <div key={asset.id} className="relative aspect-square group rounded-xl overflow-hidden border-2 border-zinc-200 shadow-sm bg-white hover:border-sky-400 transition-colors">
                <img src={asset.previewUrl} alt="asset" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-sky-900/0 group-hover:bg-sky-900/10 transition-colors" />
                <button 
                onClick={() => removeAsset(asset.id)}
                className="absolute top-1.5 right-1.5 bg-white text-zinc-500 hover:text-red-600 p-1.5 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 border border-zinc-200"
                >
                  <X size={14} />
                </button>
            </div>
          ))}
          
          {/* Add More Button */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square border-2 border-dashed border-zinc-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-sky-50 hover:border-sky-400 hover:text-sky-600 transition-all text-zinc-400"
          >
              <Plus size={24} />
          </button>
        </div>
      )}

      {/* Empty State / Dropzone */}
      {assets.length === 0 && (
        <div 
          className="relative group cursor-pointer border-2 border-dashed border-zinc-300 rounded-xl bg-zinc-50/50 p-10 flex flex-col items-center justify-center text-center hover:bg-sky-50/30 hover:border-sky-400 hover:shadow-md transition-all duration-300"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
        >
            <div className="w-14 h-14 rounded-2xl bg-white border border-zinc-200 shadow-sm flex items-center justify-center mb-4 text-zinc-400 group-hover:text-sky-600 group-hover:scale-110 group-hover:border-sky-200 transition-all">
              <Upload size={24} strokeWidth={1.5} />
            </div>
            <p className="text-base font-bold text-zinc-700 group-hover:text-sky-900 transition-colors">
              點擊或拖曳圖片至此
            </p>
            <p className="text-xs text-zinc-400 mt-2 font-bold uppercase tracking-wider">
              支援 JPG, PNG (Max 10MB)
            </p>
        </div>
      )}
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={(e) => handleFiles(e.target.files)} 
        accept="image/*" 
        multiple
        className="hidden" 
      />
    </div>
  );
};