import React, { useState, useEffect, useRef } from 'react';
import { highlightWordHead, HighlightResult } from '../utils/dataUtils';
import { SearchResult, Word, Phrase, ScenarioMatch, MorphGroup } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import {
  Search,
  X,
  ChevronRight,
  ChevronLeft,
  Shuffle,
  Eye,
  EyeOff,
  ArrowUpRight,
  Globe,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface GlobalSearchProps {
  onSearch: (query: string) => void;
  searchResults: SearchResult | null;
  onSelectEntry: (entry: Word | Phrase | ScenarioMatch) => void;
  onSelectMorph: (kind: string, label: string) => void;
  reciteMode: boolean;
  onToggleRecite: () => void;
  onStudyNav: (direction: number | null) => void;
}

export default function GlobalSearch({
  onSearch,
  searchResults,
  onSelectEntry,
  onSelectMorph,
  reciteMode,
  onToggleRecite,
  onStudyNav
}: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      onSearch(val);
      setShowResults(true);
    }, 180);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (query.trim().length < 2) return;
      e.preventDefault();
      onSearch(query);
      setShowResults(false);

      // Auto select first result logic could go here if needed
      const firstWord = searchResults?.words?.[0];
      const firstPhrase = searchResults?.phrases?.[0];
      if (firstWord) onSelectEntry(firstWord);
      else if (firstPhrase) onSelectEntry(firstPhrase);

    } else if (e.key === 'Escape') {
      e.preventDefault();
      setQuery('');
      onSearch('');
    }
  };

  // Close results on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node) &&
        inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleShortcut);
    return () => document.removeEventListener('keydown', handleShortcut);
  }, []);

  const { meta, words, phrases, prefixGroups, rootGroups, suffixGroups, scenarios } = searchResults || {};
  const hasResults = (words?.length || 0) + (phrases?.length || 0) + (prefixGroups?.length || 0) + (rootGroups?.length || 0) + (suffixGroups?.length || 0) + (scenarios?.length || 0) > 0;

  const renderMorphGroups = (kind: string, groups: MorphGroup[] = []) => {
    if (!groups || !groups.length) return null;
    const label = kind === 'prefix' ? '前缀匹配' : kind === 'root' ? '词根匹配' : '后缀匹配';
    return (
      <details open className="mt-2 rounded-xl border border-slate-100 bg-slate-50/80 text-xs text-slate-700 group">
        <summary className="flex items-center justify-between gap-2 px-3 py-2 cursor-pointer select-none font-medium list-none sticky top-0 bg-slate-50/95 backdrop-blur z-20">
          <span>{label}（{groups.length} 项）</span>
          <ChevronDown className="h-4 w-4 text-slate-400 group-open:rotate-180 transition-transform" />
        </summary>
        <div className="mt-1 space-y-1 pb-1.5 px-1.5">
          {groups.map((g, i) => (
            <Button
              key={i}
              variant="ghost"
              className="w-full justify-between h-auto py-1.5 px-2 text-xs font-normal hover:bg-white hover:shadow-sm"
              onClick={() => {
                onSelectMorph(kind, g.label);
                setShowResults(false);
              }}
            >
              <span className="flex-1 truncate text-left">
                <span className="font-mono text-xs mr-2 font-medium text-slate-700">{g.label}</span>
                <span className="text-slate-500">{g.cn}</span>
              </span>
              <Badge variant="secondary" className="ml-2 text-[10px] h-5 px-1.5 font-normal">{g.words.length} 词</Badge>
            </Button>
          ))}
        </div>
      </details>
    );
  };

  const renderEntryButton = (entry: Word | Phrase) => {
    const isWord = entry._type === 'word';
    const head = isWord ? (entry as Word).word : ((entry as Phrase).phrase || (entry as Phrase).norm_head);
    const cn = entry.cn_def;
    const highlightedHead = highlightWordHead(head || '', query);

    // Simple highlight implementation for React
    const renderHighlight = () => {
      if (typeof highlightedHead === 'string') return <span className="font-medium mr-1">{head}</span>;
      const res = highlightedHead as HighlightResult;
      if (!res.match) return <span className="font-medium mr-1">{head}</span>;
      return (
        <span className="font-medium mr-1">
          {res.before}
          <mark className={reciteMode ? "highlight-word bg-slate-900 text-white px-0.5 rounded-sm" : "bg-yellow-100 text-red-600 px-0.5 rounded-sm"}>{res.middle}</mark>
          {res.after}
        </span>
      );
    };

    return (
      <Button
        key={entry._idx}
        variant="ghost"
        className="w-full justify-between h-auto py-2 px-2 text-left font-normal hover:bg-brand-50 hover:text-brand-900 group"
        onClick={() => {
          onSelectEntry(entry);
          setShowResults(false);
        }}
      >
        <div className="flex-1 truncate">
          <div className="flex items-center">
            {renderHighlight()}
            {!reciteMode && <span className="text-slate-500 ml-2 text-xs truncate">{cn}</span>}
          </div>
          {isWord && (
            <div className="mt-0.5 text-[10px] text-slate-400 group-hover:text-brand-400">
              英: <span className="font-mono">{(entry as any).ipa_uk || (entry as any).uk_ipa || '—'}</span>
              <span className="mx-2">|</span>
              美: <span className="font-mono">{(entry as any).ipa_us || (entry as any).us_ipa || '—'}</span>
            </div>
          )}
        </div>
        {isWord ? (
          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-brand-400" />
        ) : (
          <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-brand-400" />
        )}
      </Button>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Globe className="h-5 w-5 text-brand-500" />
            全局搜索
          </h3>
          {/* <p className="text-xs text-slate-500">支持按词头、中文释义、构词信息与例句文本进行模糊匹配</p> */}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={reciteMode ? 'brandOutline' : 'outline'}
            size="sm"
            className="h-8 gap-1.5 text-xs font-medium"
            onClick={onToggleRecite}
            aria-pressed={reciteMode}
          >
            {reciteMode ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            <span>{reciteMode ? '背诵模式' : '普通模式'}</span>
          </Button>

          <div className="inline-flex items-center p-1 rounded-lg border border-slate-200 bg-white shadow-sm">
            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md" onClick={() => onStudyNav(-1)} title="上一条">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="w-px h-3 bg-slate-200 mx-1"></div>
            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md" onClick={() => onStudyNav(1)} title="下一条">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="w-px h-3 bg-slate-200 mx-1"></div>
            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md" onClick={() => onStudyNav(null)} title="随机">
              <Shuffle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="relative w-full">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <Search className="h-4 w-4" />
        </span>
        <Input
          ref={inputRef}
          type="text"
          autoComplete="off"
          placeholder="例如：abandon / 责任 / inter / ceive ..."
          className="pl-8 pr-10 h-9 text-sm shadow-sm w-full placeholder:text-xs rounded-2xl"
          value={query}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query) {
              setShowResults(true);
            }
          }}
        />
        {!query && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <kbd className="inline-flex h-5 items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 font-mono text-[10px] font-medium text-slate-500 opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        )}
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400 hover:text-slate-600"
            onClick={handleClear}
            aria-label="清空搜索"
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        {/* Results Dropdown - Constrained to parent width */}
        {showResults && hasResults && (
          <Card
            ref={resultsRef}
            className="absolute z-50 mt-1 w-full max-h-[500px] overflow-y-auto shadow-xl border-slate-200 ring-1 ring-slate-900/5"
          >
            <div className="sticky top-0 bg-white/95 backdrop-blur z-20 px-3 py-2 border-b border-slate-100">
              <div className="text-xs text-slate-500 font-medium">{meta}</div>
            </div>

            <div className="p-2 space-y-4">
              {words && words.length > 0 && (
                <div className="space-y-1">
                  <div className="sticky top-8 z-10 bg-white/95 backdrop-blur px-2 py-1 mb-1 border-b border-slate-50">
                    <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                      <span className="w-1 h-3 bg-brand-500 rounded-full"></span>
                      单词匹配
                    </p>
                  </div>
                  {words.map(renderEntryButton)}
                </div>
              )}

              {phrases && phrases.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-slate-100">
                  <div className="sticky top-8 z-10 bg-white/95 backdrop-blur px-2 py-1 mb-1 border-b border-slate-50">
                    <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                      <span className="w-1 h-3 bg-indigo-500 rounded-full"></span>
                      短语 / 搭配匹配
                    </p>
                  </div>
                  {phrases.map(renderEntryButton)}
                </div>
              )}

              {scenarios && scenarios.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-slate-100">
                  <div className="sticky top-8 z-10 bg-white/95 backdrop-blur px-2 py-1 mb-1 border-b border-slate-50">
                    <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                      <span className="w-1 h-3 bg-emerald-500 rounded-full"></span>
                      场景例句匹配
                    </p>
                  </div>
                  {scenarios.map((s, i) => (
                    <Button
                      key={i}
                      variant="ghost"
                      className="w-full justify-start h-auto py-2 px-2 text-left font-normal hover:bg-emerald-50 hover:text-emerald-900 group flex-col items-start gap-1"
                      onClick={() => {
                        onSelectEntry(s);
                        setShowResults(false);
                      }}
                    >
                      <div className="w-full flex justify-between items-start gap-2">
                        <div className="text-sm font-medium text-slate-700 truncate group-hover:text-emerald-900" title={s.en}>
                          {(() => {
                            const q = query.toLowerCase();
                            const txt = s.en;
                            const idx = txt.toLowerCase().indexOf(q);
                            if (idx === -1 || q.length < 1) return txt;
                            return (
                              <>
                                {txt.slice(0, idx)}
                                <mark className="bg-yellow-100 text-red-600 rounded-sm px-0.5 mx-0">{txt.slice(idx, idx + q.length)}</mark>
                                {txt.slice(idx + q.length)}
                              </>
                            );
                          })()}
                        </div>
                        <Badge variant="outline" className="text-[10px] h-5 px-1 bg-white whitespace-nowrap">
                          {s.categoryName.split('·')[1] || s.categoryName}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-500 truncate w-full" title={s.zh}>{s.zh}</div>
                    </Button>
                  ))}
                </div>
              )}


              {renderMorphGroups('prefix', prefixGroups)}
              {renderMorphGroups('root', rootGroups)}
              {renderMorphGroups('suffix', suffixGroups)}
            </div>
          </Card>
        )}

        {showResults && !hasResults && query.length >= 2 && (
          <Card ref={resultsRef} className="absolute z-50 mt-1 w-full shadow-xl p-4 text-center text-slate-500 text-sm">
            {meta}
          </Card>
        )}
      </div>
    </div>
  );
}
