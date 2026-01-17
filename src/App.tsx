import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Header from './components/header';
import Stats from './components/stats';
import GlobalSearch from './components/global-search';
import MorphologyNav from './components/morphology-nav';
import DetailPanel from './components/detail-panel';
import GlobalScenarios from './components/global-scenarios';
import ShortcutGuide from './components/shortcut-guide';
import { buildIndex } from './utils/dataUtils';
import { speakTextEn } from './utils/speech';
import c1WordsData from './data/c1_vocab.json';
import b2WordsData from './data/b2_vocab.json';
import c2WordsData from './data/c2_vocab.json';
import scenariosData from './data/scenarios.json';
import { Word, Phrase, ScenarioMatch, SearchResult, ScenarioCategory, IndexResult } from './types';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [level, setLevel] = useState('C1');
  const navigate = useNavigate();

  const getWordsData = (lvl: string) => {
    switch (lvl) {
      case 'B2':
        return b2WordsData;
      case 'C2':
        return c2WordsData;
      case 'C1':
      default:
        return c1WordsData;
    }
  };

  // Initialize data
  const [data, setData] = useState<{ words: Word[]; phrases: Phrase[] }>({ words: [], phrases: [] });

  useEffect(() => {
    const wordsData = getWordsData(level);
    const rawWords = (wordsData as any).words || [];
    const rawPhrases = (wordsData as any).phrases || [];

    const words = rawWords.map((w: any, i: number) => ({
      ...w,
      _type: 'word',
      _idx: i,
    })) as Word[];
    const phrases = rawPhrases.map((p: any, i: number) => ({
      ...p,
      _type: 'phrase',
      _idx: i,
    })) as Phrase[];

    setData({ words, phrases });
    setStudyList(words.map(w => w._idx!));
    setStudyIdx(0);
    setCurrentEntry(words[0] || phrases[0] || null);
  }, [level]);

  const [indexes, setIndexes] = useState<{
    prefix: IndexResult;
    root: IndexResult;
    suffix: IndexResult;
  }>({
    prefix: { groupsByLabel: {}, items: [], letterMap: {} },
    root: { groupsByLabel: {}, items: [], letterMap: {} },
    suffix: { groupsByLabel: {}, items: [], letterMap: {} },
  });

  useEffect(() => {
    const prefixIndex = buildIndex(data.words, 'prefix', 'prefix_cn', { skip: new Set() });
    const rootIndex = buildIndex(data.words, 'root', 'root_cn', {
      skip: new Set(['词干', '无']),
    });
    const suffixIndex = buildIndex(data.words, 'suffix', 'suffix_cn', { skip: new Set() });
    setIndexes({ prefix: prefixIndex, root: rootIndex, suffix: suffixIndex });
  }, [data]);

  const [stats, setStats] = useState({
    prefixCount: 0,
    rootCount: 0,
    suffixCount: 0,
    totalWords: 0,
    totalPhrases: 0,
    totalEntries: 0,
  });

  useEffect(() => {
    const totalWords = data.words.length;
    const totalPhrases = data.phrases.length;
    setStats({
      prefixCount: indexes.prefix.items.length,
      rootCount: indexes.root.items.length,
      suffixCount: indexes.suffix.items.length,
      totalWords,
      totalPhrases,
      totalEntries: totalWords + totalPhrases,
    });
  }, [data, indexes]);

  const [currentEntry, setCurrentEntry] = useState<Word | Phrase | ScenarioMatch | null>(null);

  const [studyList, setStudyList] = useState<number[]>([]);

  const [reciteMode, setReciteMode] = useState(false);
  const [accent, setAccent] = useState<'us' | 'uk'>('us');
  const [currentMorphTab, setCurrentMorphTab] = useState('prefix');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [studyIdx, setStudyIdx] = useState(0);

  // Filter scenarios based on level
  const activeScenarios = ((scenariosData as any).categories as ScenarioCategory[]).filter(c => {
    if (!c.levels) return true;
    return c.levels.includes(level);
  });

  // Reset Recite Mode on Level Change
  useEffect(() => {
    setReciteMode(false);
  }, [level]);

  // Reset Recite Mode if current entry is not a word
  useEffect(() => {
    if (currentEntry && currentEntry._type !== 'word') {
      setReciteMode(false);
    }
  }, [currentEntry]);

  const handleSearch = (query: string) => {
    if (!query || query.trim().length < 2) {
      setSearchResults(null);
      return;
    }

    const q = query.trim().toLowerCase();

    // 1. Search Words
    const wordMatches = data.words.filter(w => {
      return (w.word || '').toLowerCase().includes(q) || (w.cn_def || '').includes(q);
    });

    // 2. Search Phrases
    const phraseMatches = data.phrases.filter(p => {
      return (
        ((p.phrase || p.norm_head || '') + '').toLowerCase().includes(q) ||
        (p.cn_def || '').includes(q)
      );
    });

    // 3. Search Scenarios
    const scenarioMatches: ScenarioMatch[] = [];
    (scenariosData as any).categories.forEach((cat: ScenarioCategory) => {
      cat.examples.forEach(ex => {
        if (ex.en.toLowerCase().includes(q) || ex.zh.includes(q)) {
          scenarioMatches.push({
            _type: 'scenario',
            categoryName: cat.name,
            categoryId: cat.id,
            ...ex,
          });
        }
      });
    });

    // 4. Search Morph Groups
    const matchMorphGroups = (index: IndexResult) => {
      if (!index || !Array.isArray(index.items)) return [];
      return index.items.filter((g: any) => {
        return (
          String(g.label || '')
            .toLowerCase()
            .includes(q) || (g.cn || '').includes(q)
        );
      });
    };

    const total = wordMatches.length + phraseMatches.length + scenarioMatches.length;
    const maxDisplay = 40;
    const meta = total ? `共找到 ${total} 条匹配结果` : '未找到匹配结果';

    setSearchResults({
      words: wordMatches.slice(0, maxDisplay),
      phrases: phraseMatches.slice(0, maxDisplay),
      scenarios: scenarioMatches.slice(0, maxDisplay),
      prefixGroups: matchMorphGroups(indexes.prefix),
      rootGroups: matchMorphGroups(indexes.root),
      suffixGroups: matchMorphGroups(indexes.suffix),
      meta,
    });

    // Update study list based on search results
    if (wordMatches.length) {
      setStudyList(wordMatches.map(w => w._idx!));
      setStudyIdx(0);
    }
  };

  const handleStudyNav = (direction: number | null) => {
    if (!studyList.length) return;
    let newIdx;
    if (direction === null) {
      newIdx = Math.floor(Math.random() * studyList.length);
    } else {
      newIdx = (studyIdx + direction + studyList.length) % studyList.length;
    }
    setStudyIdx(newIdx);
    const wordIdx = studyList[newIdx];
    const entry = data.words[wordIdx];
    if (entry) setCurrentEntry(entry);
  };

  const jumpToMorph = (kind: string, label: string) => {
    setCurrentMorphTab(kind);
    // Ensure we are on the home page
    navigate('/');
    setTimeout(() => {
      const safeLabel = String(label).replace(/[^a-zA-Z0-9]+/g, '-');
      const groupId = `${kind}-group-${safeLabel}`;
      const el = document.getElementById(groupId);
      if (el) {
        el.classList.add('ring-2', 'ring-amber-400');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => el.classList.remove('ring-2', 'ring-amber-400'), 3000);

        // Find the parent details element and open it
        // The structure is: details > div (content) > div (group)
        const details = el.closest('details');
        if (details) {
          details.open = true;
          // Also close other details if needed, logic is inside MorphologyNav but we can trigger state update if controlled
        }
      }
    }, 100);
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts if input is focused (except special cases handled elsewhere)
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'arrowleft':
          handleStudyNav(-1);
          break;
        case 'arrowright':
          handleStudyNav(1);
          break;
        case 'r':
          handleStudyNav(null); // Random
          break;
        case 'v':
          setReciteMode(prev => !prev);
          break;
        case 's':
          if (currentEntry && (currentEntry as any).word) {
            const w = currentEntry as Word;
            // Try to use US accent by default or current accent state
            // Note: We need to access the text to speak.
            // Word objects have 'word', Phrases have 'phrase'
            const text =
              w.word ||
              (currentEntry as Phrase).phrase ||
              (currentEntry as Phrase).norm_head;
            if (text) speakTextEn(text, accent);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentEntry, accent, studyList, studyIdx]); // Deps needed for closures

  return (
    <div className='min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans'>
      <AnimatePresence>
        {/* Always Show Header (Reverted Logic) */}
        <motion.div
          initial={{ opacity: 1, height: 'auto', marginBottom: '0px' }}
          className='z-50 relative'
        >
          <Header
            level={level}
            onLevelChange={setLevel}
          />
        </motion.div>
      </AnimatePresence>

      <main className='flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6'>
        <Routes>
          <Route path="/" element={
            <div className='h-[calc(100vh-140px)] min-h-[600px]'>
              <section className='grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-start'>
                {/* Left Sidebar: Search, Stats, Morphology Nav */}
                <aside className='lg:col-span-6 flex flex-col gap-4 h-full overflow-hidden bg-white/50 rounded-2xl border border-slate-200/50 relative'>
                  <div className='flex-shrink-0 space-y-4 p-4 pb-0'>
                    <GlobalSearch
                      onSearch={handleSearch}
                      searchResults={searchResults}
                      onSelectEntry={entry => {
                        if (entry._type === 'scenario') {
                          navigate('/scenarios');
                          return;
                        }
                        setCurrentEntry(entry);
                        if (entry._type === 'word') {
                          const idxInStudy = studyList.indexOf(entry._idx!);
                          if (idxInStudy !== -1) setStudyIdx(idxInStudy);

                          // Auto-scroll to morphology group with priority: Root > Prefix > Suffix
                          const w = entry as Word;
                          if (w.root && indexes.root.groupsByLabel[w.root]) {
                            jumpToMorph('root', w.root);
                          } else if (
                            w.prefix &&
                            indexes.prefix.groupsByLabel[w.prefix]
                          ) {
                            jumpToMorph('prefix', w.prefix);
                          } else if (
                            w.suffix &&
                            indexes.suffix.groupsByLabel[w.suffix]
                          ) {
                            jumpToMorph('suffix', w.suffix);
                          }
                        }
                      }}
                      onSelectMorph={(kind, label) => jumpToMorph(kind, label)}
                      reciteMode={reciteMode}
                      onToggleRecite={() => setReciteMode(!reciteMode)}
                      onStudyNav={handleStudyNav}
                    />
                    <Stats stats={stats} />
                  </div>

                  <div className='flex-1 min-h-0 relative z-10 overflow-hidden'>
                    <div className='h-full overflow-hidden'>
                      <MorphologyNav
                        prefixIndex={indexes.prefix}
                        rootIndex={indexes.root}
                        suffixIndex={indexes.suffix}
                        onSelectGroup={entry => {
                          setCurrentEntry(entry);
                          if (entry._type === 'word') {
                            const idxInStudy = studyList.indexOf(entry._idx!);
                            if (idxInStudy !== -1) setStudyIdx(idxInStudy);
                          }
                        }}
                        currentMorphTab={currentMorphTab}
                        setCurrentMorphTab={setCurrentMorphTab}
                        reciteMode={reciteMode}
                        currentEntry={currentEntry}
                      />
                    </div>
                  </div>
                </aside>

                {/* Right Content: Detail Panel */}
                <div className='lg:col-span-6 h-full overflow-y-auto'>
                  <DetailPanel
                    key={
                      currentEntry
                        ? `${currentEntry._type}-${currentEntry._idx || ''}`
                        : 'empty'
                    }
                    entry={currentEntry}
                    reciteMode={reciteMode}
                    accent={accent}
                    onSetAccent={setAccent}
                    scenarios={activeScenarios}
                    onJumpToMorph={jumpToMorph}
                  />
                </div>
              </section>
            </div>
          } />
          
          <Route path="/scenarios" element={
            <GlobalScenarios
              scenarios={activeScenarios}
              reciteMode={reciteMode}
              accent={accent}
              onToggleRecite={() => setReciteMode(!reciteMode)}
            />
          } />
        </Routes>
      </main>
      <ShortcutGuide />
    </div>
  );
}

export default App;
