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
            .single();
        
        if (error) throw error;
        
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
