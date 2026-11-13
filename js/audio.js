/**
 * 纯 Web Audio API 程序化绘本氛围音效与星辰音乐盒
 * 零外部音频文件依赖，支持风声质感切换、脚步声、星图切换与路标共鸣和弦
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.windGain = null;
    this.windFilter = null;
    this.melodyTimer = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === "suspended" && this.enabled) {
        this.ctx.resume();
      }
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.initialized = true;

    // 创建柔和自然风声（粉红噪声 + 低通滤波）
    const bufferSize = this.ctx.sampleRate * 3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = "lowpass";
    this.windFilter.frequency.value = 280;
    this.windFilter.Q.value = 1.6;

    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0.08;

    noise.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.ctx.destination);
    noise.start();

    this.startAmbientCelesta();
  }

  toggle() {
    this.enabled = !this.enabled;
    if (!this.initialized && this.enabled) {
      this.init();
    }
    if (this.ctx) {
      if (this.enabled) {
        this.ctx.resume();
        if (this.windGain) this.windGain.gain.setTargetAtTime(0.08, this.ctx.currentTime, 0.3);
      } else {
        if (this.windGain) this.windGain.gain.setTargetAtTime(0.0, this.ctx.currentTime, 0.15);
      }
    }
    return this.enabled;
  }

  setAtmosphere(mode = "space") {
    if (!this.initialized || !this.enabled || !this.windFilter || !this.windGain) return;
    const now = this.ctx.currentTime;
    if (mode === "space") {
      this.windFilter.frequency.setTargetAtTime(220, now, 0.8);
      this.windGain.gain.setTargetAtTime(0.05, now, 0.8);
    } else if (mode === "snow" || mode === "pass") {
      this.windFilter.frequency.setTargetAtTime(520, now, 0.8);
      this.windGain.gain.setTargetAtTime(0.14, now, 0.8);
    } else if (mode === "seafoam") {
      this.windFilter.frequency.setTargetAtTime(380, now, 0.8);
      this.windGain.gain.setTargetAtTime(0.12, now, 0.8);
    } else {
      this.windFilter.frequency.setTargetAtTime(310, now, 0.8);
      this.windGain.gain.setTargetAtTime(0.09, now, 0.8);
    }
  }

  playNote(freq, duration = 2.4, volume = 0.055, delay = 0) {
    if (!this.initialized || !this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t);

    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(freq * 2, t);

    const g2 = this.ctx.createGain();
    g2.gain.setValueAtTime(0.12, t);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    osc.connect(gain);
    osc2.connect(g2);
    g2.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc2.start(t);
    osc.stop(t + duration + 0.05);
    osc2.stop(t + duration + 0.05);
  }

  startAmbientCelesta() {
    // 温柔稀疏的小王子风五声/大七和弦星光单音
    const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 493.88, 523.25, 587.33, 659.25, 783.99];
    const scheduleNext = () => {
      if (this.enabled && this.ctx && this.ctx.state === "running") {
        const f = scale[Math.floor(Math.random() * scale.length)];
        this.playNote(f, 3.2, 0.028, 0);
        if (Math.random() > 0.55) {
          const f2 = scale[Math.floor(Math.random() * scale.length)];
          this.playNote(f2, 2.8, 0.018, 0.45);
        }
      }
      const nextMs = 2600 + Math.random() * 3200;
      this.melodyTimer = setTimeout(scheduleNext, nextMs);
    };
    this.melodyTimer = setTimeout(scheduleNext, 1200);
  }

  playHover() {
    this.playNote(587.33, 0.5, 0.022, 0);
  }

  playSelectPlanet() {
    [392.0, 493.88, 587.33, 783.99].forEach((f, idx) => {
      this.playNote(f, 1.8, 0.04, idx * 0.08);
    });
  }

  playDiscoverWaypoint(allComplete = false) {
    const chord = allComplete
      ? [261.63, 329.63, 392.0, 493.88, 587.33, 783.99, 1046.5]
      : [329.63, 392.0, 493.88, 659.25, 783.99];
    chord.forEach((f, idx) => {
      this.playNote(f, 2.6, 0.052, idx * 0.09);
    });
  }

  playStep(surface = "earth") {
    if (!this.initialized || !this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    const baseFreq = surface === "snow" ? 210 : surface === "sand" ? 135 : 165;
    osc.frequency.setValueAtTime(baseFreq + Math.random() * 35, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.065);

    gain.gain.setValueAtTime(0.018, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.08);
  }
}

export const sound = new SoundEngine();
