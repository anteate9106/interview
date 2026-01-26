// Supabase 데이터베이스 헬퍼 함수

// Supabase 클라이언트 참조 함수 (전역 변수 또는 window 객체에서 가져오기)
function getSupabaseClient() {
    // window.supabaseClient 우선 사용
    if (typeof window !== 'undefined' && window.supabaseClient) {
        return window.supabaseClient;
    }
    // 전역 supabase 변수 사용
    if (typeof supabase !== 'undefined' && supabase) {
        return supabase;
    }
    // config.js에서 초기화된 supabase 사용
    if (typeof window !== 'undefined' && window.supabase) {
        return window.supabase;
    }
    console.error('[db.js] Supabase 클라이언트를 찾을 수 없습니다.');
    console.error('[db.js] 사용 가능한 객체:', {
        windowSupabaseClient: typeof window !== 'undefined' ? !!window.supabaseClient : 'N/A',
        globalSupabase: typeof supabase !== 'undefined' ? !!supabase : 'N/A',
        windowSupabase: typeof window !== 'undefined' ? !!window.supabase : 'N/A'
    });
    throw new Error('Supabase 클라이언트를 찾을 수 없습니다. config.js가 먼저 로드되었는지 확인하세요.');
}

// db.js에서 사용할 supabase 변수를 전역에서 가져오기
// 모든 함수에서 사용할 수 있도록 전역 변수로 설정
let supabase;

// Supabase 클라이언트 참조 함수 (매번 최신 클라이언트 가져오기)
function getSupabase() {
    // window.supabaseClient 우선 사용 (config.js에서 설정)
    if (typeof window !== 'undefined' && window.supabaseClient) {
        return window.supabaseClient;
    }
    // 전역 supabase 변수 사용 (config.js에서 선언된 var supabase)
    if (typeof supabase !== 'undefined' && supabase) {
        return supabase;
    }
    // window.supabase 사용
    if (typeof window !== 'undefined' && window.supabase) {
        return window.supabase;
    }
    return null;
}

// Supabase 클라이언트 초기화 함수
function initSupabaseForDb() {
    try {
        const client = getSupabase();
        if (client) {
            supabase = client;
            console.log('[db.js] Supabase 클라이언트 초기화 완료');
            return true;
        }
        console.error('[db.js] Supabase 클라이언트를 찾을 수 없습니다.');
        return false;
    } catch (error) {
        console.error('[db.js] Supabase 클라이언트 초기화 중 오류:', error);
        return false;
    }
}

// 즉시 초기화 시도
if (typeof window !== 'undefined') {
    // DOMContentLoaded 이벤트에서 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initSupabaseForDb, 200); // config.js 초기화 대기
        });
    } else {
        setTimeout(initSupabaseForDb, 200); // config.js 초기화 대기
    }
}

// Supabase 연결 상태 테스트 함수
async function testSupabaseConnection() {
    try {
        console.log('[db.js] Supabase 연결 테스트 시작...');
        
        // 클라이언트 초기화 확인
        if (!supabase) {
            const initialized = initSupabaseForDb();
            if (!initialized) {
                return {
                    success: false,
                    error: 'Supabase 클라이언트를 초기화할 수 없습니다.',
                    details: 'config.js가 먼저 로드되었는지 확인하세요.'
                };
            }
        }
        
        if (!supabase) {
            return {
                success: false,
                error: 'Supabase 클라이언트가 null입니다.',
                details: 'config.js의 초기화를 확인하세요.'
            };
        }
        
        console.log('[db.js] Supabase 클라이언트 확인됨:', !!supabase);
        console.log('[db.js] Supabase URL:', supabase.supabaseUrl || 'N/A');
        
        // 간단한 쿼리로 연결 테스트
        const { data, error } = await supabase
            .from('survey_questions')
            .select('id')
            .limit(1);
        
        if (error) {
            console.error('[db.js] Supabase 연결 테스트 실패:', error);
            return {
                success: false,
                error: error.message || '알 수 없는 오류',
                code: error.code,
                details: error,
                hint: error.hint
            };
        }
        
        console.log('[db.js] Supabase 연결 테스트 성공');
        return {
            success: true,
            message: 'Supabase 연결 정상',
            data: data
        };
    } catch (error) {
        console.error('[db.js] Supabase 연결 테스트 중 예외 발생:', error);
        return {
            success: false,
            error: error.message || '알 수 없는 오류',
            details: error,
            stack: error.stack
        };
    }
}

// 전역에서 접근 가능하도록 함수 export
if (typeof window !== 'undefined') {
    window.testSupabaseConnection = testSupabaseConnection;
    window.initSupabaseForDb = initSupabaseForDb;
}

// ==================== 지원자 관련 ====================

// 모든 지원자 가져오기
async function getAllApplicants() {
    try {
        if (!supabase) {
            initSupabaseForDb();
        }
        if (!supabase) {
            throw new Error('Supabase 클라이언트를 사용할 수 없습니다.');
        }
        const { data, error } = await supabase
            .from('applicants')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // 각 지원자의 평가 데이터 가져오기
        const applicantsWithEvaluations = await Promise.all(
            data.map(async (applicant) => {
                const evaluations = await getEvaluationsByApplicant(applicant.id);
                return {
                    ...applicant,
                    evaluations: evaluations
                };
            })
        );
        
        return applicantsWithEvaluations;
    } catch (error) {
        console.error('Error fetching applicants:', error);
        return [];
    }
}

// 이메일로 지원자 찾기
async function getApplicantByEmail(email) {
    try {
        const { data, error } = await supabase
            .from('applicants')
            .select('*')
            .eq('email', email)
            .maybeSingle();
        
        if (error) {
            console.error('Error fetching applicant:', error);
            return null;
        }
        
        if (!data) {
            return null;
        }
        
        // 평가 데이터 가져오기
        const evaluations = await getEvaluationsByApplicant(data.id);
        
        return {
            ...data,
            evaluations: evaluations
        };
    } catch (error) {
        console.error('Error fetching applicant:', error);
        return null;
    }
}

// 새 지원자 추가
async function createApplicant(applicantData) {
    try {
        const { data, error } = await supabase
            .from('applicants')
            .insert([applicantData])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating applicant:', error);
        throw error;
    }
}

// 지원자 정보 수정
async function updateApplicant(email, updates) {
    try {
        const { data, error } = await supabase
            .from('applicants')
            .update(updates)
            .eq('email', email)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error updating applicant:', error);
        throw error;
    }
}

// 지원자 합격/불합격 상태 업데이트
async function updateApplicantStatus(applicantId, status) {
    try {
        const { data, error } = await supabase
            .from('applicants')
            .update({ status: status })
            .eq('id', applicantId)
            .select()
            .single();
        
        if (error) throw error;
        console.log('Updated applicant status:', applicantId, status);
        return data;
    } catch (error) {
        console.error('Error updating applicant status:', error);
        throw error;
    }
}

// 지원자 결과 통보 상태 업데이트
async function updateNotificationStatus(applicantId, notificationSent) {
    try {
        const { data, error } = await supabase
            .from('applicants')
            .update({ notification_sent: notificationSent })
            .eq('id', applicantId)
            .select()
            .single();
        
        if (error) throw error;
        console.log('Updated notification status:', applicantId, notificationSent);
        return data;
    } catch (error) {
        console.error('Error updating notification status:', error);
        throw error;
    }
}

// ==================== 평가 관련 ====================

// 특정 지원자의 모든 평가 가져오기
async function getEvaluationsByApplicant(applicantId) {
    try {
        // ID 타입 정규화: 원본 ID와 문자열 변환 모두 시도
        const originalId = applicantId;
        const stringId = String(applicantId);
        const numberId = Number(applicantId);
        
        console.log('getEvaluationsByApplicant called with id:', originalId, 'type:', typeof originalId);
        console.log('Trying stringId:', stringId, 'numberId:', numberId);
        
        // 먼저 원본 ID로 시도
        let { data, error } = await supabase
            .from('evaluations')
            .select('*')
            .eq('applicant_id', originalId)
            .order('created_at', { ascending: false });
        
        // 실패하면 문자열로 시도
        if (error || !data || data.length === 0) {
            console.log('Trying with stringId:', stringId);
            const result = await supabase
                .from('evaluations')
                .select('*')
                .eq('applicant_id', stringId)
                .order('created_at', { ascending: false });
            
            if (!result.error && result.data && result.data.length > 0) {
                data = result.data;
                error = null;
            }
        }
        
        // 여전히 실패하면 숫자로 시도
        if (error || !data || data.length === 0) {
            if (!isNaN(numberId)) {
                console.log('Trying with numberId:', numberId);
                const result = await supabase
                    .from('evaluations')
                    .select('*')
                    .eq('applicant_id', numberId)
                    .order('created_at', { ascending: false });
                
                if (!result.error && result.data && result.data.length > 0) {
                    data = result.data;
                    error = null;
                }
            }
        }
        
        if (error) {
            console.error('Error in getEvaluationsByApplicant query:', error);
            throw error;
        }
        
        // 평가자 이름이 없으면 평가자 정보를 조회해서 채워넣기
        if (data && data.length > 0) {
            const uniqueEvaluatorIds = [...new Set(data.map(e => e.evaluator_id).filter(id => id))];
            
            // 평가자 정보 일괄 조회
            const evaluatorMap = {};
            for (const evaluatorId of uniqueEvaluatorIds) {
                try {
                    const evaluator = await getEvaluatorById(evaluatorId);
                    if (evaluator) {
                        evaluatorMap[evaluatorId] = evaluator.name || evaluatorId;
                    }
                } catch (err) {
                    console.warn('Error fetching evaluator:', evaluatorId, err);
                    evaluatorMap[evaluatorId] = evaluatorId; // 폴백
                }
            }
            
            // 평가 데이터에 평가자 이름 추가
            data = data.map(evaluation => {
                if (!evaluation.evaluator_name && evaluation.evaluator_id) {
                    evaluation.evaluator_name = evaluatorMap[evaluation.evaluator_id] || evaluation.evaluator_id;
                }
                return evaluation;
            });
        }
        
        console.log('Found evaluations:', data ? data.length : 0, 'for applicant_id:', originalId);
        return data || [];
    } catch (error) {
        console.error('Error fetching evaluations:', error);
        return [];
    }
}

// 특정 평가자의 특정 지원자 평가 가져오기
async function getEvaluation(applicantId, evaluatorId) {
    try {
        const { data, error } = await supabase
            .from('evaluations')
            .select('*')
            .eq('applicant_id', applicantId)
            .eq('evaluator_id', evaluatorId)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
        return data;
    } catch (error) {
        console.error('Error fetching evaluation:', error);
        return null;
    }
}

// 새 평가 추가
async function createEvaluation(evaluationData) {
    try {
        // total_score는 DB에서 자동 계산되는 GENERATED 컬럼이므로 제외
        const { total_score, ...dataWithoutTotal } = evaluationData;
        
        const { data, error } = await supabase
            .from('evaluations')
            .insert([dataWithoutTotal])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating evaluation:', error);
        throw error;
    }
}

// 평가 수정
async function updateEvaluation(applicantId, evaluatorId, updates) {
    try {
        // total_score는 DB에서 자동 계산되는 GENERATED 컬럼이므로 제외
        const { total_score, ...updatesWithoutTotal } = updates;
        
        const { data, error } = await supabase
            .from('evaluations')
            .update(updatesWithoutTotal)
            .eq('applicant_id', applicantId)
            .eq('evaluator_id', evaluatorId)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error updating evaluation:', error);
        throw error;
    }
}

// 평가 저장 또는 수정 (upsert)
async function saveEvaluation(evaluationData) {
    try {
        // 기존 평가 확인
        const existing = await getEvaluation(
            evaluationData.applicant_id,
            evaluationData.evaluator_id
        );
        
        if (existing) {
            // 수정
            return await updateEvaluation(
                evaluationData.applicant_id,
                evaluationData.evaluator_id,
                evaluationData
            );
        } else {
            // 새로 추가
            return await createEvaluation(evaluationData);
        }
    } catch (error) {
        console.error('Error saving evaluation:', error);
        throw error;
    }
}

// ==================== 작성 안내 관련 ====================

// 작성 안내 가져오기
async function getApplicationGuide() {
    try {
        const { data, error } = await supabase
            .from('application_guide')
            .select('*')
            .eq('id', 'default')
            .maybeSingle();
        
        if (error && error.code !== 'PGRST116') throw error;
        
        // 기본값 반환
        if (!data) {
            return {
                id: 'default',
                guide_items: [
                    '모든 필수 항목(*)을 입력해주세요',
                    '각 항목의 글자 수를 확인하세요',
                    '비밀번호는 8자 이상 입력해주세요',
                    '**💾 임시 저장**으로 작성 중 저장',
                    '제출 후 로그인하여 수정 가능합니다'
                ],
                writing_items: [
                    { name: '자기소개서', limit: 2000 },
                    { name: '경력기술서', limit: 500 },
                    { name: '지원동기', limit: 500 },
                    { name: '입사 후 포부', limit: 500 }
                ]
            };
        }
        
        return data;
    } catch (error) {
        console.error('Error fetching application guide:', error);
        // 에러 시 기본값 반환
        return {
            id: 'default',
            guide_items: [
                '모든 필수 항목(*)을 입력해주세요',
                '각 항목의 글자 수를 확인하세요',
                '비밀번호는 8자 이상 입력해주세요',
                '**💾 임시 저장**으로 작성 중 저장',
                '제출 후 로그인하여 수정 가능합니다'
            ],
            writing_items: [
                { name: '자기소개서', limit: 2000 },
                { name: '경력기술서', limit: 2000 },
                { name: '지원동기', limit: 2000 },
                { name: '입사 후 포부', limit: 2000 }
            ]
        };
    }
}

// 작성 안내 저장 (upsert)
async function saveApplicationGuide(guideData) {
    try {
        const { data, error } = await supabase
            .from('application_guide')
            .upsert({
                id: 'default',
                guide_items: guideData.guide_items,
                writing_items: guideData.writing_items,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'id'
            })
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error saving application guide:', error);
        throw error;
    }
}

// ==================== 평가자 관리 관련 ====================

// 모든 평가자 가져오기
async function getAllEvaluators() {
    try {
        const { data, error } = await supabase
            .from('evaluators')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching evaluators:', error);
        return [];
    }
}

// 평가자 생성
async function createEvaluator(evaluatorId, password, name) {
    try {
        const { data, error } = await supabase
            .from('evaluators')
            .insert({
                id: evaluatorId,
                password: password,
                name: name,
                is_admin: false,
                created_at: new Date().toISOString()
            })
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating evaluator:', error);
        throw error;
    }
}

// 평가자 삭제
async function deleteEvaluator(evaluatorId) {
    try {
        const { data, error } = await supabase
            .from('evaluators')
            .delete()
            .eq('id', evaluatorId)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error deleting evaluator:', error);
        throw error;
    }
}

// 평가자 인증 (로그인용)
async function authenticateEvaluator(evaluatorId, password) {
    try {
        const { data, error } = await supabase
            .from('evaluators')
            .select('*')
            .eq('id', evaluatorId)
            .eq('password', password)
            .maybeSingle();
        
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    } catch (error) {
        console.error('Error authenticating evaluator:', error);
        return null;
    }
}

// 평가자 정보 가져오기
async function getEvaluatorById(evaluatorId) {
    try {
        const { data, error } = await supabase
            .from('evaluators')
            .select('*')
            .eq('id', evaluatorId)
            .maybeSingle();
        
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    } catch (error) {
        console.error('Error fetching evaluator:', error);
        return null;
    }
}

// 평가자 비밀번호 변경 (평가자 본인용 - 현재 비밀번호 확인 필요)
async function updateEvaluatorPassword(evaluatorId, currentPassword, newPassword) {
    try {
        // 현재 비밀번호 확인
        const evaluator = await authenticateEvaluator(evaluatorId, currentPassword);
        if (!evaluator) {
            throw new Error('현재 비밀번호가 올바르지 않습니다.');
        }
        
        // 새 비밀번호로 업데이트
        const { data, error } = await supabase
            .from('evaluators')
            .update({ password: newPassword })
            .eq('id', evaluatorId)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error updating evaluator password:', error);
        throw error;
    }
}

// 평가자 비밀번호 변경 (관리자용 - 현재 비밀번호 확인 불필요)
async function updateEvaluatorPasswordByAdmin(evaluatorId, newPassword) {
    try {
        // 관리자는 현재 비밀번호 확인 없이 직접 변경 가능
        const { data, error } = await supabase
            .from('evaluators')
            .update({ password: newPassword })
            .eq('id', evaluatorId)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error updating evaluator password by admin:', error);
        throw error;
    }
}

// 평가자 관리자 권한 업데이트
async function updateEvaluatorAdminStatus(evaluatorId, isAdmin) {
    try {
        const { data, error } = await supabase
            .from('evaluators')
            .update({ is_admin: isAdmin })
            .eq('id', evaluatorId)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error updating evaluator admin status:', error);
        throw error;
    }
}

// ==================== 문의 정보 관련 ====================

// 문의 정보 가져오기
async function getContactInfo() {
    try {
        const { data, error } = await supabase
            .from('contact_info')
            .select('*')
            .eq('id', 'default')
            .maybeSingle();
        
        if (error && error.code !== 'PGRST116') throw error;
        
        // 기본값 반환
        if (!data) {
            return {
                id: 'default',
                title: '채용 관련 문의사항이 있으시면',
                email: 'recruit@company.com',
                description: '으로 연락 주시기 바랍니다.'
            };
        }
        
        return data;
    } catch (error) {
        console.error('Error fetching contact info:', error);
        // 에러 시 기본값 반환
        return {
            id: 'default',
            title: '채용 관련 문의사항이 있으시면',
            email: 'recruit@company.com',
            description: '으로 연락 주시기 바랍니다.'
        };
    }
}

// 문의 정보 저장 (upsert)
async function saveContactInfo(contactData) {
    try {
        const { data, error } = await supabase
            .from('contact_info')
            .upsert({
                id: 'default',
                title: contactData.title,
                email: contactData.email,
                description: contactData.description,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'id'
            })
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error saving contact info:', error);
        throw error;
    }
}

// ==================== 채용공고 관련 ====================

// 모든 채용공고 가져오기
async function getAllJobPostings() {
    try {
        const { data, error } = await supabase
            .from('job_postings')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error && error.code !== 'PGRST116') throw error;
        
        // 기본값 반환 (데이터가 없을 경우)
        if (!data || data.length === 0) {
            return [
                { id: 1, title: '2026년 상반기 신입사원 공채', created_at: new Date().toISOString() },
                { id: 2, title: '2026년 상반기 경력직 수시채용', created_at: new Date().toISOString() },
                { id: 3, title: '2026년 인턴 채용', created_at: new Date().toISOString() },
                { id: 4, title: '2026년 계약직 채용', created_at: new Date().toISOString() }
            ];
        }
        
        return data;
    } catch (error) {
        console.error('Error fetching job postings:', error);
        // 에러 시 기본값 반환
        return [
            { id: 1, title: '2026년 상반기 신입사원 공채', created_at: new Date().toISOString() },
            { id: 2, title: '2026년 상반기 경력직 수시채용', created_at: new Date().toISOString() },
            { id: 3, title: '2026년 인턴 채용', created_at: new Date().toISOString() },
            { id: 4, title: '2026년 계약직 채용', created_at: new Date().toISOString() }
        ];
    }
}

// 채용공고 추가
async function createJobPosting(title) {
    try {
        const { data, error } = await supabase
            .from('job_postings')
            .insert([{ title: title }])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating job posting:', error);
        throw error;
    }
}

// 채용공고 수정
async function updateJobPosting(id, title) {
    try {
        const { data, error } = await supabase
            .from('job_postings')
            .update({ title: title, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error updating job posting:', error);
        throw error;
    }
}

// 채용공고 삭제
async function deleteJobPosting(id) {
    try {
        const { data, error } = await supabase
            .from('job_postings')
            .delete()
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error deleting job posting:', error);
        throw error;
    }
}

// ==================== 이메일 템플릿 관련 ====================

// 이메일 템플릿 가져오기
async function getEmailTemplate(templateId) {
    try {
        const { data, error } = await supabase
            .from('email_templates')
            .select('*')
            .eq('id', templateId)
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching email template:', error);
        return null;
    }
}

// 모든 이메일 템플릿 가져오기
async function getAllEmailTemplates() {
    try {
        const { data, error } = await supabase
            .from('email_templates')
            .select('*');
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching email templates:', error);
        return [];
    }
}

// 이메일 템플릿 저장
async function saveEmailTemplate(templateId, subject, body) {
    try {
        const { data, error } = await supabase
            .from('email_templates')
            .upsert({
                id: templateId,
                subject: subject,
                body: body,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error saving email template:', error);
        throw error;
    }
}

// ==================== 유틸리티 ====================

// 비밀번호 검증 (클라이언트 측)
function verifyPassword(inputPassword, storedPassword) {
    return inputPassword === storedPassword;
}

// 채용공고별 지원자 수 통계
async function getJobPostingStats() {
    try {
        const applicants = await getAllApplicants();
        const stats = {};
        
        applicants.forEach(applicant => {
            const posting = applicant.job_posting || '미선택';
            if (!stats[posting]) {
                stats[posting] = {
                    total: 0,
                    evaluated: 0,
                    totalEvaluators: 0
                };
            }
            stats[posting].total++;
            if (applicant.evaluations && applicant.evaluations.length > 0) {
                stats[posting].evaluated++;
                stats[posting].totalEvaluators += applicant.evaluations.length;
            }
        });
        
        return stats;
    } catch (error) {
        console.error('Error calculating stats:', error);
        return {};
    }
}

// ==================== 설문조사 관련 ====================

// 지원자 이메일로 지원자 정보 가져오기
async function getApplicantByEmail(email) {
    try {
        const { data, error } = await supabase
            .from('applicants')
            .select('*')
            .eq('email', email)
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching applicant by email:', error);
        return null;
    }
}

// 지원자 ID로 설문조사 데이터 가져오기
async function getSurveyByApplicantId(applicantId) {
    try {
        const { data, error } = await supabase
            .from('surveys')
            .select('*')
            .eq('applicant_id', applicantId)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
        return data;
    } catch (error) {
        console.error('Error fetching survey:', error);
        return null;
    }
}

// 설문조사 데이터 저장
async function saveSurvey(surveyData) {
    try {
        // 기존 설문이 있는지 확인
        const existing = await getSurveyByApplicantId(surveyData.applicant_id);
        
        if (existing) {
            // 업데이트
            const { data, error } = await supabase
                .from('surveys')
                .update({
                    ...surveyData,
                    updated_at: new Date().toISOString()
                })
                .eq('applicant_id', surveyData.applicant_id)
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } else {
            // 새로 생성
            const { data, error } = await supabase
                .from('surveys')
                .insert(surveyData)
                .select()
                .single();
            
            if (error) throw error;
            return data;
        }
    } catch (error) {
        console.error('Error saving survey:', error);
        throw error;
    }
}

// ==================== 설문조사 항목 관리 ====================

// 모든 설문조사 항목 가져오기
async function getAllSurveyQuestions() {
    try {
        const supabaseClient = getSupabase() || supabase;
        if (!supabaseClient) {
            throw new Error('Supabase 클라이언트를 사용할 수 없습니다.');
        }
        const { data, error } = await supabaseClient
            .from('survey_questions')
            .select('*')
            .eq('is_active', true)
            .order('question_number', { ascending: true });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching survey questions:', error);
        return [];
    }
}

// 설문조사 항목 저장
async function saveSurveyQuestion(questionData) {
    try {
        const { data, error } = await supabase
            .from('survey_questions')
            .upsert({
                ...questionData,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'id'
            })
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error saving survey question:', error);
        throw error;
    }
}

// 여러 설문조사 항목 일괄 저장
async function saveAllSurveyQuestions(questions) {
    const timeout = 30000; // 30초 타임아웃
    const startTime = Date.now();
    
    try {
        console.log('[db.js] saveAllSurveyQuestions 함수 호출됨, 항목 개수:', questions.length);
        
        // Supabase 클라이언트 확인 및 초기화 (매번 최신 클라이언트 가져오기)
        const supabaseClient = getSupabase();
        if (!supabaseClient) {
            console.log('[db.js] Supabase 클라이언트가 없어서 초기화 시도...');
            initSupabaseForDb();
            const retryClient = getSupabase();
            if (!retryClient) {
                const errorMsg = 'Supabase 클라이언트를 사용할 수 없습니다. config.js가 먼저 로드되었는지 확인하세요.';
                console.error('[db.js]', errorMsg);
                throw new Error(errorMsg);
            }
            supabase = retryClient;
        } else {
            supabase = supabaseClient;
        }
        
        console.log('[db.js] Supabase 클라이언트 확인 완료:', !!supabase);
        console.log('[db.js] Supabase URL:', supabase?.supabaseUrl || 'N/A');
        
        // 타임아웃 체크 함수
        const checkTimeout = () => {
            if (Date.now() - startTime > timeout) {
                throw new Error(`저장 작업이 타임아웃되었습니다. (${timeout/1000}초 초과)`);
            }
        };
        
        // 각 항목을 개별적으로 저장 (id가 없는 경우와 있는 경우 모두 처리)
        const results = [];
        
        for (let i = 0; i < questions.length; i++) {
            checkTimeout();
            
            const q = questions[i];
            console.log(`항목 ${i + 1}/${questions.length} 저장 중:`, {
                id: q.id,
                question_number: q.question_number,
                question_text_length: q.question_text?.length || 0
            });
            
            const questionData = {
                question_number: q.question_number,
                question_text: q.question_text,
                hint_text: q.hint_text || null,
                is_required: q.is_required !== undefined ? q.is_required : true,
                is_active: q.is_active !== undefined ? q.is_active : true,
                updated_at: new Date().toISOString()
            };
            
            try {
                if (q.id && !q.id.startsWith('temp_')) {
                    // 기존 항목 업데이트
                    console.log(`기존 항목 업데이트: id=${q.id}`);
                    // supabase 클라이언트 확인 (매번 최신 클라이언트 가져오기)
                    const supabaseClient = getSupabase() || supabase;
                    if (!supabaseClient) {
                        throw new Error('Supabase 클라이언트를 사용할 수 없습니다.');
                    }
                    console.log(`[db.js] 항목 ${i + 1} 업데이트 시도:`, { id: q.id, question_number: q.question_number });
                    const { data, error } = await supabaseClient
                        .from('survey_questions')
                        .update(questionData)
                        .eq('id', q.id)
                        .select()
                        .single();
                    
                    if (error) {
                        console.error(`항목 ${i + 1} 업데이트 실패:`, error);
                        throw new Error(`항목 ${i + 1} 업데이트 실패: ${error.message || '알 수 없는 오류'}`);
                    }
                    console.log(`항목 ${i + 1} 업데이트 성공:`, data);
                    results.push(data);
                } else {
                    // 새 항목 생성
                    console.log(`새 항목 생성: question_number=${q.question_number}`);
                    // supabase 클라이언트 확인 (매번 최신 클라이언트 가져오기)
                    const supabaseClient = getSupabase() || supabase;
                    if (!supabaseClient) {
                        throw new Error('Supabase 클라이언트를 사용할 수 없습니다.');
                    }
                    console.log(`[db.js] 항목 ${i + 1} 생성 시도:`, { question_number: q.question_number });
                    const { data, error } = await supabaseClient
                        .from('survey_questions')
                        .insert(questionData)
                        .select()
                        .single();
                    
                    if (error) {
                        console.error(`항목 ${i + 1} 생성 실패:`, error);
                        throw new Error(`항목 ${i + 1} 생성 실패: ${error.message || '알 수 없는 오류'}`);
                    }
                    console.log(`항목 ${i + 1} 생성 성공:`, data);
                    results.push(data);
                }
            } catch (itemError) {
                console.error(`항목 ${i + 1} 저장 중 오류:`, itemError);
                throw itemError;
            }
        }
        
        console.log('모든 항목 저장 완료:', results.length, '개');
        return results;
    } catch (error) {
        console.error('Error saving all survey questions:', error);
        console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            stack: error.stack
        });
        throw error;
    }
}

// app.js에서 명시적으로 참조할 수 있도록 window 객체에 할당
// 함수 이름 충돌을 방지하기 위함
// 함수 정의 직후 즉시 할당
if (typeof window !== 'undefined') {
    window.dbSaveAllSurveyQuestions = saveAllSurveyQuestions;
    console.log('[db.js] window.dbSaveAllSurveyQuestions 함수 할당 완료');
}

// DOMContentLoaded에서도 할당 확인 (이중 안전장치)
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            if (!window.dbSaveAllSurveyQuestions) {
                window.dbSaveAllSurveyQuestions = saveAllSurveyQuestions;
                console.log('[db.js] DOMContentLoaded에서 window.dbSaveAllSurveyQuestions 함수 재할당 완료');
            }
        });
    } else {
        // 이미 로드된 경우 즉시 확인
        if (!window.dbSaveAllSurveyQuestions) {
            window.dbSaveAllSurveyQuestions = saveAllSurveyQuestions;
            console.log('[db.js] 이미 로드된 상태에서 window.dbSaveAllSurveyQuestions 함수 재할당 완료');
        }
    }
}

// 설문조사 항목 삭제 (비활성화)
async function deleteSurveyQuestion(questionId) {
    try {
        const { data, error } = await supabase
            .from('survey_questions')
            .update({ is_active: false })
            .eq('id', questionId)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error deleting survey question:', error);
        throw error;
    }
}

// 설문조사 안내문 가져오기
async function getSurveyIntro() {
    try {
        const { data, error } = await supabase
            .from('survey_intro')
            .select('*')
            .eq('id', 'survey_intro')
            .single();
        
        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
        return data;
    } catch (error) {
        console.error('Error fetching survey intro:', error);
        return null;
    }
}

// 설문조사 안내문 저장
async function saveSurveyIntro(introText) {
    try {
        const { data, error } = await supabase
            .from('survey_intro')
            .upsert({
                id: 'survey_intro',
                intro_text: introText,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error saving survey intro:', error);
        throw error;
    }
}
