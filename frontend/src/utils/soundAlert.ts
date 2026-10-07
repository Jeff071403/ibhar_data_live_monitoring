/**
 * Emergency Alarm Sound Engine
 * Plays the official EmergencySound audio file in the background during active emergency alerts.
 */

import emergencyAudioUrl from '../assets/EmergencySound.wav';

class SoundAlertEngine {
  private audio: HTMLAudioElement | null = null;
  private isPlaying: boolean = false;
  private audioCtx: AudioContext | null = null;
  private fallbackTimerId: number | null = null;

  private initAudio() {
    if (!this.audio) {
      try {
        this.audio = new Audio(emergencyAudioUrl);
        this.audio.loop = true;
        this.audio.volume = 1.0;
        this.audio.preload = 'auto';
      } catch (e) {
        console.warn('Failed to initialize emergency audio element:', e);
      }
    }
  }

  private initContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  private playFallbackChime() {
    this.initContext();
    if (!this.audioCtx) return;
    try {
      const startTime = this.audioCtx.currentTime;
      const playTone = (freq: number, durationSec: number, delaySec: number = 0) => {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        const t = startTime + delaySec;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.exponentialRampToValueAtTime(0.3, t + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + durationSec);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t);
        osc.stop(t + durationSec + 0.05);
      };
      playTone(880, 0.15, 0);
      playTone(660, 0.15, 0.16);
      playTone(987, 0.25, 0.32);
    } catch {}
  }

  public startEmergencySiren() {
    if (this.isPlaying) return;
    this.isPlaying = true;

    this.initAudio();
    if (this.audio) {
      this.audio.currentTime = 0;
      this.audio.loop = true;
      const playPromise = this.audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Audio play restricted by browser policy; using fallback chime:', err);
          this.playFallbackChime();
          this.fallbackTimerId = window.setInterval(() => {
            if (this.isPlaying) {
              this.playFallbackChime();
            }
          }, 1800);
        });
      }
    } else {
      this.playFallbackChime();
    }
  }

  public stopEmergencySiren() {
    this.isPlaying = false;
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    if (this.fallbackTimerId) {
      clearInterval(this.fallbackTimerId);
      this.fallbackTimerId = null;
    }
  }
}

export const soundAlert = new SoundAlertEngine();
