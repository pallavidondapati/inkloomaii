export interface TextQualityMetrics {
  wordCount: number;
  charCount: number;
  readingTimeMinutes: number;
  sentenceCount: number;
  fleschReadingEase: number;
  gradeLevel: string;
  toneSummary: string;
  tonePolarity: 'neutral_executive' | 'combative' | 'hyperbolic' | 'clear_professional';
}

/**
 * Calculates Flesch Reading Ease and enterprise tone metrics.
 */
export function calculateTextMetrics(text: string): TextQualityMetrics {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      wordCount: 0,
      charCount: 0,
      readingTimeMinutes: 0,
      sentenceCount: 0,
      fleschReadingEase: 100,
      gradeLevel: 'Grade 5 (Plain English)',
      toneSummary: 'Empty draft',
      tonePolarity: 'clear_professional',
    };
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const charCount = trimmed.length;
  const sentences = trimmed.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const sentenceCount = Math.max(1, sentences.length);

  // Simple syllable estimator
  let totalSyllables = 0;
  for (const word of words) {
    totalSyllables += countSyllables(word);
  }

  // Flesch Reading Ease = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
  const wordsPerSentence = wordCount / sentenceCount;
  const syllablesPerWord = totalSyllables / Math.max(1, wordCount);
  let fre = 206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord;
  fre = Math.max(0, Math.min(100, Math.round(fre)));

  let gradeLevel = 'Grade 8-9 (Standard Business)';
  if (fre >= 80) gradeLevel = 'Grade 6 (Accessible & Plain)';
  else if (fre >= 60) gradeLevel = 'Grade 8-10 (Standard Enterprise)';
  else if (fre >= 45) gradeLevel = 'Grade 11-12 (Executive Technical)';
  else gradeLevel = 'Post-Graduate (Dense / High Friction)';

  // Tone detection heuristics
  const textLower = trimmed.toLowerCase();
  let tonePolarity: TextQualityMetrics['tonePolarity'] = 'clear_professional';
  let toneSummary = 'Balanced & Objective Enterprise Tone';

  if (
    textLower.includes('foolish') ||
    textLower.includes('dinosaurs') ||
    textLower.includes('worthless') ||
    textLower.includes('inferior')
  ) {
    tonePolarity = 'combative';
    toneSummary = 'Combative Competitor Phrasing Detected';
  } else if (
    textLower.includes('unbreakable') ||
    textLower.includes('military-grade') ||
    textLower.includes('hack-proof') ||
    textLower.includes('flawless') ||
    textLower.includes('100% bug-free')
  ) {
    tonePolarity = 'hyperbolic';
    toneSummary = 'Hyperbolic Claims & Absolute Guarantees';
  }

  // Average reading speed is ~220 wpm
  const readingTimeMinutes = Math.max(0.1, +(wordCount / 220).toFixed(1));

  return {
    wordCount,
    charCount,
    readingTimeMinutes,
    sentenceCount,
    fleschReadingEase: fre,
    gradeLevel,
    toneSummary,
    tonePolarity,
  };
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]|ed|es|e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? Math.max(1, matches.length) : 1;
}
