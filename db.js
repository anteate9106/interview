// Supabase 데이터베이스 헬퍼 함수

// ==================== 지원자 관련 ====================

// 모든 지원자 가져오기
async function getAllApplicants() {
    try {
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

// ==================== 평가 관련 ====================

// 특정 지원자의 모든 평가 가져오기
async function getEvaluationsByApplicant(applicantId) {
    try {
        const { data, error } = await supabase
            .from('evaluations')
            .select('*')
            .eq('applicant_id', applicantId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
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
        const { data, error } = await supabase
            .from('evaluations')
            .insert([evaluationData])
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
        const { data, error } = await supabase
            .from('evaluations')
            .update(updates)
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
