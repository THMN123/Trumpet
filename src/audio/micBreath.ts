export interface MicBreathCallbacks {
  onLevel: (levelPct: number, thresholdPct: number, isBlowing: boolean) => void;
  onError: (message: string) => void;
}

class MicBreathDetector {
  private stream: MediaStream | null = null;
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private rafId = 0;
  private active = false;
  private sensitivity = 60; // 0..100
  private noiseFloorRms = 0.008;
  private smoothedRms = 0;
  private wasBlowing = false;
  private calibrationSamples: number[] = [];

  public setSensitivity(sensitivityPct: number) {
    this.sensitivity = Math.max(5, Math.min(100, sensitivityPct));
  }

  public recalibrate() {
    this.calibrationSamples = [];
  }

  private getEffectiveThreshold(): number {
    // Higher sensitivity lowers the delta above ambient noise floor
    const delta = 0.095 - (this.sensitivity / 100) * 0.082;
    return Math.min(0.14, Math.max(0.014, this.noiseFloorRms * 1.45 + delta));
  }

  public async start(callbacks: MicBreathCallbacks): Promise<boolean> {
    if (this.active) return true;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      callbacks.onError('Microphone access is not supported in this browser.');
      return false;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      const source = this.ctx.createMediaStreamSource(this.stream);

      // High-pass filter focuses on breath wind energy rather than low room rumble
      const hp = this.ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 220;

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;

      source.connect(hp);
      hp.connect(this.analyser);

      const data = new Uint8Array(this.analyser.fftSize);
      this.active = true;
      this.smoothedRms = 0;
      this.wasBlowing = false;
      this.noiseFloorRms = 0.008;
      this.calibrationSamples = [];

      const tick = () => {
        if (!this.active || !this.analyser) return;
        this.analyser.getByteTimeDomainData(data);

        let sumSq = 0;
        for (let i = 0; i < data.length; i++) {
          const centered = (data[i] - 128) / 128;
          sumSq += centered * centered;
        }
        const rms = Math.sqrt(sumSq / data.length);
        this.smoothedRms = this.smoothedRms * 0.6 + rms * 0.4;

        // First ~20 animation frames (~330ms) measure ambient room floor
        if (this.calibrationSamples.length < 20) {
          this.calibrationSamples.push(this.smoothedRms);
          if (this.calibrationSamples.length === 20) {
            const avg =
              this.calibrationSamples.reduce((a, b) => a + b, 0) / this.calibrationSamples.length;
            this.noiseFloorRms = Math.min(0.035, Math.max(0.004, avg));
          }
        }

        const onThresh = this.getEffectiveThreshold();
        const offThresh = onThresh * 0.7;
        const isBlowing = this.wasBlowing
          ? this.smoothedRms >= offThresh
          : this.smoothedRms >= onThresh;
        this.wasBlowing = isBlowing;

        const maxScale = 0.16;
        const levelPct = Math.min(100, Math.round((this.smoothedRms / maxScale) * 100));
        const thresholdPct = Math.min(95, Math.max(5, Math.round((onThresh / maxScale) * 100)));
        callbacks.onLevel(levelPct, thresholdPct, isBlowing);

        this.rafId = requestAnimationFrame(tick);
      };

      this.rafId = requestAnimationFrame(tick);
      return true;
    } catch (err) {
      const msg =
        err instanceof Error && err.name === 'NotAllowedError'
          ? 'Microphone permission was denied. Allow mic access or use the Touch Air Pad / Auto-Blow.'
          : 'Could not access microphone. Use the Touch Air Pad or Auto-Blow instead.';
      callbacks.onError(msg);
      this.stop();
      return false;
    }
  }

  public stop() {
    this.active = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
    this.analyser = null;
    this.wasBlowing = false;
    this.smoothedRms = 0;
    this.calibrationSamples = [];
  }
}

export const micBreath = new MicBreathDetector();
