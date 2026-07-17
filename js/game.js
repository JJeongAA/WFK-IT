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
 *  🎯 ТВОЇ ЗАВДАННЯ — знайди 3 функції з позначкою "ЗАВДАННЯ" і напиши код:
 *     1) renderDishes()     2) completeStage()     3) endGame()
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

function renderDishes() {
  // ============================================================
  // 🎯 ЗАВДАННЯ 1: Показати картки страв на головному екрані
  // ============================================================
  // Дивись готовий приклад renderDifficulty() вище — принцип такий самий!
  //
  // Кроки:
  //  1) Знайди контейнер:      const grid = $("dishGrid");
  //  2) Очисти його:           grid.innerHTML = "";
  //  3) Для кожної страви з масиву DISHES створи картку:
  //        DISHES.forEach((dish) => {
  //          const card = document.createElement("div");
  //          card.className = "dish-card";
  //          card.innerHTML = `
  //            <div class="dish-emoji">${dish.emoji}</div>
  //            <div class="dish-name">${dish.name[state.lang]}</div>
  //            <div class="dish-tag">${dish.tagline[state.lang]}</div>
  //            <span class="dish-play">${t().startCooking} ▶</span>`;
  //          card.onclick = () => startGame(dish);   // клік → почати гру
  //          grid.appendChild(card);
  //        });
  //
  // ✅ ГОТОВО КОЛИ: видно 5 карток страв, і клік по картці запускає гру.

  // TODO: твій код тут

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
  // 🎯 ЗАВДАННЯ 2: Завершити етап — нарахувати бали й перейти далі
  // ============================================================
  // quality — число 0..1 (наскільки добре виконано етап).
  //
  // Кроки:
  //  1) quality = clamp(quality);              // обмежити 0..1
  //  2) state.qualities.push(quality);         // зберегти результат етапу
  //  3) Порахувати бали й додати до рахунку:
  //        const gained = Math.round(cfg().base * (0.4 + quality * 0.6));
  //        state.score += gained;
  //        $("hudScore").textContent = state.score;   // оновити рахунок на екрані
  //  4) Перейти до наступного етапу:
  //        state.stageIdx++;
  //        updateStageTrack();
  //  5) Показати спалах "✅" і що робити далі:
  //        flashOverlay("✅", t().stageClear + "  +" + gained, 650, () => {
  //          if (state.stageIdx >= state.stages.length) endGame();  // етапів більше немає
  //          else runStage();                                       // наступний етап
  //        });
  //  (за бажанням) FX.ding(880); FX.vibrate(30);
  //
  // ✅ ГОТОВО КОЛИ: після кожного етапу рахунок зростає і гра йде далі.

  // TODO: твій код тут

}

function endGame() {
  // ============================================================
  // 🎯 ЗАВДАННЯ 3: Показати екран результату
  // ============================================================
  // Кроки:
  //  1) stopLoops();
  //  2) Середня якість і майстерність у %:
  //        const avg = state.qualities.reduce((a, b) => a + b, 0) / (state.qualities.length || 1);
  //        const skill = Math.round(avg * 100);
  //  3) Зірки (1..3):
  //        let stars = avg >= 0.85 ? 3 : avg >= 0.6 ? 2 : 1;
  //  4) Підсумок і емодзі:
  //        let verdict, emoji;
  //        if (stars === 3) { verdict = t().verdict.perfect; emoji = "🏆"; }
  //        else if (stars === 2) { verdict = t().verdict.great; emoji = "😋"; }
  //        else { verdict = t().verdict.good; emoji = "🙂"; }
  //  5) Заповнити екран результату:
  //        $("resultEmoji").textContent = emoji;
  //        $("resultTitle").textContent = verdict;
  //        $("resultDish").textContent  = state.dish.emoji + " " + state.dish.name[state.lang];
  //        $("rScore").textContent = state.score;
  //        $("rAcc").textContent   = skill + "%";
  //        $("cultureText").textContent = state.dish.culture[state.lang];
  //  6) Намалювати зірки в контейнері $("resultStars"):
  //        (створи 3 <span>⭐; для зайвих додай клас "star-off")
  //  7) Показати екран:  showScreen("screen-result");
  //  (за бажанням) FX.success();
  //
  // ✅ ГОТОВО КОЛИ: після останнього етапу видно бали, майстерність (%),
  //    зірки та розповідь про культуру страви.

  // TODO: твій код тут

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
