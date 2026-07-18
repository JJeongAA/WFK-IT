#!/bin/bash
# 맥용 공유 파일 / Файл для поширення (Mac)
# 더블클릭하면: 서버 + 폰에서 열리는 공개 링크 자동 생성 (가입 X)
cd "$(dirname "$0")"

echo "=================================================="
echo "   Поділитися посиланням / 폰으로 공유하기"
echo "=================================================="
echo ""
echo "[1/3] Flask 설치 중... / Встановлюю Flask..."
python3 -m pip install -r requirements.txt
echo ""
echo "[2/3] 서버 실행 중... / Запускаю сервер..."
python3 app.py &
SERVER_PID=$!
sleep 3
echo ""
echo "[3/3] 공개 링크 만드는 중... / Створюю публічне посилання..."
echo ""
echo "  ################################################################"
echo "   EASIEST: point your phone CAMERA at the QR code below,"
echo "            then tap the link that pops up."
echo "   OR copy the address ending with  .lhr.life  (e.g. https://abc.lhr.life)"
echo "   폰 카메라로 아래 QR 스캔! 또는 .lhr.life 로 끝나는 주소 복사"
echo "   (QR/‘localhost’ 주소는 복사하지 마세요)"
echo "  ################################################################"
echo ""
ssh -o StrictHostKeyChecking=accept-new -R 80:localhost:5000 nokey@localhost.run

# ssh 창을 닫으면 서버도 함께 종료 / Закриття ssh зупиняє й сервер
kill $SERVER_PID 2>/dev/null
