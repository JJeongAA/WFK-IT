/* =========================================================
 * dishes.js — 한식 메뉴 데이터 [학생 실습 파일 / ФАЙЛ ДЛЯ СТУДЕНТА]
 *
 *  🎯 ЗАВДАННЯ 4: заповни етапи готування (stages) для страв.
 *     • bibimbap (пібімпаб) вже зроблено — це ТВІЙ ПРИКЛАД.
 *     • Для bulgogi, japchae, doenjang, naengmyeon додай етапи в масив stages.
 *
 *  Доступні типи етапів (type) — усі вже запрограмовані в engines.js:
 *     select   — обрати інгредієнти:  { type:"select", need:["rice","carrot", ...] }
 *     chop     — нарізати:            { type:"chop", items:["carrot","onion"] }
 *     mince    — подрібнити:          { type:"mince", item:"garlic" }
 *     boil / blanch / braise — варити/бланшувати/тушкувати: { type:"boil", item:"noodle" }
 *     stirfry  — смажити:             { type:"stirfry", items:["carrot","beef"] }
 *     grill    — готувати на вогні:   { type:"grill", item:"beef" }
 *     season   — приправити:          { type:"season", items:["soy","sugar"] }
 *     mix      — перемішати:          { type:"mix", items:["glassNoodle","carrot"] }
 *     rinse    — промити:             { type:"rinse", item:"noodle" }
 *     fryegg   — смажити яйце:        { type:"fryegg", item:"egg" }
 *     plate    — подати у миску:      { type:"plate", items:["rice","carrot", ...] }
 *
 *  ⚠️ Використовуй лише id інгредієнтів зі словника ING нижче.
 *  ing(): { id, emoji, ko, en, ua } 재료 헬퍼
 * ======================================================= */

// 공통 재료 사전 (id 로 재사용)
const ING = {
  rice:     { emoji: "🍚", ko: "밥",        en: "Rice",          ua: "Рис" },
  egg:      { emoji: "🍳", ko: "계란",      en: "Egg",           ua: "Яйце" },
  carrot:   { emoji: "🥕", ko: "당근",      en: "Carrot",        ua: "Морква" },
  spinach:  { emoji: "🥬", ko: "시금치",    en: "Spinach",       ua: "Шпинат" },
  mushroom: { emoji: "🍄", ko: "버섯",      en: "Mushroom",      ua: "Гриби" },
  beef:     { emoji: "🥩", ko: "소고기",    en: "Beef",          ua: "Яловичина" },
  gochujang:{ emoji: "🌶️", ko: "고추장",   en: "Chili paste",   ua: "Гочуджан" },
  sesame:   { emoji: "🫘", ko: "참기름",    en: "Sesame oil",    ua: "Кунжутна олія" },
  soy:      { emoji: "🍶", ko: "간장",      en: "Soy sauce",     ua: "Соєвий соус" },
  garlic:   { emoji: "🧄", ko: "마늘",      en: "Garlic",        ua: "Часник" },
  onion:    { emoji: "🧅", ko: "양파",      en: "Onion",         ua: "Цибуля" },
  scallion: { emoji: "🌿", ko: "파",        en: "Green onion",   ua: "Зелена цибуля" },
  sugar:    { emoji: "🍬", ko: "설탕",      en: "Sugar",         ua: "Цукор" },
  pear:     { emoji: "🍐", ko: "배",        en: "Korean pear",   ua: "Груша" },
  noodle:   { emoji: "🍜", ko: "면",        en: "Noodles",       ua: "Локшина" },
  glassNoodle:{emoji: "🍝", ko: "당면",     en: "Glass noodles", ua: "Скляна локшина" },
  doenjang: { emoji: "🟤", ko: "된장",      en: "Soybean paste", ua: "Твенджан" },
  tofu:     { emoji: "⬜", ko: "두부",      en: "Tofu",          ua: "Тофу" },
  zucchini: { emoji: "🥒", ko: "애호박",    en: "Zucchini",      ua: "Кабачок" },
  potato:   { emoji: "🥔", ko: "감자",      en: "Potato",        ua: "Картопля" },
  chili:    { emoji: "🌶️", ko: "청양고추",  en: "Chili pepper",  ua: "Гострий перець" },
  cucumber: { emoji: "🥒", ko: "오이",      en: "Cucumber",      ua: "Огірок" },
  ice:      { emoji: "🧊", ko: "얼음",      en: "Ice",           ua: "Лід" },
  broth:    { emoji: "💧", ko: "육수",      en: "Cold broth",    ua: "Бульйон" },
  vinegar:  { emoji: "🍾", ko: "식초",      en: "Vinegar",       ua: "Оцет" },
  radish:   { emoji: "🥗", ko: "무",        en: "Radish",        ua: "Редька" },
  ribs:     { emoji: "🍖", ko: "갈비",      en: "Short ribs",    ua: "Реберця" },
  chestnut: { emoji: "🌰", ko: "밤",        en: "Chestnut",      ua: "Каштан" },
  jujube:   { emoji: "🔴", ko: "대추",      en: "Jujube",        ua: "Жожоба" },
  water:    { emoji: "🚰", ko: "물",        en: "Water",         ua: "Вода" },
  pepper:   { emoji: "⚫", ko: "후추",      en: "Black pepper",  ua: "Перець" },
  chives:   { emoji: "🌱", ko: "부추",      en: "Chives",        ua: "Цибуля-різанець" },
  seaweed:  { emoji: "🍥", ko: "김",        en: "Dried seaweed", ua: "Норі" },
};

function ing(id) { return { id, ...ING[id] }; }

const DISHES = [
  {
    id: "bibimbap",
    emoji: "🍲",
    hero: "🥗",
    color: "#e5533c",
    name: { ko: "비빔밥", en: "Bibimbap", ua: "Пібімпаб" },
    tagline: {
      ko: "다섯 가지 색의 나물을 밥 위에 올려 비벼 먹는 요리",
      en: "Colorful vegetables over rice, all mixed together",
      ua: "Різнокольорові овочі на рисі, все перемішується разом",
    },
    // 실제 조리 과정
    stages: [
      { type: "select", need: ["rice", "spinach", "carrot", "mushroom", "beef", "egg"] },
      { type: "chop", items: ["carrot", "mushroom", "beef"] },
      { type: "stirfry", items: ["carrot", "spinach", "mushroom", "beef"] },
      { type: "fryegg", item: "egg" },
      { type: "plate", items: ["rice", "spinach", "carrot", "mushroom", "beef", "egg"] },
      { type: "season", items: ["gochujang", "sesame"] },
      { type: "mix", items: ["rice", "carrot", "spinach", "beef", "gochujang"] },
    ],
    decoys: ["noodle", "doenjang", "ice", "chestnut", "vinegar", "ribs"],
    culture: {
      ko: "비빔밥은 '섞은 밥'이라는 뜻이에요. 다섯 가지 색(오방색)의 재료가 조화를 이루며, 이는 자연과 균형을 중시하는 한국 정신을 담고 있어요. 전주 비빔밥이 가장 유명하답니다!",
      en: "Bibimbap means 'mixed rice'. Its five colors (obangsaek) represent harmony and balance — core values in Korean philosophy. Jeonju Bibimbap is the most famous of all!",
      ua: "Пібімпаб означає «змішаний рис». П'ять кольорів (обансек) символізують гармонію та рівновагу — ключові цінності корейської філософії. Пібімпаб з Чонджу — найвідоміший!",
    },
  },
  {
    id: "bulgogi",
    emoji: "🥩",
    hero: "🍢",
    color: "#a8442a",
    name: { ko: "불고기", en: "Bulgogi", ua: "Пулькогі" },
    tagline: {
      ko: "간장 양념에 재운 소고기를 달콤하게 구운 요리",
      en: "Sweet marinated beef, grilled to perfection",
      ua: "Солодка маринована яловичина, ідеально засмажена",
    },
    stages: [
      { type: "select", need: ["beef", "soy", "sugar", "pear", "garlic", "onion"] },
      // 🎯 ЗАВДАННЯ 4 (불고기): додай етапи готування!
      //   Ідея: нарізати(chop) цибулю+м'ясо → подрібнити(mince) часник →
      //   приправити(season) → перемішати(mix) → готувати(grill) → подати(plate)
    ],
    decoys: ["gochujang", "noodle", "tofu", "ice", "vinegar", "doenjang"],
    culture: {
      ko: "불고기는 '불에 구운 고기'라는 뜻이에요. 배를 갈아 넣어 고기를 부드럽게 하고 단맛을 더하는 것이 비법! 고구려 시대의 '맥적'에서 유래한 아주 오래된 요리랍니다.",
      en: "Bulgogi means 'fire meat'. The secret is grated pear, which tenderizes the beef and adds sweetness. It traces back to 'maekjeok' from the ancient Goguryeo era!",
      ua: "Пулькогі означає «вогняне м'ясо». Секрет — терта груша, яка розм'якшує яловичину й додає солодкості. Страва походить від «мекчок» з давньої епохи Когурьо!",
    },
  },
  {
    id: "japchae",
    emoji: "🍝",
    hero: "🥢",
    color: "#c98a2b",
    name: { ko: "잡채", en: "Japchae", ua: "Чапче" },
    tagline: {
      ko: "쫄깃한 당면과 여러 채소를 볶아 만든 잔치 음식",
      en: "Chewy glass noodles stir-fried with vegetables",
      ua: "Пружна скляна локшина, смажена з овочами",
    },
    stages: [
      { type: "select", need: ["glassNoodle", "spinach", "carrot", "onion", "mushroom", "beef"] },
      // 🎯 ЗАВДАННЯ 4 (잡채): додай етапи готування!
      //   Ідея: зварити(boil) локшину → нарізати(chop) овочі → смажити(stirfry) →
      //   приправити(season) → перемішати(mix) → подати(plate)
    ],
    decoys: ["rice", "gochujang", "ice", "tofu", "ribs", "vinegar"],
    culture: {
      ko: "잡채의 '잡'은 '여러 가지', '채'는 '채소'를 뜻해요. 원래는 조선시대 궁중 잔치 음식이었어요. 생일, 결혼식 같은 특별한 날에 빠지지 않는 대표 잔치 음식이랍니다!",
      en: "In 'japchae', 'jap' means 'mixed' and 'chae' means 'vegetables'. Once a royal court dish of the Joseon dynasty, it's now a must-have at celebrations like birthdays and weddings!",
      ua: "У слові «чапче» «чап» означає «змішане», а «че» — «овочі». Колись страва королівського двору династії Чосон, тепер незамінна на святах — днях народження та весіллях!",
    },
  },
  {
    id: "doenjang",
    emoji: "🍲",
    hero: "🥘",
    color: "#7a5c2e",
    name: { ko: "된장찌개", en: "Doenjang Jjigae", ua: "Твенджан-чіге" },
    tagline: {
      ko: "구수한 된장으로 끓인 한국인의 소울푸드 국물요리",
      en: "Hearty soybean paste stew — Korea's soul food",
      ua: "Ситне рагу з соєвої пасти — душевна їжа Кореї",
    },
    stages: [
      { type: "select", need: ["water", "doenjang", "potato", "zucchini", "onion", "tofu", "chili"] },
      // 🎯 ЗАВДАННЯ 4 (된장찌개): додай етапи готування!
      //   Ідея: нарізати(chop) овочі → приправити(season) твенджаном →
      //   варити(boil) → подати(plate)
    ],
    decoys: ["glassNoodle", "sugar", "ice", "pear", "ribs", "vinegar"],
    culture: {
      ko: "된장찌개는 콩을 발효시킨 된장으로 끓여요. 발효 음식을 사랑하는 한국인에게 밥상에 가장 자주 오르는 국물요리예요. 집집마다 맛이 달라 '엄마 손맛'의 상징이기도 해요!",
      en: "Doenjang jjigae is made with fermented soybean paste. For Koreans who love fermented foods, it's the most common stew on the table. Every home has its own taste — the symbol of 'mom's cooking'!",
      ua: "Твенджан-чіге готують з ферментованої соєвої пасти. Для корейців, що люблять ферментовані страви, це найпоширеніше рагу на столі. У кожній родині свій смак — символ «маминої кухні»!",
    },
  },
  {
    id: "naengmyeon",
    emoji: "🍜",
    hero: "🧊",
    color: "#3d7ea6",
    name: { ko: "냉면", en: "Naengmyeon", ua: "Неньмьон" },
    tagline: {
      ko: "시원한 육수에 담긴 쫄깃한 면, 여름 별미!",
      en: "Chewy noodles in icy broth — a summer favorite!",
      ua: "Пружна локшина в крижаному бульйоні — літній улюбленець!",
    },
    stages: [
      { type: "select", need: ["noodle", "broth", "ice", "cucumber", "radish", "pear", "egg"] },
      // 🎯 ЗАВДАННЯ 4 (냉면): додай етапи готування!
      //   Ідея: зварити(boil) локшину → промити(rinse) → нарізати(chop) овочі → подати(plate)
    ],
    decoys: ["rice", "gochujang", "doenjang", "beef", "ribs", "sugar"],
    culture: {
      ko: "냉면은 '차가운 국수'라는 뜻이에요. 원래는 추운 겨울에 먹던 북한(평양·함흥) 음식이었지만, 지금은 한국의 여름을 대표하는 별미가 되었어요. 얼음 동동 육수가 정말 시원하답니다!",
      en: "Naengmyeon means 'cold noodles'. Originally a North Korean winter dish (Pyongyang & Hamhung), it's now the taste of Korean summer. The icy broth is wonderfully refreshing!",
      ua: "Неньмьон означає «холодна локшина». Спершу це була північнокорейська зимова страва (Пхеньян і Хамхин), а тепер — смак корейського літа. Крижаний бульйон чудово освіжає!",
    },
  },
];
