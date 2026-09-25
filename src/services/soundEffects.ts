// High-performance Web Audio API synthesizer for interactive hand gesture and motion FX
import type { SoundTheme } from "../types";

type AudioTriggerListener = (gestureName: string, theme: SoundTheme) => void;

class SoundEffectsEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled: boolean = true;
  private volume: number = 0.7; // 0.0 to 1.0
  private theme: SoundTheme = "scifi";
  private noiseBuffer: AudioBuffer | null = null;
  private listeners: Set<AudioTriggerListener> = new Set();
  private lastTriggerTime: number = 0;
  private lastMotionTime: number = 0;

  // Custom audio file buffers (MP3 / WAV / OGG uploaded or loaded from public/sounds/)
  private customAudioBuffers: Map<string, AudioBuffer> = new Map();
  private customAudioNames: Map<string, string> = new Map();

  // Initialize or resume the AudioContext safely
  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
        this.generateNoiseBuffer();
      }
    }

    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  // Pre-generate a 1-second white noise buffer for crisp percussive FX & air whooshes
  private generateNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (enabled) {
      this.getContext();
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public setTheme(theme: SoundTheme) {
    this.theme = theme;
  }

  public getTheme(): SoundTheme {
    return this.theme;
  }

  public onSoundTrigger(listener: AudioTriggerListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(gestureName: string) {
    this.listeners.forEach((fn) => {
      try {
        fn(gestureName, this.theme);
      } catch (e) {
        console.error(e);
      }
    });
  }

  // ==========================================
  // CUSTOM AUDIO MANAGEMENT (Files / URLs)
  // ==========================================
  public async loadCustomAudioFromFile(gestureName: string, file: File): Promise<boolean> {
    const ctx = this.getContext();
    if (!ctx) return false;
    try {
      const arrayBuf = await file.arrayBuffer();
      const audioBuf = await ctx.decodeAudioData(arrayBuf);
      this.customAudioBuffers.set(gestureName, audioBuf);
      this.customAudioNames.set(gestureName, file.name);
      this.notify(gestureName);
      return true;
    } catch (err) {
      console.error("Failed to decode custom audio file:", err);
      return false;
    }
  }

  public async loadCustomAudioFromUrl(gestureName: string, url: string, name?: string): Promise<boolean> {
    const ctx = this.getContext();
    if (!ctx) return false;
    try {
      const res = await fetch(url);
      if (!res.ok) return false;
      const arrayBuf = await res.arrayBuffer();
      const audioBuf = await ctx.decodeAudioData(arrayBuf);
      this.customAudioBuffers.set(gestureName, audioBuf);
      this.customAudioNames.set(gestureName, name || url.split("/").pop() || "Custom Audio");
      return true;
    } catch {
      return false;
    }
  }

  public removeCustomAudio(gestureName: string) {
    this.customAudioBuffers.delete(gestureName);
    this.customAudioNames.delete(gestureName);
    this.notify(gestureName);
  }

  public hasCustomAudio(gestureName: string): boolean {
    return this.customAudioBuffers.has(gestureName);
  }

  public getCustomAudioName(gestureName: string): string | undefined {
    return this.customAudioNames.get(gestureName);
  }

  public getCustomSoundsMap(): Record<string, string> {
    const res: Record<string, string> = {};
    this.customAudioNames.forEach((val, key) => {
      res[key] = val;
    });
    return res;
  }

  public autoLoadPublicSounds() {
    const commonGestures = [
      "Gun", "Fist", "Pinch", "ThumbsUp", "ThumbsDown",
      "Peace", "RockOn", "Pointing", "OpenPalm", "OK", "CallMe", "Whoosh"
    ];
    commonGestures.forEach((g) => {
      this.loadCustomAudioFromUrl(g, `/sounds/${g}.mp3`, `${g}.mp3`).then((ok) => {
        if (!ok) {
          this.loadCustomAudioFromUrl(g, `/sounds/${g.toLowerCase()}.mp3`, `${g.toLowerCase()}.mp3`);
        }
      });
    });
  }

  private playBuffer(buf: AudioBuffer, ctx: AudioContext) {
    try {
      const source = ctx.createBufferSource();
      source.buffer = buf;
      source.connect(this.masterGain!);
      source.start();
    } catch (e) {
      console.error("Failed to play custom buffer:", e);
    }
  }

  // ==========================================
  // DISPATCHER: Plays sound for a hand gesture
  // ==========================================
  public playGestureSound(gestureName: string, force = false) {
    if (!this.enabled) return;

    // Minimum cooldown between rapid gesture changes (160ms) unless forced (e.g. preview button)
    const now = performance.now();
    if (!force && now - this.lastTriggerTime < 160) {
      return;
    }
    this.lastTriggerTime = now;

    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    this.notify(gestureName);

    // 1. If custom audio is loaded for this gesture, play it directly!
    if (this.customAudioBuffers.has(gestureName)) {
      this.playBuffer(this.customAudioBuffers.get(gestureName)!, ctx);
      return;
    }

    // 2. Otherwise fall back to procedural soundbanks
    switch (this.theme) {
      case "arcade":
        this.playArcadeGesture(gestureName, ctx);
        break;
      case "zen":
        this.playZenGesture(gestureName, ctx);
        break;
      case "mechanical":
        this.playMechanicalGesture(gestureName, ctx);
        break;
      case "scifi":
      default:
        this.playSciFiGesture(gestureName, ctx);
        break;
    }
  }

  // =========================================================================
  // 1. SCI-FI CYBERPUNK HUD SOUNDBANK (Futuristic Hologram / Lasers / Shields)
  // =========================================================================
  private playSciFiGesture(gesture: string, ctx: AudioContext) {
    const t = ctx.currentTime;

    switch (gesture) {
      // 🔫 Finger Gun: Sci-Fi Laser Blaster with resonant frequency drop
      case "Gun": {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(1400, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.16);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(4000, t);
        filter.frequency.exponentialRampToValueAtTime(300, t + 0.16);
        filter.Q.setValueAtTime(8, t);

        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(t);
        osc.stop(t + 0.18);
        break;
      }

      // ✊ Fist: Heavy Kinetic Impact / Hydraulic Lock with Sub Bass
      case "Fist": {
        // Sub thud
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(130, t);
        osc.frequency.exponentialRampToValueAtTime(35, t + 0.18);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(t);
        osc.stop(t + 0.22);

        // Noise snap
        this.playNoiseHit(t, 0.07, 0.12, 600);
        break;
      }

      // 🤏 Pinch: Tactile Magneto-Snap / Micro Click
      case "Pinch": {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(2400, t);
        osc.frequency.exponentialRampToValueAtTime(800, t + 0.04);
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(t);
        osc.stop(t + 0.05);

        this.playNoiseHit(t, 0.03, 0.1, 3000);
        break;
      }

      // 👍 Thumbs Up: Ascending Cyber Success Arpeggio
      case "ThumbsUp": {
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, t + idx * 0.05);
          gain.gain.setValueAtTime(0, t + idx * 0.05);
          gain.gain.linearRampToValueAtTime(0.15, t + idx * 0.05 + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.18);

          osc.connect(gain);
          gain.connect(this.masterGain!);
          osc.start(t + idx * 0.05);
          osc.stop(t + idx * 0.05 + 0.18);
        });
        break;
      }

      // 👎 Thumbs Down: Cybernetic Reject / Low Glitch Buzz
      case "ThumbsDown": {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(260, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.22);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(800, t);
        filter.frequency.linearRampToValueAtTime(200, t + 0.22);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(t);
        osc.stop(t + 0.25);
        break;
      }

      // ✌️ Peace / Victory: Sparkling Dual Harmonic Chime
      case "Peace": {
        [880, 1318.51].forEach((freq, i) => { // A5, E6
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, t + i * 0.04);
          gain.gain.setValueAtTime(0.14, t + i * 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.04 + 0.28);

          osc.connect(gain);
          gain.connect(this.masterGain!);
          osc.start(t + i * 0.04);
          osc.stop(t + i * 0.04 + 0.28);
        });
        break;
      }

      // 🤘 Rock On: Synth Overdrive Power Chord (Root + 5th + Octave)
      case "RockOn": {
        const chord = [220, 330, 440]; // A3, E4, A4
        chord.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.08, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

          const filter = ctx.createBiquadFilter();
          filter.type = "bandpass";
          filter.frequency.setValueAtTime(freq * 1.5, t);
          filter.Q.setValueAtTime(3, t);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.masterGain!);

          osc.start(t);
          osc.stop(t + 0.35);
        });
        break;
      }

      // ☝️ Pointing: Holographic Target Blip / Sonar Chirp
      case "Pointing": {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(987.77, t); // B5
        osc.frequency.exponentialRampToValueAtTime(1567.98, t + 0.06); // G6
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(t);
        osc.stop(t + 0.1);
        break;
      }

      // ✋ Open Palm: Energy Field Expansion / Harmonic Sweep
      case "OpenPalm": {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(380, t);
        osc.frequency.exponentialRampToValueAtTime(760, t + 0.15);
        gain.gain.setValueAtTime(0.02, t);
        gain.gain.linearRampToValueAtTime(0.14, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(t);
        osc.stop(t + 0.28);
        break;
      }

      // 👌 OK: Resonant Crystalline Ding
      case "OK": {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(1760, t); // A6
        gain.gain.setValueAtTime(0.16, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(t);
        osc.stop(t + 0.32);
        break;
      }

      // 🤙 Call Me / Shaka: Communicator Chirp
      case "CallMe": {
        [800, 1200].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, t + idx * 0.07);
          gain.gain.setValueAtTime(0.14, t + idx * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.07 + 0.12);

          osc.connect(gain);
          gain.connect(this.masterGain!);
          osc.start(t + idx * 0.07);
          osc.stop(t + idx * 0.07 + 0.12);
        });
        break;
      }

      // 🖕 Middle Finger: Censor Bleep / Warning Pulse
      case "MiddleFinger": {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(1000, t);
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.setValueAtTime(0.18, t + 0.26);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(t);
        osc.stop(t + 0.3);
        break;
      }

      default: {
        this.playDefaultBlip(ctx);
        break;
      }
    }
  }

  // =========================================================================
  // 2. ARCADE 8-BIT RETRO SOUNDBANK (Chiptune Square Waves & Retro SFX)
  // =========================================================================
  private playArcadeGesture(gesture: string, ctx: AudioContext) {
    const t = ctx.currentTime;

    switch (gesture) {
      case "Gun": {
        // Classic arcade laser (fast pitch drop on square wave)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(990, t);
        osc.frequency.exponentialRampToValueAtTime(110, t + 0.14);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(t);
        osc.stop(t + 0.15);
        break;
      }

      case "Fist": {
        // 8-bit hit impact
        this.playNoiseHit(t, 0.14, 0.22, 450);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(t);
        osc.stop(t + 0.16);
        break;
      }

      case "Pinch": {
        // 8-bit select blip
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(1320, t);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(t);
        osc.stop(t + 0.04);
        break;
      }

      case "ThumbsUp": {
        // 8-bit 1-Up / Coin Fanfare
        [659.25, 1318.51].forEach((freq, idx) => { // E5, E6
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "square";
          osc.frequency.setValueAtTime(freq, t + idx * 0.08);
          gain.gain.setValueAtTime(0.12, t + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.2);
          osc.connect(gain);
          gain.connect(this.masterGain!);
          osc.start(t + idx * 0.08);
          osc.stop(t + idx * 0.08 + 0.2);
        });
        break;
      }

      case "ThumbsDown": {
        // 8-bit defeat sound
        [220, 196, 174, 130].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(freq, t + idx * 0.06);
          gain.gain.setValueAtTime(0.12, t + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.09);
          osc.connect(gain);
          gain.connect(this.masterGain!);
          osc.start(t + idx * 0.06);
          osc.stop(t + idx * 0.06 + 0.09);
        });
        break;
      }

      case "Peace":
      case "OK": {
        // 8-bit item fanfare
        [587.33, 880, 1174.66].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "square";
          osc.frequency.setValueAtTime(freq, t + idx * 0.05);
          gain.gain.setValueAtTime(0.1, t + idx * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.12);
          osc.connect(gain);
          gain.connect(this.masterGain!);
          osc.start(t + idx * 0.05);
          osc.stop(t + idx * 0.05 + 0.12);
        });
        break;
      }

      default: {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(660, t);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(t);
        osc.stop(t + 0.06);
        break;
      }
    }
  }

  // =========================================================================
  // 3. ZEN SOUNDBANK (Singing Bowls, Crystal Bells, Wind Chimes)
  // =========================================================================
  private playZenGesture(gesture: string, ctx: AudioContext) {
    const t = ctx.currentTime;
    const baseFreqs: Record<string, number> = {
      Gun: 523.25,     // C5
      Fist: 196.00,    // G3 gong
      Pinch: 1046.50,  // C6 ting
      ThumbsUp: 659.25,// E5
      ThumbsDown: 220, // A3
      Peace: 880.00,   // A5
      RockOn: 440.00,  // A4
      Pointing: 783.99,// G5
      OpenPalm: 392.00,// G4
      OK: 1174.66,     // D6
      CallMe: 587.33,  // D5
    };

    const freq = baseFreqs[gesture] || 523.25;

    // Resonant singing bell with harmonic overtones
    [freq, freq * 1.5, freq * 2.02].forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, t);

      const amp = idx === 0 ? 0.18 : 0.07 / (idx + 1);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(amp, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.55);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 0.55);
    });
  }

  // =========================================================================
  // 4. MECHANICAL TACTILE SOUNDBANK (Mechanical Switch, Shutter, Latch)
  // =========================================================================
  private playMechanicalGesture(gesture: string, ctx: AudioContext) {
    const t = ctx.currentTime;

    switch (gesture) {
      case "Fist": {
        // Heavy Industrial Relay Latch
        this.playNoiseHit(t, 0.08, 0.25, 400);
        this.playToneClick(ctx, t, 120, 0.04);
        break;
      }
      case "Gun": {
        // Double Camera Shutter Click
        this.playNoiseHit(t, 0.025, 0.2, 2800);
        this.playNoiseHit(t + 0.06, 0.035, 0.22, 2200);
        break;
      }
      case "Pinch": {
        // Tactile Keyboard Blue Switch Clack
        this.playNoiseHit(t, 0.02, 0.22, 3500);
        this.playToneClick(ctx, t, 1600, 0.015);
        break;
      }
      default: {
        // Crisp Rotary Click
        this.playNoiseHit(t, 0.03, 0.15, 2000);
        this.playToneClick(ctx, t, 800, 0.02);
        break;
      }
    }
  }

  // =========================================================================
  // DYNAMIC ACTION: Fast Motion Air Whoosh (Triggered on fast hand swipes)
  // =========================================================================
  public playMotionWhoosh(intensity: number = 0.5) {
    if (!this.enabled) return;

    const now = performance.now();
    if (now - this.lastMotionTime < 280) return; // Prevent whoosh storm
    this.lastMotionTime = now;

    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    this.notify("Whoosh");

    // If custom audio is set for "Whoosh", play it directly!
    if (this.customAudioBuffers.has("Whoosh")) {
      this.playBuffer(this.customAudioBuffers.get("Whoosh")!, ctx);
      return;
    }

    if (!this.noiseBuffer) return;

    const t = ctx.currentTime;
    const dur = 0.18 + Math.min(0.12, intensity * 0.1);

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    const startFreq = 280 + intensity * 400;
    const peakFreq = 900 + intensity * 1200;
    filter.frequency.setValueAtTime(startFreq, t);
    filter.frequency.exponentialRampToValueAtTime(peakFreq, t + dur * 0.4);
    filter.frequency.exponentialRampToValueAtTime(startFreq * 0.8, t + dur);
    filter.Q.setValueAtTime(2.5, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(Math.min(0.24, 0.08 + intensity * 0.16), t + dur * 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noiseSource.start(t);
    noiseSource.stop(t + dur);
  }

  // Helper for quick noise hits (impacts/clicks)
  private playNoiseHit(t: number, duration: number, volume: number, filterFreq: number) {
    if (!this.ctx || !this.masterGain || !this.noiseBuffer) return;

    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(filterFreq, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    src.start(t);
    src.stop(t + duration);
  }

  // Helper for tactile click tone
  private playToneClick(ctx: AudioContext, t: number, freq: number, duration: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(t);
    osc.stop(t + duration);
  }

  private playDefaultBlip(ctx: AudioContext) {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(700, t);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(t);
    osc.stop(t + 0.08);
  }
}

export const soundEffects = new SoundEffectsEngine();

if (typeof window !== "undefined") {
  // Automatically check public/sounds/ for custom audio files on startup
  soundEffects.autoLoadPublicSounds();
}
