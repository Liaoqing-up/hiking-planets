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
  "kitty-xiaowutai": {
    // 小五台·那座山：Cadd9 明朗温暖原木吉他分解琶音与太行草甸夏风
    tempoMs: 520,
    waveMain: "triangle",
    waveSub: "sine",
    harmonicRatio: 2,
    harmonicGain: 0.11,
    attack: 0.018,
    decay: 2.15,
    windFreq: 310,
    windVol: 0.068,
    melody: [261.63, 329.63, 392.0, 587.33, 523.25, 392.0, 329.63, 440.0, 493.88, 523.25, 659.25, 587.33],
    bass: [130.81, 164.81, 174.61, 196.0],
  },
  "kitty-sunset": {
    // 银河与日落八分钟：Eb大调空灵水晶八音盒慢拍（落日紫金余晖与旋转风车）
    tempoMs: 740,
    waveMain: "sine",
    waveSub: "triangle",
    harmonicRatio: 2,
    harmonicGain: 0.21,
    attack: 0.014,
    decay: 3.1,
    windFreq: 225,
    windVol: 0.05,
    melody: [311.13, 392.0, 466.16, 622.25, 587.33, 466.16, 392.0, 523.25, 466.16, 392.0, 349.23, 311.13],
    bass: [155.56, 116.54, 130.81, 103.83],
  },
  "kitty-changbai": {
    // 长白山天池：A大调澄澈冰晶风铃与林海鹿鸣泛音
    tempoMs: 650,
    waveMain: "sine",
    waveSub: "sine",
    harmonicRatio: 3,
    harmonicGain: 0.13,
    attack: 0.022,
    decay: 2.85,
    windFreq: 360,
    windVol: 0.075,
    melody: [440.0, 554.37, 659.25, 880.0, 739.99, 659.25, 554.37, 493.88, 440.0, 554.37, 659.25, 493.88],
    bass: [110.0, 146.83, 164.81, 138.59],
  },
  "kitty-daqing": {
    // 大青山云端营地：Ab大调静谧云海竖琴泛音
    tempoMs: 700,
    waveMain: "triangle",
    waveSub: "sine",
    harmonicRatio: 1.5,
    harmonicGain: 0.1,
    attack: 0.045,
    decay: 3.2,
    windFreq: 260,
    windVol: 0.06,
    melody: [207.65, 261.63, 311.13, 415.3, 466.16, 415.3, 311.13, 261.63, 277.18, 349.23, 415.3, 311.13],
    bass: [103.83, 130.81, 138.59, 155.56],
  },
  "miemie-guizhou": {
    // 贵州安顺喀斯特魔界：Fmaj9 塞尔达旷野竖琴与地心水琴泛音
    tempoMs: 620,
    waveMain: "sine",
    waveSub: "triangle",
    harmonicRatio: 2,
    harmonicGain: 0.17,
    attack: 0.016,
    decay: 2.85,
    windFreq: 280,
    windVol: 0.064,
    melody: [349.23, 440.0, 523.25, 659.25, 783.99, 659.25, 523.25, 587.33, 523.25, 440.0, 392.0, 349.23],
    bass: [174.61, 130.81, 146.83, 196.0],
  },
  "miemie-volcano": {
    // 乌兰哈达与大红山：D小调星际深空合成弦与火山朔漠低风
    tempoMs: 660,
    waveMain: "sine",
    waveSub: "triangle",
    harmonicRatio: 3,
    harmonicGain: 0.16,
    attack: 0.024,
    decay: 3.05,
    windFreq: 210,
    windVol: 0.072,
    melody: [293.66, 349.23, 440.0, 523.25, 587.33, 523.25, 440.0, 392.0, 349.23, 440.0, 659.25, 587.33],
    bass: [146.83, 116.54, 130.81, 110.0],
  },
  "miemie-hulunbuir": {
    // 呼伦贝尔与阿尔山：G大调五声马头琴悠扬长音与草原暖风
    tempoMs: 540,
    waveMain: "triangle",
    waveSub: "sine",
    harmonicRatio: 2,
    harmonicGain: 0.14,
    attack: 0.02,
    decay: 2.45,
    windFreq: 310,
    windVol: 0.062,
    melody: [392.0, 440.0, 493.88, 587.33, 659.25, 587.33, 493.88, 440.0, 392.0, 587.33, 783.99, 659.25],
    bass: [196.0, 146.83, 164.81, 130.81],
  },
  "miemie-shexiang": {
    // 麝香洞地心宇宙：Dm9 幽邃地心溶洞水滴星琴与空谷泛音
    tempoMs: 680,
    waveMain: "sine",
    waveSub: "triangle",
    harmonicRatio: 3,
    harmonicGain: 0.16,
    attack: 0.014,
    decay: 3.1,
    windFreq: 190,
    windVol: 0.055,
    melody: [293.66, 349.23, 440.0, 523.25, 659.25, 587.33, 523.25, 440.0, 392.0, 440.0, 659.25, 587.33],
    bass: [146.83, 116.54, 130.81, 110.0],
  },
  "miemie-tonggudang": {
    // 铜鼓荡与地心奇境：G大调高山黑石草甸牧铃与暗河泛音
    tempoMs: 560,
    waveMain: "triangle",
    waveSub: "sine",
    harmonicRatio: 2,
    harmonicGain: 0.14,
    attack: 0.02,
    decay: 2.35,
    windFreq: 295,
    windVol: 0.065,
    melody: [392.0, 493.88, 587.33, 659.25, 587.33, 493.88, 440.0, 392.0, 587.33, 783.99, 659.25, 587.33],
    bass: [196.0, 146.83, 164.81, 130.81],
  },
  "miemie-longji": {
    // 龙脊天路·人间塞尔达：Fmaj9 旷野留白竖琴与山脊清风
    tempoMs: 670,
    waveMain: "sine",
    waveSub: "triangle",
    harmonicRatio: 2,
    harmonicGain: 0.19,
    attack: 0.016,
    decay: 2.95,
    windFreq: 340,
    windVol: 0.072,
    melody: [349.23, 440.0, 523.25, 659.25, 783.99, 659.25, 523.25, 587.33, 523.25, 440.0, 392.0, 349.23],
    bass: [174.61, 130.81, 146.83, 196.0],
  },
  "miemie-buyi": {
    // 布依古寨与猫跳峡：D大调五声轻快木吉他与峡谷潺潺溪流
    tempoMs: 500,
    waveMain: "triangle",
    waveSub: "sine",
    harmonicRatio: 2,
    harmonicGain: 0.12,
    attack: 0.015,
    decay: 2.05,
    windFreq: 410,
    windVol: 0.062,
    seaWave: true,
    melody: [293.66, 369.99, 440.0, 587.33, 493.88, 440.0, 369.99, 329.63, 369.99, 440.0, 493.88, 587.33],
    bass: [146.83, 185.0, 196.0, 220.0],
  },
  "miemie-yading": {
    // 亚丁大环反穿·重装：Em9 苍茫雪岭低音与无畏冰晶星弦
    tempoMs: 690,
    waveMain: "sine",
    waveSub: "sine",
    harmonicRatio: 1.5,
    harmonicGain: 0.15,
    attack: 0.035,
    decay: 3.15,
    windFreq: 380,
    windVol: 0.082,
    melody: [329.63, 392.0, 493.88, 587.33, 659.25, 587.33, 493.88, 440.0, 392.0, 493.88, 587.33, 329.63],
    bass: [164.81, 130.81, 146.83, 123.47],
  },
  "luca-hainan": {
    // 海南环岛骑行星：G 大调阳光椰风海浪八音盒，轻快踏频律动
    tempoMs: 430,
    waveMain: "triangle",
    waveSub: "sine",
    harmonicRatio: 2.0,
    harmonicGain: 0.14,
    attack: 0.012,
    decay: 1.75,
    windFreq: 490,
    windVol: 0.068,
    seaWave: true,
    melody: [392.0, 493.88, 587.33, 659.25, 783.99, 659.25, 587.33, 493.88, 523.25, 587.33, 659.25, 783.99],
    bass: [196.0, 164.81, 130.81, 146.83],
  },
  "luca-tianshan": {
    // 新疆天山骑行星：D 宫调西域冬不拉风清澈泛音牧歌，辽阔雪岭晚风
    tempoMs: 560,
    waveMain: "triangle",
    waveSub: "sine",
    harmonicRatio: 1.5,
    harmonicGain: 0.13,
    attack: 0.018,
    decay: 2.35,
    windFreq: 420,
    windVol: 0.072,
    melody: [293.66, 329.63, 369.99, 440.0, 587.33, 493.88, 440.0, 369.99, 440.0, 493.88, 587.33, 440.0],
    bass: [146.83, 110.0, 123.47, 146.83],
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
    this.activeZone = null;
    this.birthdayLastPlayed = 0;
    this.zoneTimer = null;
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
    this.masterGain.gain.value = 0.0001;
    this.masterGain.connect(this.ctx.destination);
    if (this.enabled) {
      this.masterGain.gain.setTargetAtTime(1.0, this.ctx.currentTime, 0.35);
    }

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
    const BGM_ALIAS = {
      "kitty-zhagana": "zhagana",
      "kitty-wusun": "yili",
      "kitty-yading": "yading",
    };
    const resolved = BGM_ALIAS[planetId] || planetId;
    const nextKey = THEMES[resolved] ? resolved : "space";
    if (this.currentThemeKey !== nextKey) {
      this.currentThemeKey = nextKey;
      this.stepIndex = 0;
    }
    this.setSceneZone(null);
    if (!this.initialized || !this.ctx) return;
    const theme = THEMES[this.currentThemeKey];
    const now = this.ctx.currentTime;
    this.windFilter.frequency.setTargetAtTime(theme.windFreq, now, 0.9);
    this.windFilter.Q.setTargetAtTime(1.4, now, 0.9);
    this.windGain.gain.setTargetAtTime(theme.windVol, now, 0.9);
    this.waveLfoGain.gain.setTargetAtTime(theme.seaWave ? 0.055 : 0, now, 0.9);
  }

  /**
   * 特定地理场景音效与彩蛋旋律触发器
   * 支持: gale_pass (雪山垭口呼啸风声) | birthday_beach (咸田湾生日八音盒) | campfire_firework | water | pasture_bells
   */
  setSceneZone(zone = null) {
    if (this.activeZone === zone) return;
    this.activeZone = zone;
    if (this.zoneTimer) {
      clearInterval(this.zoneTimer);
      this.zoneTimer = null;
    }
    if (!this.initialized || !this.ctx) return;

    const theme = THEMES[this.currentThemeKey] || THEMES.space;
    const now = this.ctx.currentTime;

    if (!zone) {
      this.windFilter.frequency.setTargetAtTime(theme.windFreq, now, 0.8);
      this.windFilter.Q.setTargetAtTime(1.4, now, 0.8);
      this.windGain.gain.setTargetAtTime(theme.windVol, now, 0.8);
      this.waveLfoGain.gain.setTargetAtTime(theme.seaWave ? 0.055 : 0, now, 0.8);
      return;
    }

    if (zone === "gale_pass") {
      // 高海拔雪山垭口：凛冽呼啸风声（高共振风口啸叫感）
      this.windFilter.frequency.setTargetAtTime(860, now, 0.6);
      this.windFilter.Q.setTargetAtTime(4.8, now, 0.6);
      this.windGain.gain.setTargetAtTime(0.18, now, 0.6);
    } else if (zone === "water") {
      // 溪流/湖岸/海岸：清澈水波声浪起伏
      this.windFilter.frequency.setTargetAtTime(520, now, 0.7);
      this.windFilter.Q.setTargetAtTime(2.2, now, 0.7);
      this.windGain.gain.setTargetAtTime(0.13, now, 0.7);
      this.waveLfoGain.gain.setTargetAtTime(0.05, now, 0.7);
    } else if (zone === "birthday_beach") {
      // 麦理浩径咸田湾海滩营地：温柔海浪 + 水晶八音盒《生日快乐歌》
      this.windFilter.frequency.setTargetAtTime(420, now, 0.7);
      this.windGain.gain.setTargetAtTime(0.1, now, 0.7);
      this.waveLfoGain.gain.setTargetAtTime(0.045, now, 0.7);
      if (this.enabled && Date.now() - this.birthdayLastPlayed > 14000) {
        this.birthdayLastPlayed = Date.now();
        this.playBirthdayMusicBox();
      }
    } else if (zone === "campfire_firework") {
      // 腾格里星空营地：篝火暖风与偶发夜空烟花绽放音
      this.playFireworkSparkle();
      this.zoneTimer = setInterval(() => {
        if (this.enabled && this.activeZone === "campfire_firework") {
          this.playFireworkSparkle();
        }
      }, 4200);
    } else if (zone === "pasture_bells") {
      // 唐布拉冬牧场：清脆悠远的牧场马铃泛音
      this.playPastureBell();
      this.zoneTimer = setInterval(() => {
        if (this.enabled && this.activeZone === "pasture_bells") {
          this.playPastureBell();
        }
      }, 3600);
    } else if (zone === "cave_echo") {
      // 麝香洞地心宇宙 / 牛倒岩地心瀑布：深邃溶洞低频共鸣 + 钟乳石空灵水滴回声
      this.windFilter.frequency.setTargetAtTime(165, now, 0.7);
      this.windFilter.Q.setTargetAtTime(3.4, now, 0.7);
      this.windGain.gain.setTargetAtTime(0.085, now, 0.7);
      this.playCaveDripEcho();
      this.zoneTimer = setInterval(() => {
        if (this.enabled && this.activeZone === "cave_echo") {
          this.playCaveDripEcho();
        }
      }, 2850);
    }
  }

  playCaveDripEcho() {
    if (!this.initialized || !this.enabled || !this.ctx) return;
    const basePool = [987.77, 1174.66, 1318.51, 1567.98];
    const f0 = basePool[Math.floor(Math.random() * basePool.length)];
    const now = this.ctx.currentTime;
    // 主水滴「叮—」快速上扬清脆包络 + 三重溶洞远方回声衰减
    [0, 0.28, 0.56].forEach((d, idx) => {
      const t = now + d;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f0 * (idx === 0 ? 0.74 : 1.0), t);
      osc.frequency.exponentialRampToValueAtTime(f0 * (idx === 0 ? 1.32 : 1.02), t + 0.065);
      const vol = 0.036 * Math.pow(0.46, idx);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
      osc.connect(g);
      g.connect(this.masterGain);
      if (this.reverbInput) g.connect(this.reverbInput);
      osc.start(t);
      osc.stop(t + 0.46);
    });
  }

  playBirthdayMusicBox() {
    if (!this.initialized || !this.enabled || !this.ctx) return;
    // 《生日快乐歌》温柔八音盒旋律 (G4 G4 A4 G4 C5 B4 | G4 G4 A4 G4 D5 C5 | G4 G4 G5 E5 C5 B4 A4 | F5 F5 E5 C5 D5 C5)
    const notes = [
      [392.0, 0.0, 0.35], [392.0, 0.38, 0.25], [440.0, 0.68, 0.55], [392.0, 1.28, 0.55], [523.25, 1.88, 0.55], [493.88, 2.48, 1.0],
      [392.0, 3.65, 0.35], [392.0, 4.03, 0.25], [440.0, 4.33, 0.55], [392.0, 4.93, 0.55], [587.33, 5.53, 0.55], [523.25, 6.13, 1.0],
      [392.0, 7.3, 0.35], [392.0, 7.68, 0.25], [783.99, 7.98, 0.55], [659.25, 8.58, 0.55], [523.25, 9.18, 0.55], [493.88, 9.78, 0.55], [440.0, 10.38, 0.9],
      [698.46, 11.45, 0.35], [698.46, 11.83, 0.25], [659.25, 12.13, 0.55], [523.25, 12.73, 0.55], [587.33, 13.33, 0.6], [523.25, 13.98, 1.4],
    ];
    for (const [f, delay, dur] of notes) {
      this.playTone(f, {
        duration: dur + 1.1,
        volume: 0.048,
        delay,
        waveMain: "sine",
        waveSub: "triangle",
        harmonicRatio: 2,
        harmonicGain: 0.2,
        attack: 0.015,
      });
    }
  }

  playFireworkSparkle() {
    if (!this.initialized || !this.enabled || !this.ctx) return;
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
      this.playTone(f, { duration: 1.4, volume: 0.025, delay: 0.15 + i * 0.06, attack: 0.01 });
    });
  }

  playPastureBell() {
    if (!this.initialized || !this.enabled || !this.ctx) return;
    this.playTone(880.0, { duration: 2.2, volume: 0.026, harmonicRatio: 2.5, harmonicGain: 0.18, attack: 0.01 });
    this.playTone(1174.66, { duration: 1.9, volume: 0.018, delay: 0.45, harmonicRatio: 2, harmonicGain: 0.15, attack: 0.01 });
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
        // 正在播放咸田湾生日八音盒主旋律前 14 秒时，自动降低背景琶音避免抢旋律
        const birthdayPlaying =
          this.activeZone === "birthday_beach" && Date.now() - this.birthdayLastPlayed < 14500;
        const idx = this.stepIndex % theme.melody.length;
        const shouldRest = birthdayPlaying || (idx % 6 === 5 && Math.random() > 0.55);
        const mScale = this._musicScale ?? 1.0;
        if (!shouldRest && mScale > 0.01) {
          const freq = theme.melody[idx];
          this.playTone(freq, {
            duration: theme.decay,
            volume: 0.034 * mScale,
            waveMain: theme.waveMain,
            waveSub: theme.waveSub,
            harmonicRatio: theme.harmonicRatio,
            harmonicGain: theme.harmonicGain,
            attack: theme.attack,
          });
        }
        // 每 3 拍铺垫一颗柔和温暖的根音低音衬底
        if (idx % 3 === 0 && theme.bass && mScale > 0.01) {
          const bFreq = theme.bass[Math.floor(idx / 3) % theme.bass.length];
          this.playTone(bFreq, {
            duration: theme.decay * 1.35,
            volume: 0.024 * mScale,
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

  playCreatureChirp(planetId = "siguniang") {
    if (!this.initialized || !this.enabled || !this.ctx) return;
    if (planetId === "tengger") {
      // 清脆双响铜驼铃
      this.playTone(1318.5, { duration: 1.1, volume: 0.042, attack: 0.008 });
      this.playTone(1760.0, { duration: 1.2, volume: 0.032, delay: 0.16, attack: 0.008 });
    } else if (planetId === "yading") {
      // 土拨鼠俏皮上扬双音
      this.playTone(783.99, { duration: 0.35, volume: 0.038, attack: 0.01 });
      this.playTone(1046.5, { duration: 0.45, volume: 0.042, delay: 0.12, attack: 0.01 });
    } else {
      [523.25, 659.25, 783.99].forEach((f, i) => {
        this.playTone(f, { duration: 0.7, volume: 0.034, delay: i * 0.08, attack: 0.012 });
      });
    }
  }

  playPetChime() {
    if (!this.initialized || this.muted) return;
    [659.25, 880, 1174.66].forEach((f, i) => {
      this.playTone(f, { duration: 0.36, volume: 0.042, delay: i * 0.065, attack: 0.008 });
    });
  }

  playWishStar() {
    if (!this.initialized || this.muted) return;
    [587.33, 783.99, 1046.5, 1318.51, 1567.98].forEach((f, i) => {
      this.playTone(f, { duration: 0.75, volume: 0.036, delay: i * 0.07, attack: 0.01 });
    });
  }

  setCampfireMix({ active = false, fire = 0.7, wind = 0.5, nature = 0.45, music = 0.7 } = {}) {
    if (!this.initialized || !this.ctx) return;
    const now = this.ctx.currentTime;
    this._campMix = { active, fire, wind, nature, music };

    // 篝火噼啪暖噪声通道路由
    if (active && !this.campfireGain) {
      const len = this.ctx.sampleRate * 3;
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        last = (last + 0.04 * w) / 1.04;
        const crackle = Math.random() > 0.9965 ? (Math.random() * 2 - 1) * 0.95 : 0;
        d[i] = last * 1.8 + crackle;
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const bp = this.ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 620;
      bp.Q.value = 0.7;
      this.campfireGain = this.ctx.createGain();
      this.campfireGain.gain.value = 0.0001;
      src.connect(bp);
      bp.connect(this.campfireGain);
      this.campfireGain.connect(this.masterGain);
      src.start();
      this.campfireSrc = src;
    }

    // 山海溪浪 · 夜雨潮汐立体声自然风物通道
    if (active && !this.natureGain) {
      const len = this.ctx.sampleRate * 4;
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      let b0 = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.96 * b0 + 0.04 * w;
        const swell = 0.62 + 0.38 * Math.sin((i / len) * Math.PI * 2);
        d[i] = (b0 * 2.1 + w * 0.12) * swell;
      }
      const nSrc = this.ctx.createBufferSource();
      nSrc.buffer = buf;
      nSrc.loop = true;
      const lp = this.ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 980;
      this.natureGain = this.ctx.createGain();
      this.natureGain.gain.value = 0.0001;
      nSrc.connect(lp);
      lp.connect(this.natureGain);
      this.natureGain.connect(this.masterGain);
      nSrc.start();
    }

    if (this.campfireGain) {
      const targetFire = active ? Math.max(0.0001, fire * 0.16) : 0.0001;
      this.campfireGain.gain.setTargetAtTime(targetFire, now, 0.25);
    }
    if (this.natureGain) {
      const targetNature = active ? Math.max(0.0001, nature * 0.14) : 0.0001;
      this.natureGain.gain.setTargetAtTime(targetNature, now, 0.3);
    }
    if (this.windGain) {
      const baseWind = (THEMES[this.currentThemeKey]?.windVol ?? 0.035);
      const targetWind = active ? Math.max(0.001, wind * 0.14) : baseWind;
      this.windGain.gain.setTargetAtTime(targetWind, now, 0.3);
    }
    this._musicScale = active ? music : 1.0;
  }

  playHotpotClink() {
    if (!this.initialized || !this.enabled || !this.ctx) return;
    // 清脆高山露营钛金属马克杯碰杯「叮！」泛音 + 红汤咕嘟气泡轻响
    this.playTone(1760, { duration: 0.75, volume: 0.045, delay: 0.02, harmonicRatio: 2.76, harmonicGain: 0.25, attack: 0.005 });
    this.playTone(2349.3, { duration: 0.55, volume: 0.032, delay: 0.05, attack: 0.005 });
    [0.24, 0.42, 0.62].forEach((d, i) => {
      this.playTone(260 + i * 55, { duration: 0.14, volume: 0.03, delay: d, waveMain: "sine", attack: 0.01 });
    });
  }

  playBikeBell() {
    if (!this.initialized || !this.enabled || !this.ctx) return;
    // 清脆双响黄铜公路车铃「叮铃—叮铃！」
    [0, 0.11].forEach((d, idx) => {
      const f = idx === 0 ? 2637.02 : 3135.96;
      this.playTone(f, {
        duration: 0.65,
        volume: 0.042,
        delay: d,
        harmonicRatio: 2.42,
        harmonicGain: 0.34,
        attack: 0.003,
      });
    });
  }

  playBikeFreehub() {
    if (!this.initialized || !this.enabled || !this.ctx) return;
    // 公路车棘轮花鼓轻快细密哒哒声
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(1450 + Math.random() * 280, now);
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.024);
    g.gain.setValueAtTime(0.016, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.026);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.03);
  }
}

export const sound = new SoundEngine();
