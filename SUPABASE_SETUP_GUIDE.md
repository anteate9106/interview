# 🔗 GitHub & Supabase 연결 가이드

**작성일**: 2026-01-23

---

## ✅ 현재 상태

### GitHub 저장소
- **저장소**: `anteate9106/interview`
- **상태**: ✅ 존재함
- **연결**: ✅ 정상

### Supabase 프로젝트
- **현재 URL**: `https://qlcnvlzcflocseuvsjcb.supabase.co`
- **상태**: ⚠️ 연결 불가 (프로젝트 삭제 또는 URL 변경됨)

---

## 🔧 Supabase 프로젝트 설정 방법

### 방법 1: 기존 프로젝트 확인

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard
   - 로그인

2. **프로젝트 확인**
   - 프로젝트 목록에서 `interview` 또는 관련 프로젝트 확인
   - 프로젝트 선택

3. **API 정보 확인**
   - Settings → API 메뉴
   - **Project URL** 복사 (예: `https://xxxxx.supabase.co`)
   - **anon public** 키 복사

### 방법 2: 새 프로젝트 생성

1. **Supabase 대시보드**에서 "New Project" 클릭
2. **프로젝트 정보 입력**
   - Name: `interview`
   - Database Password: 설정
   - Region: 선택 (ap-northeast-2 권장)
3. **프로젝트 생성 완료 후**
   - Settings → API에서 URL과 키 복사

---

## 📝 config.js 업데이트

Supabase 프로젝트 URL과 API Key를 받으면:

```javascript
// config.js
const SUPABASE_URL = 'https://[새로운-프로젝트-ID].supabase.co';
const SUPABASE_ANON_KEY = '새로운-API-Key';
```

---

## 🗄️ 데이터베이스 테이블 생성

새 프로젝트를 만든 경우, Supabase SQL Editor에서 다음 SQL 실행:

### 1. applicants 테이블
```sql
CREATE TABLE applicants (
  id BIGSERIAL PRIMARY KEY,
  job_posting TEXT NOT NULL,
  name TEXT NOT NULL,
  birthdate DATE,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  phone TEXT,
  branch TEXT,
  position TEXT,
  address TEXT,
  education TEXT,
  certifications TEXT,
  career TEXT,
  self_introduction TEXT,
  career_description TEXT,
  motivation TEXT,
  aspiration TEXT,
  submit_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. evaluations 테이블
```sql
CREATE TABLE evaluations (
  id BIGSERIAL PRIMARY KEY,
  applicant_id BIGINT REFERENCES applicants(id) ON DELETE CASCADE,
  evaluator_id TEXT NOT NULL,
  evaluator_name TEXT,
  score1 INTEGER,
  score2 INTEGER,
  score3 INTEGER,
  score4 INTEGER,
  total_score INTEGER,
  comment1 TEXT,
  comment2 TEXT,
  comment3 TEXT,
  comment4 TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 3. 인덱스 생성 (성능 향상)
```sql
CREATE INDEX idx_applicants_email ON applicants(email);
CREATE INDEX idx_applicants_job_posting ON applicants(job_posting);
CREATE INDEX idx_evaluations_applicant_id ON evaluations(applicant_id);
CREATE INDEX idx_evaluations_evaluator_id ON evaluations(evaluator_id);
```

### 4. RLS (Row Level Security) 설정
```sql
-- applicants 테이블: 모든 사용자가 읽기/쓰기 가능
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on applicants"
ON applicants FOR ALL
USING (true)
WITH CHECK (true);

-- evaluations 테이블: 모든 사용자가 읽기/쓰기 가능
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on evaluations"
ON evaluations FOR ALL
USING (true)
WITH CHECK (true);
```

---

## ✅ 연결 확인

### 1. config.js 업데이트 후
- 로컬 서버에서 테스트
- 브라우저 콘솔에서 오류 확인

### 2. 데이터베이스 연결 테스트
- 지원자 페이지에서 지원서 작성 시도
- 관리자 페이지에서 데이터 조회 확인

---

## 🚀 배포

### GitHub 푸시
```bash
git add config.js
git commit -m "fix: Supabase 프로젝트 URL 및 API Key 업데이트"
git push origin main
```

### Vercel 자동 배포
- GitHub 푸시 후 자동으로 배포됨
- 1-2분 내 배포 완료

---

## 📞 다음 단계

1. **Supabase 대시보드에서 프로젝트 확인**
   - 기존 프로젝트가 있는지 확인
   - 없으면 새 프로젝트 생성

2. **프로젝트 URL과 API Key 복사**
   - Settings → API에서 정보 확인

3. **config.js 업데이트 요청**
   - URL과 API Key를 알려주시면 업데이트하겠습니다

4. **데이터베이스 테이블 생성**
   - 새 프로젝트인 경우 위의 SQL 실행

5. **연결 테스트**
   - 로컬에서 테스트 후 배포

---

**현재**: Supabase 프로젝트 정보가 필요합니다. Supabase 대시보드에서 프로젝트 URL과 API Key를 확인한 후 알려주시면 `config.js`를 업데이트하겠습니다.
