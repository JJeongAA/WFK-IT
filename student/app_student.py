"""
Таємний лист — версія для практики (з логіном)
비밀편지 - 학생 실습용 (닉네임+비밀번호 로그인)
========================================================
UK: Заповни всі TODO. Готово -> працює як app.py.
KO: 모든 TODO를 채우세요. 다 하면 app.py 처럼 동작해요.
    (templates, static 폴더가 같은 위치에 있어야 함)
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
app.secret_key = "wfk-secret-letter-class-key-change-me"

DATA_DIR = "data"
MAILBOX_FILE = os.path.join(DATA_DIR, "mailboxes.json")
LETTERS_DIR = os.path.join(DATA_DIR, "letters")
ICONS = ["🎁", "⭐", "❤️", "🔔", "☃️", "🍪", "🧸", "🌟", "💌", "🎀", "🌸", "🐧"]
COLORS = ["#ffd6e7", "#d6e4ff", "#d9f7e5", "#fff3c4", "#ede0ff", "#ffe0cc"]
NICK_RE = re.compile(r"^[\w-]{2,20}$")


# ======================================================================
# TODO 1) 파일 읽기/쓰기 / читання-запис файлів
# ======================================================================
def setup_files():
    os.makedirs(LETTERS_DIR, exist_ok=True)
    if not os.path.exists(MAILBOX_FILE):
        save_json(MAILBOX_FILE, {})


def load_json(path, default):
    # UK: якщо файлу немає -> поверни default; інакше open(...,"r") + json.load
    # KO: 파일 없으면 default; 있으면 open(...,"r") + json.load 로 읽기
    pass  # TODO


def save_json(path, data):
    # UK: open(...,"w", encoding="utf-8") + json.dump(data, f, ensure_ascii=False, indent=2)
    # KO: open(...,"w", encoding="utf-8") + json.dump(data, f, ensure_ascii=False, indent=2)
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

    # TODO 2) UK: Збережи скриньку з ХЕШЕМ пароля (не текстом!).
    #            Підказка: "password_hash": generate_password_hash(password)
    #         KO: 비밀번호를 '해시'해서 저장하세요 (원문 X!).
    #            힌트: "password_hash": generate_password_hash(password)
    mailboxes[name] = {
        "password_hash": "",  # TODO: generate_password_hash(password)
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
            # TODO 3) 새 편지를 추가하고 저장 / додай лист і збережи
            #   letters.append({
            #     "id": secrets.token_hex(4), "message": message, "sender": sender,
            #     "icon": icon, "color": color,
            #     "time": datetime.now().strftime("%Y-%m-%d %H:%M"),
            #   })  후 save_json 으로 저장
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

    if not is_logged_in(box_id):
        if request.method == "POST":
            password = request.form.get("password", "")
            # TODO 4) UK: Перевір пароль. Якщо правильний -> увійти (сесія),
            #            інакше -> показати помилку.
            #            Підказка: check_password_hash(box["password_hash"], password)
            #                      session["auth_" + box_id] = True
            #         KO: 비밀번호가 맞으면 로그인(세션 저장), 틀리면 오류.
            #            힌트: check_password_hash(box["password_hash"], password)
            #                  session["auth_" + box_id] = True
            if False:  # TODO: check_password_hash(...) 로 바꾸기
                session["auth_" + box_id] = True
                return redirect(url_for("inbox", box_id=box_id))
            return render_template("login.html", box_id=box_id, error=True)
        return render_template("login.html", box_id=box_id, error=False)

    letters = list(reversed(load_json(letters_path(box_id), [])))
    return render_template("inbox.html", name=box_id, letters=letters, count=len(letters))


@app.route("/box/<box_id>/logout")
def logout(box_id):
    # TODO 5) 로그아웃: 세션에서 이 편지함 인증 지우기 / вийти: прибрати сесію
    #   힌트: session.pop("auth_" + box_id, None)
    pass  # TODO
    return redirect(url_for("home"))


# (이미 완성된 기능) 편지 삭제 — 로그인한 주인만 / готово: видалення листа
@app.route("/box/<box_id>/delete", methods=["POST"])
def delete_letter(box_id):
    mailboxes = load_json(MAILBOX_FILE, {})
    if box_id not in mailboxes:
        abort(404)
    if not is_logged_in(box_id):
        abort(403)
    letter_id = request.form.get("letter_id", "")
    letters = load_json(letters_path(box_id), [])
    letters = [lt for lt in letters if lt.get("id") != letter_id]
    save_json(letters_path(box_id), letters)
    return redirect(url_for("inbox", box_id=box_id))


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


if __name__ == "__main__":
    setup_files()
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
