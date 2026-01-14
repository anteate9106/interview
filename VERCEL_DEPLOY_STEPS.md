# Vercel 배포 단계별 가이드 🚀

## ✅ 현재 상태
- Vercel CLI 50.3.2 설치 완료 ✅
- 프로젝트 설정 완료 ✅
- Git 커밋 완료 ✅

## 📝 배포 단계

### 1단계: Vercel 로그인

터미널에서 다음 명령어를 실행하세요:

```bash
vercel login
```

실행하면:
1. 이메일 주소 입력 요청
2. 이메일로 인증 링크 발송
3. 브라우저에서 "Verify" 클릭
4. 터미널에 "Success!" 메시지 표시

### 2단계: 프로젝트 배포

```bash
cd /Users/central/Desktop/interview
vercel --prod --yes
```

또는 간단하게:

```bash
vercel --prod
```

### 3단계: 배포 설정 (최초 1회)

다음과 같은 질문들이 나타납니다:

```
? Set up and deploy "~/Desktop/interview"? (Y/n)
답변: Y

? Which scope do you want to deploy to?
답변: (본인 계정 선택)

? Link to existing project? (y/N)
답변: N (새 프로젝트)

? What's your project's name?
답변: insarecord (엔터)

? In which directory is your code located?
답변: ./ (엔터, 현재 디렉토리)
```

### 4단계: 배포 완료!

약 30초~1분 후:

```
✅ Production: https://insarecord.vercel.app [1s]
```

URL이 표시됩니다!

## 🌐 배포 후 접속 URL

```
https://insarecord.vercel.app/           → 관리자 로그인
https://insarecord.vercel.app/apply      → 지원자 페이지
https://insarecord.vercel.app/evaluator  → 평가자 페이지
```

## 🔄 재배포 방법

코드를 수정한 후:

```bash
# 1. Git 커밋
git add .
git commit -m "feat: 새 기능 추가"

# 2. Vercel 재배포
vercel --prod
```

## ⚙️ Supabase CORS 설정 (중요!)

배포 후 반드시 설정해야 합니다:

### 1. Supabase Dashboard 접속
```
https://supabase.com/dashboard/project/qlcnvlzcflocseuvsjcb
```

### 2. Settings → API → CORS 설정
```
Allowed Origins에 추가:
https://insarecord.vercel.app
https://*.vercel.app
```

### 3. 저장

이제 Vercel에서 Supabase에 접근 가능합니다!

## 🎯 테스트

배포 후 각 페이지 테스트:

### 1. 관리자 페이지
```
URL: https://insarecord.vercel.app
로그인: admin / admin123
```

### 2. 평가자 페이지
```
URL: https://insarecord.vercel.app/evaluator
로그인: evaluator1 / eval123
```

### 3. 지원자 페이지
```
URL: https://insarecord.vercel.app/apply
지원서 작성 및 제출 테스트
```

## 🐛 문제 해결

### CORS 에러가 나는 경우
```
원인: Supabase CORS 설정 누락
해결: 위의 "Supabase CORS 설정" 단계 수행
```

### 404 에러가 나는 경우
```
원인: 라우팅 문제
해결: vercel.json 파일 확인
```

### "Not Found" 에러
```
원인: HTML 파일 경로 문제
해결: URL 끝에 .html 추가
예: /apply.html 대신 /apply 사용
```

## 📊 Vercel Dashboard

배포 상태 확인:
```
https://vercel.com/dashboard
```

여기서 확인 가능:
- 배포 로그
- 실시간 트래픽
- 에러 로그
- 도메인 설정

## 🎨 커스텀 도메인 추가 (선택)

### 1. Vercel Dashboard → 프로젝트 선택
### 2. Settings → Domains
### 3. 도메인 입력
```
예: recruit.company.com
```

### 4. DNS 설정
Vercel이 제공하는 DNS 레코드 추가:
```
Type: CNAME
Name: recruit
Value: cname.vercel-dns.com
```

## 📈 자동 배포 설정

### GitHub 연동 (권장)

1. **GitHub 리포지토리 생성**
```bash
git remote add origin https://github.com/사용자명/insarecord.git
git push -u origin main
```

2. **Vercel에서 Import**
- Vercel Dashboard → Add New Project
- GitHub 리포지토리 선택
- Import 클릭

3. **자동 배포 활성화**
```bash
# 이제 git push만 하면 자동 배포!
git add .
git commit -m "update"
git push origin main
# → Vercel이 자동으로 감지하고 배포
```

## 🔒 환경 변수 설정 (선택)

더 안전한 방법:

### 1. config.js 대신 환경 변수 사용

Vercel Dashboard → Settings → Environment Variables:
```
SUPABASE_URL=https://qlcnvlzcflocseuvsjcb.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. config.js 수정
```javascript
const SUPABASE_URL = process.env.SUPABASE_URL || 'fallback-url';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'fallback-key';
```

## 📱 배포 로그 확인

실시간 로그 확인:
```bash
vercel logs [deployment-url]
```

## ✅ 완료 체크리스트

배포 후 확인사항:

- [ ] Vercel 로그인 완료
- [ ] vercel --prod 실행
- [ ] 배포 URL 확인
- [ ] 관리자 페이지 접속 테스트
- [ ] 평가자 페이지 접속 테스트
- [ ] 지원자 페이지 접속 테스트
- [ ] Supabase CORS 설정
- [ ] 지원서 제출 테스트
- [ ] 평가 기능 테스트

## 🎉 성공!

배포가 완료되면:
1. URL을 팀원들과 공유
2. 실제 데이터로 테스트
3. 문제 발견 시 수정 후 재배포

---

## 💡 빠른 명령어

```bash
# 로그인
vercel login

# 배포
vercel --prod

# 로그 확인
vercel logs

# 프로젝트 목록
vercel list

# 프로젝트 제거
vercel remove insarecord
```

---

© 2026 Vercel 배포 가이드
