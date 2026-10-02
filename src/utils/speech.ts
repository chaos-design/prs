export function speakTextEn(text: string, accent: 'us' | 'uk' = 'us'): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || typeof window.SpeechSynthesisUtterance !== 'function') {
    return;
  }
  const content = (text || '').trim();
  if (!content) return;
  
  window.speechSynthesis.cancel();
  const utterance = new window.SpeechSynthesisUtterance(content);
  const targetLang = accent === 'uk' ? 'en-GB' : 'en-US';
  utterance.lang = targetLang;
  
  const voices = window.speechSynthesis.getVoices();
  if (voices && voices.length) {
    const lowerTarget = targetLang.toLowerCase();
    let voice =
      voices.find((v) => v.lang && v.lang.toLowerCase() === lowerTarget) ||
      voices.find((v) => v.lang && v.lang.toLowerCase().startsWith(lowerTarget)) ||
      voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('en-')) ||
      voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('en'));
    if (voice) {
      utterance.voice = voice;
    }
  }
  window.speechSynthesis.speak(utterance);
}
