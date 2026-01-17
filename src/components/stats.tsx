import { useState } from 'react';

interface StatsProps {
  stats: {
    totalEntries: number;
    totalWords: number;
    totalPhrases: number;
    prefixCount: number;
    rootCount: number;
    suffixCount: number;
  };
}

export default function Stats({ stats }: StatsProps) {
  const { totalEntries, totalWords, totalPhrases, prefixCount, rootCount, suffixCount } = stats || {};
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-brand-600 transition-colors"
      >
        <span className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-brand-500">insights</span>
          统计总览
        </span>
        <span className={`material-symbols-outlined text-[18px] text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
      </button>

      {isOpen && (
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-white border border-slate-100 px-3 py-2 shadow-sm flex flex-col justify-between">
            <p className="text-[10px] text-slate-500">词条总数</p>
            <p className="mt-0.5 text-base font-semibold tracking-tight">{totalEntries || '—'}</p>
          </div>
          <div className="rounded-xl bg-white border border-slate-100 px-3 py-2 shadow-sm flex flex-col justify-between">
            <p className="text-[10px] text-slate-500">单词条目</p>
            <p className="mt-0.5 text-base font-semibold tracking-tight">{totalWords || '—'}</p>
          </div>
          <div className="rounded-xl bg-white border border-slate-100 px-3 py-2 shadow-sm flex flex-col justify-between">
            <p className="text-[10px] text-slate-500">短语 / 搭配</p>
            <p className="mt-0.5 text-base font-semibold tracking-tight">{totalPhrases || '—'}</p>
          </div>
          <div className="rounded-xl bg-white border border-slate-100 px-3 py-2 shadow-sm flex flex-col justify-between">
            <p className="text-[10px] text-slate-500">构词项</p>
            <p className="mt-0.5 text-base font-semibold tracking-tight flex items-baseline gap-1">
              <span>{prefixCount || '—'}</span>
              <span className="text-[9px] text-slate-400">前</span>
              <span>{rootCount || '—'}</span>
              <span className="text-[9px] text-slate-400">根</span>
              <span>{suffixCount || '—'}</span>
              <span className="text-[9px] text-slate-400">后</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
