import { useState } from 'react';
import { Button } from './ui/button';
import { Keyboard, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from './ui/card';

export default function ShortcutGuide() {
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem('XCZ_ENGLISH_QUICK_KEYBOARD');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleOpen = (open: boolean) => {
    setIsOpen(open);
    localStorage.setItem('XCZ_ENGLISH_QUICK_KEYBOARD', String(open));
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {isOpen && (
        <Card className="w-56 shadow-lg border-slate-200 animate-in fade-in slide-in-from-bottom-5">
            <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                    <Keyboard className="h-3 w-3" />
                    快捷键指南
                </span>
                <button onClick={() => toggleOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <ChevronDown className="h-3.5 w-3.5" />
                </button>
            </div>
            <div className="p-2.5 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">全局搜索</span>
                    <div className="flex gap-1">
                        <kbd className="bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 font-mono text-[9px] text-slate-600">⌘</kbd>
                        <kbd className="bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 font-mono text-[9px] text-slate-600">K</kbd>
                    </div>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">切换单词</span>
                    <div className="flex gap-1">
                        <kbd className="bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 font-mono text-[9px] text-slate-600">←</kbd>
                        <kbd className="bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 font-mono text-[9px] text-slate-600">→</kbd>
                    </div>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">随机单词</span>
                    <kbd className="bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 font-mono text-[9px] text-slate-600">R</kbd>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">朗读发音</span>
                    <kbd className="bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 font-mono text-[9px] text-slate-600">S</kbd>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">背诵模式</span>
                    <kbd className="bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 font-mono text-[9px] text-slate-600">V</kbd>
                </div>
            </div>
        </Card>
      )}
      
      {!isOpen && (
        <Button 
            variant="outline" 
            size="icon" 
            className="h-10 w-10 rounded-full shadow-md bg-white hover:bg-slate-50"
            onClick={() => toggleOpen(true)}
        >
            <Keyboard className="h-5 w-5 text-slate-600" />
        </Button>
      )}
    </div>
  );
}
