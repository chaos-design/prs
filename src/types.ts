export interface Word {
  word: string;
  cn_def: string;
  en_def?: string;
  example_en?: string;
  example_zh?: string;
  sentences?: { en: string; zh?: string }[];
  prefix?: string;
  root?: string;
  suffix?: string;
  prefix_cn?: string;
  root_cn?: string;
  suffix_cn?: string;
  ipa_uk?: string;
  ipa_us?: string;
  synonyms?: string[];
  antonyms?: string[];
  uk_ipa?: string;
  us_ipa?: string;
  morph_note?: string;
  mnemonic_zh?: string;
  pos?: string;
  // Metadata added at runtime
  _type?: 'word';
  _idx?: number;
}

export interface Phrase {
  phrase?: string;
  norm_head?: string;
  cn_def?: string;
  example_en?: string;
  example_zh?: string;
  // Metadata added at runtime
  _type?: 'phrase';
  _idx?: number;
}

export interface ScenarioExample {
  en: string;
  zh: string;
}

export interface ScenarioCategory {
  id: string;
  name: string;
  levels?: string[]; // e.g. ["B2", "C1"]
  examples: ScenarioExample[];
}

export interface ScenarioMatch extends ScenarioExample {
  _type: 'scenario';
  categoryName: string;
  categoryId: string;
  _idx?: number; // Add optional idx to make it compatible in some contexts if needed
}

export interface BuildIndexOptions {
  skip?: Set<string>;
}

export interface IndexGroup {
  label: string;
  cn: string;
  words: Word[];
}

export type MorphGroup = IndexGroup;

export interface IndexResult {
  groupsByLabel: Record<string, IndexGroup>;
  items: IndexGroup[];
  letterMap: Record<string, IndexGroup[]>;
}

export type SearchResult = {
  words: Word[];
  phrases: Phrase[];
  scenarios: ScenarioMatch[];
  prefixGroups: any[];
  rootGroups: any[];
  suffixGroups: any[];
  meta: string;
}
