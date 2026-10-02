import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'src', 'data');

const c1Data = JSON.parse(fs.readFileSync(path.join(dataDir, 'c1_vocab.json'), 'utf8'));
const c1WordsByHead = new Map(
  (c1Data.words || []).map(word => [String(word.word || '').toLowerCase(), word])
);

const prefixes = [
  ['counter', '反对、相反'],
  ['under', '不足、在下'],
  ['trans', '穿过、转变'],
  ['super', '超越、在上'],
  ['inter', '在…之间'],
  ['extra', '额外、超出'],
  ['multi', '多、多种'],
  ['micro', '微小'],
  ['macro', '宏大'],
  ['semi', '半、部分'],
  ['over', '过度、在上'],
  ['fore', '预先、在前'],
  ['post', '之后'],
  ['anti', '反对、抵抗'],
  ['auto', '自己、自动'],
  ['mono', '单一'],
  ['sub', '在下、次级'],
  ['pre', '预先、在前'],
  ['pro', '向前、支持'],
  ['dis', '否定、分离'],
  ['mis', '错误、坏'],
  ['non', '不、非'],
  ['out', '超过、向外'],
  ['com', '共同、加强'],
  ['con', '共同、加强'],
  ['cor', '共同、加强'],
  ['col', '共同、加强'],
  ['en', '使、进入'],
  ['em', '使、进入'],
  ['ex', '向外、以前的'],
  ['re', '再、回'],
  ['de', '向下、去除'],
  ['un', '不、反向'],
  ['in', '不、进入'],
  ['im', '不、进入'],
  ['il', '不'],
  ['ir', '不'],
  ['co', '共同'],
  ['bi', '二、双'],
];

const suffixes = [
  ['ization', '名词后缀，表示过程或结果'],
  ['isation', '名词后缀，表示过程或结果'],
  ['ability', '名词后缀，表示能力或性质'],
  ['ibility', '名词后缀，表示能力或性质'],
  ['ically', '副词后缀，表示方式'],
  ['fulness', '名词后缀，表示状态'],
  ['lessness', '名词后缀，表示缺乏状态'],
  ['ation', '名词后缀，表示行为或结果'],
  ['ition', '名词后缀，表示行为或结果'],
  ['ment', '名词后缀，表示行为或结果'],
  ['ness', '名词后缀，表示性质或状态'],
  ['ship', '名词后缀，表示身份或关系'],
  ['hood', '名词后缀，表示状态或群体'],
  ['able', '形容词后缀，表示能够…的'],
  ['ible', '形容词后缀，表示能够…的'],
  ['less', '形容词后缀，表示无…的'],
  ['ful', '形容词后缀，表示充满…的'],
  ['ous', '形容词后缀，表示具有…性质的'],
  ['ious', '形容词后缀，表示具有…性质的'],
  ['eous', '形容词后缀，表示具有…性质的'],
  ['ive', '形容词后缀，表示有…倾向的'],
  ['ative', '形容词后缀，表示有…倾向的'],
  ['itive', '形容词后缀，表示有…倾向的'],
  ['al', '形容词/名词后缀，表示…的'],
  ['ial', '形容词后缀，表示…的'],
  ['ic', '形容词后缀，表示…的'],
  ['ical', '形容词后缀，表示…的'],
  ['ly', '副词后缀，表示方式'],
  ['er', '名词后缀，表示人或物'],
  ['or', '名词后缀，表示人或物'],
  ['ist', '名词后缀，表示从事者'],
  ['ism', '名词后缀，表示主义或体系'],
  ['ity', '名词后缀，表示性质或状态'],
  ['ty', '名词后缀，表示性质或状态'],
  ['ion', '名词后缀，表示行为或结果'],
  ['sion', '名词后缀，表示行为或结果'],
  ['tion', '名词后缀，表示行为或结果'],
  ['age', '名词后缀，表示集合或状态'],
  ['ary', '形容词/名词后缀，表示相关的'],
  ['ery', '名词后缀，表示场所或行为'],
  ['ant', '形容词/名词后缀，表示…的或人'],
  ['ent', '形容词/名词后缀，表示…的或人'],
  ['ance', '名词后缀，表示性质或行为'],
  ['ence', '名词后缀，表示性质或行为'],
];

const keepWholeWord = new Set([
  'able',
  'age',
  'ally',
  'anger',
  'answer',
  'ant',
  'enter',
  'interest',
  'iron',
  'island',
  'issue',
  'other',
  'over',
  'under',
  'union',
]);

const sortedPrefixes = [...prefixes].sort((a, b) => b[0].length - a[0].length);
const sortedSuffixes = [...suffixes].sort((a, b) => b[0].length - a[0].length);

function formatAffix(label, type) {
  if (!label) return '无';
  return type === 'prefix' ? `${label}-` : `-${label}`;
}

function trimDoubledEnding(root, suffix) {
  if (root.length < 4 || !suffix) return root;
  const last = root[root.length - 1];
  const prev = root[root.length - 2];
  if (last === prev && /[bcdfghjklmnpqrstvwxyz]/.test(last)) {
    return root.slice(0, -1);
  }
  return root;
}

function inferMorphology(word) {
  const head = String(word.word || '').toLowerCase().replace(/[^a-z]/g, '');
  if (!head || keepWholeWord.has(head)) {
    return {
      prefix: '无',
      root: head || '词干',
      suffix: '无',
      prefix_cn: '无明显前缀',
      root_cn: '词干核心',
      suffix_cn: '无明显后缀',
      source: 'stem',
    };
  }

  const prefix = sortedPrefixes.find(([value]) => {
    if (!head.startsWith(value)) return false;
    const rest = head.slice(value.length);
    return rest.length >= 4;
  });
  const suffix = sortedSuffixes.find(([value]) => {
    if (!head.endsWith(value)) return false;
    const restLength = head.length - value.length - (prefix ? prefix[0].length : 0);
    return restLength >= 3;
  });

  const prefixText = prefix?.[0] || '';
  const suffixText = suffix?.[0] || '';
  let root = head.slice(prefixText.length, suffixText ? -suffixText.length : undefined);
  root = trimDoubledEnding(root, suffixText);

  if (!root || root.length < 3) {
    root = head;
  }

  return {
    prefix: formatAffix(prefixText, 'prefix'),
    root,
    suffix: formatAffix(suffixText, 'suffix'),
    prefix_cn: prefix?.[1] || '无明显前缀',
    root_cn: '词干核心',
    suffix_cn: suffix?.[1] || '无明显后缀',
    source: prefix || suffix ? 'rule' : 'stem',
  };
}

function applyMorphology(targetLevel) {
  const filePath = path.join(dataDir, `${targetLevel}_vocab.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const summary = {
    level: targetLevel.toUpperCase(),
    total: data.words?.length || 0,
    reusedFromC1: 0,
    inferredByRule: 0,
    inferredAsStem: 0,
  };

  data.words = (data.words || []).map(word => {
    const head = String(word.word || '').toLowerCase();
    const c1Word = c1WordsByHead.get(head);

    if (c1Word && c1Word.prefix && c1Word.root && c1Word.suffix) {
      summary.reusedFromC1 += 1;
      return {
        ...word,
        prefix: c1Word.prefix,
        root: c1Word.root,
        suffix: c1Word.suffix,
        prefix_cn: c1Word.prefix_cn,
        root_cn: c1Word.root_cn,
        suffix_cn: c1Word.suffix_cn,
        morph_note: c1Word.morph_note || word.morph_note,
        mnemonic_zh: c1Word.mnemonic_zh || word.mnemonic_zh,
      };
    }

    const inferred = inferMorphology(word);
    if (inferred.source === 'rule') summary.inferredByRule += 1;
    if (inferred.source === 'stem') summary.inferredAsStem += 1;

    const morphParts = [
      inferred.prefix !== '无' ? `前缀 ${inferred.prefix}` : null,
      `词根/词干 ${inferred.root}`,
      inferred.suffix !== '无' ? `后缀 ${inferred.suffix}` : null,
    ].filter(Boolean);

    return {
      ...word,
      prefix: inferred.prefix,
      root: inferred.root,
      suffix: inferred.suffix,
      prefix_cn: inferred.prefix_cn,
      root_cn: inferred.root_cn,
      suffix_cn: inferred.suffix_cn,
      morph_note: `构词拆分：${morphParts.join(' + ')}；用于辅助索引与记忆，实际释义以“${word.cn_def || ''}”为准。`,
      mnemonic_zh:
        inferred.source === 'rule'
          ? `${morphParts.join(' + ')}，联想到“${word.cn_def || ''}”。`
          : word.mnemonic_zh,
    };
  });

  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
  return summary;
}

const summaries = ['b2', 'c2'].map(applyMorphology);
console.table(summaries);
