import * as THREE from "three";
import { latLonToUnitVec, getSurfaceRadius } from "./sphereMath.js?v=5.3.5-hikerstars-domain";

const UP = new THREE.Vector3(0, 1, 0);

function createStorybookGrad() {
  const data = new Uint8Array([
    82, 86, 112, 255,
    132, 136, 158, 255,
    182, 184, 196, 255,
    226, 224, 222, 255,
    255, 252, 244, 255,
  ]);
  const tex = new THREE.DataTexture(data, 5, 1, THREE.RGBAFormat);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}
const GRAD = createStorybookGrad();
const toon = (color) => new THREE.MeshToonMaterial({ color, gradientMap: GRAD });

export const CREATURE_CATALOG = [
  {
    planetId: "tengger",
    planetName: "腾格里沙漠",
    name: "沙漠小骆驼",
    emoji: "🐪",
    greeting: "驼铃叮当，小骆驼朝你眨了眨长睫毛",
    note: "“沙漠之所以美丽，是因为某处藏着一口井。”它替你驮着整片星砂。",
  },
  {
    planetId: "yading",
    planetName: "稻城亚丁大环线",
    name: "雪山旱獭",
    emoji: "🦦",
    greeting: "圆滚滚的土拨鼠直立起来，双手捧胸打量着你",
    note: "它在四千九百米的垭口守望风雪，把沉默的群山讲给重逢的旅人听。",
  },
  {
    planetId: "zhagana",
    planetName: "扎尕那",
    name: "高山小牦牛",
    emoji: "🦬",
    greeting: "小黑牦牛甩了甩蓬松尾巴，低头嗅了嗅草尖",
    note: "穿过云雾缭绕的石城与密林溪涧，它摇着绒尾陪你踏碎清晨的薄霜。",
  },
  {
    planetId: "siguniang",
    planetName: "四姑娘山与长穿毕",
    name: "星辰小狐狸",
    emoji: "🦊",
    greeting: "像《小王子》的狐狸一样，它安静摇着白尖尾巴陪你",
    note: "“如果你驯养了我，我们就互相需要了。”它陪你走过五千米的雪线。",
  },
  {
    planetId: "maclehose",
    planetName: "麦理浩径",
    name: "海湾抱抱鲨",
    emoji: "🦈",
    greeting: "海浪送来一只软乎乎的蓝白小鲨鱼，它朝你欢快地扑棱着胸鳍！",
    note: "从咸田湾海浪里滚上岸的毛绒小蓝鲨，露着一排软布小白牙陪你吹海风。",
  },
  {
    planetId: "yili",
    planetName: "新疆伊犁",
    name: "草原小羊羔",
    emoji: "🐑",
    greeting: "云朵般蓬松的小羊羔欢快地原地蹦跳了两下",
    note: "“请给我画一只绵羊吧。”它从漫画星云跳进金秋与初雪的牧场。",
  },
  {
    planetId: "kitty-xiaowutai",
    owner: "kitty",
    planetName: "那座山 · 小五台",
    name: "山野小橘猫",
    emoji: "🐱",
    realPhoto: "./assets/kitty/k-31.jpg?v=4.2.5-release",
    greeting: "西台山石上的小橘猫喵呜一声，翘着长尾巴蹭了蹭你的裤脚",
    note: "源自 Kitty 在山石间偶遇的真实喵星人——它替小五台的高山草甸保管着晒过太阳的温柔。",
  },
  {
    planetId: "kitty-changbai",
    owner: "kitty",
    planetName: "长白山",
    name: "长白梅花小鹿",
    emoji: "🦌",
    greeting: "林间梅花小鹿轻点蹄尖，头顶小鹿角在天池晴光下闪闪发亮",
    note: "守候在长白山岳桦林与火山天池畔的灵动小鹿，背上的白斑像落满星光。",
  },
  {
    planetId: "kitty-sunset",
    owner: "kitty",
    planetName: "银河与日落八分钟",
    name: "追光星云兔",
    emoji: "🐇",
    greeting: "长耳朵小雪兔竖起耳朵，陪你一起望向风车边的落日余晖",
    note: "它收集日落最后八分钟的橘金星尘，等夜幕降临时撒成满天银河。",
  },
  {
    planetId: "kitty-zhagana",
    owner: "kitty",
    planetName: "措美峰东线与扎尕那",
    name: "冰湖小雪狐",
    emoji: "🦊",
    greeting: "纯白小雪狐轻巧地跃过冰湖边缘，朝你歪了歪脑袋",
    note: "守望措美峰冰封海子与扎尕那云雾石城的白色精灵。",
  },
  {
    planetId: "kitty-daqing",
    owner: "kitty",
    planetName: "大青山云端营地",
    name: "云朵小羊羔",
    emoji: "🐑",
    greeting: "软绵绵的云朵小羊在帐篷边欢快地转了个圈",
    note: "大青山顶飘落的一朵白云，落在绿绒毯草甸上变成了陪你露营的伙伴。",
  },
  {
    planetId: "kitty-wusun",
    owner: "kitty",
    planetName: "乌孙古道天山脊",
    name: "天山小马驹",
    emoji: "🐴",
    greeting: "矫健的小马驹甩了甩鬃毛，陪你涉过天山峡谷的溪流",
    note: "乌孙古道千年的风声里，它是最懂重装行者脚步的忠实伙伴。",
  },
  {
    planetId: "kitty-yading",
    owner: "kitty",
    planetName: "稻城亚丁",
    name: "栈道小松鼠",
    emoji: "🐿️",
    realPhoto: "./assets/kitty/k-30.jpg?v=4.2.5-release",
    greeting: "蓬松大尾巴的小松鼠双手捧着松果，好奇地凑到镜头前营业！",
    note: "源自 Kitty 在亚丁木栈道栏杆上真实抓拍到的贪吃小松鼠——心都要被它萌化啦！",
  },
  {
    planetId: "miemie-guizhou",
    owner: "miemie",
    planetName: "贵州安顺 · 喀斯特魔界",
    name: "铜鼓荡草甸小绵羊",
    emoji: "🐑",
    greeting: "铜鼓荡黑石林旁的小绵羊咩咩叫了一声，陪你一起探秘龙脊天路与地心溶洞！",
    note: "源自咩咩在贵州安顺铜鼓荡遇见的漫山闲步牧群——守望着黑石草甸、暗河瀑布与地心星穹。",
  },
  {
    planetId: "miemie-volcano",
    owner: "miemie",
    planetName: "乌兰哈达与大红山 · 异星火山",
    name: "火星红崖小赤狐",
    emoji: "🦊",
    greeting: "蓬松火红尾巴的小赤狐跳过黑曜石火山灰，领你奔向大红山的火星断崖！",
    note: "穿梭在四子王旗大红山赤壁与乌兰哈达黑色炼丹炉火山之间的塞北星际小精灵。",
  },
  {
    planetId: "miemie-hulunbuir",
    owner: "miemie",
    planetName: "呼伦贝尔与阿尔山 · 北疆牧歌",
    name: "呼伦贝尔金草垛小马驹",
    emoji: "🐴",
    greeting: "栗色小马驹从金色大圆草垛后面探出脑袋，想载你跑遍无边绿浪！",
    note: "守望阿尔山火山森林与呼伦贝尔莫日格勒草原的追风小马驹。",
  },
  {
    planetId: "miemie-yading",
    owner: "miemie",
    planetName: "亚丁大环反穿 · 重装",
    name: "无信号雪原小牦牛",
    emoji: "🐃",
    greeting: "敦实的小牦牛摇着铜铃，陪你在没有信号的雪山营地生火发呆",
    note: "六天五晚重装反穿路上的温暖守望者：每天一个小目标，抵达营地就足够啦。",
  },
  {
    planetId: "luca-hainan",
    owner: "luca",
    planetName: "海南环岛 · 海岛桃花源",
    name: "椰风破浪抱抱鲨",
    emoji: "🦈",
    greeting: "海湾抱抱鲨拍着鳍浪追上你的车轮，陪你迎着北纬18°海风破风巡航！",
    note: "沿着海南环岛旅游公路追风 948 公里的海岛吉祥物，最爱在棋子湾与万宁的浪花里打滚。",
  },
  {
    planetId: "luca-tianshan",
    owner: "luca",
    planetName: "新疆天山 · 雪岭牧歌骑行",
    name: "天山车辙云朵小羊",
    emoji: "🐑",
    greeting: "软乎乎的云朵小羊蹭了蹭你的单车前轮，邀你在松林木屋草坡歇脚看云！",
    note: "漫步在天山覆雪溪谷与森林牧场的小精灵，见证从热带海岛骑向西域雪岭的滚烫车辙。",
  },
];

const CREATURE_META = Object.fromEntries(
  CREATURE_CATALOG.map((item) => [item.planetId, item])
);

function addEyesAndBlush(head, x = 0.055, y = 0.025, z = 0.095) {
  const eyeMat = new THREE.MeshBasicMaterial({ color: "#19161b" });
  const shineMat = new THREE.MeshBasicMaterial({ color: "#ffffff" });
  const blushMat = new THREE.MeshBasicMaterial({ color: "#f490ae", transparent: true, opacity: 0.65 });
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), eyeMat);
    eye.position.set(s * x, y, z);
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.007, 6, 6), shineMat);
    shine.position.set(s * x + 0.005, y + 0.006, z + 0.014);
    const blush = new THREE.Mesh(new THREE.SphereGeometry(0.019, 8, 6), blushMat);
    blush.scale.set(1.3, 0.7, 0.5);
    blush.position.set(s * (x + 0.022), y - 0.024, z - 0.008);
    head.add(eye, shine, blush);
  }
}

function createJoyParticles(topY = 0.72) {
  const group = new THREE.Group();
  const items = [];
  const goldMat = new THREE.MeshBasicMaterial({ color: "#ffd859" });
  const pinkMat = new THREE.MeshBasicMaterial({ color: "#ff82a9" });
  for (let i = 0; i < 4; i++) {
    const m = new THREE.Mesh(
      new THREE.OctahedronGeometry(i % 2 === 0 ? 0.036 : 0.03, 0),
      i % 2 === 0 ? goldMat : pinkMat
    );
    group.add(m);
    items.push({ mesh: m, phase: i * 0.25 });
  }
  return {
    group,
    update(elapsed, blend) {
      group.visible = blend > 0.03;
      if (!group.visible) return;
      for (const it of items) {
        const p = (elapsed * 0.75 + it.phase) % 1;
        const ang = p * Math.PI * 2 + it.phase * 6.2;
        it.mesh.position.set(
          Math.cos(ang) * 0.16,
          topY + p * 0.34,
          Math.sin(ang) * 0.16
        );
        const s = Math.sin(p * Math.PI) * blend;
        it.mesh.scale.setScalar(Math.max(0.001, s));
        it.mesh.rotation.y = elapsed * 3.2;
      }
    },
  };
}

function buildCreatureMesh(planetId) {
  const root = new THREE.Group();
  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);
  const legs = [];
  const headPivot = new THREE.Group();
  const tailPivot = new THREE.Group();
  let standPivot = null;
  let frontArms = [];
  let sharkFins = [];
  let bellMesh = null;

  const makeLegs = (color, h = 0.2, r = 0.032, spreadX = 0.085, spreadZ = 0.12) => {
    const mat = toon(color);
    for (const sx of [-1, 1]) {
      for (const sz of [1, -1]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.86, h, 8), mat);
        leg.position.set(sx * spreadX, h * 0.5, sz * spreadZ);
        bodyPivot.add(leg);
        legs.push({
          mesh: leg,
          sz,
          phase: (sx > 0 ? 0 : Math.PI) + (sz > 0 ? 0 : Math.PI * 0.5),
        });
      }
    }
  };

  if (planetId === "tengger") {
    const fur = toon("#d89a55");
    const lightFur = toon("#efd2a2");
    makeLegs("#c48642", 0.27, 0.03, 0.085, 0.13);
    const torso = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 12), fur);
    torso.scale.set(0.88, 0.82, 1.3);
    torso.position.y = 0.36;
    const hump1 = new THREE.Mesh(new THREE.SphereGeometry(0.082, 10, 10), lightFur);
    hump1.position.set(0, 0.5, 0.07);
    const hump2 = hump1.clone();
    hump2.position.set(0, 0.49, -0.09);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.068, 0.24, 10), fur);
    neck.position.set(0, 0.48, 0.2);
    neck.rotation.x = 0.42;
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.014, 8, 14), toon("#dc3830"));
    collar.position.set(0, 0.43, 0.21);
    collar.rotation.x = 1.2;
    bellMesh = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), toon("#fbbf24"));
    bellMesh.position.set(0, 0.39, 0.255);
    bodyPivot.add(torso, hump1, hump2, neck, collar, bellMesh);

    headPivot.position.set(0, 0.59, 0.26);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 10), fur);
    const snout = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 8), lightFur);
    snout.position.set(0, -0.015, 0.08);
    addEyesAndBlush(headPivot, 0.058, 0.02, 0.085);
    headPivot.add(skull, snout);
    bodyPivot.add(headPivot);
  } else if (planetId === "yading") {
    // 会直立捧胸的圆滚滚旱獭
    const fur = toon("#9e6b3b");
    const bellyMat = toon("#f2d7a4");
    const pawMat = toon("#3b281c");
    for (const sx of [-1, 1]) {
      const foot = new THREE.Mesh(new THREE.SphereGeometry(0.048, 8, 8), pawMat);
      foot.scale.set(0.9, 0.55, 1.35);
      foot.position.set(sx * 0.085, 0.03, -0.06);
      bodyPivot.add(foot);
    }
    standPivot = new THREE.Group();
    standPivot.position.set(0, 0.09, -0.06);
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.175, 14, 12), fur);
    body.scale.set(0.96, 0.9, 1.28);
    body.position.set(0, 0.09, 0.1);
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.145, 12, 10), bellyMat);
    belly.scale.set(0.86, 0.72, 1.1);
    belly.position.set(0, 0.05, 0.13);
    standPivot.add(body, belly);

    for (const sx of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.028, 0.14, 8), pawMat);
      arm.position.set(sx * 0.11, 0.06, 0.21);
      standPivot.add(arm);
      frontArms.push({ mesh: arm, side: sx });
    }
    headPivot.position.set(0, 0.16, 0.27);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.115, 12, 10), fur);
    const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.062, 10, 8), bellyMat);
    muzzle.position.set(0, -0.02, 0.09);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), pawMat);
    nose.position.set(0, 0.0, 0.14);
    const teeth = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.024, 0.012), toon("#fffdf7"));
    teeth.position.set(0, -0.036, 0.135);
    for (const sx of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), fur);
      ear.position.set(sx * 0.088, 0.082, 0.01);
      headPivot.add(ear);
    }
    addEyesAndBlush(headPivot, 0.058, 0.028, 0.095);
    headPivot.add(head, muzzle, nose, teeth);
    tailPivot.position.set(0, 0.05, -0.09);
    const tail = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), pawMat);
    tail.scale.set(0.8, 0.7, 1.7);
    tail.position.z = -0.06;
    tailPivot.add(tail);
    standPivot.add(headPivot, tailPivot);
    bodyPivot.add(standPivot);
  } else if (planetId === "siguniang" || planetId === "kitty-zhagana" || planetId === "miemie-volcano") {
    // 《小王子》暖橙雪线小狐狸 / 措美峰纯白雪狐 / 大红山赤红火星狐
    const isSnowFox = planetId === "kitty-zhagana";
    const orange = toon(isSnowFox ? "#dbeafe" : planetId === "miemie-volcano" ? "#e11d48" : "#ea7434");
    const cream = toon("#fff7eb");
    const dark = toon(isSnowFox ? "#334155" : "#2c201e");
    makeLegs("#2c201e", 0.19, 0.028, 0.075, 0.11);
    const torso = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 12), orange);
    torso.scale.set(0.86, 0.85, 1.32);
    torso.position.y = 0.26;
    const ruff = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), cream);
    ruff.position.set(0, 0.25, 0.14);
    bodyPivot.add(torso, ruff);

    headPivot.position.set(0, 0.37, 0.19);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.115, 12, 10), orange);
    const snout = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.13, 10), cream);
    snout.rotation.x = Math.PI * 0.5;
    snout.position.set(0, -0.02, 0.1);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), dark);
    nose.position.set(0, -0.015, 0.165);
    for (const sx of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.048, 0.12, 8), orange);
      ear.position.set(sx * 0.075, 0.12, 0.0);
      ear.rotation.z = -sx * 0.22;
      headPivot.add(ear);
    }
    addEyesAndBlush(headPivot, 0.054, 0.02, 0.095);
    headPivot.add(head, snout, nose);
    tailPivot.position.set(0, 0.26, -0.18);
    const tailMain = new THREE.Mesh(new THREE.SphereGeometry(0.088, 10, 10), orange);
    tailMain.scale.set(0.85, 0.85, 1.75);
    tailMain.position.set(0, 0.06, -0.11);
    tailMain.rotation.x = 0.45;
    const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.068, 10, 10), cream);
    tailTip.position.set(0, 0.12, -0.22);
    tailPivot.add(tailMain, tailTip);
    bodyPivot.add(headPivot, tailPivot);
  } else if (planetId === "yili" || planetId === "kitty-daqing" || planetId === "miemie-guizhou" || planetId === "miemie-tonggudang" || planetId === "luca-tianshan") {
    // 蓬松云朵小羊羔
    const wool = toon("#fcfaf2");
    const faceMat = toon("#382f2c");
    makeLegs("#382f2c", 0.19, 0.026, 0.075, 0.1);
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), wool);
    core.scale.set(0.95, 0.9, 1.2);
    core.position.y = 0.28;
    bodyPivot.add(core);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 8), wool);
      puff.position.set(Math.cos(a) * 0.11, 0.29 + (i % 2) * 0.04, Math.sin(a) * 0.13);
      bodyPivot.add(puff);
    }
    headPivot.position.set(0, 0.36, 0.2);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.098, 12, 10), faceMat);
    const crown = new THREE.Mesh(new THREE.SphereGeometry(0.072, 10, 8), wool);
    crown.position.set(0, 0.07, 0.01);
    for (const sx of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.036, 8, 8), toon("#f49cb5"));
      ear.scale.set(1.4, 0.55, 0.7);
      ear.position.set(sx * 0.105, 0.02, 0.0);
      headPivot.add(ear);
    }
    addEyesAndBlush(headPivot, 0.048, 0.015, 0.086);
    headPivot.add(head, crown);
    tailPivot.position.set(0, 0.3, -0.2);
    tailPivot.add(new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), wool));
    bodyPivot.add(headPivot, tailPivot);
  } else if (planetId === "maclehose" || planetId === "luca-hainan") {
    // 复刻宜家 Blåhaj 毛绒小蓝鲨：雾霾海灰蓝胖鱼身 + 奶白圆肚皮 + 珊瑚粉嘴巴与软布小白牙 + 4道鳃纹 + 大背鳍/双胸鳍/剪刀尾鳍
    const sharkBlue = toon("#5c839b");
    const bellyCream = toon("#f5f0e8");
    const mouthPink = toon("#efa9a0");
    const gillDark = toon("#355266");
    const toothWhite = toon("#ffffff");

    // 圆滚滚流线鱼身与前端微翘钝鼻头
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.185, 16, 14), sharkBlue);
    body.scale.set(0.92, 0.78, 1.62);
    body.position.set(0, 0.19, 0.03);

    const snout = new THREE.Mesh(new THREE.SphereGeometry(0.135, 14, 12), sharkBlue);
    snout.scale.set(0.92, 0.68, 1.15);
    snout.position.set(0, 0.2, 0.21);

    // 奶白圆胖下颌与大肚皮
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.168, 14, 12), bellyCream);
    belly.scale.set(0.86, 0.56, 1.52);
    belly.position.set(0, 0.125, 0.05);

    // 微张粉嫩微笑嘴 + 一排呆萌白色小三角布牙
    const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.082, 12, 8), mouthPink);
    mouth.scale.set(0.95, 0.32, 0.85);
    mouth.position.set(0, 0.135, 0.255);
    for (let i = -2; i <= 2; i++) {
      const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.011, 0.022, 5), toothWhite);
      tooth.rotation.x = Math.PI;
      tooth.position.set(i * 0.024, 0.15, 0.31 - Math.abs(i) * 0.01);
      bodyPivot.add(tooth);
    }

    // 两侧带棕框的呆萌圆豆豆眼 + 眼后 4 道竖向鳃缝
    const eyeRingMat = new THREE.MeshBasicMaterial({ color: "#422722" });
    const eyeBlackMat = new THREE.MeshBasicMaterial({ color: "#141215" });
    const shineMat = new THREE.MeshBasicMaterial({ color: "#ffffff" });
    for (const sx of [-1, 1]) {
      const ring = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), eyeRingMat);
      ring.position.set(sx * 0.122, 0.195, 0.215);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.017, 8, 8), eyeBlackMat);
      pupil.position.set(sx * 0.127, 0.196, 0.22);
      const shine = new THREE.Mesh(new THREE.SphereGeometry(0.006, 6, 6), shineMat);
      shine.position.set(sx * 0.132, 0.202, 0.228);
      bodyPivot.add(ring, pupil, shine);

      for (let g = 0; g < 4; g++) {
        const gill = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.042, 0.008), gillDark);
        gill.position.set(sx * (0.148 - g * 0.002), 0.178, 0.125 - g * 0.022);
        gill.rotation.z = sx * 0.15;
        bodyPivot.add(gill);
      }
    }

    // 标志性高耸圆润大背鳍 + 后腰迷你第二背鳍
    const dorsalMain = new THREE.Mesh(new THREE.ConeGeometry(0.092, 0.22, 10), sharkBlue);
    dorsalMain.scale.set(0.36, 1, 1.15);
    dorsalMain.position.set(0, 0.38, 0.01);
    dorsalMain.rotation.x = -0.24;

    const dorsalSmall = new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.085, 8), sharkBlue);
    dorsalSmall.scale.set(0.38, 1, 1.0);
    dorsalSmall.position.set(0, 0.265, -0.17);
    dorsalSmall.rotation.x = -0.3;

    // 左右两片会上下扑棱的胖胸鳍
    for (const sx of [-1, 1]) {
      const finPivot = new THREE.Group();
      finPivot.position.set(sx * 0.135, 0.14, 0.08);
      const fin = new THREE.Mesh(new THREE.ConeGeometry(0.068, 0.21, 10), sharkBlue);
      fin.scale.set(1.05, 1, 0.36);
      fin.position.set(sx * 0.085, -0.04, -0.02);
      fin.rotation.z = sx * 1.18;
      fin.rotation.y = -sx * 0.28;
      finPivot.add(fin);
      bodyPivot.add(finPivot);
      sharkFins.push({ pivot: finPivot, side: sx });
    }

    // 后段渐收尾柄 + 上长下短剪刀尾鳍
    const peduncle = new THREE.Mesh(new THREE.ConeGeometry(0.115, 0.24, 12), sharkBlue);
    peduncle.scale.set(0.82, 0.75, 1);
    peduncle.rotation.x = -Math.PI * 0.5;
    peduncle.position.set(0, 0.185, -0.24);

    tailPivot.position.set(0, 0.19, -0.32);
    const upperFluke = new THREE.Mesh(new THREE.ConeGeometry(0.062, 0.22, 8), sharkBlue);
    upperFluke.scale.set(0.34, 1, 1.05);
    upperFluke.position.set(0, 0.075, -0.07);
    upperFluke.rotation.x = -0.78;
    const lowerFluke = new THREE.Mesh(new THREE.ConeGeometry(0.048, 0.15, 8), sharkBlue);
    lowerFluke.scale.set(0.34, 1, 1.0);
    lowerFluke.position.set(0, -0.055, -0.05);
    lowerFluke.rotation.x = -2.35;
    tailPivot.add(upperFluke, lowerFluke);

    bodyPivot.add(body, snout, belly, mouth, dorsalMain, dorsalSmall, peduncle, headPivot, tailPivot);
  } else if (planetId === "kitty-xiaowutai" || planetId === "miemie-buyi") {
    // 🐱 山野橘白小猫咪（还原 kitty.docx 西台岩石上的猫咪！）
    const orangeFur = toon("#f59e42");
    const creamFur = toon("#fffaf0");
    const pinkEar = toon("#f9a8d4");
    const goldMat = new THREE.MeshStandardMaterial({ color: "#fbbf24", metalness: 0.7, roughness: 0.25 });
    makeLegs("#f59e42", 0.17, 0.026, 0.068, 0.1);
    const torso = new THREE.Mesh(new THREE.SphereGeometry(0.145, 14, 12), orangeFur);
    torso.scale.set(0.88, 0.85, 1.32);
    torso.position.y = 0.24;
    const chestBib = new THREE.Mesh(new THREE.SphereGeometry(0.105, 12, 10), creamFur);
    chestBib.position.set(0, 0.23, 0.1);
    bellMesh = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), goldMat);
    bellMesh.position.set(0, 0.25, 0.19);
    bodyPivot.add(torso, chestBib, bellMesh);

    headPivot.position.set(0, 0.36, 0.17);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.122, 14, 12), orangeFur);
    head.scale.set(1.08, 0.96, 0.96);
    const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.062, 10, 8), creamFur);
    muzzle.scale.set(1.15, 0.78, 0.8);
    muzzle.position.set(0, -0.028, 0.088);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 6), pinkEar);
    nose.position.set(0, -0.012, 0.132);
    for (const sx of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.048, 0.095, 4), orangeFur);
      ear.position.set(sx * 0.078, 0.11, 0.01);
      ear.rotation.set(0.1, sx * 0.3, -sx * 0.32);
      const inner = new THREE.Mesh(new THREE.ConeGeometry(0.026, 0.058, 4), pinkEar);
      inner.position.set(sx * 0.076, 0.106, 0.026);
      inner.rotation.set(0.1, sx * 0.3, -sx * 0.32);
      headPivot.add(ear, inner);
    }
    addEyesAndBlush(headPivot, 0.052, 0.016, 0.104);
    headPivot.add(head, muzzle, nose);

    tailPivot.position.set(0, 0.28, -0.18);
    const tailLow = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.026, 0.2, 8), orangeFur);
    tailLow.position.set(0, 0.08, -0.05);
    tailLow.rotation.x = -0.55;
    const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), creamFur);
    tailTip.position.set(0, 0.17, -0.1);
    tailPivot.add(tailLow, tailTip);
    bodyPivot.add(headPivot, tailPivot);
  } else if (planetId === "kitty-changbai") {
    // 🦌 长白山梅花小鹿
    const fawnFur = toon("#d97736");
    const creamSpot = toon("#fffbeb");
    const antlerMat = toon("#fde68a");
    makeLegs("#c26427", 0.22, 0.024, 0.068, 0.11);
    const torso = new THREE.Mesh(new THREE.SphereGeometry(0.145, 14, 12), fawnFur);
    torso.scale.set(0.84, 0.88, 1.38);
    torso.position.y = 0.29;
    const chest = new THREE.Mesh(new THREE.SphereGeometry(0.095, 10, 8), creamSpot);
    chest.position.set(0, 0.28, 0.12);
    bodyPivot.add(torso, chest);
    for (const [sx, sy, sz] of [[-0.08, 0.34, -0.02], [0.08, 0.34, 0.03], [-0.07, 0.32, -0.11], [0.07, 0.33, -0.09]]) {
      const sp = new THREE.Mesh(new THREE.SphereGeometry(0.026, 6, 6), creamSpot);
      sp.position.set(sx, sy, sz);
      bodyPivot.add(sp);
    }
    headPivot.position.set(0, 0.44, 0.17);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.112, 12, 10), fawnFur);
    const snout = new THREE.Mesh(new THREE.SphereGeometry(0.058, 10, 8), creamSpot);
    snout.position.set(0, -0.022, 0.086);
    for (const sx of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), fawnFur);
      ear.scale.set(1.3, 0.55, 0.5);
      ear.position.set(sx * 0.11, 0.05, 0);
      ear.rotation.z = sx * 0.35;
      const antler = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, 0.12, 6), antlerMat);
      antler.position.set(sx * 0.048, 0.13, 0.01);
      antler.rotation.z = -sx * 0.22;
      headPivot.add(ear, antler);
    }
    addEyesAndBlush(headPivot, 0.05, 0.015, 0.096);
    headPivot.add(head, snout);
    tailPivot.position.set(0, 0.33, -0.19);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.09, 6), creamSpot);
    tail.rotation.x = 0.6;
    tailPivot.add(tail);
    bodyPivot.add(headPivot, tailPivot);
  } else if (planetId === "kitty-yading") {
    // 🐿️ 亚丁栈道抱松果小松鼠（还原 kitty.docx 稻城亚丁npc！）
    const brownFur = toon("#b46535");
    const bellyFur = toon("#faeed7");
    const pineConeMat = toon("#6b3e23");
    makeLegs("#965026", 0.14, 0.025, 0.062, 0.075);
    const torso = new THREE.Mesh(new THREE.SphereGeometry(0.135, 14, 12), brownFur);
    torso.scale.set(0.92, 1.18, 0.95);
    torso.position.set(0, 0.24, 0.02);
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.105, 12, 10), bellyFur);
    belly.scale.set(0.82, 1.05, 0.65);
    belly.position.set(0, 0.23, 0.075);
    // 双手捧着一颗可爱松果
    const pineCone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.048, 0), pineConeMat);
    pineCone.scale.set(0.85, 1.2, 0.85);
    pineCone.position.set(0, 0.25, 0.155);
    bodyPivot.add(torso, belly, pineCone);

    headPivot.position.set(0, 0.4, 0.06);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.105, 12, 10), brownFur);
    for (const sx of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.034, 8, 8), brownFur);
      ear.scale.set(0.7, 1.15, 0.5);
      ear.position.set(sx * 0.072, 0.095, 0.0);
      headPivot.add(ear);
    }
    addEyesAndBlush(headPivot, 0.048, 0.015, 0.092);
    headPivot.add(head);

    // 超大蓬松翘起的大松鼠尾巴！
    tailPivot.position.set(0, 0.2, -0.1);
    const t1 = new THREE.Mesh(new THREE.SphereGeometry(0.115, 12, 10), brownFur);
    t1.scale.set(0.78, 1.35, 0.95);
    t1.position.set(0, 0.12, -0.09);
    const t2 = new THREE.Mesh(new THREE.SphereGeometry(0.105, 12, 10), brownFur);
    t2.position.set(0, 0.27, -0.11);
    tailPivot.add(t1, t2);
    bodyPivot.add(headPivot, tailPivot);
  } else if (planetId === "kitty-sunset" || planetId === "miemie-shexiang") {
    // 🐇 追光长耳星云兔
    const whiteFur = toon("#fffaf5");
    const pinkMat = toon("#f9a8d4");
    makeLegs("#f5ebe1", 0.13, 0.026, 0.065, 0.085);
    const torso = new THREE.Mesh(new THREE.SphereGeometry(0.145, 14, 12), whiteFur);
    torso.scale.set(0.95, 0.92, 1.2);
    torso.position.y = 0.22;
    bodyPivot.add(torso);
    headPivot.position.set(0, 0.34, 0.14);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), whiteFur);
    for (const sx of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.034, 10, 8), whiteFur);
      ear.scale.set(0.65, 2.5, 0.45);
      ear.position.set(sx * 0.052, 0.145, -0.01);
      ear.rotation.z = -sx * 0.14;
      const inner = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), pinkMat);
      inner.scale.set(0.6, 2.1, 0.4);
      inner.position.set(sx * 0.052, 0.14, 0.008);
      inner.rotation.z = -sx * 0.14;
      headPivot.add(ear, inner);
    }
    addEyesAndBlush(headPivot, 0.048, 0.012, 0.096);
    headPivot.add(head);
    tailPivot.position.set(0, 0.23, -0.17);
    tailPivot.add(new THREE.Mesh(new THREE.SphereGeometry(0.052, 10, 8), whiteFur));
    bodyPivot.add(headPivot, tailPivot);
  } else if (planetId === "kitty-wusun" || planetId === "miemie-hulunbuir" || planetId === "miemie-longji") {
    // 🐴 天山小马驹
    const horseCoat = toon("#9a5b37");
    const maneMat = toon("#3b2316");
    const blazeMat = toon("#fff8eb");
    makeLegs("#6e3e23", 0.24, 0.028, 0.075, 0.13);
    const torso = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 12), horseCoat);
    torso.scale.set(0.86, 0.88, 1.38);
    torso.position.y = 0.31;
    bodyPivot.add(torso);
    headPivot.position.set(0, 0.45, 0.2);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.075, 0.16, 10), horseCoat);
    neck.position.set(0, -0.05, -0.02);
    neck.rotation.x = 0.35;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 10), horseCoat);
    head.scale.set(0.88, 0.92, 1.32);
    head.position.set(0, 0.03, 0.04);
    const blaze = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), blazeMat);
    blaze.position.set(0, 0.04, 0.13);
    const mane = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.16, 0.08), maneMat);
    mane.position.set(0, 0.02, -0.05);
    for (const sx of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.026, 0.068, 6), horseCoat);
      ear.position.set(sx * 0.05, 0.12, 0.01);
      headPivot.add(ear);
    }
    addEyesAndBlush(headPivot, 0.052, 0.038, 0.12);
    headPivot.add(neck, head, blaze, mane);
    tailPivot.position.set(0, 0.33, -0.22);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.048, 0.22, 8), maneMat);
    tail.position.set(0, -0.06, -0.06);
    tail.rotation.x = 2.4;
    tailPivot.add(tail);
    bodyPivot.add(headPivot, tailPivot);
  } else {
    // zhagana 高山小黑牦牛
    const coat = toon("#2d272b");
    const muzzleMat = toon("#f6f3eb");
    const hornMat = toon("#efe2c6");
    makeLegs("#201c1f", 0.2, 0.033, 0.085, 0.12);
    const torso = new THREE.Mesh(new THREE.SphereGeometry(0.185, 14, 12), coat);
    torso.scale.set(0.95, 0.88, 1.28);
    torso.position.y = 0.29;
    bodyPivot.add(torso);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const skirt = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.13, 7), coat);
      skirt.position.set(Math.cos(a) * 0.14, 0.18, Math.sin(a) * 0.17);
      bodyPivot.add(skirt);
    }
    headPivot.position.set(0, 0.35, 0.23);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), coat);
    const snout = new THREE.Mesh(new THREE.SphereGeometry(0.072, 10, 8), muzzleMat);
    snout.scale.set(1.1, 0.8, 0.9);
    snout.position.set(0, -0.025, 0.08);
    for (const sx of [-1, 1]) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.09, 8), hornMat);
      horn.position.set(sx * 0.085, 0.095, 0.0);
      horn.rotation.z = -sx * 0.45;
      headPivot.add(horn);
    }
    addEyesAndBlush(headPivot, 0.056, 0.022, 0.092);
    headPivot.add(head, snout);
    tailPivot.position.set(0, 0.31, -0.22);
    const tail = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), coat);
    tail.scale.set(0.8, 0.8, 1.8);
    tail.position.z = -0.06;
    tailPivot.add(tail);
    bodyPivot.add(headPivot, tailPivot);
  }

  root.scale.setScalar(1.12);
  const particles = createJoyParticles(planetId === "tengger" ? 0.82 : 0.66);
  root.add(particles.group);

  return {
    root,
    animate(dt, elapsed, isWalking, reactBlend, napBlend = 0) {
      const awake = 1 - napBlend;
      const w = (isWalking ? 1 : 0) * awake;
      const effReact = reactBlend * awake;
      const walkSwing = Math.sin(elapsed * 7.2) * 0.42 * w;
      for (const l of legs) {
        const walkRot = Math.sin(elapsed * 7.2 + l.phase) * 0.42 * w;
        const napFold = (l.sz > 0 ? -0.55 : 0.55) * napBlend;
        l.mesh.rotation.x = walkRot + napFold;
      }

      let activeY = Math.abs(Math.sin(elapsed * 7.2)) * 0.026 * w;

      if (planetId === "yading" && standPivot) {
        // 土拨鼠直立捧胸歪头杀（围炉小憩时乖巧趴伏）
        standPivot.rotation.x = -1.22 * effReact + 0.14 * napBlend;
        headPivot.rotation.x = 1.15 * effReact + 0.12 * napBlend;
        headPivot.rotation.z = Math.sin(elapsed * 3.4) * 0.22 * effReact;
        for (const arm of frontArms) {
          arm.mesh.rotation.x = 0.6 * effReact + walkSwing * (1 - effReact) - 0.35 * napBlend;
          arm.mesh.rotation.z = -arm.side * 0.55 * effReact;
        }
      } else if (planetId === "yili" || planetId === "luca-tianshan") {
        // 小羊羔欢快双连跳
        const hop = Math.max(0, Math.sin(elapsed * 6.5)) * 0.11 * effReact;
        activeY += hop;
        headPivot.rotation.x = 0.16 * napBlend;
        headPivot.rotation.z = Math.sin(elapsed * 4.0) * 0.18 * effReact;
      } else if (planetId === "maclehose" || planetId === "luca-hainan") {
        // 宜家小蓝鲨欢快扑棱胸鳍 + 软弹贴地游动摇摆
        const hop = Math.abs(Math.sin(elapsed * 6.0)) * (0.035 * w + 0.075 * effReact);
        activeY += hop;
        bodyPivot.rotation.y = Math.sin(elapsed * (5.5 + effReact * 4.0)) * (0.12 * w + 0.18 * effReact);
        bodyPivot.rotation.z = Math.sin(elapsed * 4.2) * 0.14 * effReact;
        for (const f of sharkFins) {
          f.pivot.rotation.z = f.side * Math.sin(elapsed * (7.0 + effReact * 6.0)) * (0.18 * w + 0.38 * effReact);
        }
      } else {
        headPivot.rotation.z = Math.sin(elapsed * 3.1) * 0.2 * effReact;
        headPivot.rotation.x = Math.sin(elapsed * 2.4) * 0.14 * effReact + 0.16 * napBlend;
      }

      bodyPivot.position.y = THREE.MathUtils.lerp(activeY, -0.07, napBlend);
      const breath = Math.sin(elapsed * 1.6) * 0.032 * napBlend;
      bodyPivot.scale.set(1 + breath, 1 - breath * 0.65, 1 + breath * 0.5);

      if (bellMesh) {
        bellMesh.rotation.z = Math.sin(elapsed * 8.0) * (0.12 + effReact * 0.35) * awake;
      }
      const awakeTail = Math.sin(elapsed * (4.5 + effReact * 5.0)) * (0.22 + effReact * 0.38);
      const calmTail = Math.sin(elapsed * 1.2) * 0.04;
      tailPivot.rotation.y = THREE.MathUtils.lerp(awakeTail, calmTail, napBlend);
      particles.update(elapsed, effReact);
    },
  };
}

export function buildPlanetCreature(planetConfig, initiallyBonded = false) {
  const pid = planetConfig.creatureType || planetConfig.id;
  const meta = CREATURE_META[planetConfig.id] || CREATURE_META[pid] || CREATURE_META.siguniang;
  const anchorWp = planetConfig.waypoints[1] || planetConfig.waypoints[0];
  const homeDir = latLonToUnitVec(anchorWp.lat + 8, anchorWp.lon - 11);

  const upDir = homeDir.clone();
  const forwardDir = UP.clone()
    .sub(upDir.clone().multiplyScalar(upDir.y))
    .normalize();
  if (forwardDir.lengthSq() < 0.001) forwardDir.set(1, 0, 0);

  const rig = buildCreatureMesh(pid);
  const group = rig.root;
  let bonded = Boolean(initiallyBonded);
  let seededNearHiker = !bonded;
  let wanderTurn = 0.35;
  let reactBlend = 0;
  let napBlend = 0;
  let bondFlash = 0;

  const prevHikerUp = new THREE.Vector3();
  const inferredForward = new THREE.Vector3(0, 0, 1);
  const effHikerUp = new THREE.Vector3();
  const effHikerFwd = new THREE.Vector3();
  const hikerRight = new THREE.Vector3();
  const targetDir = new THREE.Vector3();
  const tmpRight = new THREE.Vector3();
  const tmpMat = new THREE.Matrix4();
  const tmpProj = new THREE.Vector3();
  const tmpToTarget = new THREE.Vector3();
  const tmpDesiredFwd = new THREE.Vector3();
  const tmpAxis = new THREE.Vector3();

  function projectTangent(vec, normal, fallback) {
    vec.sub(tmpProj.copy(normal).multiplyScalar(vec.dot(normal)));
    if (vec.lengthSq() < 1e-6) {
      if (fallback) vec.copy(fallback);
      else vec.set(1, 0, 0).sub(tmpProj.copy(normal).multiplyScalar(normal.x));
      if (vec.lengthSq() < 1e-6) vec.set(0, 0, 1);
    }
    return vec.normalize();
  }

  // 轻触互动：宽松透明点选碰撞球 + 头顶欢欣金色星芒粒子
  const hitSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.68, 8, 8),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  hitSphere.position.set(0, 0.35, 0);
  group.add(hitSphere);

  const joyGroup = new THREE.Group();
  joyGroup.visible = false;
  const joyStars = [];
  const joyMat = new THREE.MeshBasicMaterial({ color: "#ffe27a", transparent: true, opacity: 0.95 });
  for (let i = 0; i < 3; i++) {
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.065, 0), joyMat.clone());
    joyGroup.add(star);
    joyStars.push(star);
  }
  group.add(joyGroup);
  let petTimer = 0;
  const PET_LINES = {
    tengger: "🐪 小骆驼开心地晃了晃驼铃，蹭了蹭你的掌心！",
    yading: "🦦 雪山旱獭捧着爪子原地蹦了一下，朝你咧嘴笑！",
    zhagana: "🦬 小黑牦牛欢快地摇起绒尾巴，轻轻顶了顶你的衣角！",
    siguniang: "🦊 星辰小狐狸眯起眼睛转了个圈：“被驯养的感觉真好呀。”",
    maclehose: "🦈 海湾抱抱鲨扑棱着软乎乎的胸鳍，开心地蹦起浪花！",
    yili: "🐑 草原小羊羔像云朵一样蹦跳起来，发出软糯轻鸣！",
  };

  function syncTransform() {
    const hop = petTimer > 0 ? Math.abs(Math.sin(petTimer * Math.PI * 2.5)) * 0.34 : 0;
    const r = getSurfaceRadius(pid, upDir) + hop;
    group.position.copy(upDir).multiplyScalar(r);
    projectTangent(forwardDir, upDir);
    tmpRight.crossVectors(upDir, forwardDir).normalize();
    forwardDir.crossVectors(tmpRight, upDir).normalize();
    tmpMat.makeBasis(tmpRight, upDir, forwardDir);
    group.quaternion.setFromRotationMatrix(tmpMat);
    if (petTimer > 0) {
      const spin = (1 - petTimer / 1.35) * Math.PI * 2;
      group.rotateY(spin);
    }
  }
  syncTransform();

  return {
    group,
    hitSphere,
    info: meta,
    pet() {
      bonded = true;
      bondFlash = 1.0;
      petTimer = 1.35;
      joyGroup.visible = true;
      return PET_LINES[pid] || `${meta.emoji} ${meta.name}开心地围着你跳了一圈！`;
    },
    get isBonded() {
      return bonded;
    },
    getUnitDir: () => upDir.clone(),
    update(dt, elapsed, state, onGreet) {
      const stateObj = state && state.isVector3 ? { hikerPos: state } : state || {};
      const hikerPos = stateObj.hikerPos || null;
      const isCampfire = Boolean(stateObj.isCampfire);

      let hasHiker = false;
      if (stateObj.hikerUp && stateObj.hikerUp.lengthSq() > 1e-6) {
        effHikerUp.copy(stateObj.hikerUp).normalize();
        hasHiker = true;
      } else if (hikerPos && hikerPos.lengthSq() > 1e-6) {
        effHikerUp.copy(hikerPos).normalize();
        hasHiker = true;
      }

      if (hasHiker) {
        if (prevHikerUp.lengthSq() > 1e-6) {
          tmpToTarget.copy(effHikerUp).sub(prevHikerUp);
          if (tmpToTarget.lengthSq() > 1e-7) {
            projectTangent(tmpToTarget, effHikerUp, inferredForward);
            inferredForward.copy(tmpToTarget);
          }
        }
        prevHikerUp.copy(effHikerUp);

        if (stateObj.hikerForward && stateObj.hikerForward.lengthSq() > 1e-6) {
          effHikerFwd.copy(stateObj.hikerForward);
          projectTangent(effHikerFwd, effHikerUp, inferredForward);
        } else {
          effHikerFwd.copy(inferredForward);
          projectTangent(effHikerFwd, effHikerUp);
        }
        hikerRight.crossVectors(effHikerUp, effHikerFwd).normalize();

        if (!seededNearHiker) {
          seededNearHiker = true;
          upDir
            .copy(effHikerUp)
            .addScaledVector(effHikerFwd, -0.18)
            .addScaledVector(hikerRight, 0.12)
            .normalize();
          forwardDir.copy(effHikerFwd);
          syncTransform();
        }
      }

      const dist = hikerPos
        ? group.position.distanceTo(hikerPos)
        : hasHiker
          ? upDir.angleTo(effHikerUp) * 12
          : 999;

      if (!bonded && dist < 3.0) {
        bonded = true;
        bondFlash = 1.0;
        if (onGreet) onGreet(meta, true);
      }
      bondFlash = Math.max(0, bondFlash - dt * 0.45);

      let isWalking = false;
      let targetReact = 0;
      let targetNap = 0;

      if (!bonded || !hasHiker) {
        // 未结伴：围绕栖息地柔和漫步
        isWalking = true;
        wanderTurn += Math.sin(elapsed * 0.7) * dt * 0.4;
        tmpToTarget.copy(homeDir).sub(upDir);
        if (upDir.angleTo(homeDir) > 0.24) {
          projectTangent(tmpToTarget, upDir, forwardDir);
          forwardDir.lerp(tmpToTarget, Math.min(1, dt * 1.8)).normalize();
        } else {
          forwardDir.applyAxisAngle(upDir, Math.sin(wanderTurn) * dt * 0.55).normalize();
        }
        tmpAxis.crossVectors(upDir, forwardDir);
        if (tmpAxis.lengthSq() > 1e-6) {
          tmpAxis.normalize();
          const stepAngle = 0.048 * dt;
          upDir.applyAxisAngle(tmpAxis, stepAngle).normalize();
          forwardDir.applyAxisAngle(tmpAxis, stepAngle).normalize();
        }
      } else if (isCampfire) {
        // 已结伴 · 围炉夜话模式：走近篝火与行者身侧乖巧蜷伏小憩
        targetDir
          .copy(effHikerUp)
          .addScaledVector(effHikerFwd, 0.045)
          .addScaledVector(hikerRight, 0.055)
          .normalize();
        const ang = upDir.angleTo(targetDir);
        if (ang > 0.015) {
          isWalking = true;
          tmpToTarget.copy(targetDir);
          projectTangent(tmpToTarget, upDir, forwardDir);
          forwardDir.lerp(tmpToTarget, Math.min(1, dt * 8.5));
          projectTangent(forwardDir, upDir, tmpToTarget);
          const stepAngle = Math.min(ang, THREE.MathUtils.clamp(ang * 4.0, 0.22, 1.2) * dt);
          tmpAxis.crossVectors(upDir, tmpToTarget);
          if (tmpAxis.lengthSq() > 1e-6) {
            tmpAxis.normalize();
            upDir.applyAxisAngle(tmpAxis, stepAngle).normalize();
            forwardDir.applyAxisAngle(tmpAxis, stepAngle).normalize();
          }
        } else {
          isWalking = false;
          targetNap = 1;
          // 面向温暖篝火与行者方向安静小憩
          tmpDesiredFwd.copy(effHikerFwd).multiplyScalar(0.55).addScaledVector(hikerRight, -0.55);
          projectTangent(tmpDesiredFwd, upDir, forwardDir);
          forwardDir.lerp(tmpDesiredFwd, Math.min(1, dt * 4.5));
          projectTangent(forwardDir, upDir);
        }
      } else {
        // 已结伴 · 星球探索模式：如《小王子》狐狸般跟在行者右后侧小跑相随
        targetDir
          .copy(effHikerUp)
          .addScaledVector(effHikerFwd, -0.085)
          .addScaledVector(hikerRight, 0.065)
          .normalize();
        const ang = upDir.angleTo(targetDir);
        if (ang > 0.018) {
          isWalking = true;
          targetReact = Math.max(0.15, bondFlash);
          tmpToTarget.copy(targetDir);
          projectTangent(tmpToTarget, upDir, forwardDir);
          forwardDir.lerp(tmpToTarget, Math.min(1, dt * 9.0));
          projectTangent(forwardDir, upDir, tmpToTarget);
          const stepAngle = Math.min(ang, THREE.MathUtils.clamp(ang * 4.2, 0.24, 1.35) * dt);
          tmpAxis.crossVectors(upDir, tmpToTarget);
          if (tmpAxis.lengthSq() > 1e-6) {
            tmpAxis.normalize();
            upDir.applyAxisAngle(tmpAxis, stepAngle).normalize();
            forwardDir.applyAxisAngle(tmpAxis, stepAngle).normalize();
          }
        } else {
          isWalking = false;
          targetReact = Math.max(0.65, bondFlash);
          // 停步在侧，顺着行者朝向并微侧首望向行者，轻摇尾巴歪头陪伴
          tmpToTarget.copy(effHikerUp).sub(upDir);
          projectTangent(tmpToTarget, upDir, effHikerFwd);
          tmpDesiredFwd.copy(effHikerFwd).multiplyScalar(0.65).addScaledVector(tmpToTarget, 0.35);
          projectTangent(tmpDesiredFwd, upDir, forwardDir);
          forwardDir.lerp(tmpDesiredFwd, Math.min(1, dt * 5.0));
          projectTangent(forwardDir, upDir);
        }
      }

      reactBlend = THREE.MathUtils.lerp(reactBlend, targetReact, Math.min(1, dt * 5.0));
      napBlend = THREE.MathUtils.lerp(napBlend, targetNap, Math.min(1, dt * 4.0));

      if (petTimer > 0) {
        petTimer = Math.max(0, petTimer - dt);
        const prog = 1 - petTimer / 1.35;
        joyStars.forEach((s, idx) => {
          const a = prog * 5.2 + idx * ((Math.PI * 2) / 3);
          s.position.set(Math.cos(a) * 0.28, 0.62 + prog * 0.55 + idx * 0.08, Math.sin(a) * 0.28);
          s.rotation.y += dt * 5;
          s.material.opacity = Math.max(0, 1 - prog * 0.85);
        });
        if (petTimer <= 0) joyGroup.visible = false;
      }

      syncTransform();
      rig.animate(dt, elapsed, isWalking || petTimer > 0, Math.max(reactBlend, petTimer > 0 ? 1 : 0), napBlend);
    },
  };
}
