// ==========================================
// CRICKETVERSE: BROWSER TEXT-TO-SPEECH (TTS)
// Powered by browser-native Web Speech API (window.speechSynthesis)
// Zero paid AI APIs required
// ==========================================

class CommentaryTTSService {
  constructor() {
    this.isEnabled = false;
    this.currentVoice = null;
    this.volume = 1.0;
    this.isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

    if (this.isSupported) {
      // Load available system voices
      this.initVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  initVoices() {
    if (!this.isSupported) return;
    const voices = window.speechSynthesis.getVoices();
    // Prefer English voices (UK/US/IN)
    this.currentVoice = voices.find(v => v.lang.startsWith('en-GB') || v.lang.startsWith('en-IN') || v.lang.startsWith('en-US')) || voices[0] || null;
  }

  toggleTTS(enabled = null) {
    if (enabled !== null) {
      this.isEnabled = enabled;
    } else {
      this.isEnabled = !this.isEnabled;
    }
    if (!this.isEnabled) {
      this.stop();
    }
    return this.isEnabled;
  }

  speak(text, personality = 'Professional') {
    if (!this.isSupported || !this.isEnabled || !text) return;

    try {
      // Cancel ongoing speech to prevent backlog lag
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      if (this.currentVoice) utterance.voice = this.currentVoice;
      utterance.volume = this.volume;

      // Adjust vocal pitch & rate based on commentary personality
      const p = (personality || 'Professional').toLowerCase();
      if (p === 'hype') {
        utterance.rate = 1.20; // Fast energetic delivery
        utterance.pitch = 1.15; // Higher enthusiasm
      } else if (p === 'savage') {
        utterance.rate = 0.95; // Deliberate sarcastic cadence
        utterance.pitch = 0.90; // Deadpan dry tone
      } else {
        // Professional (Richie Benaud / Harsha Bhogle calm delivery)
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('[Commentary TTS] Speech error:', err);
    }
  }

  stop() {
    if (this.isSupported) {
      window.speechSynthesis.cancel();
    }
  }
}

export const commentaryTTS = new CommentaryTTSService();
export default commentaryTTS;

