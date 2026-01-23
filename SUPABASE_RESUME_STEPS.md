# 🔄 Supabase 프로젝트 Resume 후 설정 가이드

**작성일**: 2026-01-23

---

## ✅ 프로젝트 Resume 완료

Supabase에서 `interview` 프로젝트를 resume(재개)하셨습니다.

---

## 📝 다음 단계: 프로젝트 정보 확인

### 1. Supabase 대시보드 접속
- https://supabase.com/dashboard
- `interview` 프로젝트 선택

### 2. API 정보 확인
1. **Settings** 메뉴 클릭
2. **API** 섹션 선택
3. 다음 정보 복사:
   - **Project URL** (예: `https://xxxxx.supabase.co`)
   - **anon public** 키

### 3. 정보 제공
프로젝트 URL과 API Key를 알려주시면 `config.js`를 업데이트하겠습니다.

---

## 🔧 config.js 업데이트 예시

현재:
```javascript
const SUPABASE_URL = 'https://qlcnvlzcflocseuvsjcb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

업데이트 후:
```javascript
const SUPABASE_URL = 'https://[새로운-프로젝트-ID].supabase.co';
const SUPABASE_ANON_KEY = '새로운-API-Key';
```

---

## 🗄️ 데이터베이스 확인

프로젝트를 resume한 경우:

### 1. 테이블 확인
- Supabase 대시보드 → Table Editor
- `applicants` 테이블 존재 확인
- `evaluations` 테이블 존재 확인

### 2. 테이블이 없는 경우
- SQL Editor에서 테이블 생성 SQL 실행 필요
- `SUPABASE_SETUP_GUIDE.md` 참고

---

## ✅ 연결 테스트

config.js 업데이트 후:
1. 로컬 서버에서 테스트
2. 브라우저 콘솔에서 오류 확인
3. 데이터 조회/저장 테스트

---

**다음 단계**: Supabase 대시보드에서 프로젝트 URL과 API Key를 확인한 후 알려주시면 바로 업데이트하겠습니다!
