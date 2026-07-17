/* =========================================================
 * engines.js — 한식 마스터 [게임 엔진 / 프레임워크]
 *  ⚠️ 학생 여러분은 이 파일을 수정하지 마세요! (НЕ РЕДАГУЙТЕ ЦЕЙ ФАЙЛ)
 *  여기에는 공용 상태, 헬퍼, 그리고 조리 미니게임(썰기/볶기/끓이기 등)이
 *  들어 있습니다. game.js 에서 아래 값들을 가져다 씁니다:
 *    - state, DIFFICULTY, DISHES, I18N, ING, ing()
 *    - $(id), t(), cfg(), clamp(), shuffle()
 *    - ENGINES[type](stage, area, done)  ← 각 조리 단계 미니게임
 *    - ingVisual(id), dishImgURL(id), fillTile(el,id), actionEmoji(type)
 *    - feedback(msg,ok), flashOverlay(big,msg,ms,cb), beep(), stopLoops()
 *    - FX (소리/진동/흔들림)
 * ======================================================= */
"use strict";

// ---------- 난이도 파라미터 ----------
const DIFFICULTY = {
  easy:   { key: "easy",   emoji: "😊", zone: 0.36, chopMs: 1500, gauge: 9,  cuts: 4, pieces: 3, mash: 14, decoys: 2, base: 180, grill: [50, 88], chopTime: 36 },
  normal: { key: "normal", emoji: "🔥", zone: 0.20, chopMs: 1050, gauge: 16, cuts: 6, pieces: 4, mash: 22, decoys: 4, base: 240, grill: [55, 82], chopTime: 30 },
  hard:   { key: "hard",   emoji: "💀", zone: 0.10, chopMs: 720,  gauge: 26, cuts: 8, pieces: 5, mash: 32, decoys: 6, base: 320, grill: [60, 78], chopTime: 24 },
};

const state = {
  lang: "ko", diff: "easy", dish: null, sound: true,
  stages: [], stageIdx: 0, score: 0, qualities: [],
  teardown: [],
};

const $ = (id) => document.getElementById(id);
const t = () => I18N[state.lang];
const cfg = () => DIFFICULTY[state.diff];
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

/* =================================================================
 *  공용 UI 헬퍼
 * ============================================================== */
function actionEmoji(type) {
  return ({
    select: "🛒", chop: "🔪", mince: "🧄", stirfry: "🍳", boil: "🍲",
    grill: "🔥", season: "🥄", mix: "🥣", plate: "🍽️", rinse: "🚰",
    blanch: "💧", braise: "🍲", fryegg: "🍳",
  })[type] || "🍳";
}

function feedback(msg, ok) {
  const fb = $("feedback");
  fb.textContent = msg;
  fb.className = "feedback " + (ok ? "ok" : "bad");
}

// 재료 사진/벡터(있으면) / 이모지(없으면) 를 담은 요소 반환
const ASSET = "assets/ingredients/";
const IMG_EXTS = ["png", "svg", "webp", "jpg", "jpeg"];
// 재료 id → 실제 파일 경로 (assets/ingredients/ 기준)
const INGREDIENT_IMG = {
  rice: "food-rice.svg", egg: "food-egg.svg", carrot: "food-carrot.svg",
  spinach: "food-spinach.svg", mushroom: "food-mushroom.svg", beef: "food-meat.svg",
  noodle: "naengmyeon-noodle-nobg.png",
  gochujang: "gochujang-nobg.png", sesame: "food-sesame-oil-fixed.svg",
  soy: "food-soy sauce/한국기행_문화_여행_음식_내포_145_씨간장.jpg", garlic: "food-garlic.svg",
  scallion: "food-green onion.svg", sugar: "food-sugar.jpg", pear: "food-asia pear.svg",
  glassNoodle: "dangmyeon-nobg.png", doenjang: "doenjang-nobg.png", tofu: "food-tofu.svg",
  zucchini: "food-GlitchCourgette.svg", potato: "food-potato.svg", chili: "food-red chili.svg",
  cucumber: "food-Cucumber.svg", jujube: "food-jujube.jpg", pepper: "food-pepper.jpg",
  onion: "food-onion.svg", radish: "food-radish.svg",
  chives: "food-chives/한국기행_문화_여행_음식_풍경_여름강변_금강17_부추.jpg",
};
// 요리 id → 완성 사진
const DISH_IMG = {
  bibimbap: "비빔밥/한국기행_문화_여행_음식_남해바닷길_099_육회_비빔밥.jpg",
  bulgogi: "전라남도_강진_전복버섯불고기_03.jpg",
  japchae: "잡채/전라북도_전주_잡채.jpg",
  doenjang: "된장찌개/팔도음식 (1003).jpg",
  naengmyeon: "냉면/강원-춘천-평양냉면(물냉면)-002.jpg",
};
// 후보 URL 목록: 매핑에 있으면 그 파일, 없으면 빈 배열(→ 이모지로 표시)
function ingCandidates(id) {
  return INGREDIENT_IMG[id] ? [ASSET + encodeURI(INGREDIENT_IMG[id])] : [];
}
function dishImgURL(id) { return DISH_IMG[id] ? ASSET + encodeURI(DISH_IMG[id]) : null; }

function ingVisual(id, extraCls) {
  const el = document.createElement("span");
  el.className = "ing-visual" + (extraCls ? " " + extraCls : "");
  const emoji = ing(id).emoji;
  const cands = ingCandidates(id);
  if (!cands.length) { el.classList.add("is-emoji"); el.textContent = emoji; return el; }
  const img = document.createElement("img");
  img.alt = ing(id)[state.lang];
  img.decoding = "async";
  img.draggable = false;
  let ci = 0;
  img.onload = () => el.classList.add("has-img");
  img.onerror = () => {
    ci++;
    if (ci < cands.length) img.src = cands[ci];
    else { el.classList.add("is-emoji"); el.textContent = emoji; }
  };
  img.src = cands[0];
  el.appendChild(img);
  return el;
}
// .ingredient 타일 내용 채우기(사진+이름)
function fillTile(el, id) {
  el.innerHTML = "";
  const box = document.createElement("div"); box.className = "ing-emoji";
  box.appendChild(ingVisual(id));
  const nm = document.createElement("div"); nm.className = "ing-name"; nm.textContent = ing(id)[state.lang];
  el.appendChild(box); el.appendChild(nm);
}

function meterEl(labelText, color) {
  const wrap = document.createElement("div");
  wrap.className = "meter";
  wrap.innerHTML = `<div class="meter-label"><span>${labelText}</span><span class="meter-pct">0%</span></div>
    <div class="meter-track"><div class="meter-fill" style="background:${color}"></div></div>`;
  wrap.set = (pct) => {
    pct = clamp(pct, 0, 100);
    wrap.querySelector(".meter-fill").style.width = pct + "%";
    wrap.querySelector(".meter-pct").textContent = Math.round(pct) + "%";
  };
  return wrap;
}

// 재료가 튀는 작은 이펙트
function spawnBit(container, emoji) {
  const b = document.createElement("span");
  b.className = "fx-bit";
  b.textContent = emoji;
  const ang = (Math.random() - 0.5) * 120;
  b.style.setProperty("--tx", Math.round(Math.sin(ang * Math.PI / 180) * 60) + "px");
  b.style.left = (40 + Math.random() * 20) + "%";
  container.appendChild(b);
  setTimeout(() => b.remove(), 650);
}

/* =================================================================
 *  루프 / 정리 관리 (rAF + 포인터 리스너)
 * ============================================================== */
let rafId = null;
function loop(fn) {
  let last = performance.now();
  const tick = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (fn(dt) === false) return;
    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);
  onTeardown(() => { if (rafId) cancelAnimationFrame(rafId); rafId = null; });
}
function onTeardown(fn) { state.teardown.push(fn); }
function stopLoops() {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  (state.teardown || []).forEach((fn) => { try { fn(); } catch (e) {} });
  state.teardown = [];
}
// 문서 전역 포인터 리스너 등록(+자동 정리). 요소 밖으로 나가도 드래그 유지.
function onDoc(type, fn) {
  document.addEventListener(type, fn, { passive: false });
  onTeardown(() => document.removeEventListener(type, fn));
}
function pointerXY(e, el) {
  const r = el.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top, r };
}

/* =================================================================
 *  미니게임 엔진들
 *   각 engine(stage, area, done) → 완료 시 done(quality 0..1)
 * ============================================================== */
const ENGINES = {};

// ---- 재료 고르기 ----
ENGINES.select = function (stage, area, done) {
  const dict = t();
  const need = stage.need.slice();
  const decoyN = cfg().decoys;
  const decoys = shuffle(state.dish.decoys.slice()).slice(0, decoyN);
  const tiles = shuffle(need.concat(decoys));
  const collected = new Set();
  let mistakes = 0;

  const wrap = document.createElement("div");
  wrap.className = "select-wrap";
  wrap.innerHTML = `
    <div class="checklist" id="checklist">
      <div class="checklist-h">📋 ${dict.labels.checklist}</div>
      <div class="checklist-items"></div>
    </div>
    <div class="basket">🧺<span class="basket-count">0/${need.length}</span></div>
    <div class="market" id="market"></div>`;
  area.appendChild(wrap);

  const clItems = wrap.querySelector(".checklist-items");
  need.forEach((id) => {
    const ig = ing(id);
    const row = document.createElement("div");
    row.className = "cl-item";
    row.dataset.id = id;
    row.innerHTML = `<span class="cl-check">⬜</span><span>${ig.emoji} ${ig[state.lang]}</span>`;
    clItems.appendChild(row);
  });

  const market = wrap.querySelector("#market");
  tiles.forEach((id) => {
    const el = document.createElement("div");
    el.className = "ingredient";
    el.tabIndex = 0;
    fillTile(el, id);
    const pick = () => {
      if (need.includes(id)) {
        if (collected.has(id)) return;
        collected.add(id);
        el.classList.add("used");
        const row = clItems.querySelector(`[data-id="${id}"]`);
        if (row) { row.classList.add("done"); row.querySelector(".cl-check").textContent = "✅"; }
        wrap.querySelector(".basket-count").textContent = `${collected.size}/${need.length}`;
        wrap.querySelector(".basket").classList.add("pop");
        setTimeout(() => wrap.querySelector(".basket").classList.remove("pop"), 200);
        feedback(dict.labels.nice, true);
        beep(720, .08);
        if (collected.size === need.length) {
          const q = clamp(1 - mistakes * 0.12);
          setTimeout(() => done(q), 350);
        }
      } else {
        mistakes++;
        el.classList.add("flash-bad");
        setTimeout(() => el.classList.remove("flash-bad"), 350);
        feedback(dict.labels.oops, false);
        beep(180, .16, "square");
      }
    };
    el.onclick = pick;
    el.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } };
    market.appendChild(el);
  });
};

// 재료별 단면 색 (Canvas 렌더용)
const VEGCOLOR = {
  carrot:   { rim: "#e07b1f", core: "#ffb765", leaf: "#4a9a5e" },
  potato:   { rim: "#c79a52", core: "#f0dcab", leaf: "#b98a3a" },
  cucumber: { rim: "#3f7d34", core: "#d6ecac", leaf: "#2f6a28" },
  zucchini: { rim: "#4a8a3a", core: "#cfe8a0", leaf: "#356b28" },
  radish:   { rim: "#e8e0d2", core: "#fffaf0", leaf: "#4a9a5e" },
  onion:    { rim: "#e6dcc8", core: "#fff8ec", leaf: "#c9b98f" },
};
// 특정 재료 수동 회전각(라디안). 지정 안 하면 세로로 길면 자동으로 눕힘
const VEG_ROT = {};

// 이미지를 썰기 좋게 전처리: 세로로 길면 가로로 눕히고 여백 트림
function prepChopImage(img, forceRot) {
  if (forceRot != null) return rotTrim(img, forceRot);
  let c = rotTrim(img, 0);
  if (c.height > c.width * 1.25) c = rotTrim(c, Math.PI / 2);  // 세로 → 가로로 눕히기
  return c;
}
// 이미지를 회전시키고 투명 여백을 잘라내 꽉 차게 만든 캔버스 반환
function rotTrim(img, rot) {
  const w = img.naturalWidth || img.width || 100;
  const h = img.naturalHeight || img.height || 100;
  const cos = Math.abs(Math.cos(rot)), sin = Math.abs(Math.sin(rot));
  const rw = Math.max(1, Math.ceil(w * cos + h * sin));
  const rh = Math.max(1, Math.ceil(w * sin + h * cos));
  const c1 = document.createElement("canvas"); c1.width = rw; c1.height = rh;
  const x1 = c1.getContext("2d");
  x1.translate(rw / 2, rh / 2); x1.rotate(rot); x1.drawImage(img, -w / 2, -h / 2, w, h);
  let data;
  try { data = x1.getImageData(0, 0, rw, rh).data; } catch (e) { return c1; }
  let minX = rw, minY = rh, maxX = 0, maxY = 0, found = false;
  for (let y = 0; y < rh; y++) {
    for (let x = 0; x < rw; x++) {
      if (data[(y * rw + x) * 4 + 3] > 12) { found = true; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
    }
  }
  if (!found) return c1;
  const cw = maxX - minX + 1, ch = maxY - minY + 1;
  const c2 = document.createElement("canvas"); c2.width = cw; c2.height = ch;
  c2.getContext("2d").drawImage(c1, minX, minY, cw, ch, 0, 0, cw, ch);
  return c2;
}

// ---- 썰기 (Canvas 자유 절단: 여러 재료를 순서대로 썬다) ----
ENGINES.chop = function (stage, area, done) {
  const dict = t();
  const items = (stage.items || [stage.item]).slice();
  const cuts = cfg().cuts;

  const chopTime = cfg().chopTime || 30;
  let timeLeft = chopTime;

  const wrap = document.createElement("div");
  wrap.className = "chop-wrap";
  wrap.innerHTML = `
    <div class="chop-timer"><div class="chop-timer-fill" id="chopTimer"></div><span class="chop-timer-txt" id="chopTimerTxt"></span></div>
    <div class="prep-progress" id="prepProg"></div>
    <div class="chop-holder" id="holder">
      <canvas id="chopCanvas"></canvas>
      <div class="knife-cursor" id="knife">🔪</div>
    </div>
    <div class="chop-count" id="chopCount"></div>`;
  area.appendChild(wrap);

  const holder = wrap.querySelector("#holder");
  const canvas = wrap.querySelector("#chopCanvas");
  const knife = wrap.querySelector("#knife");
  const prog = wrap.querySelector("#prepProg");
  const timerFill = wrap.querySelector("#chopTimer");
  const timerTxt = wrap.querySelector("#chopTimerTxt");
  const ctx2d = canvas.getContext("2d");
  const dpr = Math.min(2, window.devicePixelRatio || 1);

  const pieces = [], juice = [], trail = [];
  let pressed = false, prevX = 0, prevY = 0;
  let W = 0, H = 0, bodyL, bodyR, midY, bodyH, curL, seg;
  // 현재 재료별 상태
  let itemIndex = 0, itemId, ig, col, cutsDone, curDone, vegImg, imgReady, natW, natH, qs;
  const itemQ = [];
  let finishedAll = false;

  // 상단 진행 표시(어떤 재료를 손질 중인지)
  function renderProgress() {
    prog.innerHTML = items.map((id, i) => {
      const cls = i < itemIndex ? "done" : (i === itemIndex ? "current" : "");
      return `<span class="prep-chip ${cls}">${ing(id).emoji}</span>`;
    }).join("");
  }

  function layout() {
    const r = holder.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    bodyL = W * 0.14; bodyR = W * 0.86; midY = H * 0.5;
    bodyH = Math.min(72, H * 0.34);
    if (curL === undefined) curL = bodyL;
    seg = (bodyR - bodyL) / (cuts + 1);
  }
  function fitImage() {
    const aspect = natW / natH;
    let bh = Math.min(H * 0.62, 158);
    let bw = bh * aspect;
    const maxW = W * 0.82;
    if (bw > maxW) { bw = maxW; bh = bw / aspect; }
    bodyL = (W - bw) / 2; bodyR = (W + bw) / 2; bodyH = bh;
    if (cutsDone === 0) curL = bodyL;
    seg = (bodyR - bodyL) / (cuts + 1);
  }
  const destToSrcX = (dx) => clamp((dx - bodyL) / (bodyR - bodyL)) * natW;
  function updateCount() {
    wrap.querySelector("#chopCount").textContent = `🔪 ${ig[state.lang]} · ${cutsDone} / ${cuts}  (${itemIndex + 1}/${items.length})`;
  }

  // 다음(또는 첫) 재료 로드
  function loadItem(i) {
    itemIndex = i; itemId = items[i]; ig = ing(itemId);
    col = VEGCOLOR[itemId] || { rim: "#d9b06a", core: "#f2e2c0", leaf: "#4a9a5e" };
    cutsDone = 0; curL = undefined; curDone = false; qs = [];
    vegImg = null; imgReady = false; natW = 1; natH = 1;
    pieces.length = 0; juice.length = 0;
    layout(); renderProgress(); updateCount();
    const cands = ingCandidates(itemId); let ci = 0;
    if (!cands.length) return;   // 이미지 없으면 그림(roundedLog)으로 대체
    const im = new Image();
    im.onload = () => { const pr = prepChopImage(im, VEG_ROT[itemId]); vegImg = pr; natW = pr.width; natH = pr.height; imgReady = true; fitImage(); };
    im.onerror = () => { ci++; if (ci < cands.length) im.src = cands[ci]; };
    im.src = cands[0];
  }

  function roundedLog(x0, x1, cy, h, rimC, coreC) {
    const r = h / 2;
    const g = ctx2d.createLinearGradient(0, cy - r, 0, cy + r);
    g.addColorStop(0, coreC); g.addColorStop(0.5, rimC); g.addColorStop(1, shade(rimC, -20));
    ctx2d.fillStyle = g;
    ctx2d.beginPath();
    ctx2d.moveTo(x0 + r, cy - r); ctx2d.lineTo(x1 - r, cy - r);
    ctx2d.arc(x1 - r, cy, r, -Math.PI / 2, Math.PI / 2);
    ctx2d.lineTo(x0 + r, cy + r); ctx2d.arc(x0 + r, cy, r, Math.PI / 2, -Math.PI / 2);
    ctx2d.closePath(); ctx2d.fill();
    ctx2d.fillStyle = coreC;
    ctx2d.beginPath(); ctx2d.ellipse(x0 + r, cy, r * 0.42, r * 0.78, 0, 0, Math.PI * 2); ctx2d.fill();
  }

  function draw() {
    ctx2d.clearRect(0, 0, W, H);
    if (bodyR - curL > 2) {
      if (imgReady) {
        const sL = destToSrcX(curL);
        ctx2d.drawImage(vegImg, sL, 0, natW - sL, natH, curL, midY - bodyH / 2, bodyR - curL, bodyH);
      } else roundedLog(curL, bodyR, midY, Math.min(72, bodyH), col.rim, col.core);
    }
    const nextX = bodyL + seg * (cutsDone + 1);
    if (!curDone && cutsDone < cuts) {
      ctx2d.strokeStyle = "rgba(220,60,40,.6)";
      ctx2d.lineWidth = 2.5; ctx2d.setLineDash([7, 6]);
      ctx2d.beginPath(); ctx2d.moveTo(nextX, midY - bodyH / 2 - 8); ctx2d.lineTo(nextX, midY + bodyH / 2 + 8); ctx2d.stroke();
      ctx2d.setLineDash([]);
    }
    for (let i = pieces.length - 1; i >= 0; i--) {
      const p = pieces[i];
      p.vy += 520 * p.dt; p.x += p.vx * p.dt; p.y += p.vy * p.dt; p.rot += p.va * p.dt;
      ctx2d.save(); ctx2d.translate(p.x, p.y); ctx2d.rotate(p.rot); ctx2d.globalAlpha = p.a;
      if (p.img && p.srcR > p.srcL) ctx2d.drawImage(p.img, p.srcL, 0, p.srcR - p.srcL, p.natH, -p.w / 2, -p.h / 2, p.w, p.h);
      else roundedLog(-p.w / 2, p.w / 2, 0, Math.min(72, p.h), p.rim, p.core);
      ctx2d.restore();
      if (p.y > H + 80) pieces.splice(i, 1);
    }
    for (let i = juice.length - 1; i >= 0; i--) {
      const j = juice[i];
      j.vy += 600 * j.dt; j.x += j.vx * j.dt; j.y += j.vy * j.dt; j.life -= j.dt;
      ctx2d.globalAlpha = clamp(j.life * 2); ctx2d.fillStyle = j.color;
      ctx2d.beginPath(); ctx2d.arc(j.x, j.y, j.r, 0, Math.PI * 2); ctx2d.fill();
      ctx2d.globalAlpha = 1;
      if (j.life <= 0) juice.splice(i, 1);
    }
    if (trail.length > 1) {
      ctx2d.strokeStyle = "rgba(255,255,255,.65)"; ctx2d.lineWidth = 3; ctx2d.lineCap = "round";
      ctx2d.beginPath(); ctx2d.moveTo(trail[0].x, trail[0].y);
      for (let i = 1; i < trail.length; i++) ctx2d.lineTo(trail[i].x, trail[i].y);
      ctx2d.stroke();
    }
  }

  function updateTimer() {
    const pct = clamp(timeLeft / chopTime) * 100;
    timerFill.style.width = pct + "%";
    timerFill.classList.toggle("warn", pct <= 45 && pct > 20);
    timerFill.classList.toggle("danger", pct <= 20);
    timerTxt.textContent = "⏱ " + Math.ceil(timeLeft) + "s";
  }
  updateTimer();

  loop((dt) => {
    pieces.forEach((p) => p.dt = dt);
    juice.forEach((j) => j.dt = dt);
    if (trail.length && !pressed) trail.shift();
    if (!finishedAll) {
      timeLeft -= dt;
      if (timeLeft <= 0) { timeLeft = 0; updateTimer(); timeOut(); }
      else updateTimer();
    }
    draw();
    return true;
  });

  // 시간 초과: 못 채운 만큼 감점하고 다음 스테이지로
  function timeOut() {
    if (finishedAll) return;
    finishedAll = true; curDone = true;
    // 현재 재료의 부분 점수 + 못 손질한 재료는 0점
    const curPartial = qs.length ? (qs.reduce((a, b) => a + b, 0) / qs.length) * (cutsDone / cuts) : 0;
    const sum = itemQ.reduce((a, b) => a + b, 0) + curPartial;
    const overall = clamp(sum / items.length);
    // 감점: 못 끝낸 재료 수만큼 점수 차감
    const unfinished = items.length - itemQ.length;
    const penalty = Math.round(cfg().base * 0.5) * unfinished;
    state.score = Math.max(0, state.score - penalty);
    $("hudScore").textContent = state.score;
    feedback(dict.labels.timeUp + " -" + penalty, false);
    FX.fail(); FX.vibrate([60, 40, 60]); FX.shake(holder, 1);
    setTimeout(() => done(overall), 900);
  }

  function makeCut(cx) {
    if (curDone || finishedAll) return;
    cx = Math.max(curL + 4, Math.min(bodyR, cx));
    if (cx - curL < seg * 0.4) return;
    const w = cx - curL;
    pieces.push({ x: (curL + cx) / 2, y: midY, w, h: bodyH, img: imgReady ? vegImg : null, natH, srcL: destToSrcX(curL), srcR: destToSrcX(cx), rim: col.rim, core: col.core, vx: (Math.random() * 80 - 40), vy: -120 - Math.random() * 80, rot: 0, va: (Math.random() * 8 - 4), a: 1, dt: 0 });
    const jy = Math.min(bodyH, 60);
    for (let k = 0; k < 9; k++) juice.push({ x: cx, y: midY + (Math.random() * jy - jy / 2), color: col.core, vx: (Math.random() * 160 - 80), vy: -60 - Math.random() * 120, r: 1.5 + Math.random() * 2.5, life: 0.5 + Math.random() * 0.3, dt: 0 });
    curL = cx; cutsDone++;
    const idealX = bodyL + seg * cutsDone;
    qs.push(clamp(1 - Math.abs(cx - idealX) / (seg * 0.9), 0.3, 1));
    updateCount();
    knife.classList.remove("chop"); void knife.offsetWidth; knife.classList.add("chop");
    FX.chop(); FX.vibrate(18); FX.shake(holder, 0.7);
    feedback(qs[qs.length - 1] > 0.8 ? dict.labels.perfect : dict.labels.nice, true);
    if (cutsDone >= cuts && !curDone) {
      curDone = true;
      itemQ.push(qs.reduce((a, b) => a + b, 0) / qs.length);
      renderProgress();
      if (itemIndex + 1 < items.length) {
        setTimeout(() => loadItem(itemIndex + 1), 750);
      } else {
        finishedAll = true;
        const overall = itemQ.reduce((a, b) => a + b, 0) / itemQ.length;
        setTimeout(() => done(overall), 700);
      }
    }
  }

  function moveKnife(x, y) { knife.style.left = x + "px"; knife.style.top = y + "px"; }
  holder.addEventListener("pointerdown", (e) => {
    pressed = true;
    const p = pointerXY(e, holder); prevX = p.x; prevY = p.y;
    trail.length = 0; trail.push({ x: p.x, y: p.y });
    moveKnife(p.x, p.y);
    holder.setPointerCapture && holder.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  holder.addEventListener("pointermove", (e) => {
    const p = pointerXY(e, holder);
    moveKnife(p.x, p.y);
    knife.classList.remove("hide");
    if (pressed && !curDone && !finishedAll) {
      trail.push({ x: p.x, y: p.y }); if (trail.length > 10) trail.shift();
      if (prevY < midY && p.y >= midY && p.x >= curL && p.x <= bodyR) makeCut(p.x);
      prevX = p.x; prevY = p.y;
    }
  });
  const end = () => { pressed = false; };
  holder.addEventListener("pointerup", end);
  holder.addEventListener("pointercancel", end);
  holder.addEventListener("pointerleave", () => { knife.classList.add("hide"); });
  onTeardown(end);

  qs = [];
  loadItem(0);
};

// 색 밝기 조절 헬퍼
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
  r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// ---- 다지기 / 버무리기 / 헹구기 (빠른 연타) ----
function mashEngine(stage, area, done, opts) {
  const dict = t();
  const ig = ing(stage.item);
  const needTaps = cfg().mash * (opts.tapScale || 1);
  const decay = opts.decay; // 초당 감소
  const timeLimit = opts.time;
  let fill = 0, burn = 0, elapsed = 0, finished = false;

  const wrap = document.createElement("div");
  wrap.className = "mash-wrap";
  wrap.innerHTML = `<div class="mash-vessel" id="vessel">
      <div class="mash-emoji">${opts.emoji || ig.emoji}</div>
      <div class="mash-fx" id="mashFx"></div>
    </div>`;
  const cooked = meterEl(opts.label || dict.labels.done, "linear-gradient(90deg,#4a9a5e,#f2b134)");
  wrap.appendChild(cooked);
  let burnMeter = null;
  if (opts.burn) { burnMeter = meterEl(dict.labels.burn, "linear-gradient(90deg,#f2b134,#e5533c)"); wrap.appendChild(burnMeter); }
  const btn = document.createElement("button");
  btn.className = "tap-btn big";
  btn.textContent = (opts.btnEmoji || "👐") + " " + (dict.actions[stage.type] || "");
  wrap.appendChild(btn);
  area.appendChild(wrap);

  const fx = wrap.querySelector("#mashFx");
  const vessel = wrap.querySelector("#vessel");

  loop((dt) => {
    if (finished) return false;
    elapsed += dt;
    fill = Math.max(0, fill - decay * dt);
    if (opts.burn) burn = clamp(burn + opts.burnRate * dt, 0, 100);
    cooked.set(fill);
    if (burnMeter) burnMeter.set(burn);
    if (opts.burn && burn >= 100) return finish();
    if (timeLimit && elapsed >= timeLimit) return finish();
    return true;
  });

  function tap() {
    if (finished) return;
    fill = Math.min(100, fill + 100 / needTaps);
    if (opts.burn) burn = Math.max(0, burn - opts.burnRelief);
    cooked.set(fill);
    if (burnMeter) burnMeter.set(burn);
    vessel.classList.remove("shake"); void vessel.offsetWidth; vessel.classList.add("shake");
    spawnBit(fx, opts.emoji || ig.emoji);
    beep(300 + fill * 4, .04);
    if (fill >= 100) finish();
  }
  btn.onclick = tap;
  vessel.onclick = tap;

  function finish() {
    if (finished) return false;
    finished = true; stopLoops();
    let q = fill / 100;
    if (opts.burn) q *= clamp(1 - burn / 140);
    if (burn >= 100) feedback(dict.labels.burnt, false);
    else feedback(q > 0.8 ? dict.labels.perfect : dict.labels.nice, true);
    setTimeout(() => done(clamp(q)), 350);
    return false;
  }
}

// 다지기: 마늘을 직접 빠르게 두드려 다짐 (연타)
ENGINES.mince = (s, a, d) => mashEngine(s, a, d, { emoji: "🧄", btnEmoji: "🔪", decay: 22, time: 9 });

// ---- 볶기 / 버무리기 / 헹구기 (팬 안에서 원을 그리며 젓는 동작) ----
function stirEngine(stage, area, done, opts) {
  const dict = t();
  const foodIds = (stage.items || [stage.item]);
  const needDist = 130 * cfg().mash * (opts.distScale || 1); // 필요한 총 이동거리(px)
  let progress = 0, burn = 0, angle = 0, elapsed = 0, finished = false;
  let pressed = false, lastX = 0, lastY = 0, moving = 0;
  let heat = 1;                              // 불 세기(0.6 약 / 1 중 / 1.5 센)

  const wrap = document.createElement("div");
  wrap.className = "stir-wrap";
  wrap.innerHTML = `
    ${opts.burn ? `<div class="heat-knob" id="heat">
      <button data-h="0.6">🔥 <span>${dict.heat.low}</span></button>
      <button data-h="1" class="on">🔥🔥 <span>${dict.heat.mid}</span></button>
      <button data-h="1.5">🔥🔥🔥 <span>${dict.heat.high}</span></button>
    </div>` : ""}
    <div class="stir-pan ${opts.burn ? "hot" : ""}" id="pan">
      <div class="pan-flames" id="flames" aria-hidden="true"></div>
      <div class="stir-coat" id="coat" style="background:${opts.coat || "transparent"}"></div>
      <div class="stir-food" id="food"></div>
      <div class="stir-splash" id="splash"></div>
      <div class="stir-spoon" id="spoon">${opts.tool || "🥄"}</div>
      <div class="stir-hint" id="stirHint">↻</div>
    </div>`;
  const cooked = meterEl(opts.label || dict.labels.cooked, "linear-gradient(90deg,#4a9a5e,#f2b134)");
  wrap.appendChild(cooked);
  let burnMeter = null;
  if (opts.burn) { burnMeter = meterEl(dict.labels.burn, "linear-gradient(90deg,#f2b134,#e5533c)"); wrap.appendChild(burnMeter); }
  area.appendChild(wrap);

  const pan = wrap.querySelector("#pan");
  const spoon = wrap.querySelector("#spoon");
  const food = wrap.querySelector("#food");
  const hint = wrap.querySelector("#stirHint");
  const flames = wrap.querySelector("#flames");
  const coat = wrap.querySelector("#coat");
  const splash = wrap.querySelector("#splash");

  // 재료를 원형으로 배치(이미지) — 저으면 같이 돌며 섞임
  const pieceEls = [];
  foodIds.forEach((id, i) => {
    const ang = (i / foodIds.length) * Math.PI * 2 - Math.PI / 2;
    const rad = foodIds.length > 1 ? 30 : 0;
    const pc = document.createElement("div");
    pc.className = "stir-piece";
    pc.style.left = (50 + Math.cos(ang) * rad) + "%";
    pc.style.top = (50 + Math.sin(ang) * rad) + "%";
    pc.appendChild(ingVisual(id));
    food.appendChild(pc);
    pieceEls.push(pc);
  });
  // 섞임 표현용 색(재료 대표색)
  const splashColors = foodIds.map((id) => (VEGCOLOR[id] && VEGCOLOR[id].core) || opts.splashColor || "#f2b134");

  if (opts.burn) {
    FX.sizzleStart();
    wrap.querySelectorAll(".heat-knob button").forEach((b) => {
      b.onclick = () => {
        heat = parseFloat(b.dataset.h);
        wrap.querySelectorAll(".heat-knob button").forEach((x) => x.classList.toggle("on", x === b));
        pan.style.setProperty("--heat", heat);
        FX.ding(500 + heat * 200);
      };
    });
    pan.style.setProperty("--heat", 1);
  }

  loop((dt) => {
    if (finished) return false;
    elapsed += dt;
    moving = Math.max(0, moving - dt);
    if (opts.burn) {
      // 불이 셀수록 빨리 익지만 안 저으면 빨리 탐
      if (moving > 0) burn = Math.max(0, burn - opts.burnRelief * dt);
      else burn = clamp(burn + opts.burnRate * heat * dt, 0, 100);
      burnMeter.set(burn);
      FX.sizzleLevel(heat * (moving > 0 ? 1.1 : 0.5));
      flames.style.opacity = 0.35 + (heat - 0.6) * 0.5;
      if (burn >= 100) return finish();
    }
    const pct = (progress / needDist) * 100;
    cooked.set(pct);
    // 양념/기름이 골고루 배어드는 정도(오버레이 코팅)
    if (opts.coat) coat.style.opacity = (pct / 100) * 0.6 + (opts.burn ? burn / 220 : 0);
    if (progress >= needDist) return finish();
    return true;
  });

  function move(e) {
    const p = pointerXY(e, pan);
    spoon.style.left = p.x + "px";
    spoon.style.top = p.y + "px";
    if (!pressed) { lastX = p.x; lastY = p.y; return; }
    const dx = p.x - lastX, dy = p.y - lastY;
    const dist = Math.hypot(dx, dy);
    lastX = p.x; lastY = p.y;
    if (dist > 0.5) {
      progress = Math.min(needDist, progress + dist * (opts.burn ? heat : 1));
      moving = 0.25;
      angle += dist * 0.06;
      food.style.transform = `rotate(${angle}deg)`;
      hint.style.opacity = 0;
      // 재료들이 각자 통통 튀며 섞이는 느낌 + 양념 방울 튀김
      pieceEls.forEach((pc) => { pc.style.setProperty("--jig", (Math.random() * 8 - 4) + "px"); });
      if (Math.random() < 0.5) {
        const b = document.createElement("span");
        b.className = "splash-bit";
        b.style.background = splashColors[Math.floor(Math.random() * splashColors.length)];
        b.style.left = (30 + Math.random() * 40) + "%";
        b.style.top = (30 + Math.random() * 40) + "%";
        b.style.setProperty("--sx", (Math.random() * 40 - 20) + "px");
        b.style.setProperty("--sy", (Math.random() * 40 - 20) + "px");
        splash.appendChild(b);
        setTimeout(() => b.remove(), 450);
      }
      if (!opts.burn && Math.random() < 0.12) FX.tone(360 + Math.random() * 140, .03, "sine", 0.06);
    }
  }
  pan.addEventListener("pointerdown", (e) => { pressed = true; const p = pointerXY(e, pan); lastX = p.x; lastY = p.y; spoon.classList.add("grab"); pan.setPointerCapture && pan.setPointerCapture(e.pointerId); e.preventDefault(); });
  pan.addEventListener("pointermove", move);
  const up = () => { pressed = false; spoon.classList.remove("grab"); };
  pan.addEventListener("pointerup", up);
  pan.addEventListener("pointercancel", up);
  onTeardown(() => { up(); FX.sizzleStop(); });

  function finish() {
    if (finished) return false;
    finished = true; FX.sizzleStop(); stopLoops();
    let q = clamp(progress / needDist);
    if (opts.burn) q *= clamp(1 - burn / 140);
    if (burn >= 100) { feedback(dict.labels.burnt, false); FX.fail(); }
    else feedback(q > 0.8 ? dict.labels.perfect : dict.labels.nice, true);
    setTimeout(() => done(clamp(q)), 350);
    return false;
  }
}

ENGINES.mix     = (s, a, d) => stirEngine(s, a, d, { tool: "🥢", label: I18N[state.lang].labels.done, coat: "radial-gradient(circle at 50% 45%, rgba(210,70,40,.85), rgba(150,45,28,.5))", splashColor: "#d24a2a" });
ENGINES.rinse   = (s, a, d) => stirEngine(s, a, d, { tool: "🥢", distScale: 0.7, splashColor: "#bfe3ff" });
ENGINES.stirfry = (s, a, d) => stirEngine(s, a, d, { tool: "🥄", burn: true, burnRate: 13, burnRelief: 34, distScale: 1.1, coat: "radial-gradient(circle at 50% 45%, rgba(120,72,26,.95), rgba(78,44,16,.6))", splashColor: "#c98a3a" });

// ---- 끓이기 / 데치기 / 졸이기 / 계란 (게이지 타이밍) ----
function gaugeEngine(stage, area, done, opts) {
  const dict = t();
  const rise = cfg().gauge * (opts.speed || 1);
  const half = cfg().zone * 50;         // 초록 밴드 반폭
  const center = opts.center || 72;
  const lo = center - half, hi = center + half;
  let val = 0, finished = false;

  const wrap = document.createElement("div");
  wrap.className = "gauge-wrap";
  wrap.innerHTML = `
    <div class="pot-big">
      <div class="pot-food">${opts.emoji}</div>
      <div class="bubbles" id="bubbles"></div>
    </div>
    <div class="gauge">
      <div class="gauge-green" id="gGreen"></div>
      <div class="gauge-fill" id="gFill"></div>
      <div class="gauge-arrow" id="gArrow">◀</div>
    </div>
    <button class="tap-btn big done-btn" id="doneBtn">✅ ${dict.doneBtn}</button>`;
  area.appendChild(wrap);

  const green = wrap.querySelector("#gGreen");
  green.style.bottom = lo + "%";
  green.style.height = (hi - lo) + "%";
  const fill = wrap.querySelector("#gFill");
  const arrow = wrap.querySelector("#gArrow");
  const bubbles = wrap.querySelector("#bubbles");
  let bubT = 0;

  loop((dt) => {
    if (finished) return false;
    val = Math.min(100, val + rise * dt);
    fill.style.height = val + "%";
    arrow.style.bottom = val + "%";
    arrow.classList.toggle("in-green", val >= lo && val <= hi);
    bubT += dt;
    if (bubT > 0.35) { bubT = 0; addBubble(bubbles); FX.bubble(); }
    if (val >= 100) return finish(); // 과조리 자동 종료
    return true;
  });

  function stop() {
    if (finished) return;
    finish();
  }
  wrap.querySelector("#doneBtn").onclick = stop;
  wrap.querySelector(".pot-big").onclick = stop;

  function finish() {
    if (finished) return false;
    finished = true; stopLoops();
    let q, msg, ok = true;
    if (val >= lo && val <= hi) { q = 1; msg = dict.labels.perfect; }
    else if (val < lo) { q = clamp(0.3 + (val / lo) * 0.5); msg = dict.labels.under; ok = false; }
    else { q = clamp(1 - (val - hi) / (100 - hi) * 0.8, 0.2, 1); msg = dict.labels.over; ok = false; }
    feedback(msg, ok);
    if (ok) { FX.ding(880); FX.vibrate(30); } else FX.fail();
    setTimeout(() => done(q), 400);
    return false;
  }
}
function addBubble(container) {
  const b = document.createElement("span");
  b.className = "bubble";
  b.style.left = (10 + Math.random() * 80) + "%";
  b.style.width = b.style.height = (5 + Math.random() * 8) + "px";
  container.appendChild(b);
  setTimeout(() => b.remove(), 1400);
}

ENGINES.boil   = (s, a, d) => gaugeEngine(s, a, d, { emoji: ing(s.item).emoji, center: 70 });
ENGINES.blanch = (s, a, d) => gaugeEngine(s, a, d, { emoji: ing(s.item).emoji, center: 58, speed: 1.2 });
ENGINES.braise = (s, a, d) => gaugeEngine(s, a, d, { emoji: ing(s.item).emoji, center: 80, speed: 0.85 });
ENGINES.fryegg = (s, a, d) => gaugeEngine(s, a, d, { emoji: "🍳", center: 64, speed: 1.1 });

// ---- 굽기 (여러 조각 뒤집기) ----
ENGINES.grill = function (stage, area, done) {
  const dict = t();
  const n = cfg().pieces;
  const [glo, ghi] = cfg().grill;
  const rise = cfg().gauge * 0.85;
  const qs = [];
  let resolved = 0, finished = false;

  const wrap = document.createElement("div");
  wrap.className = "grill-wrap";
  wrap.innerHTML = `<div class="grill" id="grill"></div>
    <div class="grill-count" id="grillCount">0 / ${n}</div>`;
  area.appendChild(wrap);
  const grill = wrap.querySelector("#grill");

  const pieces = [];
  for (let i = 0; i < n; i++) {
    const el = document.createElement("button");
    el.className = "meat raw";
    el.textContent = "🥩";
    grill.appendChild(el);
    const p = { el, val: 0, delay: i * (1.1 + Math.random()), state: "wait", done: false };
    el.onclick = () => tapPiece(p);
    pieces.push(p);
  }

  FX.sizzleStart(); FX.sizzleLevel(0.8);
  onTeardown(() => FX.sizzleStop());

  loop((dt) => {
    if (finished) return false;
    pieces.forEach((p) => {
      if (p.done) return;
      if (p.delay > 0) { p.delay -= dt; return; }
      p.val += rise * dt;
      // 색상 단계
      if (p.val < glo) setMeat(p, "raw");
      else if (p.val <= ghi) setMeat(p, "ready");
      else if (p.val < 100) setMeat(p, "warn");
      else { resolvePiece(p, 0.2, "burnt"); }
    });
    return true;
  });

  function setMeat(p, cls) {
    if (p.state === cls) return;
    p.state = cls;
    p.el.className = "meat " + cls;
    p.el.textContent = cls === "burnt" ? "⬛" : cls === "warn" ? "🍖" : cls === "ready" ? "🍖" : "🥩";
  }
  function tapPiece(p) {
    if (p.done || p.delay > 0) return;
    if (p.val >= glo && p.val <= ghi) resolvePiece(p, 1, "ok");
    else if (p.val < glo) resolvePiece(p, 0.35, "under");
    else resolvePiece(p, 0.5, "over");
  }
  function resolvePiece(p, q, kind) {
    if (p.done) return;
    p.done = true; resolved++;
    qs.push(q);
    p.el.className = "meat served " + kind;
    p.el.textContent = kind === "burnt" ? "⬛" : "✅";
    if (kind === "ok") { feedback(dict.labels.perfect, true); FX.chop(); FX.vibrate(20); }
    else if (kind === "burnt") { feedback(dict.labels.burnt, false); FX.fail(); }
    else { feedback(dict.labels.nice, true); beep(440, .06); }
    wrap.querySelector("#grillCount").textContent = `${resolved} / ${n}`;
    if (resolved >= n) {
      finished = true; FX.sizzleStop(); stopLoops();
      const avg = qs.reduce((a, b) => a + b, 0) / qs.length;
      setTimeout(() => done(avg), 400);
    }
  }
};

// ---- 양념하기 (순서대로 넣기) ----
ENGINES.season = function (stage, area, done) {
  const dict = t();
  const items = stage.items.slice();
  let idx = 0, mistakes = 0;

  const wrap = document.createElement("div");
  wrap.className = "season-wrap";
  wrap.innerHTML = `<div class="season-bowl" id="seasonBowl">🥣<div class="season-added" id="added"></div></div>
    <div class="season-tray" id="tray"></div>`;
  area.appendChild(wrap);
  const tray = wrap.querySelector("#tray");
  const added = wrap.querySelector("#added");
  const bowl = wrap.querySelector("#seasonBowl");

  shuffle(items.slice()).forEach((id) => {
    const ig = ing(id);
    const el = document.createElement("button");
    el.className = "sauce";
    el.dataset.id = id;
    el.innerHTML = `<span class="sauce-emoji">${ig.emoji}</span><span class="sauce-name">${ig[state.lang]}</span>`;
    el.onclick = () => {
      if (el.disabled) return;
      if (id === items[idx]) {
        el.disabled = true; el.classList.add("used");
        idx++;
        bowl.classList.remove("pour"); void bowl.offsetWidth; bowl.classList.add("pour");
        const drop = document.createElement("span");
        drop.textContent = ig.emoji; drop.className = "added-pc";
        added.appendChild(drop);
        feedback(dict.labels.nice, true); FX.pour(); FX.vibrate(12);
        if (idx >= items.length) {
          const q = clamp(1 - mistakes * 0.15);
          setTimeout(() => done(q), 350);
        }
      } else {
        mistakes++;
        el.classList.add("flash-bad");
        setTimeout(() => el.classList.remove("flash-bad"), 350);
        feedback(dict.labels.oops, false); beep(180, .16, "square");
      }
    };
    tray.appendChild(el);
  });
  // 순서 힌트 (다음에 넣을 것 숫자)
  const hint = document.createElement("div");
  hint.className = "season-order";
  hint.innerHTML = items.map((id, i) => `<span class="so-step">${i + 1}. ${ing(id).emoji} ${ing(id)[state.lang]}</span>`).join(" → ");
  wrap.insertBefore(hint, tray);
};

// ---- 담기 / 조립 (재료를 그릇으로 끌어다 놓으면 요리가 완성됨) ----
ENGINES.plate = function (stage, area, done) {
  const dict = t();
  const items = stage.items.slice();
  const baseId = items[0];            // 첫 재료 = 그릇 바닥(밥 등)
  let placed = 0, finished = false;

  // 각 재료의 그릇 내 위치(오방색 배치): 바닥은 중앙, 나머지는 원형으로
  const toppings = items.slice(1);
  const slot = {};
  slot[baseId] = { cx: 50, cy: 52, r: 0, base: true };
  toppings.forEach((id, i) => {
    const ang = -Math.PI / 2 + (i / toppings.length) * Math.PI * 2;
    slot[id] = { cx: 50 + Math.cos(ang) * 27, cy: 52 + Math.sin(ang) * 27, ang };
  });

  const wrap = document.createElement("div");
  wrap.className = "plate-wrap";
  wrap.innerHTML = `
    <div class="bowl" id="bowl">
      <div class="bowl-slots" id="slots"></div>
      <div class="bowl-layers" id="layers"></div>
      <div class="bowl-hint">⬇</div>
    </div>
    <div class="plate-tray" id="plateTray"></div>`;
  area.appendChild(wrap);
  const tray = wrap.querySelector("#plateTray");
  const layers = wrap.querySelector("#layers");
  const slotsEl = wrap.querySelector("#slots");
  const bowl = wrap.querySelector("#bowl");

  // 목표 자리(연한 원) 표시
  items.forEach((id) => {
    const s = slot[id];
    const m = document.createElement("div");
    m.className = "bowl-slot" + (s.base ? " base" : "");
    m.dataset.id = id;
    m.style.left = s.cx + "%"; m.style.top = s.cy + "%";
    slotsEl.appendChild(m);
  });

  let ghost = null, dragTile = null, dragId = null;

  function startDrag(e, el, id) {
    if (el.classList.contains("used")) return;
    dragTile = el; dragId = id;
    el.classList.add("dragging");
    ghost = document.createElement("div");
    ghost.className = "drag-ghost";
    ghost.appendChild(ingVisual(id));
    document.body.appendChild(ghost);
    moveGhost(e);
    bowl.classList.add("drop-ready");
    const target = slotsEl.querySelector(`.bowl-slot[data-id="${id}"]`);
    if (target) target.classList.add("target");
    FX.vibrate(10);
    e.preventDefault();
  }
  function moveGhost(e) {
    if (!ghost) return;
    ghost.style.left = e.clientX + "px";
    ghost.style.top = e.clientY + "px";
  }
  function endDrag(e) {
    if (!ghost) return;
    const r = bowl.getBoundingClientRect();
    const over = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    ghost.remove(); ghost = null;
    bowl.classList.remove("drop-ready");
    slotsEl.querySelectorAll(".bowl-slot.target").forEach((x) => x.classList.remove("target"));
    if (dragTile) dragTile.classList.remove("dragging");
    if (over && dragTile) {
      dragTile.classList.add("used");
      const s = slot[dragId];
      const pc = ingVisual(dragId, "plate-pc" + (s.base ? " base" : ""));
      pc.style.left = s.cx + "%"; pc.style.top = s.cy + "%";
      layers.appendChild(pc);
      bowl.classList.remove("pop"); void bowl.offsetWidth; bowl.classList.add("pop");
      FX.pour(); FX.vibrate(15);
      feedback(dict.labels.nice, true);
      placed++;
      if (placed >= items.length && !finished) {
        finished = true;
        FX.shake(bowl, 0.6);
        feedback(dict.labels.perfect, true);
        setTimeout(() => done(1), 550);
      }
    } else {
      FX.tone(220, .08, "sine", 0.12);
    }
    dragTile = null; dragId = null;
  }

  items.forEach((id) => {
    const el = document.createElement("div");
    el.className = "ingredient plate-src";
    fillTile(el, id);
    el.addEventListener("pointerdown", (e) => startDrag(e, el, id));
    tray.appendChild(el);
  });
  onDoc("pointermove", moveGhost);
  onDoc("pointerup", endDrag);
  onDoc("pointercancel", endDrag);
};

ENGINES._fallback = function (stage, area, done) { done(1); };

/* =================================================================
 *  오버레이 / 사운드 / 유틸
 * ============================================================== */
function flashOverlay(big, msg, ms, cb) {
  $("overlayBig").textContent = big || "";
  $("overlayMsg").textContent = msg || "";
  $("overlay").classList.add("show");
  setTimeout(() => { $("overlay").classList.remove("show"); if (cb) cb(); }, ms);
}

// 간단 음: FX 엔진으로 위임 (사운드 on/off는 FX가 관리)
function beep(freq, dur, type) { FX.tone(freq, dur || 0.1, type || "sine", 0.16); }

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
