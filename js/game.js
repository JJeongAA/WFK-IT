/* =========================================================
 * game.js — 한식 마스터 [학생 실습 파일 / ФАЙЛ ДЛЯ СТУДЕНТА]
 *
 *  Тут ти пишеш логіку головного екрана та ходу гри.
 *  Файли fx.js, i18n.js, dishes.js, engines.js вже готові —
 *  вони дають тобі такі інструменти (можна викликати за іменем):
 *
 *    state           — стан гри { lang, diff, dish, score, stageIdx, stages, qualities }
 *    DIFFICULTY      — рівні складності (easy / normal / hard)
 *    DISHES          — масив страв (з dishes.js)
 *    I18N            — переклади (з i18n.js)
 *    t()             — словник поточної мови (напр. t().startCooking)
 *    cfg()           — налаштування поточної складності (напр. cfg().base)
 *    $("id")         — document.getElementById("id")
 *    clamp(v)        — обмежує число в межах 0..1
 *    ENGINES[type](stage, area, done) — міні-гра одного етапу
 *    ingVisual(id)   — картинка інгредієнта
 *    dishImgURL(id)  — фото готової страви (або null)
 *    actionEmoji(t)  — емодзі етапу (🔪 🍳 …)
 *    feedback(msg,ok), flashOverlay(big,msg,ms,cb), beep(), stopLoops()
 *    FX.ding() FX.vibrate() FX.shake() FX.success()  — звук/вібрація/трясіння
 *
 *  🎯 ТВОЇ ЗАВДАННЯ (легко!):
 *     • У ЦЬОМУ файлі — функція completeStage(): заповни 2 місця з позначкою ✏️ TODO
 *       (це += та if/else — так само як у Python).
 *     • У файлі dishes.js — заповни етапи готування (stages) для страв.
 *     Решта (малювання екранів тощо) вже написана за тебе.
 * ======================================================= */
"use strict";

/* =================================================================
 *  다국어 / 홈 화면  (Головний екран)
 * ============================================================== */
function applyI18n() {
  const dict = t();
  document.documentElement.lang = state.lang === "ua" ? "uk" : state.lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const val = el.getAttribute("data-i18n").split(".").reduce((o, k) => (o ? o[k] : null), dict);
    if (typeof val === "string") el.textContent = val;
  });
  document.querySelectorAll(".lang-btn").forEach((b) => b.classList.toggle("active", b.dataset.lang === state.lang));
  renderDifficulty();
  renderDishes();
  $("soundBtn").textContent = state.sound ? "🔊" : "🔇";
}

function buildLangSwitch() {
  const wrap = $("langSwitch");
  wrap.innerHTML = "";
  ["ua", "ko", "en"].forEach((lng) => {
    const b = document.createElement("button");
    b.className = "lang-btn";
    b.dataset.lang = lng;
    b.textContent = I18N[lng].langName;
    b.onclick = () => { state.lang = lng; beep(660, .05); applyI18n(); };
    wrap.appendChild(b);
  });
}

/* ✅ ГОТОВИЙ ПРИКЛАД — картки складності. renderDishes() роби так само! */
function renderDifficulty() {
  const grid = $("difficultyGrid");
  grid.innerHTML = "";
  Object.values(DIFFICULTY).forEach((d) => {
    const card = document.createElement("div");
    card.className = "diff-card" + (state.diff === d.key ? " active" : "");
    card.tabIndex = 0;
    card.innerHTML = `<div class="diff-emoji">${d.emoji}</div>
      <div class="diff-name">${t().difficulty[d.key]}</div>
      <div class="diff-desc">${t().difficultyDesc[d.key]}</div>`;
    const pick = () => { state.diff = d.key; beep(560, .05); renderDifficulty(); };
    card.onclick = pick;
    card.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } };
    grid.appendChild(card);
  });
}

/* ✅ ГОТОВО (не чіпай) — малює картки страв на головному екрані. */
function renderDishes() {
  const grid = $("dishGrid");
  grid.innerHTML = "";
  DISHES.forEach((dish) => {
    const card = document.createElement("div");
    card.className = "dish-card";
    card.tabIndex = 0;
    card.style.setProperty("--dish-color", dish.color);
    const photo = dishImgURL(dish.id);
    const thumb = photo
      ? `<div class="dish-photo"><img src="${photo}" alt="${dish.name[state.lang]}" loading="lazy" onerror="var p=this.parentNode;if(p){p.className='dish-emoji';p.textContent='${dish.emoji}'}"></div>`
      : `<div class="dish-emoji">${dish.emoji}</div>`;
    card.innerHTML = `${thumb}
      <div class="dish-name">${dish.name[state.lang]}</div>
      <div class="dish-tag">${dish.tagline[state.lang]}</div>
      <span class="dish-steps">🍳 ${dish.stages.length} ${t().recipeSteps}</span>
      <span class="dish-play">${t().startCooking} ▶</span>`;
    const go = () => startGame(dish);
    card.onclick = go;
    card.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } };
    grid.appendChild(card);
  });
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  $(id).classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* =================================================================
 *  게임 흐름  (Хід гри)
 * ============================================================== */
function startGame(dish) {
  stopLoops();
  state.dish = dish;
  state.stages = dish.stages;
  state.stageIdx = 0;
  state.score = 0;
  state.qualities = [];
  document.documentElement.style.setProperty("--dish-color", dish.color);
  $("cookDishEmoji").textContent = dish.emoji;
  $("cookDishName").textContent = dish.name[state.lang];
  $("hudScore").textContent = "0";
  buildStageTrack();
  showScreen("screen-game");
  flashOverlay(dish.emoji, dish.name[state.lang], 850, () => runStage());
}

function buildStageTrack() {
  const track = $("stageTrack");
  track.innerHTML = "";
  state.stages.forEach((s, i) => {
    const dot = document.createElement("div");
    dot.className = "stage-dot";
    dot.dataset.i = i;
    dot.innerHTML = `<span>${actionEmoji(s.type)}</span>`;
    track.appendChild(dot);
  });
}

function updateStageTrack() {
  document.querySelectorAll(".stage-dot").forEach((d, i) => {
    d.classList.toggle("done", i < state.stageIdx);
    d.classList.toggle("current", i === state.stageIdx);
  });
}

/* Запускає міні-гру поточного етапу. Коли етап завершено,
   engine викликає completeStage(quality). */
function runStage() {
  stopLoops();
  const stage = state.stages[state.stageIdx];
  const dict = t();
  $("stageBadge").textContent = `${state.stageIdx + 1}/${state.stages.length}`;
  $("stageAction").textContent = `${actionEmoji(stage.type)} ${dict.actions[stage.type] || stage.type}`;
  $("stageTip").textContent = dict.tips[stage.type] || "";
  $("feedback").textContent = "";
  $("feedback").className = "feedback";
  updateStageTrack();

  const area = $("stageArea");
  area.innerHTML = "";
  const engine = ENGINES[stage.type] || ENGINES._fallback;
  engine(stage, area, completeStage);
}

function completeStage(quality) {
  // ============================================================
  // 🎯 ЗАВДАННЯ (game.js): нарахувати бали й перейти далі
  //    Схоже на Python: += (додати) та if / else (умова).
  //    Заповни лише 2 місця, позначені ??? . Решта вже готова.
  // ============================================================
  quality = clamp(quality);              // обмежити 0..1 (готово)
  state.qualities.push(quality);         // зберегти результат (як list.append у Python) (готово)

  const gained = Math.round(cfg().base * (0.4 + quality * 0.6));  // бали за етап (готово)

  // ✏️ TODO 1 — додай бали (gained) до рахунку.
  //    Зараз додається 0, тому рахунок не росте. Заміни 0 на  gained .
  //    У Python: state.score += gained  (в JS так само!)
  state.score += 0;   // <-- заміни 0 на gained

  $("hudScore").textContent = state.score;   // показати рахунок (готово)
  if (quality > 0.7) FX.ding(880); else FX.ding(520);   // звук (готово)
  state.stageIdx++;                          // перейти на наступний етап (готово)
  updateStageTrack();

  flashOverlay("✅", t().stageClear + "  +" + gained, 650, () => {
    // ✏️ TODO 2 — коли етапів більше НЕ лишилось → показати результат (endGame),
    //    інакше → запустити наступний етап (runStage).
    //    Зараз стоїть  true , тому гра завершується вже після 1-го етапу.
    //    Заміни  true  на умову "етапів більше немає":
    //         state.stageIdx >= state.stages.length
    if (true) {   // <-- заміни true на  state.stageIdx >= state.stages.length
      endGame();
    } else {
      runStage();
    }
  });
}

/* ✅ ГОТОВО (не чіпай) — екран результату: бали, майстерність, зірки, культура. */
function endGame() {
  stopLoops();
  const dict = t();
  const avg = state.qualities.reduce((a, b) => a + b, 0) / (state.qualities.length || 1);
  const skill = Math.round(avg * 100);
  let stars = avg >= 0.85 ? 3 : avg >= 0.6 ? 2 : 1;
  let verdict, emoji;
  if (stars === 3) { verdict = dict.verdict.perfect; emoji = "🏆"; }
  else if (stars === 2) { verdict = dict.verdict.great; emoji = "😋"; }
  else if (avg >= 0.4) { verdict = dict.verdict.good; emoji = "🙂"; }
  else { verdict = dict.verdict.ok; emoji = "💪"; }

  const rphoto = dishImgURL(state.dish.id);
  const rEmoji = $("resultEmoji");
  if (rphoto) {
    rEmoji.innerHTML = `<div class="result-photo"><img src="${rphoto}" alt="${state.dish.name[state.lang]}" onerror="var p=this.parentNode;if(p)p.textContent='${emoji}'"><span class="result-badge">${emoji}</span></div>`;
  } else {
    rEmoji.textContent = emoji;
  }
  $("resultTitle").textContent = verdict;
  $("resultDish").textContent = state.dish.emoji + " " + state.dish.name[state.lang];
  $("rScore").textContent = state.score;
  $("rAcc").textContent = skill + "%";
  $("cultureText").textContent = state.dish.culture[state.lang];
  const starsEl = $("resultStars");
  starsEl.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    const s = document.createElement("span");
    s.textContent = "⭐";
    if (i >= stars) s.className = "star-off";
    starsEl.appendChild(s);
  }
  FX.success(); FX.vibrate([40, 60, 40, 60, 80]);
  showScreen("screen-result");
}

/* =================================================================
 *  Кнопки та запуск  (готово — не чіпай)
 * ============================================================== */
function bindEvents() {
  $("quitBtn").onclick = () => { stopLoops(); showScreen("screen-home"); };
  $("brandHome").onclick = () => { stopLoops(); showScreen("screen-home"); };
  $("againBtn").onclick = () => startGame(state.dish);
  $("nextBtn").onclick = () => showScreen("screen-home");
  $("soundBtn").onclick = () => {
    state.sound = !state.sound;
    FX.setEnabled(state.sound);
    $("soundBtn").textContent = state.sound ? "🔊" : "🔇";
    if (state.sound) beep(660, .08);
  };
}

function init() {
  buildLangSwitch();
  bindEvents();
  applyI18n();
  showScreen("screen-home");
}
document.addEventListener("DOMContentLoaded", init);
