import { useState } from 'react';

interface StatsProps {
  level: string;
  stats: {
    totalEntries: number;
    totalWords: number;
    totalPhrases: number;
    prefixCount: number;
    rootCount: number;
    suffixCount: number;
  };
}

export default function Stats({ level, stats }: StatsProps) {
  const { totalEntries, totalWords, totalPhrases, prefixCount, rootCount, suffixCount } = stats || {};
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-slate-100 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:border-brand-100 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-brand-500">insights</span>
          <span>统计总览</span>
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">
            {level}
          </span>
          <span className="hidden text-[10px] font-medium text-slate-400 sm:inline">
            {totalWords || '—'} 词
          </span>
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
