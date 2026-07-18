#!/bin/bash
# 맥용 폰 공유 (Cloudflare) / Поділитися на телефон (Mac, Cloudflare)
# cloudflared 가 없으면 자동으로 다운로드해요.
cd "$(dirname "$0")"

echo "=================================================="
echo "   Secret Letter  -  SHARE TO PHONE (Cloudflare)"
echo "=================================================="
echo ""

# 0) cloudflared 준비 (없으면 칩에 맞게 자동 다운로드)
if [ ! -f "./cloudflared" ]; then
  echo "[0/3] cloudflared 다운로드 중... / downloading cloudflared..."
  ARCH=$(uname -m)
  if [ "$ARCH" = "arm64" ]; then
    URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-arm64.tgz"
  else
    URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-amd64.tgz"
  fi
  curl -L -o cloudflared.tgz "$URL"
  tar -xzf cloudflared.tgz
  rm -f cloudflared.tgz
  chmod +x cloudflared
  xattr -d com.apple.quarantine cloudflared 2>/dev/null   # 보안 차단 방지
fi

# 1) Flask 설치
echo "[1/3] Flask 설치 중... / Installing Flask..."
python3 -m pip install -r requirements.txt

# 2) 서버 실행 (백그라운드)
echo "[2/3] 서버 실행 중... / Starting server..."
python3 app.py &
SERVER_PID=$!
sleep 3

# 3) 공개 링크
echo "[3/3] 공개 링크 생성 중... / Creating public link..."
echo ""
echo "  ################################################################"
echo "   Look for the address:   https://XXXX.trycloudflare.com"
echo "   그 주소를 폰으로 보내세요! / Send THAT to your phone."
echo "   이 창을 닫지 마세요! / KEEP THIS WINDOW OPEN while sharing."
echo "  ################################################################"
echo ""
./cloudflared tunnel --url http://localhost:5000

# 터널을 닫으면 서버도 함께 종료
kill $SERVER_PID 2>/dev/null
