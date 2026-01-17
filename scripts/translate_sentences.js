import fs from 'fs';
import path from 'path';
import { translate } from 'google-translate-api-x';

const FILES = [
  'src/data/c1_vocab.json',
  // 'src/data/b2_vocab.json',
  // 'src/data/c2_vocab.json',
];

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function translateSentence(sentence, retries = 3) {
  while (retries > 0) {
    try {
      const res = await translate(sentence.en, { from: 'en', to: 'zh-CN', rejectOnPartialFail: false });
      if (res && res.text) {
        sentence.zh = res.text;
        return true;
      }
      return false;
    } catch (e) {
      retries--;
      if (retries === 0) {
        console.error(`\nFailed to translate: "${sentence.en}"`);
        return false;
      }
      await delay(1000 + Math.random() * 1000); // Backoff with jitter
    }
  }
}

async function processFile(filePathStr) {
  const filePath = path.join(process.cwd(), filePathStr);
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return;
  }
  
  console.log(`Processing ${filePathStr}...`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Collect all sentences needing translation
  const tasks = [];
  data.words.forEach(word => {
    if (word.sentences) {
      word.sentences.forEach(s => {
        if ((!s.zh || s.zh.trim() === '') && s.en) {
          tasks.push(s);
        }
      });
    }
  });

  console.log(`Total tasks for ${filePathStr}: ${tasks.length}`);
  if (tasks.length === 0) return;

  let completed = 0;
  const concurrency = 20; 
  
  for (let i = 0; i < tasks.length; i += concurrency) {
    const chunk = tasks.slice(i, i + concurrency);
    const promises = chunk.map(task => translateSentence(task));
    await Promise.all(promises);
    
    completed += chunk.length;
    process.stdout.write(`\rProgress: ${completed}/${tasks.length}`);
    
    // Save periodically
    if (completed % 100 === 0 || completed >= tasks.length) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    }
    
    await delay(200);
  }
  
  // Final save
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`\nTranslation complete for ${filePathStr}.`);
}

async function processTranslations() {
  console.log('Starting optimized translation...');
  for (const file of FILES) {
    await processFile(file);
  }
  console.log('All files processed.');
}

processTranslations().catch(err => console.error('Fatal error:', err));
