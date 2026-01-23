# ⚠️ Supabase 연결 오류 해결 가이드

**오류**: `ERR_NAME_NOT_RESOLVED`
**원인**: Supabase 프로젝트 URL이 해결되지 않음

---

## 🔍 문제 진단

### 확인된 오류
```
qlcnvlzcflocseuvsjcb.supabase.co/rest/v1/applicants
Failed to load resource: net::ERR_NAME_NOT_RESOLVED
```

### DNS 조회 결과
```
** server can't find qlcnvlzcflocseuvsjcb.supabase.co: NXDOMAIN
```

**의미**: Supabase 프로젝트가 삭제되었거나, URL이 변경되었습니다.

---

## 🔧 해결 방법

### 방법 1: Supabase 대시보드에서 확인

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard

2. **프로젝트 확인**
   - 프로젝트 목록에서 `interview` 또는 `insarecord` 프로젝트 확인
   - 프로젝트가 삭제되었는지 확인

3. **새 프로젝트 URL 확인**
   - 프로젝트 선택 → Settings → API
   - **Project URL** 복사
   - 형식: `https://[프로젝트ID].supabase.co`

4. **API Key 확인**
   - 같은 페이지에서 **anon public** 키 복사

### 방법 2: 새 프로젝트 생성 (기존 프로젝트가 삭제된 경우)

1. **Supabase 대시보드**에서 새 프로젝트 생성
2. **프로젝트 URL과 API Key** 복사
3. **데이터베이스 테이블 재생성**
   - `applicants` 테이블
   - `evaluations` 테이블

---

## 📝 config.js 업데이트 방법

새로운 Supabase URL과 API Key를 받으면:

```javascript
// config.js
const SUPABASE_URL = 'https://[새로운-프로젝트-ID].supabase.co';
const SUPABASE_ANON_KEY = '새로운-API-Key';
```

---

## 🔄 데이터베이스 스키마 재생성

새 프로젝트를 만든 경우, 다음 SQL을 실행하세요:

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
  applicant_id BIGINT REFERENCES applicants(id),
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

### 3. 시퀀스 생성 (ID 자동 증가)
```sql
CREATE SEQUENCE applicants_id_seq;
ALTER TABLE applicants ALTER COLUMN id SET DEFAULT nextval('applicants_id_seq');
```

---

## ✅ 확인 사항

Supabase 대시보드에서 확인:
1. ✅ 프로젝트가 활성화되어 있는지
2. ✅ 프로젝트 URL이 올바른지
3. ✅ API Key가 유효한지
4. ✅ 테이블이 존재하는지
5. ✅ RLS (Row Level Security) 설정 확인

---

## 🚨 임시 해결책

Supabase 연결이 복구될 때까지:

1. **로컬 테스트**: 로컬 서버에서만 테스트
2. **데이터 백업**: 기존 데이터가 있다면 백업
3. **새 프로젝트 생성**: 필요시 새 Supabase 프로젝트 생성

---

## 📞 다음 단계

1. **Supabase 대시보드 확인**
   - 프로젝트 상태 확인
   - 새 URL과 API Key 복사

2. **config.js 업데이트**
   - 새 URL과 API Key로 변경

3. **테스트**
   - 로컬에서 연결 테스트
   - 데이터 조회/저장 테스트

4. **배포**
   - 변경사항 커밋 및 푸시
   - Vercel 자동 배포 확인

---

**현재 상태**: Supabase 프로젝트 URL이 해결되지 않아 연결할 수 없습니다. Supabase 대시보드에서 프로젝트 상태를 확인하고, 필요시 새 URL과 API Key를 받아서 `config.js`를 업데이트해야 합니다.
