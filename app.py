"""
Таємний лист (анонімна скринька) — готова версія (з логіном)
비밀편지 (익명 편지함) - 완성본 (닉네임+비밀번호 로그인)
====================================================
UK: Сайт анонімних листів. Без бази даних — лише JSON-файли.
    Вхід: нікнейм + пароль (пароль зберігається у вигляді хешу, не як текст).
KO: DB 없이 JSON 파일로 동작하는 익명 편지 웹사이트.
    로그인: 닉네임 + 비밀번호 (비밀번호는 해시로 저장, 원문 저장 X).

UK / KO — потік / 흐름:
  1. Створюєш скриньку (нікнейм+пароль) / 편지함 만들기 (닉네임+비번)
  2. Даєш посилання /box/<нікнейм> другові / 공유 링크를 친구에게
  3. Друг пише анонімний лист / 친구가 익명 편지 작성
  4. Ти входиш нікнеймом+паролем і читаєш / 닉네임+비번으로 로그인해서 확인

Запуск / 실행:  python app.py  ->  http://127.0.0.1:5000
"""

import json
import os
import re
import secrets
from datetime import datetime

from flask import (Flask, render_template, request, redirect, url_for,
                   abort, session)
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)

# UK: Секретний ключ підписує cookie сесії (щоб логін не підробили).
# KO: 세션 쿠키를 안전하게 서명하는 비밀 키 (로그인 위조 방지).
app.secret_key = "wfk-secret-letter-class-key-change-me"

DATA_DIR = "data"
MAILBOX_FILE = os.path.join(DATA_DIR, "mailboxes.json")   # список скриньок / 편지함 목록
LETTERS_DIR = os.path.join(DATA_DIR, "letters")           # папка з листами / 편지 저장 폴더
ICONS = ["🎁", "⭐", "❤️", "🔔", "☃️", "🍪", "🧸", "🌟", "💌", "🎀", "🌸", "🐧"]
# UK: Кольори картки листа (пастель) / KO: 편지 카드 색 (파스텔)
COLORS = ["#ffd6e7", "#d6e4ff", "#d9f7e5", "#fff3c4", "#ede0ff", "#ffe0cc"]

# UK: Нікнейм = літери/цифри/_/-, 2~20 символів (стає адресою).
# KO: 닉네임 = 글자/숫자/_/-, 2~20자 (주소로 쓰임).
NICK_RE = re.compile(r"^[\w-]{2,20}$")


# ----------------------------------------------------------------------
# Функції читання/запису файлів / 파일 읽고 쓰는 도우미 함수
# ----------------------------------------------------------------------
def setup_files():
    os.makedirs(LETTERS_DIR, exist_ok=True)
    if not os.path.exists(MAILBOX_FILE):
        save_json(MAILBOX_FILE, {})


def load_json(path, default):
    if not os.path.exists(path):
        return default
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def letters_path(box_id):
    return os.path.join(LETTERS_DIR, box_id + ".json")


def is_logged_in(box_id):
    """UK: Чи увійшов користувач у цю скриньку? / KO: 이 편지함에 로그인했나?"""
    return session.get("auth_" + box_id, False)


# ----------------------------------------------------------------------
# Сторінки (маршрути) / 화면(라우트)
# ----------------------------------------------------------------------
@app.route("/")
def home():
    """UK: Головна: створити скриньку або увійти. / KO: 홈: 편지함 만들기 또는 로그인."""
    return render_template("home.html")


@app.route("/create", methods=["POST"])
def create():
    """UK: Створити нову скриньку (нікнейм + пароль).
    KO: 새 편지함 만들기 (닉네임 + 비밀번호)."""
    name = request.form.get("name", "").strip()
    password = request.form.get("password", "")

    # 검사 1) 닉네임 형식 / перевірка нікнейма
    if not NICK_RE.match(name):
        return render_template("home.html",
            error_uk="Нікнейм: літери/цифри/_/-, 2~20 символів (без пробілів).",
            error_ko="닉네임은 글자/숫자/_/- 로 2~20자 (띄어쓰기·특수문자 X)")
    # 검사 2) 비밀번호 길이 / довжина пароля
    if len(password) < 4:
        return render_template("home.html",
            error_uk="Пароль має бути щонайменше 4 символи.",
            error_ko="비밀번호는 4자 이상이어야 해요.")

    mailboxes = load_json(MAILBOX_FILE, {})
    # 검사 3) 이미 있는 닉네임인지 / чи вже зайнято
    if name in mailboxes:
        return render_template("home.html",
            error_uk="Цей нікнейм уже зайнятий. Обери інший.",
            error_ko="이미 있는 닉네임이에요. 다른 걸로 해보세요.")

    # 비밀번호는 해시해서 저장 (원문 저장 X) / зберігаємо хеш пароля, не текст
    mailboxes[name] = {
        "password_hash": generate_password_hash(password),
        "created": datetime.now().strftime("%Y-%m-%d %H:%M"),
    }
    save_json(MAILBOX_FILE, mailboxes)
    save_json(letters_path(name), [])

    session["auth_" + name] = True  # 만들면서 바로 로그인 / одразу входимо
    return render_template("created.html", name=name)


@app.route("/enter", methods=["POST"])
def enter():
    """UK: З головної: перейти до входу за нікнеймом. / KO: 홈에서 닉네임으로 로그인 화면 이동."""
    name = request.form.get("name", "").strip()
    return redirect(url_for("inbox", box_id=name))


@app.route("/box/<box_id>", methods=["GET", "POST"])
def write(box_id):
    """UK: Спільне посилання — друг пише анонімний лист. / KO: 공유 링크: 친구가 익명 편지 쓰기."""
    mailboxes = load_json(MAILBOX_FILE, {})
    if box_id not in mailboxes:
        abort(404)

    if request.method == "POST":
        message = request.form.get("message", "").strip()
        sender = request.form.get("sender", "").strip()   # 보낸 사람 닉네임(선택) / нікнейм відправника
        icon = request.form.get("icon", "")
        color = request.form.get("color", "")
        # 목록에 없는 값이 오면 안전하게 기본값으로 / якщо не зі списку — запасне
        if icon not in ICONS:
            icon = secrets.choice(ICONS)
        if color not in COLORS:
            color = COLORS[0]
        if message:
            letters = load_json(letters_path(box_id), [])
            letters.append({
                "id": secrets.token_hex(4),     # 편지마다 고유 번호(삭제에 사용) / унікальний id
                "message": message,
                "sender": sender,               # 빈칸이면 익명 / порожньо = анонім
                "icon": icon,
                "color": color,
                "time": datetime.now().strftime("%Y-%m-%d %H:%M"),
            })
            save_json(letters_path(box_id), letters)
        return redirect(url_for("thanks", box_id=box_id))

    # 아이콘·색 목록을 화면에 넘겨줌 / передаємо іконки та кольори у шаблон
    return render_template("write.html", name=box_id, box_id=box_id,
                           icons=ICONS, colors=COLORS)


@app.route("/box/<box_id>/thanks")
def thanks(box_id):
    """UK: Екран подяки. / KO: 편지 전송 완료 화면."""
    mailboxes = load_json(MAILBOX_FILE, {})
    if box_id not in mailboxes:
        abort(404)
    return render_template("thanks.html", name=box_id, box_id=box_id)


@app.route("/box/<box_id>/inbox", methods=["GET", "POST"])
def inbox(box_id):
    """
    UK: Скринька власника. Треба увійти паролем (сесія запам'ятовує).
    KO: 주인의 편지함. 비밀번호로 로그인해야 함 (세션이 기억함).
    """
    mailboxes = load_json(MAILBOX_FILE, {})
    box = mailboxes.get(box_id)
    if box is None:
        abort(404)

    # 아직 로그인 안 했으면 → 비밀번호 화면 / якщо не увійшов — форма пароля
    if not is_logged_in(box_id):
        if request.method == "POST":
            password = request.form.get("password", "")
            if check_password_hash(box["password_hash"], password):
                session["auth_" + box_id] = True
                return redirect(url_for("inbox", box_id=box_id))
            return render_template("login.html", box_id=box_id, error=True)
        return render_template("login.html", box_id=box_id, error=False)

    # 로그인됨 → 편지 보여주기 / увійшов — показуємо листи
    letters = list(reversed(load_json(letters_path(box_id), [])))
    return render_template("inbox.html", name=box_id, letters=letters, count=len(letters))


@app.route("/box/<box_id>/logout")
def logout(box_id):
    """UK: Вийти зі скриньки. / KO: 편지함 로그아웃."""
    session.pop("auth_" + box_id, None)
    return redirect(url_for("home"))


@app.route("/box/<box_id>/delete", methods=["POST"])
def delete_letter(box_id):
    """UK: Видалити один лист (лише власник, що увійшов).
    KO: 편지 하나 삭제 (로그인한 주인만)."""
    mailboxes = load_json(MAILBOX_FILE, {})
    if box_id not in mailboxes:
        abort(404)
    if not is_logged_in(box_id):
        abort(403)   # 로그인 안 했으면 삭제 불가 / не увійшов — не можна

    letter_id = request.form.get("letter_id", "")
    letters = load_json(letters_path(box_id), [])
    # 그 id만 빼고 다시 저장 / залишаємо всі, крім цього id
    letters = [lt for lt in letters if lt.get("id") != letter_id]
    save_json(letters_path(box_id), letters)
    return redirect(url_for("inbox", box_id=box_id))


# ----------------------------------------------------------------------
# Екрани помилок / 에러 화면
# ----------------------------------------------------------------------
@app.errorhandler(404)
def not_found(e):
    return render_template("error.html", emoji="🌫️",
                           title="Скриньку не знайдено", title_ko="편지함을 찾을 수 없어요",
                           message="Перевір нікнейм у посиланні.",
                           message_ko="닉네임(링크)이 올바른지 확인해 주세요."), 404


@app.errorhandler(403)
def forbidden(e):
    return render_template("error.html", emoji="🔒",
                           title="Немає доступу", title_ko="접근 권한이 없어요",
                           message="Спочатку увійди у свою скриньку.",
                           message_ko="먼저 내 편지함에 로그인하세요."), 403


# ----------------------------------------------------------------------
# Старт програми / 프로그램 시작
# ----------------------------------------------------------------------
if __name__ == "__main__":
    setup_files()
    # UK: На Replit порт приходить у змінній PORT; локально — 5000.
    # KO: Replit에서는 PORT 환경변수로 포트가 오고, 로컬에서는 5000을 씁니다.
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
