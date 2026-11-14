export function playUiSound(type: 'success' | 'match' | 'nope' | 'spin', enabled: boolean) {
  if (!enabled) return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'success' || type === 'match') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.09);
      osc.frequency.setValueAtTime(783.99, now + 0.18);
      osc.frequency.setValueAtTime(1046.5, now + 0.27);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
      osc.start(now);
      osc.stop(now + 0.48);
    } else if (type === 'nope') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.14);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'spin') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(620, now + 0.14);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    }
    setTimeout(() => {
      try {
        ctx.close();
      } catch {
        // ignore
      }
    }, 650);
  } catch {
    // ignore Web Audio block errors
  }
}

export class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private sourceNodes: Array<{ stop?: () => void; disconnect?: () => void }> = [];
  private intervalId: number | null = null;

  stop() {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.sourceNodes.forEach((n) => {
      try {
        n.stop?.();
        n.disconnect?.();
      } catch {
        // ignore
      }
    });
    this.sourceNodes = [];
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch {
        // ignore
      }
      this.ctx = null;
    }
    this.gainNode = null;
  }

  setVolume(volume: number, muted: boolean) {
    if (!this.gainNode || !this.ctx) return;
    const target = muted ? 0.0001 : Math.max(0.0001, (volume / 100) * 0.45);
    this.gainNode.gain.setValueAtTime(target, this.ctx.currentTime);
  }

  start(trackId: string, volume: number, muted: boolean) {
    this.stop();
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      this.gainNode = this.ctx.createGain();
      this.setVolume(volume, muted);
      this.gainNode.connect(this.ctx.destination);

      const bufferSize = this.ctx.sampleRate * 3;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      if (trackId === 'branco') {
        for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
      } else if (['rosa', 'chuva', 'natureza', 'floresta'].includes(trackId)) {
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
          b6 = white * 0.115926;
        }
      } else {
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = output[i];
          output[i] *= 2.5;
        }
      }

      if (['branco', 'rosa', 'marrom', 'chuva', 'natureza', 'ondas', 'floresta'].includes(trackId)) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value =
          trackId === 'chuva' ? 950 : trackId === 'natureza' ? 650 : trackId === 'ondas' ? 420 : 1600;

        noise.connect(filter);
        filter.connect(this.gainNode);
        noise.start(0);
        this.sourceNodes.push(noise);

        if (trackId === 'ondas') {
          const lfo = this.ctx.createOscillator();
          const lfoGain = this.ctx.createGain();
          lfo.frequency.value = 0.12;
          lfoGain.gain.value = 300;
          lfo.connect(lfoGain);
          lfoGain.connect(filter.frequency);
          lfo.start();
          this.sourceNodes.push(lfo);
        }

        if (trackId === 'floresta') {
          this.intervalId = window.setInterval(() => {
            if (!this.ctx || !this.gainNode) return;
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            const now = this.ctx.currentTime;
            osc.frequency.setValueAtTime(1600 + Math.random() * 600, now);
            osc.frequency.exponentialRampToValueAtTime(2200 + Math.random() * 400, now + 0.12);
            g.gain.setValueAtTime(0.02, now);
            g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
            osc.connect(g);
            g.connect(this.gainNode);
            osc.start(now);
            osc.stop(now + 0.19);
          }, 2400);
        }
      } else {
        const chords =
          trackId === 'meditacao'
            ? [
                [216, 324, 432],
                [264, 396, 528],
              ]
            : [
                [261.63, 329.63, 392.0],
                [220.0, 261.63, 329.63],
                [174.61, 220.0, 261.63],
              ];
        let chordIdx = 0;

        const playChord = () => {
          if (!this.ctx || !this.gainNode) return;
          const freqs = chords[chordIdx % chords.length];
          chordIdx += 1;
          const now = this.ctx.currentTime;
          freqs.forEach((f) => {
            if (!this.ctx || !this.gainNode) return;
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = trackId === 'piano' ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(f, now);
            g.gain.setValueAtTime(0.001, now);
            g.gain.linearRampToValueAtTime(0.08, now + 0.4);
            g.gain.exponentialRampToValueAtTime(0.0008, now + 3.2);
            osc.connect(g);
            g.connect(this.gainNode);
            osc.start(now);
            osc.stop(now + 3.3);
          });
        };
        playChord();
        this.intervalId = window.setInterval(playChord, 3400);
      }
    } catch {
      // ignore
    }
  }
}
