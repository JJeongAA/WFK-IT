# 💌 비밀편지 (익명 편지함)

친구에게 링크를 보내면 **익명으로 편지를 받을 수 있는** 웹사이트예요.
인스타에서 유행한 "트리 편지함" 같은 사이트를, **데이터베이스 없이 파이썬 파일**만으로 만들었어요.

## ✨ 어떻게 동작하나요?

1. 내 편지함을 만든다 → **닉네임 + 비밀번호** 설정, **공유 링크**가 생긴다
2. **공유 링크** `/box/<닉네임>` 를 친구에게 보낸다
3. 친구가 익명으로 편지를 쓴다 (누가 썼는지 저장 안 됨 🤫)
4. 나는 홈에서 **닉네임 + 비밀번호로 로그인**해서 받은 편지를 확인한다
   (링크를 잃어버려도 닉네임+비번만 알면 다시 들어갈 수 있어요!)

> 💡 데이터베이스 대신 `data/` 폴더 안 **JSON 파일**에 저장돼요.

## 📁 폴더 구성

```
app.py                # 완성본 (바로 실행됨)
requirements.txt      # 필요한 라이브러리 (Flask)
templates/            # 화면 (HTML)
  home.html           #   편지함 만들기 + 로그인
  created.html        #   만든 뒤 공유 링크 안내
  write.html          #   익명 편지 쓰기 (공유 링크)
  thanks.html         #   전송 완료
  login.html          #   비밀번호 로그인
  inbox.html          #   받은 편지함 (아이콘으로 표시)
  error.html          #   에러 화면
static/style.css      # 디자인
student/
  app_student.py      # 학생 실습용 (TODO 채우기)
GUIDE.md              # 수업 가이드 (선생님용)
start.bat / .command  # 더블클릭 실행 (윈도우 / 맥)
share.bat / .command  # 더블클릭 폰 공유
```

## ▶️ 실행 방법

### ⭐ 방법 A. 더블클릭 (초보자용, 명령어 필요 없음)

**윈도우(Windows):**
- **`start.bat` 더블클릭** → 자동으로 설치 + 실행 + 브라우저가 저절로 열려요.
- **`share_cf.bat` 더블클릭** ⭐ → 서버 + **폰 공유 링크**(Cloudflare, 안정적). `https://xxxx.trycloudflare.com` 주소가 떠요. (가입 X, 무료)
  - 필요 파일: `cloudflared.exe` (무료, 한 번만 다운로드해서 폴더에 두면 됨)
- `share.bat` → localhost.run 방식 (가끔 끊겨서 비추천. `share_cf.bat` 이 더 안정적)

> ⚠️ 공유용 창은 **끝날 때까지 닫지 마세요.** 창을 닫으면 링크가 죽어요.

**맥(Mac):**
- **`start.command` 더블클릭** → 설치 + 실행 + 브라우저 자동
- **`share_cf.command` 더블클릭** ⭐ → 폰 공유(Cloudflare, 안정적). `cloudflared`가 없으면 칩(Intel/Apple)에 맞게 **자동 다운로드**해요.
- `share.command` → localhost.run 방식 (가끔 끊겨서 비추천)
- ⚠️ 맥은 처음 한 번만: 터미널에서 `chmod +x *.command` 실행
  (또는 파일 우클릭 → "열기"). 그 뒤부턴 더블클릭이면 돼요.

> 💡 `python`(맥은 `python3`)이 설치돼 있어야 해요. 파이썬 배우는 중이면 보통 이미 있어요.
> 끄려면 뜬 검은 창(터미널)을 닫으면 됩니다.

### 방법 B. 명령어로 (직접)

```bash
pip install -r requirements.txt
python app.py
```

브라우저에서 **http://127.0.0.1:5000** 접속.

> 같은 와이파이의 친구에게 보여주려면, 실행할 때 뜨는
> `http://192.168.x.x:5000` 주소를 알려주면 돼요.

### 방법 C. Replit에서 (내 PC에 파이썬 설치 없이 / 계정 필요)

이 프로젝트에는 이미 `.replit` 설정이 들어 있어서 **Run만 누르면** 됩니다.

1. [replit.com](https://replit.com) 접속 → 새 Repl 만들기
2. 이 프로젝트 폴더 전체를 그대로 올린다
   (**`.replit`, `requirements.txt`, `app.py`, `templates/`, `static/` 모두 포함** — 숨김파일 `.replit` 빠뜨리지 않기!)
3. **Run ▶** 버튼 클릭
   → 자동으로 Flask 설치 후 실행되고, 위쪽 웹뷰에 사이트가 뜹니다.
4. 웹뷰 주소창의 `https://....replit.dev` 가 **어디서든 열리는 진짜 공유 링크!**
   (친구가 모바일 데이터로도, 다른 지역에서도 접속 가능 📱)

> 💡 편지함을 만들 때 나오는 공유 링크도 이 Replit 주소를 그대로 사용해요.
> ⚠️ Replit 무료 버전은 오래 멈춰 있으면 `data/` 파일이 초기화될 수 있어요.
> 수업/발표 때는 충분하지만, 오래 보관하려면 로컬을 쓰세요.

## 🎓 학생이라면?

`student/app_student.py` 를 열어 `TODO` 를 직접 채워보세요.
막히면 `GUIDE.md` 와 완성본 `app.py` 를 참고하세요.
