import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { translate } from 'google-translate-api-x';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FILES = [
	// 'src/data/b2_vocab.json',
	'src/data/c1_vocab.json',
	// 'src/data/c2_vocab.json',
];

const CONFIG = {
	skipExisting: true, // If true, only update if fields are missing. If false, overwrite.
};

const API_BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en/';

async function sleep (ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function translateSentence (sentence, retries = 3) {
	while (retries > 0) {
		try {
			// Explicitly set 'from: en' to avoid auto-detection errors
			const res = await translate(sentence.en, { from: 'en', to: 'zh-CN', rejectOnPartialFail: false, forceBatch: false });

			if (res && res.text) {
				return res.text;
			}

			return false;
		} catch (e) {
			retries--;
			if (retries === 0) {
				console.error(`\nFailed to translate: "${sentence.en}"`);
				console.error(`Error details: ${e.message}`);
				return false;
			}

			await sleep(1000 + Math.random() * 1000); // Backoff with jitter
		}
	}
}

async function fetchWordData (word) {
	try {
		const response = await fetch(`${API_BASE}${word}`);
		if (!response.ok) {
			if (response.status === 404) {
				return null;
			}
			if (response.status === 429) {
				console.warn(`Rate limit (429) for "${word}". Pausing for 5s...`);
				await sleep(5000);
				return fetchWordData(word); // Retry
			}
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();
		return data;
	} catch (error) {
		console.error(`Error fetching ${word}:`, error.message);
		return null;
	}
}

async function extractDetails (data) {
	let ipa_uk = '';
	let ipa_us = '';
	let default_ipa = '';
	let en_def = '';
	let sentences = [];
	let synonyms = [];
	let antonyms = [];

	if (!data || !data.length) return { ipa_uk, ipa_us, en_def, sentences, synonyms, antonyms };

	// 1. Extract IPA (Scan all entries)
	for (const entry of data) {
		if (entry.phonetics) {
			for (const phonetic of entry.phonetics) {
				if (!phonetic.text) continue;

				if (!default_ipa) default_ipa = phonetic.text;

				const audio = phonetic.audio || '';

				if (audio.includes('-uk') || audio.includes('/uk/')) {
					if (!ipa_uk) ipa_uk = phonetic.text;
				} else if (audio.includes('-us') || audio.includes('/us/')) {
					if (!ipa_us) ipa_us = phonetic.text;
				}
			}
		}
		if (entry.phonetic && !default_ipa) {
			default_ipa = entry.phonetic;
		}
	}

	if (!ipa_uk && default_ipa) ipa_uk = default_ipa;
	if (!ipa_us && default_ipa) ipa_us = default_ipa;

	if (!ipa_uk && ipa_us) ipa_uk = ipa_us;
	if (!ipa_us && ipa_uk) ipa_us = ipa_uk;

	// 2. Extract Definition & Examples (Prioritize first entry/meaning)
	// We iterate to find the first valid definition and accumulate examples
	outerLoop: for (const entry of data) {
		if (entry.meanings) {
			for (const meaning of entry.meanings) {
				if (meaning.synonyms) synonyms.push(...meaning.synonyms);
				if (meaning.antonyms) antonyms.push(...meaning.antonyms);

				if (meaning.definitions) {
					for (const def of meaning.definitions) {
						if (def.synonyms) synonyms.push(...def.synonyms);
						if (def.antonyms) antonyms.push(...def.antonyms);

						if (!en_def && def.definition) {
							en_def = def.definition;
						}
						if (def.example) {
							const zh = (await translateSentence({ en: def.example })) || '';

							sentences.push({ en: def.example, zh });
							if (sentences.length >= 3) break outerLoop;
						}
					}
				}
			}
		}
	}

	// Deduplicate and limit
	synonyms = [...new Set(synonyms)].slice(0, 10);
	antonyms = [...new Set(antonyms)].slice(0, 10);

	return { ipa_uk, ipa_us, en_def, sentences, synonyms, antonyms };
}

async function processFile (filePath) {
	const fullPath = path.resolve(process.cwd(), filePath);

	if (!fs.existsSync(fullPath)) {
		console.warn(`File not found: ${fullPath}`);
		return;
	}

	console.log(`Processing ${filePath}...`);

	let content;
	try {
		content = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
	} catch (e) {
		console.error(`Error parsing JSON from ${filePath}:`, e);
		return;
	}

	if (!content.words || !Array.isArray(content.words)) {
		console.error(`Invalid structure in ${filePath}: 'words' array missing.`);
		return;
	}

	let updatedCount = 0;
	const words = content.words;
	let unsavedChanges = false;

	for (let i = 0; i < words.length; i++) {
		const wordObj = words[i];

		// Check if we need to fetch data: missing IPA OR missing definition OR missing sentences OR missing synonyms/antonyms
		let needsUpdate = false;
		if (CONFIG.skipExisting) {
			needsUpdate =
				!wordObj.ipa_uk ||
				!wordObj.ipa_us ||
				!wordObj.en_def ||
				!wordObj?.sentences ||
				wordObj?.sentences?.length === 0 ||
				!wordObj.synonyms ||
				!wordObj.antonyms;
		} else {
			needsUpdate = true;
		}

		if (needsUpdate) {
			// Log less frequently to reduce noise, but enough to see progress
			if (i % 10 === 0) process.stdout.write(`\r[${i + 1}/${words.length}] Processing... `);

			const apiData = await fetchWordData(wordObj.word);

			if (apiData) {
				const { ipa_uk, ipa_us, en_def, sentences, synonyms, antonyms } = await extractDetails(apiData);

				let changed = false;

				// Helper to decide if we should update a field
				const shouldUpdate = (oldVal, newVal) => {
					if (!newVal) return false; // Don't update with empty
					if (!CONFIG.skipExisting) return true; // Overwrite if config says so
					return !oldVal; // Otherwise only update if old value is missing
				};

				if (shouldUpdate(wordObj.ipa_uk, ipa_uk)) {
					wordObj.ipa_uk = ipa_uk;
					changed = true;
				}
				if (shouldUpdate(wordObj.ipa_us, ipa_us)) {
					wordObj.ipa_us = ipa_us;
					changed = true;
				}
				if (shouldUpdate(wordObj.en_def, en_def)) {
					wordObj.en_def = en_def;
					changed = true;
				}

				if (shouldUpdate(wordObj.synonyms, synonyms) && synonyms.length > 0) {
					wordObj.synonyms = synonyms;
					changed = true;
				}

				if (shouldUpdate(wordObj.antonyms, antonyms) && antonyms.length > 0) {
					wordObj.antonyms = antonyms;
					changed = true;
				}

				// Sentences logic is a bit more complex.
				// If skipping existing, update only if empty.
				// If overwriting, update if we found new sentences.
				if (
					(!CONFIG.skipExisting && sentences.length > 0) ||
					((!wordObj.sentences || wordObj.sentences.length === 0) && sentences.length > 0)
				) {
					wordObj.sentences = sentences;
					changed = true;
				}

				if (changed) {
					updatedCount++;
					unsavedChanges = true;
				}
			}

			// Save every 50 processed items to avoid data loss
			if (unsavedChanges && updatedCount % 50 === 0) {
				fs.writeFileSync(fullPath, JSON.stringify(content, null, 2), 'utf8');
				unsavedChanges = false;
				process.stdout.write(`(Saved ${updatedCount}) `);
			}

			// Adaptive sleep: 50ms nominal
			await sleep(50);
		}
	}
	process.stdout.write('\n');

	if (unsavedChanges) {
		fs.writeFileSync(fullPath, JSON.stringify(content, null, 2), 'utf8');
		console.log(`Final save: ${updatedCount} total updates to ${filePath}`);
	} else {
		console.log(`Finished ${filePath}. Total updates: ${updatedCount}`);
	}
	console.log('---');
}

async function main () {
	for (const file of FILES) {
		await processFile(file);
	}
	console.log('All files processed.');
}

main().catch(console.error);
