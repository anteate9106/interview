# npm 설치 가이드 (macOS)

## 📦 npm이란?

- **npm** (Node Package Manager): JavaScript 패키지 관리자
- Node.js를 설치하면 npm이 자동으로 함께 설치됩니다
- Vercel CLI 등 개발 도구를 설치하는 데 필요합니다

## 🚀 설치 방법 (3가지)

### ✅ 방법 1: Homebrew 사용 (가장 추천!)

Homebrew가 설치되어 있다면 가장 쉬운 방법입니다.

```bash
# 1. Homebrew가 설치되어 있는지 확인
brew --version

# 2. Node.js 설치 (npm 포함)
brew install node

# 3. 설치 확인
node --version
npm --version
```

#### Homebrew가 없다면?
```bash
# Homebrew 먼저 설치
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### ✅ 방법 2: 공식 설치 파일 다운로드

1. **Node.js 공식 사이트 접속**
   - https://nodejs.org/

2. **LTS 버전 다운로드**
   - "LTS" (Long Term Support) 버전 클릭
   - 안정적이고 권장되는 버전입니다

3. **설치 파일 실행**
   - 다운로드한 `.pkg` 파일 실행
   - 설치 마법사 따라하기

4. **설치 확인**
   ```bash
   node --version
   npm --version
   ```

### ✅ 방법 3: nvm 사용 (개발자용)

여러 Node.js 버전을 관리해야 하는 경우:

```bash
# 1. nvm 설치
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 2. 터미널 재시작 후
nvm install node        # 최신 버전 설치
nvm install --lts       # LTS 버전 설치

# 3. 버전 확인
node --version
npm --version
```

## 🔧 현재 권한 문제 해결

현재 다음 에러가 발생했습니다:
```
npm error Your cache folder contains root-owned files
```

### 해결 방법 A: npm 캐시 권한 수정

```bash
# 1. npm 캐시 소유권 변경
sudo chown -R $(whoami) ~/.npm

# 2. 다시 설치 시도
npm install -g vercel
```

### 해결 방법 B: 새로 설치

```bash
# 1. 기존 Node.js 완전 제거
sudo rm -rf /usr/local/lib/node_modules
sudo rm -rf ~/.npm
sudo rm -rf /usr/local/bin/npm
sudo rm -rf /usr/local/bin/node

# 2. Homebrew로 새로 설치
brew install node

# 3. 설치 확인
node --version
npm --version

# 4. Vercel CLI 설치
npm install -g vercel
```

### 해결 방법 C: Vercel 웹 UI 사용 (가장 쉬움!)

npm 문제를 건너뛰고 웹 브라우저로 배포:
1. https://vercel.com 접속
2. GitHub 계정으로 가입
3. 리포지토리 Import
4. Deploy 클릭!

## ✅ 설치 확인

```bash
# Node.js 버전 확인
node --version
# 예상 출력: v20.10.0

# npm 버전 확인
npm --version
# 예상 출력: 10.2.3

# 설치 경로 확인
which node
which npm
```

## 📦 Vercel CLI 설치

npm이 설치되었다면:

```bash
# 전역 설치
npm install -g vercel

# 설치 확인
vercel --version

# 로그인
vercel login
```

## 🐛 문제 해결

### 1. "command not found: npm"
```bash
# PATH 환경 변수 확인
echo $PATH

# Node.js 재설치
brew reinstall node
```

### 2. "permission denied"
```bash
# sudo 없이 설치하려면 권한 수정
sudo chown -R $(whoami) /usr/local/lib/node_modules
sudo chown -R $(whoami) /usr/local/bin

# 또는 sudo 사용
sudo npm install -g vercel
```

### 3. "EACCES" 에러
```bash
# npm 설정 변경 (전역 패키지를 홈 디렉토리에 설치)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'

# .zshrc 또는 .bash_profile에 추가
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc

# 이제 sudo 없이 설치 가능
npm install -g vercel
```

## 🎯 빠른 시작 (권장)

### Option A: Homebrew 방식
```bash
# 1. Node.js 설치
brew install node

# 2. 캐시 권한 수정
sudo chown -R $(whoami) ~/.npm

# 3. Vercel CLI 설치
npm install -g vercel

# 4. 배포
cd /Users/central/Desktop/interview
vercel login
vercel --prod
```

### Option B: 웹 UI 방식 (npm 불필요!)
```bash
# 1. GitHub에 푸시
git remote add origin https://github.com/사용자명/insarecord.git
git push -u origin main

# 2. 브라우저에서 https://vercel.com 접속
# 3. GitHub 연동 및 Deploy 클릭
# 완료!
```

## 📚 추가 자료

- Node.js 공식 사이트: https://nodejs.org/
- npm 문서: https://docs.npmjs.com/
- Homebrew: https://brew.sh/
- Vercel 문서: https://vercel.com/docs

## 💡 팁

1. **LTS 버전 사용**: 안정적이고 장기 지원
2. **정기적 업데이트**: `brew upgrade node`
3. **캐시 정리**: `npm cache clean --force`
4. **전역 패키지 확인**: `npm list -g --depth=0`

## 🔍 현재 상태 확인

```bash
# 설치 여부 확인
which node
which npm

# 버전 확인
node --version
npm --version

# 전역 패키지 목록
npm list -g --depth=0
```

---

## 🚀 다음 단계

### npm 설치 후:
```bash
# 1. Vercel CLI 설치
npm install -g vercel

# 2. 프로젝트 디렉토리로 이동
cd /Users/central/Desktop/interview

# 3. Vercel 로그인
vercel login

# 4. 배포
vercel --prod

# 완료! URL이 표시됩니다
```

### npm 없이 배포:
- DEPLOY.md 파일의 "방법 2: Vercel Dashboard (웹 UI)" 참고
- GitHub에 푸시 후 웹에서 Import만 하면 끝!

---

© 2026 npm 설치 가이드
