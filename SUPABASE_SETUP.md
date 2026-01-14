# Supabase 연동 완료 ✅

## 📊 데이터베이스 정보

- **프로젝트명**: insarecord
- **프로젝트 ID**: qlcnvlzcflocseuvsjcb
- **URL**: https://qlcnvlzcflocseuvsjcb.supabase.co
- **리전**: ap-southeast-1 (싱가포르)

## 📦 생성된 테이블

### 1. applicants (지원자)
```sql
CREATE TABLE applicants (
  id BIGINT PRIMARY KEY,
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
  submit_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. evaluations (평가)
```sql
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id BIGINT REFERENCES applicants(id) ON DELETE CASCADE,
  evaluator_id TEXT NOT NULL,
  evaluator_name TEXT NOT NULL,
  score1 INTEGER CHECK (score1 >= 0 AND score1 <= 25),
  score2 INTEGER CHECK (score2 >= 0 AND score2 <= 25),
  score3 INTEGER CHECK (score3 >= 0 AND score3 <= 25),
  score4 INTEGER CHECK (score4 >= 0 AND score4 <= 25),
  comment1 TEXT,
  comment2 TEXT,
  comment3 TEXT,
  comment4 TEXT,
  total_score INTEGER GENERATED ALWAYS AS (score1 + score2 + score3 + score4) STORED,
  evaluation_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(applicant_id, evaluator_id)
);
```

## 🔧 주요 변경사항

### LocalStorage → Supabase 마이그레이션

#### 기존 (LocalStorage)
```javascript
const applicants = JSON.parse(localStorage.getItem('applicants') || '[]');
localStorage.setItem('applicants', JSON.stringify(applicants));
```

#### 변경 (Supabase)
```javascript
const applicants = await getAllApplicants();
await createApplicant(applicantData);
await updateApplicant(email, updates);
```

## 📁 새로 추가된 파일

### 1. config.js
- Supabase 클라이언트 초기화
- API URL 및 Anon Key 설정

### 2. db.js
- 데이터베이스 헬퍼 함수 모음
- CRUD 작업 함수들

## 🔒 보안 설정

- RLS (Row Level Security) 활성화
- 현재는 개발용으로 모든 접근 허용
- 실제 운영 시 권한 정책 수정 필요

## 🚀 테스트 방법

### 1. 지원자 페이지 (apply.html)
```
1. 새 지원서 작성
2. 지원서 제출 → Supabase에 저장
3. 로그인 → Supabase에서 데이터 조회
4. 수정 → Supabase에 업데이트
```

### 2. 평가자 페이지 (evaluator.html)
```
1. evaluator1 / eval123 로그인
2. 채용공고 선택
3. 지원자 평가 → evaluations 테이블에 저장
4. 평가 수정 가능
```

### 3. 관리자 페이지 (index.html)
```
1. admin / admin123 로그인
2. 채용공고 선택
3. 전체 지원자 및 평가 통계 확인
```

## ⚠️ 주의사항

### 1. 비밀번호 보안
- 현재는 평문으로 저장 (개발용)
- 실제 운영 시 bcrypt 등으로 암호화 필요

### 2. 데이터 마이그레이션
- 기존 LocalStorage 데이터는 자동 이전 안 됨
- 필요시 수동으로 Supabase에 입력 필요

### 3. 네트워크 연결
- 인터넷 연결 필요
- 오프라인 상태에서는 작동 안 함

## 🔄 LocalStorage 백업

### 데이터 추출
```javascript
// 브라우저 콘솔에서 실행
console.log(localStorage.getItem('applicants'));
```

### Supabase로 마이그레이션
```javascript
// 기존 데이터를 Supabase로 이전
const oldData = JSON.parse(localStorage.getItem('applicants') || '[]');
for (const applicant of oldData) {
  await createApplicant({
    id: applicant.id,
    job_posting: applicant.jobPosting,
    name: applicant.name,
    // ... 나머지 필드
  });
}
```

## 📈 다음 단계

### 실제 운영을 위한 개선사항

1. **보안 강화**
   - 비밀번호 암호화
   - JWT 인증 구현
   - RLS 정책 세분화

2. **기능 추가**
   - 이메일 인증
   - 파일 첨부 (이력서, 자격증)
   - 알림 기능

3. **성능 최적화**
   - 페이지네이션
   - 캐싱
   - 인덱스 최적화

## 🛠 문제 해결

### 연결 오류
```
Error: Failed to fetch
→ 인터넷 연결 확인
→ Supabase 프로젝트 상태 확인
```

### 권한 오류
```
Error: new row violates row-level security policy
→ RLS 정책 확인
→ API 키 확인
```

## 📞 지원

- Supabase 대시보드: https://supabase.com/dashboard/project/qlcnvlzcflocseuvsjcb
- 문서: https://supabase.com/docs

---

© 2026 청년들 입사지원 시스템 - Supabase 연동 버전
