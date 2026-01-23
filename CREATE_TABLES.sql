-- 작성 안내 테이블 생성
CREATE TABLE IF NOT EXISTS application_guide (
  id TEXT PRIMARY KEY DEFAULT 'default',
  guide_items TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  writing_items JSONB NOT NULL DEFAULT '[]'::JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 문의 정보 테이블 생성
CREATE TABLE IF NOT EXISTS contact_info (
  id TEXT PRIMARY KEY DEFAULT 'default',
  title TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 초기 데이터 삽입 (application_guide)
INSERT INTO application_guide (id, guide_items, writing_items)
VALUES (
  'default',
  ARRAY[
    '모든 필수 항목(*)을 입력해주세요',
    '각 항목의 글자 수를 확인하세요',
    '비밀번호는 8자 이상 입력해주세요',
    '**💾 임시 저장**으로 작성 중 저장',
    '제출 후 로그인하여 수정 가능합니다'
  ],
  '[
    {"name": "자기소개서", "limit": 2000},
    {"name": "경력기술서", "limit": 2000},
    {"name": "지원동기", "limit": 2000},
    {"name": "입사 후 포부", "limit": 2000}
  ]'::JSONB
)
ON CONFLICT (id) DO NOTHING;

-- 초기 데이터 삽입 (contact_info)
INSERT INTO contact_info (id, title, email, description)
VALUES (
  'default',
  '채용 관련 문의사항이 있으시면',
  'recruit@company.com',
  '으로 연락 주시기 바랍니다.'
)
ON CONFLICT (id) DO NOTHING;
