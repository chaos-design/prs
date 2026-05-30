import { useState } from 'react';
import { IndexResult, Word, MorphGroup } from '../types';

interface MorphologyNavProps {
	prefixIndex: IndexResult;
	rootIndex: IndexResult;
	suffixIndex: IndexResult;
	onSelectGroup: (entry: Word) => void;
	currentMorphTab: string;
	setCurrentMorphTab: (tab: string) => void;
	reciteMode: boolean;
	currentEntry: any; // Allow any to match App state
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#';
const LETTER_LIST = LETTERS.split('');

export default function MorphologyNav({
	prefixIndex,
	rootIndex,
	suffixIndex,
	onSelectGroup,
	currentMorphTab,
	setCurrentMorphTab,
	reciteMode,
	currentEntry,
}: MorphologyNavProps) {
	const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
	const [openLetters, setOpenLetters] = useState<Record<string, boolean>>(() => {
		const initial: Record<string, boolean> = {};

		LETTER_LIST.forEach(l => (initial[l] = true));

		return initial;
	});

	const getGroupId = (kind: string, label: string) => {
		const safeLabel = String(label).replace(/[^a-zA-Z0-9]+/g, '-');

		return `${kind}-group-${safeLabel}`;
	};

	const toggleGroup = (groupId: string) => {
		setOpenGroups(prev => ({
			...prev,
			[groupId]: !prev[groupId],
		}));
	};

	const toggleLetter = (letter: string) => {
		setOpenLetters(prev => {
			return {
				...prev,
				[letter]: !prev[letter],
			};
		});
	};

	const expandAll = (kind: string) => {
		const index = kind === 'prefix' ? prefixIndex : kind === 'root' ? rootIndex : suffixIndex;
		const newOpen = { ...openGroups };
		index?.items.forEach(g => {
			newOpen[getGroupId(kind, g.label)] = true;
		});
		setOpenGroups(newOpen);
	};

	const collapseAll = (kind: string) => {
		const index = kind === 'prefix' ? prefixIndex : kind === 'root' ? rootIndex : suffixIndex;
		const newOpen = { ...openGroups };
		index?.items.forEach(g => {
			newOpen[getGroupId(kind, g.label)] = false;
		});
		setOpenGroups(newOpen);
	};

	const renderIndex = (index: IndexResult, kind: string) => {
		if (!index || !index.letterMap) return null;

		return (
			<div className='relative h-full space-y-2 overflow-hidden'>
				<div className='mb-2 flex items-center justify-between gap-2 px-4'>
					<p className='text-[11px] text-slate-500'>
						{kind === 'prefix' &&
							'按字母索引展开前缀组，点击小标签展开该前缀下的所有词汇。'}
						{kind === 'root' && '以词根为中心查看同源词，便于构建语义家族。'}
						{kind === 'suffix' && '从词性和抽象名词/形容词等后缀切入。'}
					</p>
					<div className='flex items-center gap-1 shrink-0'>
						<button
							type='button'
							className='cursor-pointer rounded-full border border-slate-200 bg-white/80 px-2 py-0.5 text-[10px] text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300'
							onClick={() => expandAll(kind)}
						>
							展开
						</button>
						<button
							type='button'
							className='cursor-pointer rounded-full border border-slate-200 bg-white/80 px-2 py-0.5 text-[10px] text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300'
							onClick={() => collapseAll(kind)}
						>
							折叠
						</button>
					</div>
				</div>

				<div className='smooth-scroll h-[calc(100%-30px)] min-h-0 flex-1 space-y-2 overflow-y-auto px-4 pb-10'>
					{LETTER_LIST.map(letter => {
						const groups = index.letterMap[letter];
						if (!groups || !groups.length) return null;


						return (
							<div
								key={letter}
								className='letter-section mb-2 rounded-xl border border-slate-200 bg-white/60 shadow-sm'
							>
								<div
									className='sticky top-0 z-10 flex cursor-pointer select-none items-center justify-between gap-2 rounded-xl border-b border-slate-100 bg-white/95 px-3 py-2 text-xs text-slate-700 shadow-sm backdrop-blur transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300'
									onClick={() => toggleLetter(letter)}
									role='button'
									tabIndex={0}
									onKeyDown={event => {
										if (event.key === 'Enter' || event.key === ' ') {
											event.preventDefault();
											toggleLetter(letter);
										}
									}}
								>
									<div className='flex items-center gap-2'>
										<span className='inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white text-[11px] font-semibold'>
											{letter}
										</span>
										<span className='text-[11px] text-slate-500'>
											{groups.length} 个构词项
										</span>
									</div>
									<span
										className={`material-symbols-outlined text-[18px] text-slate-400 transition-transform duration-200 ${openLetters[letter] ? 'rotate-180' : ''}`}
									>
										expand_more
									</span>
								</div>

								{openLetters[letter] && (
									<div className='space-y-2 bg-slate-50/70 px-3 py-2'>
										{groups.map((g: MorphGroup, index: number) => {
										const groupId = getGroupId(kind, g.label);
										const isOpen = openGroups[groupId];
										const count = g.words.length;
										const subLabel = g.cn
											? `${g.cn} · ${count} 个词`
											: `${count} 个词`;

										return (
											<div
												key={`${groupId}-${index}`}
												id={groupId}
													className='space-y-1.5 border-l border-slate-200 py-1.5 pl-2.5'
											>
													<button
														type='button'
														className='flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-1 py-0.5 text-xs text-slate-700 transition-colors hover:bg-white hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300'
														onClick={() => toggleGroup(groupId)}
													>
														<div className='flex items-center gap-1.5'>
															<span className='inline-flex items-center justify-center rounded-full bg-slate-900 text-white text-[11px] font-mono px-1.5'>
																{g.label}
															</span>
															<span className='text-[11px] text-slate-500'>
																{subLabel}
															</span>
														</div>
														<span
															className={`material-symbols-outlined text-[18px] text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''
																}`}
														>
															expand_more
														</span>
													</button>

													{isOpen && (
														<div className='group-words mt-1 space-y-0.5'>
															{g.words
																.sort((a: Word, b: Word) =>
																	(a.word || '').localeCompare(
																		b.word || ''
																	)
																)
																.map((w: Word) => (
																	<button
																		key={w._idx}
																		type='button'
																		className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] transition-colors hover:bg-brand-50/80 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 ${currentEntry?._idx ===
																			w._idx
																			? 'bg-brand-100 text-brand-800 font-medium shadow-sm ring-1 ring-brand-200'
																			: ''
																			}`}
																		onClick={() =>
																			onSelectGroup(w)
																		}
																	>
																		<div className='flex-1 truncate'>
																			<div>
																				<span
																					className={`font-medium mr-1 ${reciteMode
																						? 'highlight-word'
																						: ''
																						}`}
																				>
																					{w.word}
																				</span>
																				{!reciteMode && (
																					<span className='text-slate-500'>
																						{w.cn_def}
																					</span>
																				)}
																			</div>
																			<div className='mt-0.5 text-[10px] text-slate-400'>
																				英:{' '}
																				<span>
																					{w.ipa_uk ||
																						w.uk_ipa ||
																						'—'}
																				</span>{' '}
																				美:{' '}
																				<span>
																					{w.ipa_us ||
																						w.us_ipa ||
																						'—'}
																				</span>
																			</div>
																		</div>
																		<span className='material-symbols-outlined text-[16px] text-slate-400'>
																			chevron_right
																		</span>
																	</button>
																))}
														</div>
													)}
												</div>
											);
										})}
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>
		);
	};

	const getTabClass = (tabName: string) => {
		const isActive = currentMorphTab === tabName;
		const base =
			'group flex cursor-pointer flex-col justify-between rounded-xl border px-3 py-2 text-left shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300';

		if (isActive) {
			return `${base} border-brand-100 bg-white ring-1 ring-brand-500/70 text-brand-700`;
		}

		return `${base} border-slate-200 bg-white/80 hover:border-brand-300 hover:shadow-md`;
	};

	return (
		<div className='flex h-full flex-col space-y-3'>
			<h3 className='flex flex-shrink-0 items-center gap-1.5 px-4 text-xs font-semibold text-slate-700'>
				<span className='material-symbols-outlined text-[18px] text-brand-500'>
					category
				</span>
				三大入口：按前缀 / 词根 / 后缀浏览
			</h3>

			<div className='grid flex-shrink-0 gap-2 px-4 sm:grid-cols-3'>
				<div onClick={() => setCurrentMorphTab('prefix')} className={getTabClass('prefix')}>
					<div className='flex items-center justify-between gap-2'>
						<div>
							<p
								className={`text-[11px] font-semibold ${currentMorphTab === 'prefix'
									? 'text-brand-700'
									: 'text-slate-800'
									}`}
							>
								按前缀浏览
							</p>
							<p className='mt-0.5 text-[11px] text-slate-500'>
								re-, de-, inter- ...
							</p>
						</div>
						<span className='material-symbols-outlined text-[20px] text-brand-500'>
							segment
						</span>
					</div>
					<p className='mt-0.5 text-[10px] text-slate-400'>适合从派生规律切入。</p>
				</div>
				<div onClick={() => setCurrentMorphTab('root')} className={getTabClass('root')}>
					<div className='flex items-center justify-between gap-2'>
						<div>
							<p
								className={`text-[11px] font-semibold ${currentMorphTab === 'root' ? 'text-brand-700' : 'text-slate-800'
									}`}
							>
								按词根浏览
							</p>
							<p className='mt-0.5 text-[11px] text-slate-500'>ject, spect ...</p>
						</div>
						<span className='material-symbols-outlined text-[20px] text-indigo-400'>
							psychology
						</span>
					</div>
					<p className='mt-0.5 text-[10px] text-slate-400'>聚焦核心意义模块。</p>
				</div>
				<div onClick={() => setCurrentMorphTab('suffix')} className={getTabClass('suffix')}>
					<div className='flex items-center justify-between gap-2'>
						<div>
							<p
								className={`text-[11px] font-semibold ${currentMorphTab === 'suffix'
									? 'text-brand-700'
									: 'text-slate-800'
									}`}
							>
								按后缀浏览
							</p>
							<p className='mt-0.5 text-[11px] text-slate-500'>-tion, -ment ...</p>
						</div>
						<span className='material-symbols-outlined text-[20px] text-emerald-500'>
							widgets
						</span>
					</div>
					<p className='mt-0.5 text-[10px] text-slate-400'>强化词性与词义感知。</p>
				</div>
			</div>

			<div id='morph-panels' className='flex-1 min-h-0 overflow-hidden'>
				{currentMorphTab === 'prefix' && renderIndex(prefixIndex, 'prefix')}
				{currentMorphTab === 'root' && renderIndex(rootIndex, 'root')}
				{currentMorphTab === 'suffix' && renderIndex(suffixIndex, 'suffix')}
			</div>
		</div>
	);
}
