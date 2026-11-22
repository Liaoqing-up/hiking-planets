/**
 * Cloudflare Pages Function: /api/ai-inspire
 * 边缘端 AI 识图配色与星语诗行引擎
 * - 若 Cloudflare Pages 绑定了 Workers AI (`env.AI`)，自动调用边缘大模型生成定制地貌与诗句
 * - 若未绑定或网络超时，使用零成本确定性山海诗学引擎即时返回地貌、守护灵与手账寄语
 */

const VALID_TEMPLATES = ["snow", "volcano", "sunset", "meadow", "desert", "coast"];
const VALID_CREATURES = [
  "kitty-changbai",
  "kitty-yading",
  "siguniang",
  "maclehose",
  "kitty-sunset",
  "yili",
];

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, authorization",
    "Access-Control-Max-Age": "86400",
  };
}

function hashSeed(str) {
  let h = 2166136261;
  const s = String(str || "hikerstars");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function buildDeterministicInspiration({ planetName = "未命名远山", elevation = "3000m", gpxSummary = null }) {
  const elevNum = parseInt(String(elevation).replace(/[^\d]/g, ""), 10) || 2800;
  const name = String(planetName || "远山").trim();
  const seed = hashSeed(`${name}|${elevNum}`);

  let template = "meadow";
  if (/雪|冰|峰|梅里|贡嘎|珠峰|四姑娘|亚丁|神山/.test(name) || elevNum >= 4000) {
    template = "snow";
  } else if (/火山|熔岩|乌兰察布|腾冲|长白/.test(name)) {
    template = "volcano";
  } else if (/海|岛|湾|礁|麦理浩|浪|澳/.test(name) || elevNum <= 550) {
    template = "coast";
  } else if (/沙|戈壁|敦煌|西北|丹霞|雅丹/.test(name)) {
    template = "desert";
  } else if (/日落|晚霞|秋|红叶|金顶|武功/.test(name)) {
    template = "sunset";
  } else {
    template = VALID_TEMPLATES[seed % VALID_TEMPLATES.length];
  }

  const CREATURE_BY_TPL = {
    snow: "kitty-yading",
    volcano: "kitty-changbai",
    coast: "maclehose",
    desert: "kitty-sunset",
    sunset: "kitty-sunset",
    meadow: "yili",
  };
  const creature = CREATURE_BY_TPL[template] || VALID_CREATURES[seed % VALID_CREATURES.length];

  const QUOTES = [
    `风吹过${name}的山脊，把每一步脚印都酿成了星光。`,
    `在海拔 ${elevation} 的云端回望，群山沉默，却替我们记住了所有热爱。`,
    `山不向我走来，我便向${name}走去，把呼吸留在离星星最近的地方。`,
    `所有翻山越岭的疲惫，都在看见${name}天际线的那一刻化作了温柔。`,
  ];

  const distNote = gpxSummary?.distanceKm
    ? `全程徒步 ${gpxSummary.distanceKm} km、累计爬升 ${gpxSummary.elevationGainM || 0} m。`
    : `在海拔 ${elevation} 的山海之间，`;

  return {
    template,
    creature,
    quote: QUOTES[seed % QUOTES.length],
    memory: `${distNote}登顶「${name}」的那一刻，山风拂过耳畔，我们将这段真实的远行封存在属于自己的小星球上。`,
    edgeEngine: "cloudflare-poetic-engine",
  };
}

export async function onRequest(context) {
  const { request, env } = context;
  const cors = corsHeaders(request.headers.get("Origin"));

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ ok: true, service: "hikerstars-ai-inspire" }), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json; charset=utf-8" },
    });
  }

  let body = {};
  try {
    body = await request.json();
  } catch (_) {}

  const fallback = buildDeterministicInspiration(body);

  // 若绑定了 Cloudflare Workers AI (env.AI)，尝试生成定制诗句
  if (env && env.AI && typeof env.AI.run === "function") {
    try {
      const prompt = `你是一位温暖浪漫的户外徒步诗人。用户刚去过「${body.planetName || "远山"}」（海拔 ${body.elevation || "3000m"}）。请输出严格 JSON：{"template":"snow|volcano|sunset|meadow|desert|coast 之一","quote":"一句26字以内的中文星语诗句","memory":"一段55字以内的中文登顶手账回忆"}`;
      const aiRes = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        messages: [{ role: "user", content: prompt }],
        max_tokens: 180,
      });
      const text = aiRes?.response || "";
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return new Response(
          JSON.stringify({
            template: VALID_TEMPLATES.includes(parsed.template) ? parsed.template : fallback.template,
            creature: fallback.creature,
            quote: parsed.quote || fallback.quote,
            memory: parsed.memory || fallback.memory,
            edgeEngine: "workers-ai-llama3",
          }),
          {
            status: 200,
            headers: { ...cors, "Content-Type": "application/json; charset=utf-8" },
          }
        );
      }
    } catch (_) {}
  }

  return new Response(JSON.stringify(fallback), {
    status: 200,
    headers: { ...cors, "Content-Type": "application/json; charset=utf-8" },
  });
}
