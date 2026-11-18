import { MuteType } from '../music/trumpetPhysics';

function makeBrassSaturationCurve(amount = 18): Float32Array<ArrayBuffer> {
  const samples = 2048;
  const buffer = new ArrayBuffer(samples * 4);
  const curve = new Float32Array(buffer);
  const k = amount;
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((1 + k * 0.08) * x) / (1 + k * 0.08 * Math.abs(x));
  }
  return curve;
}

class TrumpetAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;

  private oscSaw: OscillatorNode | null = null;
  private oscBody: OscillatorNode | null = null;
  private oscSub: OscillatorNode | null = null;

  private bodyGain: GainNode | null = null;
  private subGain: GainNode | null = null;
  private shaper: WaveShaperNode | null = null;
  private airLowpass: BiquadFilterNode | null = null;
  private bellFormant: BiquadFilterNode | null = null;
  private muteFilterA: BiquadFilterNode | null = null;
  private muteFilterB: BiquadFilterNode | null = null;
  private envGain: GainNode | null = null;
  private masterGain: GainNode | null = null;

  private vibratoLfo: OscillatorNode | null = null;
  private vibratoGain: GainNode | null = null;

  private analyser: AnalyserNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private currentMasterVolume = 0.72;

  public ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.setupGraph(this.ctx);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private setupGraph(ctx: AudioContext) {
    // Master & Analyser
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = this.currentMasterVolume;

    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.78;

    // Subtle studio room delay network
    const dryGain = ctx.createGain();
    dryGain.gain.value = 0.88;

    const wetGain = ctx.createGain();
    wetGain.gain.value = 0.16;

    const delayL = ctx.createDelay();
    delayL.delayTime.value = 0.029;
    const delayR = ctx.createDelay();
    delayR.delayTime.value = 0.047;
    const wetFilter = ctx.createBiquadFilter();
    wetFilter.type = 'lowpass';
    wetFilter.frequency.value = 2400;

    // Envelope & Tone Chain
    this.envGain = ctx.createGain();
    this.envGain.gain.value = 0;

    this.shaper = ctx.createWaveShaper();
    this.shaper.curve = makeBrassSaturationCurve(14);
    this.shaper.oversample = '2x';

    this.airLowpass = ctx.createBiquadFilter();
    this.airLowpass.type = 'lowpass';
    this.airLowpass.frequency.value = 2200;
    this.airLowpass.Q.value = 1.4;

    this.bellFormant = ctx.createBiquadFilter();
    this.bellFormant.type = 'peaking';
    this.bellFormant.frequency.value = 1320;
    this.bellFormant.Q.value = 2.0;
    this.bellFormant.gain.value = 4.5;

    this.muteFilterA = ctx.createBiquadFilter();
    this.muteFilterB = ctx.createBiquadFilter();
    this.applyMuteFilterParams('open', ctx.currentTime);

    // Connect chain
    this.shaper.connect(this.airLowpass);
    this.airLowpass.connect(this.bellFormant);
    this.bellFormant.connect(this.muteFilterA);
    this.muteFilterA.connect(this.muteFilterB);
    this.muteFilterB.connect(this.envGain);

    this.envGain.connect(dryGain);
    this.envGain.connect(delayL);
    delayL.connect(delayR);
    delayR.connect(wetFilter);
    wetFilter.connect(wetGain);

    dryGain.connect(this.masterGain);
    wetGain.connect(this.masterGain);

    this.masterGain.connect(this.analyser);
    this.analyser.connect(ctx.destination);

    // Oscillators (kept running smoothly for zero-click brass slurs)
    this.oscSaw = ctx.createOscillator();
    this.oscSaw.type = 'sawtooth';
    this.oscSaw.frequency.value = 233.08;

    this.oscBody = ctx.createOscillator();
    this.oscBody.type = 'triangle';
    this.oscBody.frequency.value = 233.08;
    this.oscBody.detune.value = 1.2;

    this.oscSub = ctx.createOscillator();
    this.oscSub.type = 'sine';
    this.oscSub.frequency.value = 233.08;

    const sawGain = ctx.createGain();
    sawGain.gain.value = 0.65;

    this.bodyGain = ctx.createGain();
    this.bodyGain.gain.value = 0.35;

    this.subGain = ctx.createGain();
    this.subGain.gain.value = 0.22;

    this.oscSaw.connect(sawGain);
    this.oscBody.connect(this.bodyGain);
    this.oscSub.connect(this.subGain);

    sawGain.connect(this.shaper);
    this.bodyGain.connect(this.shaper);
    this.subGain.connect(this.shaper);

    // Vibrato LFO
    this.vibratoLfo = ctx.createOscillator();
    this.vibratoLfo.type = 'sine';
    this.vibratoLfo.frequency.value = 5.4;

    this.vibratoGain = ctx.createGain();
    this.vibratoGain.gain.value = 0;

    this.vibratoLfo.connect(this.vibratoGain);
    this.vibratoGain.connect(this.oscSaw.detune);
    this.vibratoGain.connect(this.oscBody.detune);
    this.vibratoGain.connect(this.oscSub.detune);

    this.oscSaw.start();
    this.oscBody.start();
    this.oscSub.start();
    this.vibratoLfo.start();

    // Pre-generate 0.5s white noise buffer for tonguing/breath puffs
    const len = Math.floor(ctx.sampleRate * 0.5);
    this.noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }

  private applyMuteFilterParams(mute: MuteType, now: number) {
    if (!this.muteFilterA || !this.muteFilterB) return;

    if (mute === 'open') {
      this.muteFilterA.type = 'lowshelf';
      this.muteFilterA.frequency.setTargetAtTime(240, now, 0.02);
      this.muteFilterA.gain.setTargetAtTime(2.5, now, 0.02);

      this.muteFilterB.type = 'peaking';
      this.muteFilterB.frequency.setTargetAtTime(2200, now, 0.02);
      this.muteFilterB.Q.setTargetAtTime(1.0, now, 0.02);
      this.muteFilterB.gain.setTargetAtTime(1.5, now, 0.02);
    } else if (mute === 'straight') {
      this.muteFilterA.type = 'highpass';
      this.muteFilterA.frequency.setTargetAtTime(620, now, 0.02);
      this.muteFilterA.Q.setTargetAtTime(0.9, now, 0.02);

      this.muteFilterB.type = 'peaking';
      this.muteFilterB.frequency.setTargetAtTime(2350, now, 0.02);
      this.muteFilterB.Q.setTargetAtTime(2.8, now, 0.02);
      this.muteFilterB.gain.setTargetAtTime(8.5, now, 0.02);
    } else if (mute === 'cup') {
      this.muteFilterA.type = 'lowpass';
      this.muteFilterA.frequency.setTargetAtTime(1400, now, 0.02);
      this.muteFilterA.Q.setTargetAtTime(1.2, now, 0.02);

      this.muteFilterB.type = 'peaking';
      this.muteFilterB.frequency.setTargetAtTime(680, now, 0.02);
      this.muteFilterB.Q.setTargetAtTime(2.1, now, 0.02);
      this.muteFilterB.gain.setTargetAtTime(5.0, now, 0.02);
    } else if (mute === 'harmon') {
      this.muteFilterA.type = 'bandpass';
      this.muteFilterA.frequency.setTargetAtTime(1750, now, 0.02);
      this.muteFilterA.Q.setTargetAtTime(2.4, now, 0.02);

      this.muteFilterB.type = 'peaking';
      this.muteFilterB.frequency.setTargetAtTime(2900, now, 0.02);
      this.muteFilterB.Q.setTargetAtTime(3.2, now, 0.02);
      this.muteFilterB.gain.setTargetAtTime(7.5, now, 0.02);
    }
  }

  private triggerTongueBreath(ctx: AudioContext, pressurePct: number) {
    if (!this.noiseBuffer || !this.envGain) return;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1100 + pressurePct * 14;
    bp.Q.value = 1.6;

    const g = ctx.createGain();
    const peak = 0.04 + (pressurePct / 100) * 0.07;
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(peak, now + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0005, now + 0.055);

    src.connect(bp);
    bp.connect(g);
    g.connect(this.masterGain!);
    src.start(now);
    src.stop(now + 0.065);
  }

  public triggerValveClick() {
    if (!this.ctx || this.ctx.state !== 'running' || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(165, now);
    osc.frequency.exponentialRampToValueAtTime(68, now + 0.022);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.045, now);
    g.gain.exponentialRampToValueAtTime(0.0008, now + 0.025);

    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.03);
  }

  public triggerMetronomeClick(isDownbeat: boolean) {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isDownbeat ? 1280 : 880, now);
    osc.frequency.exponentialRampToValueAtTime(isDownbeat ? 640 : 440, now + 0.025);

    const g = ctx.createGain();
    g.gain.setValueAtTime(isDownbeat ? 0.16 : 0.095, now);
    g.gain.exponentialRampToValueAtTime(0.0005, now + 0.045);

    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  public setVolume(vol: number) {
    this.currentMasterVolume = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.currentMasterVolume, this.ctx.currentTime, 0.02);
    }
  }

  public startNote(params: {
    freqHz: number;
    airPressure: number;
    mute: MuteType;
    vibratoCents: number;
  }) {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;
    const { freqHz, airPressure, mute, vibratoCents } = params;

    if (!this.oscSaw || !this.oscBody || !this.oscSub || !this.airLowpass || !this.envGain || !this.vibratoGain) {
      return;
    }

    // Subtle initial lip-buzz pitch settle (starts ~15 cents flat for 22ms)
    this.oscSaw.frequency.cancelScheduledValues(now);
    this.oscBody.frequency.cancelScheduledValues(now);
    this.oscSub.frequency.cancelScheduledValues(now);

    this.oscSaw.frequency.setValueAtTime(freqHz * 0.991, now);
    this.oscSaw.frequency.exponentialRampToValueAtTime(freqHz, now + 0.024);

    this.oscBody.frequency.setValueAtTime(freqHz * 0.991, now);
    this.oscBody.frequency.exponentialRampToValueAtTime(freqHz, now + 0.024);

    this.oscSub.frequency.setValueAtTime(freqHz * 0.991, now);
    this.oscSub.frequency.exponentialRampToValueAtTime(freqHz, now + 0.024);

    this.applyMuteFilterParams(mute, now);

    // Brightness scales with air pressure + crisp brass attack flare
    const baseCutoff = 900 + (airPressure / 100) * 2900;
    this.airLowpass.frequency.cancelScheduledValues(now);
    this.airLowpass.frequency.setValueAtTime(baseCutoff * 0.65, now);
    this.airLowpass.frequency.linearRampToValueAtTime(baseCutoff * 1.45, now + 0.038);
    this.airLowpass.frequency.setTargetAtTime(baseCutoff, now + 0.045, 0.08);

    // Amplitude envelope
    const targetAmp = 0.28 + (airPressure / 100) * 0.24;
    this.envGain.gain.cancelScheduledValues(now);
    this.envGain.gain.setValueAtTime(Math.max(0.001, this.envGain.gain.value), now);
    this.envGain.gain.linearRampToValueAtTime(targetAmp * 1.12, now + 0.028);
    this.envGain.gain.setTargetAtTime(targetAmp, now + 0.035, 0.06);

    // Vibrato swells in slightly after attack
    this.vibratoGain.gain.cancelScheduledValues(now);
    this.vibratoGain.gain.setValueAtTime(0, now);
    this.vibratoGain.gain.setTargetAtTime(vibratoCents, now + 0.16, 0.14);

    this.triggerTongueBreath(ctx, airPressure);
    this.isPlaying = true;
  }

  public updateNote(params: {
    freqHz: number;
    airPressure: number;
    mute: MuteType;
    vibratoCents: number;
    slurTimeSec?: number;
  }) {
    if (!this.ctx || !this.isPlaying) return;
    const now = this.ctx.currentTime;
    const { freqHz, airPressure, mute, vibratoCents, slurTimeSec = 0.016 } = params;

    if (this.oscSaw && this.oscBody && this.oscSub) {
      this.oscSaw.frequency.setTargetAtTime(freqHz, now, slurTimeSec);
      this.oscBody.frequency.setTargetAtTime(freqHz, now, slurTimeSec);
      this.oscSub.frequency.setTargetAtTime(freqHz, now, slurTimeSec);
    }

    if (this.airLowpass) {
      const baseCutoff = 900 + (airPressure / 100) * 2900;
      this.airLowpass.frequency.setTargetAtTime(baseCutoff, now, 0.03);
    }

    if (this.envGain) {
      const targetAmp = 0.28 + (airPressure / 100) * 0.24;
      this.envGain.gain.setTargetAtTime(targetAmp, now, 0.03);
    }

    if (this.vibratoGain) {
      this.vibratoGain.gain.setTargetAtTime(vibratoCents, now, 0.05);
    }

    this.applyMuteFilterParams(mute, now);
  }

  public stopNote() {
    if (!this.ctx || !this.envGain) return;
    const now = this.ctx.currentTime;
    this.envGain.gain.cancelScheduledValues(now);
    this.envGain.gain.setValueAtTime(this.envGain.gain.value, now);
    this.envGain.gain.setTargetAtTime(0.0001, now, 0.035);
    this.isPlaying = false;
  }

  public getTimeDomainData(target: Uint8Array<ArrayBuffer>): boolean {
    if (!this.analyser) return false;
    this.analyser.getByteTimeDomainData(target);
    return true;
  }

  public getContextState(): AudioContextState | 'uninitialized' {
    return this.ctx ? this.ctx.state : 'uninitialized';
  }
}

export const trumpetAudio = new TrumpetAudioEngine();
