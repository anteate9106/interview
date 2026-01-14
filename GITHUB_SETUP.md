# GitHub 연결 가이드 🔗

## 📋 준비사항

1. GitHub 계정 (없으면 https://github.com 에서 가입)
2. Git 설치 완료 ✅
3. 프로젝트 커밋 완료 ✅

## 🚀 GitHub 연결 단계

### 1단계: GitHub에서 새 리포지토리 생성

1. **GitHub 접속**: https://github.com
2. **로그인**
3. **New repository 클릭** (우측 상단 + 버튼)
4. **리포지토리 설정**:
   ```
   Repository name: insarecord
   Description: 청년들 입사지원 시스템
   Visibility: Private (권장) 또는 Public
   ✅ Add a README: 체크 하지 않음
   ✅ Add .gitignore: None
   ✅ Choose a license: None
   ```
5. **Create repository 클릭**

### 2단계: GitHub 리포지토리 URL 복사

생성 후 나타나는 화면에서 HTTPS URL 복사:
```
https://github.com/사용자명/insarecord.git
```

### 3단계: 로컬 Git과 연결

터미널에서 다음 명령어 실행:

```bash
# 1. 프로젝트 디렉토리로 이동
cd /Users/central/Desktop/interview

# 2. GitHub 리포지토리 연결
git remote add origin https://github.com/사용자명/insarecord.git

# 3. 연결 확인
git remote -v

# 4. 브랜치 이름 확인/변경 (main으로)
git branch -M main

# 5. GitHub에 Push
git push -u origin main
```

### 4단계: GitHub 인증

Push 시 인증 요청이 나타나면:

#### 옵션 A: Personal Access Token (권장)
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token" 클릭
3. 권한 선택: `repo` 전체 체크
4. Token 생성 후 복사 (한 번만 보임!)
5. 터미널에서:
   ```
   Username: [GitHub 사용자명]
   Password: [생성한 Token 붙여넣기]
   ```

#### 옵션 B: GitHub CLI 사용
```bash
# GitHub CLI 설치
brew install gh

# 인증
gh auth login

# Push
git push -u origin main
```

## 🎯 빠른 시작 명령어

```bash
# GitHub 리포지토리 생성 후 실행:

cd /Users/central/Desktop/interview
git remote add origin https://github.com/사용자명/insarecord.git
git branch -M main
git push -u origin main
```

## ✅ 연결 확인

성공하면 다음과 같이 표시됩니다:

```
Enumerating objects: 20, done.
Counting objects: 100% (20/20), done.
Delta compression using up to 8 threads
Compressing objects: 100% (18/18), done.
Writing objects: 100% (20/20), 50.23 KiB | 5.02 MiB/s, done.
Total 20 (delta 2), reused 0 (delta 0), pack-reused 0
To https://github.com/사용자명/insarecord.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

이제 GitHub에서 코드를 확인할 수 있습니다!

## 🔄 이후 작업 흐름

코드 수정 후:

```bash
# 1. 변경사항 추가
git add .

# 2. 커밋
git commit -m "feat: 새 기능 추가"

# 3. Push
git push origin main
```

## 🌐 Vercel과 GitHub 연동

### 자동 배포 설정

1. **Vercel Dashboard**: https://vercel.com/dashboard
2. **Add New Project** 클릭
3. **Import Git Repository** 선택
4. **GitHub 계정 연동**
5. **insarecord 리포지토리 선택**
6. **Import** 클릭

이제 `git push` 할 때마다 자동으로 Vercel에 배포됩니다! 🚀

## 📊 현재 프로젝트 구조

```
insarecord/
├── index.html              # 관리자 페이지
├── apply.html              # 지원자 페이지
├── evaluator.html          # 평가자 페이지
├── app.js                  # 관리자 로직
├── apply.js                # 지원자 로직
├── evaluator.js            # 평가자 로직
├── styles.css              # 관리자 스타일
├── apply.css               # 지원자 스타일
├── evaluator.css           # 평가자 스타일
├── config.js               # Supabase 설정
├── db.js                   # DB 헬퍼 함수
├── vercel.json             # Vercel 설정
├── package.json            # 프로젝트 정보
├── .gitignore              # Git 제외 파일
├── README.md               # 프로젝트 문서
├── SUPABASE_SETUP.md       # Supabase 가이드
├── DEPLOY.md               # 배포 가이드
├── NPM_INSTALL.md          # npm 설치 가이드
├── VERCEL_DEPLOY_STEPS.md  # Vercel 단계별 가이드
└── GITHUB_SETUP.md         # 이 파일
```

## 🎨 GitHub 리포지토리 설정

### README.md 개선

GitHub에서 리포지토리가 더 멋지게 보이도록:

```markdown
# 🎓 청년들 입사지원 시스템

입사지원서 작성, 평가자 평가, 관리자 취합을 위한 통합 웹 플랫폼

## 🚀 Live Demo
- [관리자 페이지](https://insarecord.vercel.app)
- [평가자 페이지](https://insarecord.vercel.app/evaluator)
- [지원자 페이지](https://insarecord.vercel.app/apply)

## 🛠 기술 스택
- HTML5, CSS3, JavaScript
- Supabase (Database)
- Vercel (Hosting)
```

### Topics 추가

GitHub 리포지토리 페이지에서:
- Settings → Topics 추가
- `recruitment`, `evaluation`, `supabase`, `vercel` 등

## 🔒 보안 설정

### .gitignore 확인

민감한 정보가 커밋되지 않도록:

```
# 환경 변수
.env
.env.local

# 로그
*.log

# OS 파일
.DS_Store
```

### Secrets 관리

중요한 키는 GitHub Secrets에 저장:
1. Repository → Settings → Secrets and variables → Actions
2. New repository secret
3. Vercel과 연동 시 자동으로 사용

## 📈 GitHub Actions (선택)

자동 테스트 및 배포:

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

## 🎯 완료 체크리스트

- [ ] GitHub 계정 생성/로그인
- [ ] 새 리포지토리 생성 (insarecord)
- [ ] Git remote 추가
- [ ] Git push 완료
- [ ] GitHub에서 코드 확인
- [ ] Vercel과 GitHub 연동
- [ ] 자동 배포 테스트

## 🐛 문제 해결

### "remote origin already exists"
```bash
# 기존 remote 제거 후 다시 추가
git remote remove origin
git remote add origin https://github.com/사용자명/insarecord.git
```

### "Authentication failed"
```bash
# Personal Access Token 사용
# 또는 GitHub CLI로 인증
gh auth login
```

### "Updates were rejected"
```bash
# 강제 push (주의: 협업 시 사용 금지)
git push -f origin main

# 또는 pull 후 push
git pull origin main --rebase
git push origin main
```

## 📞 도움말

- GitHub 문서: https://docs.github.com
- Git 문서: https://git-scm.com/doc
- Vercel + GitHub: https://vercel.com/docs/git

---

© 2026 GitHub 연결 가이드
