"""
Таємний лист — версія для практики (기초용)
비밀편지 - 학생 실습용
========================================================
UK: Заповни TODO 1~3 у цьому файлі, потім запусти start.bat (або: python app_student.py).
KO: 이 파일의 TODO 1~3 을 채운 뒤, start.bat 을 실행하세요 (또는: python app_student.py).
    (templates, static 폴더와 같은 위치에 있어야 해요 — 이미 그렇게 되어 있어요.)

* 비밀번호 해시 · 로그인 · 로그아웃은 어려운 부분이라 '완성 코드'로 제공돼요.
  읽고 "이렇게 동작하는구나"만 이해하면 돼요 (채울 필요 없음).
  Частина з паролем/логіном уже готова — просто прочитай і зрозумій.
"""

import json
import os
import re
import secrets
from datetime import datetime

from flask import (Flask, render_template, request, redirect, url_for,
                   abort, session)
from werkzeug.security import generate_password_hash, check_password_hash

from i18n import TEXT   # 다국어 텍스트 (uk / ko)

app = Flask(__name__)
app.secret_key = "wfk-secret-letter-class-key-change-me"

DEFAULT_LANG = "uk"   # 기본 언어


# (완성 제공) 모든 화면에 현재 언어(lang)와 번역(t)을 전달
@app.context_processor
def inject_i18n():
    lang = session.get("lang", DEFAULT_LANG)
    if lang not in TEXT:
        lang = DEFAULT_LANG
    return {"lang": lang, "t": TEXT[lang]}


# (완성 제공) 오른쪽 상단 버튼: 언어 전환
@app.route("/lang/<code>")
def set_lang(code):
    if code in TEXT:
        session["lang"] = code
    return redirect(request.referrer or url_for("home"))

DATA_DIR = "data"
MAILBOX_FILE = os.path.join(DATA_DIR, "mailboxes.json")
LETTERS_DIR = os.path.join(DATA_DIR, "letters")
ICONS = ["🎁", "⭐", "❤️", "🔔", "☃️", "🍪", "🧸", "🌟", "💌", "🎀", "🌸", "🐧"]
COLORS = ["#ffd6e7", "#d6e4ff", "#d9f7e5", "#fff3c4", "#ede0ff", "#ffe0cc"]
NICK_RE = re.compile(r"^[\w-]{2,20}$")


# ======================================================================
# TODO 1) UK: Читання / запис файлів (load_json / save_json)
#         KO: 파일 읽기 / 쓰기 (load_json / save_json)
#   UK: замість бази даних зберігаємо у 'файл' / KO: 데이터베이스 대신 '파일'에 저장
# ======================================================================
def setup_files():
    os.makedirs(LETTERS_DIR, exist_ok=True)
    if not os.path.exists(MAILBOX_FILE):
        save_json(MAILBOX_FILE, {})


def load_json(path, default):
    # UK: якщо файлу немає -> поверни default; інакше open(...,"r") + json.load
    # KO: 파일이 없으면 default 를 반환, 있으면 open(...,"r") 로 열어 json.load 로 읽기
    pass  # TODO


def save_json(path, data):
    # UK: open(...,"w", encoding="utf-8") + json.dump(data, f, ensure_ascii=False, indent=2)
    # KO: open(...,"w", encoding="utf-8") 로 열어 json.dump(data, f, ensure_ascii=False, indent=2)
    pass  # TODO


def letters_path(box_id):
    return os.path.join(LETTERS_DIR, box_id + ".json")


def is_logged_in(box_id):
    return session.get("auth_" + box_id, False)


# ======================================================================
# 화면(라우트) / маршрути
# ======================================================================
@app.route("/")
def home():
    return render_template("home.html")


@app.route("/create", methods=["POST"])
def create():
    name = request.form.get("name", "").strip()
    password = request.form.get("password", "")

    if not NICK_RE.match(name):
        return render_template("home.html",
            error_uk="Нікнейм: літери/цифри/_/-, 2~20 символів.",
            error_ko="닉네임은 글자/숫자/_/- 로 2~20자")
    if len(password) < 4:
        return render_template("home.html",
            error_uk="Пароль щонайменше 4 символи.",
            error_ko="비밀번호는 4자 이상")

    mailboxes = load_json(MAILBOX_FILE, {})
    if name in mailboxes:
        return render_template("home.html",
            error_uk="Цей нікнейм зайнятий.",
            error_ko="이미 있는 닉네임이에요.")

    # (완성 제공) 비밀번호는 '해시'로 저장돼요 — 원문 저장 X, 파일이 새어도 안전.
    # (готово) пароль зберігається як хеш, не як текст.
    mailboxes[name] = {
        "password_hash": generate_password_hash(password),
        "created": datetime.now().strftime("%Y-%m-%d %H:%M"),
    }
    save_json(MAILBOX_FILE, mailboxes)
    save_json(letters_path(name), [])

    session["auth_" + name] = True
    return render_template("created.html", name=name)


@app.route("/enter", methods=["POST"])
def enter():
    name = request.form.get("name", "").strip()
    return redirect(url_for("inbox", box_id=name))


@app.route("/box/<box_id>", methods=["GET", "POST"])
def write(box_id):
    mailboxes = load_json(MAILBOX_FILE, {})
    if box_id not in mailboxes:
        abort(404)

    if request.method == "POST":
        message = request.form.get("message", "").strip()
        sender = request.form.get("sender", "").strip()   # 보낸 사람(선택)
        icon = request.form.get("icon", "")
        color = request.form.get("color", "")
        if icon not in ICONS:
            icon = secrets.choice(ICONS)
        if color not in COLORS:
            color = COLORS[0]
        if message:
            letters = load_json(letters_path(box_id), [])
            # ==========================================================
            # TODO 2) UK: Додай новий лист у список letters і збережи у файл.
            #         KO: 새 편지를 letters 리스트에 추가하고, 파일에 저장하세요.
            #   значення / 넣을 값 (dict):
            #     "id": secrets.token_hex(4),   # унікальний id (видалення) / 삭제용 고유 번호
            #     "message": message,
            #     "sender": sender,             # порожньо = анонім / 비우면 익명
            #     "icon": icon, "color": color, # вибір користувача / 사용자가 고른 값
            #     "time": datetime.now().strftime("%Y-%m-%d %H:%M"),
            #   Підказка / 힌트:
            #     letters.append({ ... })  ->  save_json(letters_path(box_id), letters)
            # ==========================================================
            pass  # TODO
        return redirect(url_for("thanks", box_id=box_id))

    return render_template("write.html", name=box_id, box_id=box_id,
                           icons=ICONS, colors=COLORS)


@app.route("/box/<box_id>/thanks")
def thanks(box_id):
    mailboxes = load_json(MAILBOX_FILE, {})
    if box_id not in mailboxes:
        abort(404)
    return render_template("thanks.html", name=box_id, box_id=box_id)


@app.route("/box/<box_id>/inbox", methods=["GET", "POST"])
def inbox(box_id):
    mailboxes = load_json(MAILBOX_FILE, {})
    box = mailboxes.get(box_id)
    if box is None:
        abort(404)

    # (완성 제공) 로그인: 비밀번호가 맞는지 확인하고, 맞으면 세션에 기록해요.
    # (готово) вхід: перевіряємо пароль і запам'ятовуємо в сесії.
    if not is_logged_in(box_id):
        if request.method == "POST":
            password = request.form.get("password", "")
            if check_password_hash(box["password_hash"], password):
                session["auth_" + box_id] = True
                return redirect(url_for("inbox", box_id=box_id))
            return render_template("login.html", box_id=box_id, error=True)
        return render_template("login.html", box_id=box_id, error=False)

    letters = list(reversed(load_json(letters_path(box_id), [])))
    return render_template("inbox.html", name=box_id, letters=letters, count=len(letters))


@app.route("/box/<box_id>/logout")
def logout(box_id):
    # (완성 제공) 로그아웃: 세션에서 이 편지함 로그인 기록을 지워요.
    session.pop("auth_" + box_id, None)
    return redirect(url_for("home"))


@app.route("/box/<box_id>/delete", methods=["POST"])
def delete_letter(box_id):
    mailboxes = load_json(MAILBOX_FILE, {})
    if box_id not in mailboxes:
        abort(404)
    if not is_logged_in(box_id):
        abort(403)   # (완성 제공) 로그인한 주인만 삭제 가능

    letter_id = request.form.get("letter_id", "")
    letters = load_json(letters_path(box_id), [])
    # ==============================================================
    # TODO 3) UK: Залиш лише листи, чий id НЕ дорівнює letter_id (видали саме цей).
    #         KO: letter_id 와 '다른' 편지들만 남기세요 (그 편지만 삭제).
    #   Підказка / 힌트:
    #     letters = [lt for lt in letters if lt.get("id") != letter_id]
    # ==============================================================
    pass  # TODO
    save_json(letters_path(box_id), letters)
    return redirect(url_for("inbox", box_id=box_id))


@app.errorhandler(404)
def not_found(e):
    return render_template("error.html", emoji="🌫️",
                           title_key="err404_title", msg_key="err404_msg"), 404


@app.errorhandler(403)
def forbidden(e):
    return render_template("error.html", emoji="🔒",
                           title_key="err403_title", msg_key="err403_msg"), 403


if __name__ == "__main__":
    setup_files()
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
