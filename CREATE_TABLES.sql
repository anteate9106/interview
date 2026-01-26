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

-- 평가자 테이블 생성
CREATE TABLE IF NOT EXISTS evaluators (
  id TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
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

-- 초기 데이터 삽입 (evaluators) - 기존 평가자들
INSERT INTO evaluators (id, password, name, is_admin)
VALUES 
  ('evaluator1', 'eval123', '평가자 1', FALSE),
  ('evaluator2', 'eval123', '평가자 2', FALSE),
  ('evaluator3', 'eval123', '평가자 3', FALSE)
ON CONFLICT (id) DO NOTHING;

-- 기존 테이블에 is_admin 컬럼이 없는 경우 추가
ALTER TABLE evaluators ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 2차 서류전형 질문지 테이블 생성
CREATE TABLE IF NOT EXISTS second_round_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  hint_text TEXT,
  is_required BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(question_number)
);

-- 2차 서류전형 답변 테이블 생성
CREATE TABLE IF NOT EXISTS second_round_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id TEXT NOT NULL,
  applicant_name TEXT,
  applicant_email TEXT,
  answers JSONB NOT NULL DEFAULT '{}'::JSONB,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(applicant_id)
);

-- 2차 서류전형 안내문 테이블 생성
CREATE TABLE IF NOT EXISTS second_round_intro (
  id TEXT PRIMARY KEY DEFAULT 'second_round_intro',
  intro_text TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2차 서류전형 안내문 초기 데이터 삽입
INSERT INTO second_round_intro (id, intro_text)
VALUES (
  'second_round_intro',
  '축하합니다! 1차 서류전형에 합격하셨습니다.\n\n2차 서류전형을 위해 아래 질문에 답변해주시기 바랍니다.\n모든 항목을 성실하게 작성해주세요.'
)
ON CONFLICT (id) DO NOTHING;
