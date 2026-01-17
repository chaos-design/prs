import { useState, useEffect, useRef } from 'react';
import { speakTextEn } from '../utils/speech';
import { ScenarioCategory } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Volume2, Globe, Eye, EyeOff, Search, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

interface GlobalScenariosProps {
	scenarios: ScenarioCategory[];
	reciteMode: boolean;
	accent: 'us' | 'uk';
	onToggleRecite?: () => void;
}

export default function GlobalScenarios({ scenarios, reciteMode, accent, onToggleRecite }: GlobalScenariosProps) {
	const [inputVal, setInputVal] = useState('');
	const [head, setHead] = useState('');
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const prevSelectedTagsLength = useRef(0);

	// Get all unique category names
	const allTags = Array.from(new Set(scenarios.map(s => s.name)));

	const toggleTag = (tag: string) => {
		setSelectedTags(prev => {
			if (prev.includes(tag)) {
				return prev.filter(t => t !== tag);
			} else {
				return [...prev, tag];
			}
		});
	};

	const clearTags = () => {
		setSelectedTags([]);
	};

	useEffect(() => {
		const timer = setTimeout(() => {
			setHead(inputVal);
		}, 300);
		return () => clearTimeout(timer);
	}, [inputVal]);

	// Auto scroll to bottom when a new tag is selected
	useEffect(() => {
		if (selectedTags.length > prevSelectedTagsLength.current) {
			// Small delay to allow rendering
			setTimeout(() => {
				if (scrollContainerRef.current) {
					scrollContainerRef.current.scrollTo({
						top: scrollContainerRef.current.scrollHeight,
						behavior: 'smooth'
					});
				}
			}, 100);
		}
		prevSelectedTagsLength.current = selectedTags.length;
	}, [selectedTags]);

	const visibleScenarios = scenarios.filter(s => {
		if (!inputVal.trim()) return true;
		const term = inputVal.trim().toLowerCase();
		const matchesName = s.name.toLowerCase().includes(term);
		const matchesExamples = s.examples?.some(ex => ex.en.toLowerCase().includes(term) || ex.zh.includes(term));
		return matchesName || matchesExamples;
	});

	const getTagVariant = (id: string, name: string): "default" | "secondary" | "outline" | "brand" | "success" | "warning" | "info" => {
		if (id.startsWith('life_')) return 'success';
		if (id.startsWith('campus_')) return 'info';
		if (id.startsWith('social_')) return 'warning';
		if (id.startsWith('dialog_')) return 'default';
		if (name.startsWith('工作')) return 'brand';
		if (name.startsWith('生活')) return 'success';
		if (name.startsWith('校园')) return 'info';
		if (name.startsWith('社交')) return 'warning';
		if (name.startsWith('对话')) return 'default';
		return 'brand';
	};

	const renderContent = () => {
		const headLower = head.trim().toLowerCase();
		const relatedScenarios: any[] = [];

		// If tags are selected, use selectedTags order to display content
		// Otherwise use visibleScenarios (default order)
		const sourceList = selectedTags.length > 0 
			? selectedTags.map(tagName => visibleScenarios.find(s => s.name === tagName)).filter(Boolean)
			: visibleScenarios;

		sourceList.forEach(c => {
			if (!c || !c.examples) return;

			let matchedExamples: any[] = c.examples;

			// If searching, filter examples
			if (head.trim()) {
				matchedExamples = c.examples.map((ex, idx) => {
					if (!ex.en || !ex.en.toLowerCase().includes(headLower)) return null;
					return { ...ex, idx };
				}).filter((item) => item !== null);
			} else {
				matchedExamples = c.examples.map((ex, idx) => ({ ...ex, idx }));
			}

			if (matchedExamples.length > 0) {
				relatedScenarios.push({
					...c,
					matchedExamples
				});
			}
		});

		if (!relatedScenarios.length) return (
			<div className="flex h-full items-center justify-center">
				<p className="text-base text-slate-500">暂无与该词相关的场景例句。</p>
			</div>
		);

		return (
			<AnimatePresence mode="popLayout">
				{relatedScenarios.map(c => {
					const parts = c.name.split(/ · | - |：/);
					const hasPrefix = parts.length > 1;
					const prefix = hasPrefix ? parts[0] : null;
					const label = hasPrefix ? parts[1] : c.name;

					const tagVariant = getTagVariant(c.id, c.name);

					return (
						<motion.div
							layout
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95 }}
							transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
							key={c.id}
							className="mb-4 last:mb-0"
						>
							<Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
								<div className="sticky top-0 z-10 bg-white/95 backdrop-blur flex items-center justify-between gap-2 px-5 py-3 border-b border-slate-100/50 rounded-t-xl">
									<div className="flex items-center gap-2">
										<Badge variant={tagVariant} className="text-xs font-medium px-2.5 py-0.5">
											{prefix && prefix}
											{label}
										</Badge>
										{c.levels && c.levels.map((lvl: string) => (
											<Badge key={lvl} variant="outline" className="text-[10px] px-1.5 py-0 text-slate-400 border-slate-200">
												{lvl}
											</Badge>
										))}
									</div>
								</div>
								<div className="divide-y divide-slate-50">
									{c.matchedExamples.map((ex: any, i: number) => (
										<div key={i} className="flex items-start justify-between gap-4 px-5 py-4 text-sm hover:bg-slate-50/80 transition-colors group">
											<div className="flex-1 space-y-1.5">
												<p className="text-slate-800 leading-relaxed font-medium" dangerouslySetInnerHTML={{
													__html: head.trim() ? ex.en.replace(new RegExp(head.trim(), 'gi'), (match: string) => `<mark class="bg-yellow-100 text-red-600 rounded-sm px-0.5">${match}</mark>`) : ex.en
												}}></p>

												<p
													className={clsx(
														"text-xs transition-all duration-500 ease-in-out",
														reciteMode
															? "blur-md bg-slate-100/50 text-transparent select-none cursor-pointer hover:blur-none hover:bg-transparent hover:text-slate-600"
															: "text-slate-500"
													)}
												>
													{ex.zh}
												</p>
											</div>
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 text-slate-400 hover:text-brand-600 hover:bg-brand-50 shrink-0"
												onClick={() => speakTextEn(ex.en, accent)}
											>
												<Volume2 className="h-4 w-4" />
											</Button>
										</div>
									))}
								</div>
							</Card>
						</motion.div>
					);
				})}
			</AnimatePresence>
		);
	};

	return (
		<div className="space-y-6 h-[calc(100vh-140px)] overflow-hidden flex flex-col">
			{/* Header Section */}
			<AnimatePresence>
				<motion.div
					initial={{ height: 'auto', opacity: 1 }}
					className="flex items-center justify-between flex-shrink-0"
				>
					<div className="space-y-1">
						<h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
							<Globe className="h-6 w-6 text-brand-500" />
							场景例句（全局）
						</h3>
						<p className="text-sm text-slate-500">浏览所有场景例句，或输入单词筛选</p>
					</div>

					{reciteMode && (
						<div className="flex items-center gap-3">
							<span className="text-brand-700 text-sm font-medium flex items-center gap-1.5">
								<EyeOff className="h-4 w-4" />
								专注模式
							</span>
							<Button
								size="sm"
								variant="outline"
								className="bg-white hover:bg-slate-50 text-brand-700 border-brand-200 h-8 text-xs"
								onClick={onToggleRecite}
							>
								退出
							</Button>
						</div>
					)}
				</motion.div>
			</AnimatePresence>

			<div className="flex-1 min-h-0 grid grid-cols-12 gap-3">
				{/* Left Sidebar: Tags & Search */}
				<div className="col-span-3 flex flex-col gap-2 overflow-hidden pr-2 pb-4 h-full">
					<div className="space-y-2 p-1">
						{/* <label htmlFor="global-scenarios-word-input" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">搜索筛选</label> */}
						<div className="relative group">
							<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
							<Input
								id="global-scenarios-word-input"
								type="text"
								autoComplete="off"
								placeholder="搜索分类或单词..."
								className="h-11 text-sm rounded-full pl-10 pr-10 shadow-sm border-slate-200 focus:border-brand-300 focus:ring-brand-100 bg-white transition-all hover:border-brand-200 hover:shadow"
								value={inputVal}
								onChange={(e) => setInputVal(e.target.value)}
							/>
							{inputVal && (
								<button
									onClick={() => setInputVal('')}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors"
								>
									<X className="h-4 w-4" />
								</button>
							)}
						</div>
					</div>

					<div className="flex items-center justify-between px-1">
						<h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">场景分类</h4>
						{selectedTags.length > 0 && (
							<button
								onClick={clearTags}
								className="text-[10px] text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors"
							>
								<Trash2 className="h-3 w-3" />
								清空
							</button>
						)}
					</div>
					<div className="space-y-2 overflow-y-auto scroll-smooth h-[calc(100%-20px)]">
						<div className="flex flex-col gap-2">
							{visibleScenarios.map(scenario => {
								const parts = scenario.name.split(/ · | - |：/);
								const hasPrefix = parts.length > 1;
								const prefix = hasPrefix ? parts[0] : null;
								const label = hasPrefix ? parts[1] : scenario.name;

								const tagVariant = getTagVariant(scenario.id, scenario.name);

								return (
									<button
										key={scenario.id}
										className={clsx(
											"text-left px-3 py-3 rounded-xl text-sm transition-all duration-200 border flex items-center gap-3 group w-full",
											selectedTags.includes(scenario.name)
												? "bg-brand-100 border-indigo-300 shadow-sm ring-1 ring-indigo-200"
												: "bg-white border-transparent hover:bg-slate-50 hover:border-slate-100 hover:shadow-sm"
										)}
										onClick={() => toggleTag(scenario.name)}
									>
										{/* {prefix && (
											<Badge variant={tagVariant} className="shrink-0 px-2 py-0.5 text-[10px] font-medium rounded-md shadow-none opacity-90">
												{prefix}
											</Badge>
										)} */}
										<Badge variant={tagVariant} className="text-xs font-medium px-2.5 py-0.5">
											{prefix && prefix}
											{label}
										</Badge>
									</button>
								);
							})}
						</div>
					</div>
				</div>

				{/* Right Content: Scrollable List */}
				<div ref={scrollContainerRef} className="col-span-9 h-full overflow-y-auto rounded-2xl bg-slate-50/30 border border-slate-100 scroll-smooth relative [scrollbar-gutter:stable] pr-2">
					{renderContent()}
				</div>
			</div>
		</div>
	);
}
