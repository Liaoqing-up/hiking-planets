/**
 * v2.0 多星球专属治愈轻音乐合成引擎（Web Audio API）
 * 保持空灵绘本纯音乐统一美学，为扉页/星图及 6 颗星球定制独立调式、旋律乐句、音色泛音与自然风浪环境声
 */

const THEMES = {
  space: {
    tempoMs: 680,
    waveMain: "sine",
    waveSub: "triangle",
    harmonicRatio: 2,
    harmonicGain: 0.12,
    attack: 0.04,
    decay: 2.9,
    windFreq: 210,
    windVol: 0.045,
    // Cmaj7 空灵星辰音乐盒琶音
    melody: [261.63, 329.63, 392.0, 493.88, 523.25, 493.88, 392.0, 329.63, 293.66, 392.0, 440.0, 587.33],
    bass: [130.81, 130.81, 174.61, 174.61],
  },
  tengger: {
    // 腾格里：F大调温暖怀旧民谣泛音（致敬《张三的歌》温暖悠远的旅途感）
    tempoMs: 560,
    waveMain: "triangle",
    waveSub: "sine",
    harmonicRatio: 2,
    harmonicGain: 0.08,
    attack: 0.025,
    decay: 2.3,
    windFreq: 330,
    windVol: 0.085,
    melody: [349.23, 440.0, 523.25, 587.33, 523.25, 440.0, 392.0, 349.23, 293.66, 349.23, 440.0, 392.0],
    bass: [174.61, 146.83, 196.0, 130.81],
  },
  yading: {
    // 稻城亚丁：D高原五声空灵颂钵与悠长转山韵律
    tempoMs: 880,
    waveMain: "sine",
    waveSub: "sine",
    harmonicRatio: 3,
    harmonicGain: 0.07,
    attack: 0.08,
    decay: 3.8,
    windFreq: 480,
    windVol: 0.11,
    melody: [293.66, 329.63, 440.0, 493.88, 587.33, 493.88, 440.0, 329.63, 392.0, 440.0, 293.66, 246.94],
    bass: [146.83, 146.83, 110.0, 146.83],
  },
  zhagana: {
    // 扎尕那：G大调清澈繁星钢片琴与密林夜色
    tempoMs: 620,
    waveMain: "sine",
    waveSub: "triangle",
    harmonicRatio: 2,
    harmonicGain: 0.16,
    attack: 0.02,
    decay: 2.5,
    windFreq: 280,
    windVol: 0.07,
    melody: [392.0, 493.88, 587.33, 783.99, 659.25, 587.33, 493.88, 440.0, 392.0, 440.0, 493.88, 587.33],
    bass: [196.0, 164.81, 130.81, 146.83],
  },
  siguniang: {
    // 四姑娘山：A小调转C大调坚韧清冷钢琴夜曲（四年执念与破晓登顶）
    tempoMs: 640,
    waveMain: "triangle",
    waveSub: "sine",
    harmonicRatio: 2,
    harmonicGain: 0.11,
    attack: 0.03,
    decay: 2.8,
    windFreq: 410,
    windVol: 0.09,
    melody: [220.0, 329.63, 440.0, 523.25, 493.88, 440.0, 392.0, 523.25, 659.25, 587.33, 523.25, 440.0],
    bass: [110.0, 174.61, 130.81, 196.0],
  },
  maclehose: {
    // 麦理浩径：E大调轻快阳光海风竖琴拨弦 + 呼吸海浪声
    tempoMs: 490,
    waveMain: "triangle",
    waveSub: "sine",
    harmonicRatio: 2,
    harmonicGain: 0.14,
    attack: 0.018,
    decay: 2.0,
    windFreq: 390,
    windVol: 0.11,
    seaWave: true,
    melody: [329.63, 415.3, 493.88, 659.25, 622.25, 493.88, 415.3, 493.88, 554.37, 659.25, 493.88, 415.3],
    bass: [164.81, 207.65, 220.0, 246.94],
  },
  yili: {
    // 新疆伊犁：Bb大调辽阔冬牧场泛音与皎洁明月长线
    tempoMs: 720,
    waveMain: "sine",
    waveSub: "triangle",
    harmonicRatio: 1.5,
    harmonicGain: 0.09,
    attack: 0.055,
    decay: 3.3,
    windFreq: 250,
    windVol: 0.065,
    melody: [233.08, 293.66, 349.23, 466.16, 523.25, 466.16, 392.0, 349.23, 293.66, 349.23, 466.16, 392.0],
    bass: [116.54, 174.61, 146.83, 155.56],
  },
};

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.initialized = false;
    this.masterGain = null;
    this.reverbDelay = null;
    this.windFilter = null;
    this.windGain = null;
    this.waveLfo = null;
    this.waveLfoGain = null;
    this.currentThemeKey = "space";
    this.stepIndex = 0;
    this.melodyTimer = null;
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

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.enabled ? 1.0 : 0.0;
    this.masterGain.connect(this.ctx.destination);

    // 温暖柔和的空间回声延迟网络（让轻音乐如星空般空灵顺滑）
    const delay = this.ctx.createDelay(1.0);
    delay.delayTime.value = 0.36;
    const fb = this.ctx.createGain();
    fb.gain.value = 0.32;
    const damp = this.ctx.createBiquadFilter();
    damp.type = "lowpass";
    damp.frequency.value = 1800;

    delay.connect(damp);
    damp.connect(fb);
    fb.connect(delay);
    damp.connect(this.masterGain);
    this.reverbInput = delay;

    // 粉红噪声环境风/海浪层
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
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.038;
      b6 = white * 0.115926;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = "lowpass";
    this.windFilter.frequency.value = 220;
    this.windFilter.Q.value = 1.4;

    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0.05;

    // 海浪慢速呼吸 LFO（仅麦理浩径激活）
    this.waveLfo = this.ctx.createOscillator();
    this.waveLfo.frequency.value = 0.14;
    this.waveLfoGain = this.ctx.createGain();
    this.waveLfoGain.gain.value = 0;
    this.waveLfo.connect(this.waveLfoGain);
    this.waveLfoGain.connect(this.windGain.gain);
    this.waveLfo.start();

    noise.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);
    noise.start();

    this.startThemeSequencer();
  }

  toggle() {
    this.enabled = !this.enabled;
    if (!this.initialized && this.enabled) {
      this.init();
    }
    if (this.ctx && this.masterGain) {
      if (this.enabled) {
        this.ctx.resume();
        this.masterGain.gain.setTargetAtTime(1.0, this.ctx.currentTime, 0.25);
      } else {
        this.masterGain.gain.setTargetAtTime(0.0, this.ctx.currentTime, 0.15);
      }
    }
    return this.enabled;
  }

  setPlanetBGM(planetId = "space") {
    const nextKey = THEMES[planetId] ? planetId : "space";
    if (this.currentThemeKey !== nextKey) {
      this.currentThemeKey = nextKey;
      this.stepIndex = 0;
    }
    if (!this.initialized || !this.ctx) return;
    const theme = THEMES[this.currentThemeKey];
    const now = this.ctx.currentTime;
    this.windFilter.frequency.setTargetAtTime(theme.windFreq, now, 0.9);
    this.windGain.gain.setTargetAtTime(theme.windVol, now, 0.9);
    this.waveLfoGain.gain.setTargetAtTime(theme.seaWave ? 0.055 : 0, now, 0.9);
  }

  // 兼容旧调用接口
  setAtmosphere(mode = "space") {
    if (mode === "space") this.setPlanetBGM("space");
  }

  playTone(freq, {
    duration = 2.5,
    volume = 0.042,
    delay = 0,
    waveMain = "sine",
    waveSub = "triangle",
    harmonicRatio = 2,
    harmonicGain = 0.12,
    attack = 0.035,
  } = {}) {
    if (!this.initialized || !this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime + delay;

    const osc = this.ctx.createOscillator();
    const oscSub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    const env = this.ctx.createGain();
    const toneFilter = this.ctx.createBiquadFilter();

    osc.type = waveMain;
    osc.frequency.setValueAtTime(freq, t);

    oscSub.type = waveSub;
    oscSub.frequency.setValueAtTime(freq * harmonicRatio, t);
    subGain.gain.setValueAtTime(harmonicGain, t);

    toneFilter.type = "lowpass";
    toneFilter.frequency.setValueAtTime(2400, t);

    env.gain.setValueAtTime(0.0001, t);
    env.gain.linearRampToValueAtTime(volume, t + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    osc.connect(toneFilter);
    oscSub.connect(subGain);
    subGain.connect(toneFilter);
    toneFilter.connect(env);

    env.connect(this.masterGain);
    if (this.reverbInput) env.connect(this.reverbInput);

    osc.start(t);
    oscSub.start(t);
    osc.stop(t + duration + 0.06);
    oscSub.stop(t + duration + 0.06);
  }

  startThemeSequencer() {
    const tick = () => {
      const theme = THEMES[this.currentThemeKey] || THEMES.space;
      if (this.enabled && this.ctx && this.ctx.state === "running") {
        const idx = this.stepIndex % theme.melody.length;
        // 偶发留白呼吸一拍，让轻音乐自然不机械
        const shouldRest = idx % 6 === 5 && Math.random() > 0.55;
        if (!shouldRest) {
          const freq = theme.melody[idx];
          this.playTone(freq, {
            duration: theme.decay,
            volume: 0.034,
            waveMain: theme.waveMain,
            waveSub: theme.waveSub,
            harmonicRatio: theme.harmonicRatio,
            harmonicGain: theme.harmonicGain,
            attack: theme.attack,
          });
        }
        // 每 3 拍铺垫一颗柔和温暖的根音低音衬底
        if (idx % 3 === 0 && theme.bass) {
          const bFreq = theme.bass[Math.floor(idx / 3) % theme.bass.length];
          this.playTone(bFreq, {
            duration: theme.decay * 1.35,
            volume: 0.024,
            waveMain: "sine",
            waveSub: "sine",
            harmonicRatio: 2,
            harmonicGain: 0.05,
            attack: 0.09,
          });
        }
        this.stepIndex++;
      }
      const jitter = (Math.random() - 0.5) * 70;
      this.melodyTimer = setTimeout(tick, Math.max(360, theme.tempoMs + jitter));
    };
    this.melodyTimer = setTimeout(tick, 600);
  }

  playHover() {
    this.playTone(587.33, { duration: 0.55, volume: 0.022, attack: 0.015 });
  }

  playSelectPlanet() {
    [392.0, 493.88, 587.33, 783.99].forEach((f, idx) => {
      this.playTone(f, { duration: 1.9, volume: 0.036, delay: idx * 0.08 });
    });
  }

  playDiscoverWaypoint(allComplete = false) {
    const chord = allComplete
      ? [261.63, 329.63, 392.0, 493.88, 587.33, 783.99, 1046.5]
      : [329.63, 392.0, 493.88, 659.25, 783.99];
    chord.forEach((f, idx) => {
      this.playTone(f, { duration: 2.6, volume: 0.048, delay: idx * 0.09 });
    });
  }

  playStep(surface = "earth") {
    if (!this.initialized || !this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    const baseFreq = surface === "snow" ? 210 : surface === "sand" ? 135 : 165;
    osc.frequency.setValueAtTime(baseFreq + Math.random() * 32, t);
    osc.frequency.exponentialRampToValueAtTime(52, t + 0.065);

    gain.gain.setValueAtTime(0.016, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.08);
  }
}

export const sound = new SoundEngine();
