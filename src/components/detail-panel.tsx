import { useState, useEffect, useMemo } from 'react';
import { speakTextEn } from '../utils/speech';
import { Word, Phrase, ScenarioMatch, ScenarioCategory } from '../types';
import { Volume2, Languages, Sparkles, MapPin, AudioLines } from 'lucide-react';

interface DetailPanelProps {
	entry: Word | Phrase | ScenarioMatch | null;
	reciteMode: boolean;
	accent: 'us' | 'uk';
	onSetAccent: (accent: 'us' | 'uk') => void;
	scenarios: ScenarioCategory[];
	onJumpToMorph: (kind: string, label: string) => void;
}

export default function DetailPanel({
	entry,
	reciteMode,
	accent,
	onSetAccent,
	scenarios,
	onJumpToMorph,
}: DetailPanelProps) {
	const [revealed, setRevealed] = useState({ head: false, sentence: false });
	const [detailTab, setDetailTab] = useState('content');
	const [autoMnemonic, setAutoMnemonic] = useState('');

	// Reset revealed state when entry changes
	useEffect(() => {
		setRevealed({ head: false, sentence: false });
		setAutoMnemonic('');
		setDetailTab('content');
	}, [entry]);

	if (!entry) {
		return (
			<div className='rounded-2xl bg-white/95 border border-slate-100 shadow-[0_16px_36px_rgba(15,23,42,0.14)] h-full overflow-y-auto p-5'>
				<h2 className='text-lg font-semibold text-slate-700'>
					请选择左侧词条或使用上方搜索
				</h2>
				<p className='text-xs text-slate-500 mt-2'>
					在任意列表中点击单词或短语，这里会展示构词拆解、助记与双语例句。
				</p>
			</div>
		);
	}

	const isWord = entry._type === 'word';
	const head = isWord
		? (entry as Word).word
		: (entry as Phrase).phrase || (entry as Phrase).norm_head;
	const cnDef = (entry as any).cn_def || '';
	const enDef = (entry as any).en_def || '';
	const sentences = (entry as any).sentences || [];
	// Safe access for IPA
	const ipaUk = (entry as any).ipa_uk || (entry as any).uk_ipa || '—';
	const ipaUs = (entry as any).ipa_us || (entry as any).us_ipa || '—';

	const handleAutoMnemonic = () => {
		if (!isWord) {
			setAutoMnemonic('该词不适合自动助记');
			return;
		}
		const { prefix_cn, root_cn, suffix_cn } = entry as Word;
		if (!prefix_cn || !root_cn || !suffix_cn) {
			setAutoMnemonic('该词不适合自动助记');
		} else {
			setAutoMnemonic(
				`前缀「${prefix_cn}」 + 词根「${root_cn}」 + 后缀「${suffix_cn}」 → 合在一起形成单词 ${head}：${cnDef}`
			);
		}
	};

	const renderScenarios = () => {
		if (!scenarios || !scenarios.length) return <p className='text-sm'>暂无场景例句</p>;

		const headLower = (head || '').toLowerCase();
		const relatedScenarios: any[] = [];

		scenarios.forEach(c => {
			if (!c.examples) return;
			const matchedExamples = c.examples
				.map((ex, idx) => {
					if (!ex.en || !ex.en.toLowerCase().includes(headLower)) return null;
					return { ...ex, idx, categoryName: c.name, categoryId: c.id };
				})
				.filter(Boolean);

			if (matchedExamples.length > 0) {
				relatedScenarios.push({
					...c,
					matchedExamples,
				});
			}
		});

		if (!relatedScenarios.length)
			return <p className='text-[14px]'>暂无与该词相关的场景例句</p>;

		return relatedScenarios.map(c => {
			let tagClass = 'scene-tag--work';
			if (c.id.startsWith('life_')) tagClass = 'scene-tag--life';
			else if (c.id.startsWith('campus_')) tagClass = 'scene-tag--campus';
			else if (c.id.startsWith('social_')) tagClass = 'scene-tag--social';

			return (
				<div key={c.id} className='rounded-xl border border-slate-100 bg-white/80 mb-2'>
					<div className='sticky top-0 z-10 bg-white/95 backdrop-blur flex items-center justify-between gap-2 px-2.5 py-1.5 border-b border-slate-100'>
						<div className='flex items-center gap-1.5'>
							<span
								className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${tagClass}`}
							>
								{c.name}
							</span>
							{c.levels &&
								c.levels.map((lvl: string) => (
									<span
										key={lvl}
										className='text-[9px] border border-slate-200 text-slate-400 px-1 rounded-sm'
									>
										{lvl}
									</span>
								))}
						</div>
					</div>
					<div className='mt-0.5 space-y-1.5 pb-1.5'>
						{c.matchedExamples.map((ex: any, i: number) => (
							<div
								key={i}
								className='flex items-start justify-between gap-2 px-2.5 py-1.5 text-xs'
							>
								<div className='flex-1'>
									<p
										className='text-slate-800 italic'
										dangerouslySetInnerHTML={{
											__html: ex.en.replace(
												new RegExp(head || '', 'gi'),
												(match: string) =>
													`<mark class="keyword-mark">${match}</mark>`
											),
										}}
									></p>
									{!reciteMode && (
										<p className='text-[11px] text-slate-500'>{ex.zh}</p>
									)}
								</div>
								<button
									type='button'
									className='mt-0.5 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/90 px-2 py-0.5 text-[10px] text-slate-600 hover:border-brand-300 hover:text-brand-700'
									onClick={() => speakTextEn(ex.en, accent)}
								>
									<Volume2 className='h-3.5 w-3.5' />
									<span>朗读</span>
								</button>
							</div>
						))}
					</div>
				</div>
			);
		});
	};

	const shouldMaskHead = reciteMode && !revealed.head;
	const shouldMaskSentence = reciteMode && !revealed.sentence;

	const scrollToSection = (sectionId: string) => {
		const element = document.getElementById(sectionId);

		if (element) {
			element.scrollIntoView({ behavior: 'smooth', block: 'start' });
			setDetailTab(sectionId);
		}
	};

	const tabs = useMemo(() => [
		{ id: 'content', label: '单词详情', color: 'bg-red-400', visible: true },
		{
			id: 'synonyms',
			label: '近义词',
			color: 'bg-teal-400',
			visible: isWord && (
				((entry as Word).synonyms?.length ?? 0) > 0
			)
		},
		{
			id: 'antonyms',
			label: '反义词',
			color: 'bg-rose-400',
			visible: isWord && (
				((entry as Word).antonyms?.length ?? 0) > 0
			)
		},
		{ id: 'sentence', label: '双语例句', color: 'bg-blue-400', visible: true },
		{ id: 'scenarios', label: '场景例句', color: 'bg-purple-400', visible: true },
		{
			id: 'cross-nav',
			label: '交叉导航',
			color: 'bg-slate-400',
			visible: isWord && (
				((entry as Word).prefix && (entry as Word).prefix !== '无') ||
				((entry as Word).root && (entry as Word).root !== '词干' && (entry as Word).root !== '无') ||
				((entry as Word).suffix && (entry as Word).suffix !== '无')
			)
		},
	].filter(t => t.visible), [isWord, entry]);

	// Handle scroll sync to update active tab
	useEffect(() => {
		const container = document.getElementById('detail-scroll-container');
		if (!container) return;

		const handleScroll = () => {
			let currentSection = '';

			for (const tab of tabs) {
				const element = document.getElementById(tab.id);
				if (element) {
					const rect = element.getBoundingClientRect();
					const containerRect = container.getBoundingClientRect();

					// Improved scroll spy logic:
					// Check if the section overlaps with the top area of the container (e.g., top 150px)
					// or if it's the last section and we are near bottom
					const offset = 150;
					if (rect.top <= containerRect.top + offset && rect.bottom > containerRect.top + offset) {
						currentSection = tab.id;
					}
				}
			}

			if (currentSection) {
				setDetailTab(currentSection);
			}
		};

		container.addEventListener('scroll', handleScroll);
		return () => container.removeEventListener('scroll', handleScroll);
	}, []);

	return (
		<div
			id='detail-scroll-container'
			className='rounded-2xl bg-white/95 border border-slate-100 h-full overflow-y-auto'
		>
			<div className='detail-header sticky top-0 z-20 bg-white/95 backdrop-blur px-6 py-5 pb-0 border-b border-slate-50'>
				<div className='flex flex-col gap-4'>
					<div className='space-y-2'>
						<div className='inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1'>
							<Languages className='h-4 w-4 text-brand-600' />
							<span className='text-[11px] font-medium text-brand-700'>
								{isWord ? '单词 · Word' : '短语 · Phrase'}
							</span>
						</div>
						<div
							className={`relative cursor-pointer flex items-end gap-4 ${shouldMaskHead ? 'mask-container' : ''
								}`}
							onClick={() => setRevealed(prev => ({ ...prev, head: true }))}
						>
							<h2
								className={`text-3xl font-bold tracking-tight text-slate-900 ${reciteMode && !shouldMaskHead ? 'detail-head-highlight' : ''
									}`}
								style={{ opacity: shouldMaskHead ? 0 : 1 }}
							>
								{head}
							</h2>
							<p className='text-sm text-slate-600 font-medium'>
								{(entry as any).pos} · {cnDef}
							</p>
							{shouldMaskHead && (
								<div className='mask-overlay text-[11px]'>点击揭示单词</div>
							)}
						</div>
						{isWord && (
							<section className='space-y-1 mb-1'>
								<div className='flex flex-wrap items-center gap-x-4 gap-y-0.5 text-sm text-slate-600 font-medium'>
									<div className='flex items-center gap-1'>
										<span>
											UK <span className='font-sans'>{ipaUk}</span>
										</span>
										<button
											type='button'
											className={`inline-flex items-center justify-center rounded-full p-1 transition-colors ${accent === 'uk'
												? 'text-brand-600 bg-brand-50'
												: 'text-slate-400 hover:text-brand-600 hover:bg-brand-50'
												}`}
											onClick={e => {
												e.stopPropagation();
												onSetAccent('uk');
												speakTextEn(head || '', 'uk');
											}}
											title='英音朗读'
										>
											<Volume2 className='h-4 w-4' />
										</button>
									</div>
									<div className='flex items-center gap-1'>
										<span>
											US <span className='font-sans'>{ipaUs}</span>
										</span>
										<button
											type='button'
											className={`inline-flex items-center justify-center rounded-full p-1 transition-colors ${accent === 'us'
												? 'text-brand-600 bg-brand-50'
												: 'text-slate-400 hover:text-brand-600 hover:bg-brand-50'
												}`}
											onClick={e => {
												e.stopPropagation();
												onSetAccent('us');
												speakTextEn(head || '', 'us');
											}}
											title='美音朗读'
										>
											<Volume2 className='h-4 w-4' />
										</button>
									</div>
								</div>
							</section>
						)}

						<div className='mt-3 inline-flex rounded-full bg-slate-100 p-1 text-[11px] text-slate-600 font-medium'>
							{tabs.map(tab => (
								<button
									key={tab.id}
									type='button'
									className={`px-3 py-1 rounded-full transition-all duration-200 flex items-center gap-1.5 ${detailTab === tab.id
										? 'bg-white text-slate-900 shadow-sm font-bold'
										: 'hover:text-slate-900 text-slate-500'
										}`}
									onClick={() => scrollToSection(tab.id)}
								>
									{detailTab === tab.id && (
										<span className={`w-1.5 h-1.5 rounded-full ${tab.color}`}></span>
									)}
									{tab.label}
								</button>
							))}
						</div>
					</div>
				</div>
			</div>

			<div className='p-4'>
				<div className='mt-2 space-y-2 text-sm'>
					{/* Word Details Group */}
					<div id='content' className='space-y-4 scroll-mt-40'>
						{/* Morph Section */}
						{isWord && (
							<section className='space-y-1'>
								<h3 className='text-md font-bold tracking-wider uppercase flex items-center gap-2'>
									<span className={`w-1 h-1 rounded-full ${tabs.find(t => t.id === 'content')?.color || 'bg-red-400'}`}></span>
									构词拆解
								</h3>
								<div className='flex flex-wrap gap-2'>
									<div className='inline-flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2 min-w-[80px]'>
										<div className='text-[10px] font-medium text-slate-400 uppercase tracking-wide'>
											前缀
										</div>
										<div className='flex flex-col'>
											<span className='font-mono text-base text-slate-700 font-medium'>
												{(entry as Word).prefix || '—'}
											</span>
											<span className='text-[11px] text-slate-500'>
												{(entry as Word).prefix_cn ||
													((entry as Word).prefix ? '' : '无明显前缀')}
											</span>
										</div>
									</div>
									<div className='inline-flex flex-col gap-1 rounded-xl border border-indigo-100 bg-indigo-50/30 px-3 py-2 min-w-[100px]'>
										<div className='text-[10px] font-medium text-indigo-400 uppercase tracking-wide'>
											词根
										</div>
										<div className='flex flex-col'>
											<span className='font-mono text-base text-indigo-900 font-medium'>
												{(entry as Word).root || '词干'}
											</span>
											<span className='text-[11px] text-indigo-600/80'>
												{(entry as Word).root_cn ||
													((entry as Word).root ? '' : '核心含义')}
											</span>
										</div>
									</div>
									<div className='inline-flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2 min-w-[80px]'>
										<div className='text-[10px] font-medium text-slate-400 uppercase tracking-wide'>
											后缀
										</div>
										<div className='flex flex-col'>
											<span className='font-mono text-base text-slate-700 font-medium'>
												{(entry as Word).suffix || '—'}
											</span>
											<span className='text-[11px] text-slate-500'>
												{(entry as Word).suffix_cn ||
													((entry as Word).suffix ? '' : '无派生后缀')}
											</span>
										</div>
									</div>
								</div>
								{(entry as Word).morph_note && (
									<p className='text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100'>
										💡 {(entry as Word).morph_note}
									</p>
								)}
							</section>
						)}

						{/* Etymology & IPA */}
						<section className='space-y-1'>
							<h3 className='text-md font-bold tracking-wider uppercase flex items-center gap-2'>
								<span className='w-1 h-1 rounded-full bg-amber-400'></span>
								词源
							</h3>
							<div className='bg-amber-50 rounded-xl p-4 border border-amber-100'>
								<p className='text-sm leading-7 text-slate-700 font-medium'>
									{isWord && (entry as Word).root && (entry as Word).root !== '词干'
										? `可能源自拉丁/希腊词根：${(entry as Word).root}`
										: '词源信息暂缺或基于词干'}
								</p>
							</div>
						</section>

						{/* Synonyms & Antonyms */}
						{isWord && (((entry as Word).synonyms?.length ?? 0) > 0 || ((entry as Word).antonyms?.length ?? 0) > 0) && (
							<>
								<section id='synonyms' className='space-y-3 scroll-mt-40'>
									{((entry as Word).synonyms?.length ?? 0) > 0 && (
										<div className='space-y-1'>
											<h3 className='text-md font-bold tracking-wider uppercase flex items-center gap-2'>
												<span className={`w-1 h-1 rounded-full ${tabs.find(t => t.id === 'synonyms')?.color || 'bg-teal-400'}`}></span>
												近义词 Synonyms
											</h3>
											<div className='flex flex-wrap gap-2'>
												{(entry as Word).synonyms!.map((syn, idx) => (
													<span key={idx} className='inline-flex items-center px-2.5 py-1 rounded-md bg-teal-50 text-teal-700 text-xs font-medium border border-teal-100'>
														{syn}
													</span>
												))}
											</div>
										</div>
									)}

								</section>
								<section id='antonyms' className='space-y-3 scroll-mt-40'>
									{((entry as Word).antonyms?.length ?? 0) > 0 && (
										<div className='space-y-1'>
											<h3 className='text-md font-bold tracking-wider uppercase flex items-center gap-2'>
												<span className={`w-1 h-1 rounded-full ${tabs.find(t => t.id === 'antonyms')?.color || 'bg-rose-400'}`}></span>
												反义词 Antonyms
											</h3>
											<div className='flex flex-wrap gap-2'>
												{(entry as Word).antonyms!.map((ant, idx) => (
													<span key={idx} className='inline-flex items-center px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 text-xs font-medium border border-rose-100'>
														{ant}
													</span>
												))}
											</div>
										</div>
									)}
								</section>
							</>
						)}

						<section className='space-y-1'>
							<div className='flex items-center justify-between gap-2'>
								<h3 className='text-md font-bold tracking-wider uppercase flex items-center gap-2'>
									<span className='w-1 h-1 rounded-full bg-emerald-400'></span>
									中文助记
								</h3>
								{isWord && (
									<button
										type='button'
										className='inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600 hover:border-brand-300 hover:text-brand-700 hover:shadow-sm transition-all'
										onClick={handleAutoMnemonic}
									>
										<Sparkles className='h-3 w-3' />
										<span>AI 助记</span>
									</button>
								)}
							</div>
							<div className='bg-emerald-50 rounded-xl p-4 border border-emerald-100'>
								<p className='text-sm leading-7 text-slate-700 font-medium'>
									{reciteMode ? '—' : (entry as Word).mnemonic_zh || '—'}
								</p>
								{autoMnemonic && !reciteMode && (
									<p className='mt-2 pt-2 border-t border-emerald-100 text-xs leading-relaxed text-emerald-600'>
										{autoMnemonic}
									</p>
								)}
							</div>
						</section>
					</div>

					{/* Examples */}
					<section id='sentence' className='space-y-2 scroll-mt-40'>
						<h3 className='text-md font-bold tracking-wider uppercase flex items-center gap-2'>
							<span className={`w-1 h-1 rounded-full ${tabs.find(t => t.id === 'sentence')?.color || 'bg-blue-400'}`}></span>
							双语例句
						</h3>

						<div
							className={`relative cursor-pointer group rounded-xl p-4 bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-100 ${shouldMaskSentence ? 'mask-container' : ''
								}`}
							onClick={() => setRevealed(prev => ({ ...prev, sentence: true }))}
						>
							<div className='flex items-center gap-3'>
								<button
									type='button'
									className='mt-0.5 flex-shrink-0 inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/90 p-1.5 text-slate-600 hover:border-brand-300 hover:text-brand-700 hover:shadow-sm transition-all'
									onClick={e => {
										e.stopPropagation();
										speakTextEn((entry as any).example_en || '', accent);
									}}
									title='朗读例句'
								>
									<AudioLines className='h-3.5 w-3.5' />
								</button>
								<p
									className='text-[15px] leading-relaxed text-slate-800 italic font-serif'
									dangerouslySetInnerHTML={{
										__html: (entry as any).example_en
											? (entry as any).example_en.replace(
												new RegExp(head || '', 'gi'),
												(match: string) =>
													`<mark class="keyword-mark">${match}</mark>`
											)
											: '—',
									}}
									style={{ opacity: shouldMaskSentence ? 0 : 1 }}
								>
								</p>
							</div>

							{shouldMaskSentence && (
								<div className='mask-overlay text-[11px]'>点击揭示例句</div>
							)}
							{!reciteMode && (
								<p className='mt-3 pt-3 border-t border-blue-100 text-sm leading-relaxed text-slate-600 pl-10'>
									{(entry as any).example_zh || (entry as any).cn_def}
								</p>
							)}
						</div>
						{(sentences || []).map((sent: any, idx: number) => (
							<div
								key={idx}
								className={`relative cursor-pointer group rounded-xl p-4 bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-100 ${shouldMaskSentence ? 'mask-container' : ''
									}`}
								onClick={() => setRevealed(prev => ({ ...prev, sentence: true }))}
							>
								<div className='flex items-center gap-3'>
									<button
										type='button'
										className='mt-0.5 flex-shrink-0 inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/90 p-1.5 text-slate-600 hover:border-brand-300 hover:text-brand-700 hover:shadow-sm transition-all'
										onClick={e => {
											e.stopPropagation();
											speakTextEn(sent.en || '', accent);
										}}
										title='朗读例句'
									>
										<AudioLines className='h-3.5 w-3.5' />
									</button>
									<p
										className='text-[15px] leading-relaxed text-slate-800 italic font-serif'
										dangerouslySetInnerHTML={{
											__html: sent.en
												? sent.en.replace(
													new RegExp(head || '', 'gi'),
													(match: string) =>
														`<mark class="keyword-mark">${match}</mark>`
												)
												: '—',
										}}
										style={{ opacity: shouldMaskSentence ? 0 : 1 }}
									></p>
								</div>

								{shouldMaskSentence && (
									<div className='mask-overlay text-[11px]'>点击揭示例句</div>
								)}
								{!reciteMode &&
									sent.zh && (
										<p className='mt-3 pt-3 border-t border-blue-100 text-sm leading-relaxed text-slate-600 pl-10'>
											{sent.zh}
										</p>
									)}
							</div>
						))}
					</section>

					{/* Scenarios */}
					<section id='scenarios' className='relative space-y-4 scroll-mt-40'>
						<h3 className='text-md font-bold tracking-wider uppercase flex items-center gap-2'>
							<span className={`w-1 h-1 rounded-full ${tabs.find(t => t.id === 'scenarios')?.color || 'bg-purple-400'}`}></span>
							场景例句
						</h3>
						<div className='space-y-1'>{renderScenarios()}</div>
					</section>
				</div>

				{/* Cross Nav */}
				<div id='cross-nav' className='mt-4 border-t border-slate-100 pt-4 space-y-1 scroll-mt-40'>
					<div className='flex items-center justify-between gap-2'>
						<h3 className='text-sm font-bold tracking-wider uppercase flex items-center gap-2'>
							<span className={`w-1 h-1 rounded-full ${tabs.find(t => t.id === 'cross-nav')?.color || 'bg-slate-400'}`}></span>
							交叉导航
						</h3>
						<p className='text-[10px] text-slate-400'>点击标签跳转到对应索引</p>
					</div>
					<div className='flex flex-wrap gap-2'>
						{isWord && (entry as Word).prefix && (entry as Word).prefix !== '无' && (
							<button
								onClick={() => onJumpToMorph('prefix', (entry as Word).prefix!)}
								className='morph-chip inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs bg-brand-50 text-brand-700 border-brand-100 hover:bg-brand-100 transition-colors'
							>
								<MapPin className='h-3.5 w-3.5' />
								<span>前缀 · {(entry as Word).prefix}</span>
							</button>
						)}
						{isWord &&
							(entry as Word).root &&
							(entry as Word).root !== '词干' &&
							(entry as Word).root !== '无' && (
								<button
									onClick={() => onJumpToMorph('root', (entry as Word).root!)}
									className='morph-chip inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100 transition-colors'
								>
									<MapPin className='h-3.5 w-3.5' />
									<span>词根 · {(entry as Word).root}</span>
								</button>
							)}
						{isWord && (entry as Word).suffix && (entry as Word).suffix !== '无' && (
							<button
								onClick={() => onJumpToMorph('suffix', (entry as Word).suffix!)}
								className='morph-chip inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 transition-colors'
							>
								<MapPin className='h-3.5 w-3.5' />
								<span>后缀 · {(entry as Word).suffix}</span>
							</button>
						)}
						{(!isWord ||
							(!(entry as Word).prefix &&
								!(entry as Word).root &&
								!(entry as Word).suffix)) && (
								<p className='text-xs text-slate-400 italic'>
									该词无典型前缀/词根/后缀可跳转。
								</p>
							)}
					</div>
				</div>
			</div>
		</div>
	);
}
