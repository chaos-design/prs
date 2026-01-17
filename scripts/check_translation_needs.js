
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src/data/c1_vocab.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

let count = 0;
data.words.forEach(word => {
  if (word.sentences) {
    word.sentences.forEach(s => {
      if (!s.zh || s.zh.trim() === '') {
        count++;
      }
    });
  }
});

console.log(`Sentences needing translation: ${count}`);
