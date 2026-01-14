#!/bin/bash

# npm 권한 문제 해결 스크립트

echo "🔧 npm 캐시 권한 수정 중..."

# npm 캐시 소유권 변경
sudo chown -R $(whoami) ~/.npm

echo "✅ 권한 수정 완료!"
echo ""
echo "이제 다음 명령어로 Vercel CLI를 설치할 수 있습니다:"
echo "npm install -g vercel"
