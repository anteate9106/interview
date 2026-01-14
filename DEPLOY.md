# Vercel 배포 가이드 🚀

## 📋 사전 준비

### 1. Vercel 계정 생성
- https://vercel.com 접속
- GitHub, GitLab, Bitbucket 계정으로 가입

### 2. Vercel CLI 설치 (선택사항)
```bash
npm install -g vercel
```

## 🚀 배포 방법

### 방법 1: Vercel CLI 사용 (추천)

#### 1단계: 프로젝트 디렉토리에서 실행
```bash
cd /Users/central/Desktop/interview
vercel
```

#### 2단계: 초기 설정
```
? Set up and deploy "~/Desktop/interview"? [Y/n] Y
? Which scope do you want to deploy to? [Your Account]
? Link to existing project? [y/N] N
? What's your project's name? insarecord
? In which directory is your code located? ./
```

#### 3단계: 배포 완료
- Production URL이 표시됩니다
- 예: https://insarecord.vercel.app

#### 4단계: 프로덕션 배포
```bash
vercel --prod
```

### 방법 2: Vercel Dashboard (웹 UI)

#### 1단계: GitHub에 코드 푸시
```bash
# GitHub 리포지토리 생성 후
git remote add origin https://github.com/yourusername/insarecord.git
git branch -M main
git push -u origin main
```

#### 2단계: Vercel Dashboard
1. https://vercel.com/dashboard 접속
2. "Add New Project" 클릭
3. GitHub 리포지토리 선택
4. "Import" 클릭

#### 3단계: 프로젝트 설정
```
Project Name: insarecord
Framework Preset: Other
Root Directory: ./
Build Command: (비워두기)
Output Directory: ./
Install Command: (비워두기)
```

#### 4단계: 환경 변수 설정 (선택)
```
Environment Variables 섹션에서:
(이미 config.js에 하드코딩되어 있으므로 불필요)
```

#### 5단계: Deploy 클릭

## 🌐 배포 후 URL

### 자동 생성 URL
```
https://insarecord.vercel.app          (메인 URL)
https://insarecord-git-main.vercel.app (Git 브랜치별)
https://insarecord-[hash].vercel.app   (각 배포별)
```

### 커스텀 도메인 설정
1. Vercel Dashboard → Settings → Domains
2. 도메인 입력 (예: recruit.company.com)
3. DNS 설정 따라하기

## 📱 접속 URL

배포 후 다음 URL로 접속 가능:

```
https://insarecord.vercel.app/               → 관리자 로그인
https://insarecord.vercel.app/apply.html     → 지원자 페이지
https://insarecord.vercel.app/evaluator.html → 평가자 페이지

또는 깔끔한 URL (vercel.json 설정):
https://insarecord.vercel.app/               → 관리자
https://insarecord.vercel.app/apply          → 지원자
https://insarecord.vercel.app/evaluator      → 평가자
```

## 🔄 자동 배포 설정

### GitHub 연동 시
- `main` 브랜치에 push → 자동 배포
- Pull Request 생성 → 프리뷰 배포 자동 생성
- Commit마다 고유 URL 생성

### 배포 트리거
```bash
# 코드 수정 후
git add .
git commit -m "feat: 새 기능 추가"
git push origin main
# → 자동으로 Vercel에 배포됨!
```

## ⚙️ 배포 설정 파일

### vercel.json
```json
{
  "version": 2,
  "name": "insarecord",
  "routes": [
    { "src": "/", "dest": "/index.html" },
    { "src": "/(.*)", "dest": "/$1" }
  ],
  "rewrites": [
    { "source": "/apply", "destination": "/apply.html" },
    { "source": "/evaluator", "destination": "/evaluator.html" },
    { "source": "/admin", "destination": "/index.html" }
  ]
}
```

## 🔍 배포 확인

### 1. 로컬에서 테스트
```bash
# Vercel CLI로 로컬 서버 실행
vercel dev

# 또는 간단한 HTTP 서버
npx serve .
```

### 2. 배포 로그 확인
```bash
vercel logs [deployment-url]
```

### 3. 배포 상태 확인
- Vercel Dashboard에서 실시간 로그 확인
- 빌드 성공/실패 이메일 수신

## 🐛 문제 해결

### 1. 404 에러
```
원인: 라우팅 설정 문제
해결: vercel.json의 routes 확인
```

### 2. Supabase 연결 오류
```
원인: CORS 설정
해결: Supabase Dashboard → Settings → API
      → Allowed origins에 Vercel URL 추가
      예: https://insarecord.vercel.app
```

### 3. 환경 변수 오류
```
원인: config.js 로딩 안 됨
해결: HTML에서 config.js가 올바르게 로드되는지 확인
```

## 📊 성능 최적화

### 1. Vercel Edge Network
- 자동으로 전 세계 CDN 배포
- 빠른 로딩 속도

### 2. 자동 HTTPS
- SSL 인증서 자동 생성
- 무료 HTTPS 지원

### 3. 이미지 최적화
- Vercel Image Optimization 사용 가능
- 자동 WebP 변환

## 🔒 보안 설정

### 1. 환경 변수 보호
```bash
# config.js를 .env로 변경 (권장)
vercel env add SUPABASE_URL production
vercel env add SUPABASE_ANON_KEY production
```

### 2. CORS 설정
```javascript
// Supabase Dashboard에서 설정
Allowed origins:
- https://insarecord.vercel.app
- https://*.vercel.app (프리뷰 배포용)
```

## 📈 배포 통계

### Analytics 활성화
1. Vercel Dashboard → Analytics
2. 방문자 수, 페이지 뷰 확인
3. 성능 메트릭 모니터링

## 🎯 다음 단계

### 1. 도메인 구매 (선택)
```
- Namecheap, GoDaddy 등에서 구매
- Vercel에서 도메인 연결
- 예: recruit.company.com
```

### 2. GitHub Actions 설정 (선택)
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: amondnet/vercel-action@v20
```

### 3. 모니터링 설정
```
- Sentry: 에러 트래킹
- LogRocket: 사용자 세션 기록
- Google Analytics: 방문자 분석
```

## 📞 지원

- Vercel 문서: https://vercel.com/docs
- Vercel 커뮤니티: https://github.com/vercel/vercel/discussions
- Supabase + Vercel: https://supabase.com/docs/guides/hosting/vercel

## ✅ 체크리스트

배포 전 확인사항:

- [ ] Git 리포지토리 생성
- [ ] Vercel 계정 생성
- [ ] vercel.json 설정 확인
- [ ] Supabase URL이 올바른지 확인
- [ ] 모든 페이지가 로컬에서 정상 작동하는지 테스트
- [ ] CORS 설정 확인
- [ ] 민감한 정보 제거 확인

---

## 🚀 빠른 시작

```bash
# 1. Vercel CLI 설치
npm install -g vercel

# 2. 로그인
vercel login

# 3. 배포
cd /Users/central/Desktop/interview
vercel --prod

# 완료! URL이 표시됩니다.
```

---

© 2026 청년들 입사지원 시스템 - Vercel 배포 가이드
