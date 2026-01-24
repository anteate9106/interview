// 전역 변수
let currentUser = null;
let applicants = [];
let selectedApplicantId = null;
let selectedJobPosting = null;
let jobPostings = []; // 동적으로 로드

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', async function() {
    await loadData();
    await loadJobPostings();
    checkAuth();
    setupEventListeners();
});

// 데이터 로드 (Supabase에서)
async function loadData() {
    try {
        applicants = await getAllApplicants();
        console.log('Loaded applicants from Supabase:', applicants);
        
        // 필드명 정규화: snake_case와 camelCase 모두 지원
        applicants = applicants.map(applicant => {
            // 평가 데이터 확인 및 로그
            if (applicant.evaluations) {
                console.log(`Applicant ${applicant.name} (${applicant.id}) has ${applicant.evaluations.length} evaluations:`, applicant.evaluations);
            } else {
                console.log(`Applicant ${applicant.name} (${applicant.id}) has no evaluations`);
            }
            
            // self_introduction와 selfIntroduction 모두 확인
            if (!applicant.self_introduction && applicant.selfIntroduction) {
                applicant.self_introduction = applicant.selfIntroduction;
            }
            if (!applicant.selfIntroduction && applicant.self_introduction) {
                applicant.selfIntroduction = applicant.self_introduction;
            }
            
            // career_description와 careerDescription 모두 확인
            if (!applicant.career_description && applicant.careerDescription) {
                applicant.career_description = applicant.careerDescription;
            }
            if (!applicant.careerDescription && applicant.career_description) {
                applicant.careerDescription = applicant.career_description;
            }
            
            // ID 타입 정규화: 문자열로 통일
            const originalId = applicant.id;
            if (applicant.id !== undefined && applicant.id !== null) {
                applicant.id = String(applicant.id);
            }
            
            // 평가 데이터의 applicant_id도 문자열로 변환 (일치시키기 위해)
            if (applicant.evaluations && Array.isArray(applicant.evaluations)) {
                applicant.evaluations = applicant.evaluations.map(eval => {
                    if (eval.applicant_id !== undefined && eval.applicant_id !== null) {
                        eval.applicant_id = String(eval.applicant_id);
                    }
                    return eval;
                });
            }
            
            return applicant;
        });
        
        console.log('Normalized applicants with evaluations:', applicants.map(a => ({
            id: a.id,
            name: a.name,
            evaluationCount: a.evaluations ? a.evaluations.length : 0
        })));
    } catch (error) {
        console.error('Error loading applicants:', error);
        applicants = [];
    }
}

// 채용공고 목록 로드
async function loadJobPostings() {
    try {
        const postings = await getAllJobPostings();
        jobPostings = postings.map(p => p.title);
        console.log('Loaded job postings:', jobPostings);
    } catch (error) {
        console.error('Error loading job postings:', error);
        // 기본값 사용
        jobPostings = [
            '2026년 상반기 신입사원 공채',
            '2026년 상반기 경력직 수시채용',
            '2026년 인턴 채용',
            '2026년 계약직 채용'
        ];
    }
}

// 인증 확인
function checkAuth() {
    const user = localStorage.getItem('currentUser');
    if (user) {
        currentUser = user;
        showJobPostingPage();
    } else {
        showPage('loginPage');
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
}

// 로그인 처리
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // 기본 관리자 계정
    if (username === 'admin' && password === 'admin123') {
        currentUser = username;
        localStorage.setItem('currentUser', username);
        showJobPostingPage();
        return;
    }
    
    // 평가자 계정 중 관리자 권한이 있는 경우 확인
    try {
        const evaluator = await authenticateEvaluator(username, password);
        if (evaluator && evaluator.is_admin === true) {
            currentUser = username;
            localStorage.setItem('currentUser', username);
            localStorage.setItem('isEvaluatorAdmin', 'true');
            showJobPostingPage();
            return;
        }
    } catch (error) {
        console.error('Error checking evaluator admin:', error);
    }
    
    alert('아이디 또는 비밀번호가 올바르지 않습니다.');
}

// 로그아웃
function logout() {
    if (confirm('로그아웃 하시겠습니까?')) {
        currentUser = null;
        selectedApplicantId = null;
        selectedJobPosting = null;
        localStorage.removeItem('currentUser');
        showPage('loginPage');
    }
}

// 페이지 표시
function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

// 채용공고 페이지 표시
function showJobPostingPage() {
    showPage('jobPostingPage');
    document.getElementById('currentUserPosting').textContent = currentUser;
    renderJobPostings();
}

// 채용공고 목록 렌더링 (리스트형)
function renderJobPostings() {
    const grid = document.getElementById('jobPostingGrid');
    grid.innerHTML = `
        <div class="job-posting-list">
            <div class="list-header">
                <div class="list-col-title">채용공고</div>
                <div class="list-col-count">총 지원자</div>
                <div class="list-col-count">평가 완료</div>
                <div class="list-col-count">평가율</div>
                <div class="list-col-count">평균 평가자</div>
            </div>
            ${jobPostings.map(posting => {
                const postingApplicants = applicants.filter(a => a.job_posting === posting);
                const totalCount = postingApplicants.length;
                const evaluatedCount = postingApplicants.filter(a => 
                    a.evaluations && a.evaluations.length > 0
                ).length;
                const totalEvaluators = postingApplicants.reduce((sum, a) => 
                    sum + (a.evaluations ? a.evaluations.length : 0), 0
                );
                const avgEvaluators = totalCount > 0 ? (totalEvaluators / totalCount).toFixed(1) : 0;
                const evaluationRate = totalCount > 0 ? Math.round((evaluatedCount / totalCount) * 100) : 0;
                
                return `
                    <div class="job-posting-item" onclick="selectJobPosting('${posting}')">
                        <div class="list-col-title">
                            <span class="posting-title">${posting}</span>
                        </div>
                        <div class="list-col-count">
                            <span class="count-badge">${totalCount}명</span>
                        </div>
                        <div class="list-col-count">
                            <span class="count-badge success">${evaluatedCount}명</span>
                        </div>
                        <div class="list-col-count">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${evaluationRate}%"></div>
                            </div>
                            <span class="progress-text">${evaluationRate}%</span>
                        </div>
                        <div class="list-col-count">
                            <span class="count-badge warning">${avgEvaluators}명</span>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// 채용공고 선택
async function selectJobPosting(posting) {
    selectedJobPosting = posting;
    selectedApplicantId = null; // 공고 변경 시 지원자 선택 초기화
    await loadData(); // 데이터 다시 로드
    showMainPage();
}

// 채용공고 목록으로 돌아가기
function backToJobPostings() {
    selectedJobPosting = null;
    selectedApplicantId = null;
    showJobPostingPage();
}

// 메인 페이지 표시
function showMainPage() {
    showPage('mainPage');
    updateUI();
    
    // 공고가 선택되어 있지 않으면 공고 선택 안내
    if (!selectedJobPosting) {
        const header = document.getElementById('applicantInfoHeader');
        const content = document.getElementById('coverLetterContent');
        if (header) header.innerHTML = '';
        if (content) {
            content.innerHTML = `
                <div class="empty-state">
                    <p>왼쪽에서 채용공고와 지원자를 선택하세요</p>
                </div>
            `;
        }
    }
}

// UI 업데이트
function updateUI() {
    document.getElementById('currentUser').textContent = `${currentUser}님`;
    
    // 채용공고 드롭다운 업데이트
    updateJobPostingDropdown();
    
    // 지원자 드롭다운 업데이트
    updateApplicantDropdown();
}

// 채용공고 드롭다운 업데이트
function updateJobPostingDropdown() {
    const select = document.getElementById('jobPostingSelect');
    if (!select) return;
    
    select.innerHTML = '<option value="">채용공고를 선택하세요</option>';
    
    jobPostings.forEach(posting => {
        const option = document.createElement('option');
        option.value = posting;
        option.textContent = posting;
        if (selectedJobPosting === posting) {
            option.selected = true;
        }
        select.appendChild(option);
    });
    
    // 공고가 선택되어 있으면 드롭다운 활성화
    select.disabled = false;
}

// 지원자 드롭다운 업데이트
function updateApplicantDropdown() {
    const select = document.getElementById('applicantSelect');
    if (!select) return;
    
    select.innerHTML = '<option value="">지원자를 선택하세요</option>';
    
    if (!selectedJobPosting) {
        select.disabled = true;
        return;
    }
    
    // 선택된 채용공고의 지원자만 필터링
    const filteredApplicants = applicants.filter(a => a.job_posting === selectedJobPosting);
    
    if (filteredApplicants.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = '지원자가 없습니다';
        option.disabled = true;
        select.appendChild(option);
        select.disabled = false;
        return;
    }
    
    filteredApplicants.forEach(applicant => {
        const option = document.createElement('option');
        option.value = applicant.id;
        const evaluationCount = applicant.evaluations ? applicant.evaluations.length : 0;
        const avgScore = applicant.evaluations && applicant.evaluations.length > 0
            ? Math.round(applicant.evaluations.reduce((sum, e) => sum + (e.total_score || 0), 0) / applicant.evaluations.length)
            : null;
        const scoreText = avgScore !== null ? ` (평균 ${avgScore}점)` : '';
        option.textContent = `${applicant.name} - ${applicant.branch || '지점'} ${applicant.position || '직무'}${scoreText}`;
        if (selectedApplicantId === applicant.id) {
            option.selected = true;
        }
        select.appendChild(option);
    });
    
    select.disabled = false;
}

// 채용공고 드롭다운 변경 핸들러
function onJobPostingChange() {
    const select = document.getElementById('jobPostingSelect');
    if (!select) return;
    
    const posting = select.value;
    if (posting) {
        selectJobPosting(posting);
    } else {
        selectedJobPosting = null;
        selectedApplicantId = null;
        updateApplicantDropdown();
        // 지원자 정보 초기화
        const header = document.getElementById('applicantInfoHeader');
        const content = document.getElementById('coverLetterContent');
        if (header) header.innerHTML = '';
        if (content) {
            content.innerHTML = `
                <div class="empty-state">
                    <p>왼쪽에서 채용공고와 지원자를 선택하세요</p>
                </div>
            `;
        }
        // 평가 결과 초기화
        const evaluationContent = document.getElementById('evaluationContent');
        if (evaluationContent) {
            evaluationContent.innerHTML = `
                <div class="empty-evaluation">
                    <div style="text-align: center; padding: 60px 20px; color: #94a3b8;">
                        <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
                        <p style="font-size: 16px;">지원자를 선택하세요</p>
                    </div>
                </div>
            `;
        }
    }
}

// 지원자 드롭다운 변경 핸들러
async function onApplicantChange() {
    const select = document.getElementById('applicantSelect');
    if (!select || !select.value) {
        // 지원자 선택이 해제된 경우 초기화
        const header = document.getElementById('applicantInfoHeader');
        const content = document.getElementById('coverLetterContent');
        const evaluationContent = document.getElementById('evaluationContent');
        
        if (header) header.innerHTML = '';
        if (content) {
            content.innerHTML = `
                <div class="empty-state">
                    <p>왼쪽에서 채용공고와 지원자를 선택하세요</p>
                </div>
            `;
        }
        if (evaluationContent) {
            evaluationContent.innerHTML = `
                <div class="empty-evaluation">
                    <div style="text-align: center; padding: 60px 20px; color: #94a3b8;">
                        <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
                        <p style="font-size: 16px;">지원자를 선택하세요</p>
                    </div>
                </div>
            `;
        }
        return;
    }
    
    const applicantId = select.value;
    console.log('onApplicantChange: selecting applicant', applicantId);
    await selectApplicant(applicantId);
}

// 지원자 목록 렌더링
// 드롭다운 방식으로 변경되어 더 이상 사용하지 않음
// 호환성을 위해 빈 함수로 유지 (에러 방지)
function renderApplicantList() {
    // 드롭다운 방식으로 변경되어 리스트 렌더링 불필요
    // 이 함수는 호환성을 위해 유지하되 아무 작업도 수행하지 않음
    // 더 이상 사용하지 않는 함수이므로 안전하게 처리
    
    // applicantList 요소가 존재하는지 확인 (드롭다운 방식에서는 없을 수 있음)
    const listContainer = document.getElementById('applicantList');
    if (!listContainer) {
        // 요소가 없으면 정상 (드롭다운 방식 사용 중)
        return;
    }
    
    // 요소가 있어도 아무 작업도 수행하지 않음 (드롭다운 방식 사용 중)
    return;
}

// 지원자 선택
async function selectApplicant(id) {
    console.log('selectApplicant called with id:', id, 'type:', typeof id);
    selectedApplicantId = id;
    
    // ID 타입 정규화: 문자열로 변환
    const searchId = String(id);
    console.log('Searching for applicant with id:', searchId);
    console.log('Available applicant IDs:', applicants.map(a => ({ id: a.id, type: typeof a.id, name: a.name })));
    
    let applicant = applicants.find(a => {
        const applicantId = String(a.id);
        return applicantId === searchId;
    });
    
    console.log('Found applicant:', applicant);
    
    if (!applicant) {
        console.error('Applicant not found with id:', id);
        console.error('Available IDs:', applicants.map(a => a.id));
        
        // 지원자를 찾을 수 없을 때 평가 영역 초기화
        const evaluationContent = document.getElementById('evaluationContent');
        if (evaluationContent) {
            evaluationContent.innerHTML = `
                <div class="empty-evaluation">
                    <div style="text-align: center; padding: 60px 20px; color: #94a3b8;">
                        <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                        <p style="font-size: 16px;">지원자를 찾을 수 없습니다.</p>
                    </div>
                </div>
            `;
        }
        return;
    }

    // 평가 데이터가 없거나 최신 데이터를 확인하기 위해 다시 로드
    try {
        console.log('Loading evaluations for applicant:', applicant.id, 'name:', applicant.name);
        const evaluations = await getEvaluationsByApplicant(applicant.id);
        applicant.evaluations = evaluations;
        console.log('Loaded evaluations for applicant:', evaluations);
        console.log('Evaluation count:', evaluations ? evaluations.length : 0);
        
        // 평가 데이터 상세 로그
        if (evaluations && evaluations.length > 0) {
            console.log('Evaluation details:', evaluations.map(e => ({
                evaluator_id: e.evaluator_id,
                evaluator_name: e.evaluator_name,
                score1: e.score1,
                score2: e.score2,
                score3: e.score3,
                score4: e.score4,
                total_score: e.total_score
            })));
        } else {
            console.warn('No evaluations found for applicant:', applicant.id, applicant.name);
        }
        
        // applicants 배열도 업데이트
        const applicantIndex = applicants.findIndex(a => String(a.id) === searchId);
        if (applicantIndex !== -1) {
            applicants[applicantIndex].evaluations = evaluations;
        }
    } catch (error) {
        console.error('Error loading evaluations:', error);
        // 에러가 발생해도 평가 데이터를 빈 배열로 설정하여 계속 진행
        applicant.evaluations = [];
    }

    // 드롭다운 방식으로 변경되어 리스트 렌더링 불필요
    // renderApplicantList() 호출 제거 - 드롭다운 방식에서는 지원자 목록을 렌더링할 필요 없음
    // renderApplicantList()는 더 이상 호출하지 않음
    
    console.log('About to call showCoverLetter and loadEvaluation');
    
    // 지원서 내용 표시
    try {
        showCoverLetter(applicant);
    } catch (error) {
        console.error('Error in showCoverLetter:', error);
    }
    
    // 평가 내용 표시 (항상 호출하여 평가 데이터가 없을 때도 적절한 메시지 표시)
    try {
        loadEvaluation(applicant);
    } catch (error) {
        console.error('Error in loadEvaluation:', error);
    }
    
    console.log('selectApplicant completed');
}

// 지원서 표시
function showCoverLetter(applicant) {
    const header = document.getElementById('applicantInfoHeader');
    const content = document.getElementById('coverLetterContent');

    if (!applicant) {
        console.error('showCoverLetter: applicant is null or undefined');
        if (content) {
            content.innerHTML = `
                <div class="empty-state">
                    <p>지원자 정보를 불러올 수 없습니다.</p>
                </div>
            `;
        }
        return;
    }

    if (!header || !content) {
        console.error('showCoverLetter: DOM elements not found', { header, content });
        return;
    }

    console.log('showCoverLetter called for:', applicant.name, 'evaluations:', applicant.evaluations);

    header.innerHTML = `
        <div class="applicant-detail">
            <span><strong>${applicant.name}</strong></span>
            <span>생년월일: ${applicant.birthdate || '미입력'}</span>
            <span>${applicant.email}</span>
            <span>${applicant.phone || '미입력'}</span>
        </div>
        <div class="applicant-detail" style="margin-top: 8px;">
            <span style="color: #6366f1; font-weight: 700;">📢 ${applicant.job_posting || '채용공고 미선택'}</span>
        </div>
        <div class="applicant-detail" style="margin-top: 4px;">
            <span><strong>지원 지점:</strong> ${applicant.branch || '미입력'}</span>
            <span><strong>지원 직무:</strong> ${applicant.position || '미입력'}</span>
        </div>
    `;

    // 평가 평균 점수 요약 (가운데 섹션 상단에 표시)
    let evaluationSummary = '';
    if (applicant.evaluations && applicant.evaluations.length > 0) {
        // total_score가 없으면 계산
        const evaluationsWithTotal = applicant.evaluations.map(e => {
            if (!e.total_score && e.score1 !== undefined) {
                e.total_score = (e.score1 || 0) + (e.score2 || 0) + (e.score3 || 0) + (e.score4 || 0);
            }
            return e;
        });
        
        const totalAvgScore = Math.round(evaluationsWithTotal.reduce((sum, e) => sum + (e.total_score || 0), 0) / evaluationsWithTotal.length);
        
        const avgScores = {
            score1: Math.round(evaluationsWithTotal.reduce((sum, e) => sum + (e.score1 || 0), 0) / evaluationsWithTotal.length),
            score2: Math.round(evaluationsWithTotal.reduce((sum, e) => sum + (e.score2 || 0), 0) / evaluationsWithTotal.length),
            score3: Math.round(evaluationsWithTotal.reduce((sum, e) => sum + (e.score3 || 0), 0) / evaluationsWithTotal.length),
            score4: Math.round(evaluationsWithTotal.reduce((sum, e) => sum + (e.score4 || 0), 0) / evaluationsWithTotal.length)
        };
        
        evaluationSummary = `
            <div class="section-block" style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-left: 4px solid #10b981; margin-bottom: 24px;">
                <h3 style="margin-bottom: 20px; color: #10b981; font-size: 20px;">📊 평가 평균 점수</h3>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
                    <div style="background: white; padding: 20px; border-radius: 12px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <div style="font-size: 13px; color: #64748b; margin-bottom: 8px; font-weight: 600;">전체 평균 점수</div>
                        <div style="font-size: 42px; font-weight: 800; color: #10b981; line-height: 1;">${totalAvgScore}점</div>
                        <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">/ 100점 만점</div>
                    </div>
                    <div style="background: white; padding: 20px; border-radius: 12px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <div style="font-size: 13px; color: #64748b; margin-bottom: 8px; font-weight: 600;">평가자 수</div>
                        <div style="font-size: 42px; font-weight: 800; color: #6366f1; line-height: 1;">${evaluationsWithTotal.length}명</div>
                        <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">평가 완료</div>
                    </div>
                </div>
                
                <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <h4 style="margin-bottom: 16px; color: var(--text-primary); font-size: 16px; font-weight: 600;">항목별 평균 점수</h4>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
                        <div style="padding: 16px; background: #f8fafc; border-radius: 8px;">
                            <div style="font-size: 13px; color: #64748b; margin-bottom: 8px; font-weight: 600;">내용충실도</div>
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="flex: 1; height: 10px; background: #e2e8f0; border-radius: 5px; overflow: hidden;">
                                    <div style="height: 100%; background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%); width: ${avgScores.score1 * 4}%;"></div>
                                </div>
                                <div style="font-size: 20px; font-weight: 700; color: #6366f1; min-width: 50px; text-align: right;">${avgScores.score1}/25</div>
                            </div>
                        </div>
                        <div style="padding: 16px; background: #f8fafc; border-radius: 8px;">
                            <div style="font-size: 13px; color: #64748b; margin-bottom: 8px; font-weight: 600;">경력 및 교육사항</div>
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="flex: 1; height: 10px; background: #e2e8f0; border-radius: 5px; overflow: hidden;">
                                    <div style="height: 100%; background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%); width: ${avgScores.score2 * 4}%;"></div>
                                </div>
                                <div style="font-size: 20px; font-weight: 700; color: #6366f1; min-width: 50px; text-align: right;">${avgScores.score2}/25</div>
                            </div>
                        </div>
                        <div style="padding: 16px; background: #f8fafc; border-radius: 8px;">
                            <div style="font-size: 13px; color: #64748b; margin-bottom: 8px; font-weight: 600;">조직적합성</div>
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="flex: 1; height: 10px; background: #e2e8f0; border-radius: 5px; overflow: hidden;">
                                    <div style="height: 100%; background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%); width: ${avgScores.score3 * 4}%;"></div>
                                </div>
                                <div style="font-size: 20px; font-weight: 700; color: #6366f1; min-width: 50px; text-align: right;">${avgScores.score3}/25</div>
                            </div>
                        </div>
                        <div style="padding: 16px; background: #f8fafc; border-radius: 8px;">
                            <div style="font-size: 13px; color: #64748b; margin-bottom: 8px; font-weight: 600;">직무적합성</div>
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="flex: 1; height: 10px; background: #e2e8f0; border-radius: 5px; overflow: hidden;">
                                    <div style="height: 100%; background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%); width: ${avgScores.score4 * 4}%;"></div>
                                </div>
                                <div style="font-size: 20px; font-weight: 700; color: #6366f1; min-width: 50px; text-align: right;">${avgScores.score4}/25</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else {
        evaluationSummary = `
            <div class="section-block" style="background: #fef3c7; border-left: 4px solid #f59e0b; margin-bottom: 24px; padding: 20px;">
                <h3 style="margin-bottom: 12px; color: #f59e0b; font-size: 18px;">⚠️ 평가 대기 중</h3>
                <p style="color: #92400e; margin: 0;">아직 평가가 완료되지 않았습니다. 평가자가 평가를 완료하면 평균 점수가 여기에 표시됩니다.</p>
            </div>
        `;
    }

    content.innerHTML = `
        <div class="application-sections">
            ${evaluationSummary}
            
            <div class="section-block">
                <h3>📋 기본 정보</h3>
                <p><strong>주소:</strong> ${applicant.address || '미입력'}</p>
            </div>

            <div class="section-block">
                <h3>🎓 학력사항</h3>
                <p class="pre-wrap">${applicant.education || '미입력'}</p>
            </div>

            ${applicant.certifications ? `
            <div class="section-block">
                <h3>📜 자격 및 교육사항</h3>
                <p class="pre-wrap">${applicant.certifications}</p>
            </div>
            ` : ''}

            ${applicant.career ? `
            <div class="section-block">
                <h3>💼 경력사항</h3>
                <p class="pre-wrap">${applicant.career}</p>
            </div>
            ` : ''}

            <div class="section-block">
                <h3>✍️ 자기소개서</h3>
                <p class="pre-wrap">${applicant.self_introduction || applicant.selfIntroduction || applicant.coverLetter || '미입력'}</p>
            </div>

            <div class="section-block">
                <h3>💻 경력기술서</h3>
                <p class="pre-wrap">${applicant.career_description || applicant.careerDescription || '미입력'}</p>
            </div>

            <div class="section-block">
                <h3>🎯 지원동기</h3>
                <p class="pre-wrap">${applicant.motivation || '미입력'}</p>
            </div>

            <div class="section-block">
                <h3>🚀 입사 후 포부</h3>
                <p class="pre-wrap">${applicant.aspiration || '미입력'}</p>
            </div>
        </div>
    `;
}

// 평가 로드 (관리자는 평가하지 않고 조회만 가능)
// 오른쪽 섹션에 각 평가자별 상세 평가 내용 표시
function loadEvaluation(applicant) {
    const form = document.getElementById('evaluationForm');
    const evaluationContent = document.getElementById('evaluationContent');
    
    if (!evaluationContent) {
        console.error('loadEvaluation: evaluationContent element not found');
        return;
    }
    
    if (!applicant) {
        console.error('loadEvaluation: applicant is null or undefined');
        evaluationContent.innerHTML = `
            <div class="empty-evaluation">
                <div style="text-align: center; padding: 60px 20px; color: #94a3b8;">
                    <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                    <p style="font-size: 16px;">지원자 정보를 불러올 수 없습니다.</p>
                </div>
            </div>
        `;
        return;
    }
    
    console.log('loadEvaluation called for applicant:', applicant.name, applicant.id);
    console.log('Evaluations:', applicant.evaluations);
    console.log('Evaluation count:', applicant.evaluations ? applicant.evaluations.length : 0);
    
    // 지원자 정보가 없으면 초기화
    if (!applicant) {
        evaluationContent.innerHTML = `
            <div class="empty-evaluation">
                <div style="text-align: center; padding: 60px 20px; color: #94a3b8;">
                    <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
                    <p style="font-size: 16px;">지원자를 선택하세요</p>
                </div>
            </div>
        `;
        return;
    }
    
    // 평가 내역이 있으면 각 평가자별 상세 평가 표시
    if (applicant.evaluations && applicant.evaluations.length > 0) {
        console.log('Displaying evaluations, count:', applicant.evaluations.length);
        console.log('Evaluation data:', JSON.stringify(applicant.evaluations, null, 2));
        
        // total_score가 없으면 계산
        const evaluationsWithTotal = applicant.evaluations.map(e => {
            if (!e.total_score && e.score1 !== undefined) {
                e.total_score = (e.score1 || 0) + (e.score2 || 0) + (e.score3 || 0) + (e.score4 || 0);
            }
            // 평가자 이름이 없으면 evaluator_id 사용
            if (!e.evaluator_name && e.evaluator_id) {
                e.evaluator_name = e.evaluator_id;
            }
            return e;
        });
        
        console.log('Evaluations with total scores:', evaluationsWithTotal);

        evaluationContent.innerHTML = `
            <div class="evaluation-summary" style="padding: 20px;">
                <div style="margin-bottom: 24px;">
                    <h3 style="margin-bottom: 8px; color: var(--text-primary); font-size: 18px; font-weight: 600;">👥 평가자별 상세 평가</h3>
                    <p style="font-size: 13px; color: #64748b; margin: 0;">총 ${evaluationsWithTotal.length}명의 평가자가 평가했습니다</p>
                </div>
                
                <div class="evaluators-detail">
                    ${evaluationsWithTotal.map((e, index) => {
                        const totalScore = e.total_score || ((e.score1 || 0) + (e.score2 || 0) + (e.score3 || 0) + (e.score4 || 0));
                        const evaluationDate = e.evaluation_date || e.created_at || '';
                        const dateText = evaluationDate ? new Date(evaluationDate).toLocaleDateString('ko-KR') : '';
                        return `
                        <div class="evaluator-card" style="background: white; border: 2px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                            <div class="evaluator-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #f1f5f9;">
                                <div>
                                    <strong style="font-size: 18px; color: var(--text-primary);">${e.evaluator_name || e.evaluator_id || `평가자 ${index + 1}`}</strong>
                                    ${dateText ? `<div style="font-size: 12px; color: #94a3b8; margin-top: 6px;">평가일: ${dateText}</div>` : ''}
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">총점</div>
                                    <span style="font-size: 28px; font-weight: 700; color: #6366f1;">${totalScore}점</span>
                                </div>
                            </div>
                            
                            <div class="evaluator-scores" style="margin-bottom: ${e.comment1 || e.comment2 || e.comment3 || e.comment4 ? '20px' : '0'};">
                                <h4 style="font-size: 14px; color: var(--text-primary); margin-bottom: 12px; font-weight: 600;">📊 항목별 점수</h4>
                                <div style="display: grid; grid-template-columns: 1fr; gap: 12px;">
                                    <div style="padding: 14px; background: #f8fafc; border-radius: 8px; border-left: 3px solid #6366f1;">
                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                            <div>
                                                <div style="font-size: 13px; color: #64748b; margin-bottom: 4px; font-weight: 600;">내용충실도</div>
                                                <div style="font-size: 20px; font-weight: 700; color: #6366f1;">${e.score1 || 0}점 / 25점</div>
                                            </div>
                                            <div style="width: 100px; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                                                <div style="height: 100%; background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%); width: ${((e.score1 || 0) / 25) * 100}%;"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div style="padding: 14px; background: #f8fafc; border-radius: 8px; border-left: 3px solid #6366f1;">
                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                            <div>
                                                <div style="font-size: 13px; color: #64748b; margin-bottom: 4px; font-weight: 600;">경력 및 교육사항</div>
                                                <div style="font-size: 20px; font-weight: 700; color: #6366f1;">${e.score2 || 0}점 / 25점</div>
                                            </div>
                                            <div style="width: 100px; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                                                <div style="height: 100%; background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%); width: ${((e.score2 || 0) / 25) * 100}%;"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div style="padding: 14px; background: #f8fafc; border-radius: 8px; border-left: 3px solid #6366f1;">
                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                            <div>
                                                <div style="font-size: 13px; color: #64748b; margin-bottom: 4px; font-weight: 600;">조직적합성</div>
                                                <div style="font-size: 20px; font-weight: 700; color: #6366f1;">${e.score3 || 0}점 / 25점</div>
                                            </div>
                                            <div style="width: 100px; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                                                <div style="height: 100%; background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%); width: ${((e.score3 || 0) / 25) * 100}%;"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div style="padding: 14px; background: #f8fafc; border-radius: 8px; border-left: 3px solid #6366f1;">
                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                            <div>
                                                <div style="font-size: 13px; color: #64748b; margin-bottom: 4px; font-weight: 600;">직무적합성</div>
                                                <div style="font-size: 20px; font-weight: 700; color: #6366f1;">${e.score4 || 0}점 / 25점</div>
                                            </div>
                                            <div style="width: 100px; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                                                <div style="height: 100%; background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%); width: ${((e.score4 || 0) / 25) * 100}%;"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            ${e.comment1 || e.comment2 || e.comment3 || e.comment4 ? `
                                <div class="evaluator-comments" style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #f1f5f9;">
                                    <h5 style="font-size: 15px; color: var(--text-primary); margin-bottom: 16px; font-weight: 600;">💬 평가 의견</h5>
                                    ${e.comment1 ? `
                                        <div style="margin-bottom: 14px; padding: 14px; background: #f8fafc; border-radius: 8px; border-left: 3px solid #6366f1;">
                                            <strong style="color: #6366f1; font-size: 13px; display: block; margin-bottom: 6px;">내용충실도</strong>
                                            <p style="margin: 0; color: var(--text-primary); line-height: 1.7; font-size: 14px;">${e.comment1}</p>
                                        </div>
                                    ` : ''}
                                    ${e.comment2 ? `
                                        <div style="margin-bottom: 14px; padding: 14px; background: #f8fafc; border-radius: 8px; border-left: 3px solid #6366f1;">
                                            <strong style="color: #6366f1; font-size: 13px; display: block; margin-bottom: 6px;">경력 및 교육사항</strong>
                                            <p style="margin: 0; color: var(--text-primary); line-height: 1.7; font-size: 14px;">${e.comment2}</p>
                                        </div>
                                    ` : ''}
                                    ${e.comment3 ? `
                                        <div style="margin-bottom: 14px; padding: 14px; background: #f8fafc; border-radius: 8px; border-left: 3px solid #6366f1;">
                                            <strong style="color: #6366f1; font-size: 13px; display: block; margin-bottom: 6px;">조직적합성</strong>
                                            <p style="margin: 0; color: var(--text-primary); line-height: 1.7; font-size: 14px;">${e.comment3}</p>
                                        </div>
                                    ` : ''}
                                    ${e.comment4 ? `
                                        <div style="margin-bottom: 14px; padding: 14px; background: #f8fafc; border-radius: 8px; border-left: 3px solid #6366f1;">
                                            <strong style="color: #6366f1; font-size: 13px; display: block; margin-bottom: 6px;">직무적합성</strong>
                                            <p style="margin: 0; color: var(--text-primary); line-height: 1.7; font-size: 14px;">${e.comment4}</p>
                                        </div>
                                    ` : ''}
                                </div>
                            ` : `
                                <div style="margin-top: 16px; padding: 12px; background: #f8fafc; border-radius: 8px; text-align: center;">
                                    <p style="margin: 0; color: #94a3b8; font-size: 13px;">평가 의견이 없습니다</p>
                                </div>
                            `}
                        </div>
                    `;
                    }).join('')}
                </div>
            </div>
        `;
    } else {
        evaluationContent.innerHTML = `
            <div class="empty-evaluation">
                <div style="text-align: center; padding: 60px 20px; color: #94a3b8;">
                    <div style="font-size: 48px; margin-bottom: 16px;">📋</div>
                    <p style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">아직 평가가 완료되지 않았습니다.</p>
                    <p style="font-size: 14px; color: #64748b;">평가자가 평가를 완료하면 여기에 표시됩니다.</p>
                </div>
            </div>
        `;
    }
}

// 관리자는 평가하지 않음 (평가자 시스템 사용)

// 대시보드로 돌아가기
function backToDashboard() {
    selectedApplicantId = null;
    showMainPage();
}

// ==================== 작성 안내 편집 ====================

let currentGuideData = null;
let currentContactData = null;

// 작성 안내 편집 모달 열기
async function openGuideEditor() {
    try {
        currentGuideData = await getApplicationGuide();
        currentContactData = await getContactInfo();
        renderGuideEditor();
        const modal = document.getElementById('guideEditorModal');
        modal.style.display = 'flex';
        modal.classList.add('active');
        
        // 모달 배경 클릭 시 닫기
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeGuideEditor();
            }
        });
    } catch (error) {
        console.error('Error loading guide:', error);
        alert('작성 안내를 불러오는 중 오류가 발생했습니다.');
    }
}

// 작성 안내 편집 모달 닫기
function closeGuideEditor() {
    const modal = document.getElementById('guideEditorModal');
    modal.style.display = 'none';
    modal.classList.remove('active');
}

// 작성 안내 편집기 렌더링
function renderGuideEditor() {
    // 작성 안내 항목을 textarea에 표시 (자유형식)
    const guideTextarea = document.getElementById('guideItemsTextarea');
    if (guideTextarea && currentGuideData.guide_items) {
        // 배열인 경우 줄바꿈으로 조인, 문자열인 경우 그대로 사용
        if (Array.isArray(currentGuideData.guide_items)) {
            guideTextarea.value = currentGuideData.guide_items.join('\n');
        } else {
            guideTextarea.value = currentGuideData.guide_items || '';
        }
    }

    // 작성 항목을 textarea에 표시 (이름:글자수 형식)
    const writingTextarea = document.getElementById('writingItemsTextarea');
    if (writingTextarea && currentGuideData.writing_items) {
        const writingText = currentGuideData.writing_items
            .map(item => `${item.name}:${item.limit}`)
            .join('\n');
        writingTextarea.value = writingText;
    }
    
    // 문의 정보 렌더링 (자유형식)
    const contactTextarea = document.getElementById('contactTextarea');
    if (contactTextarea && currentContactData) {
        // content 필드가 있으면 사용, 없으면 기존 필드들을 조합
        if (currentContactData.content) {
            contactTextarea.value = currentContactData.content;
        } else {
            // 기존 데이터 호환성을 위해 조합
            const parts = [];
            if (currentContactData.title) parts.push(currentContactData.title);
            if (currentContactData.email) parts.push(currentContactData.email);
            if (currentContactData.description) parts.push(currentContactData.description);
            contactTextarea.value = parts.join('\n');
        }
    }
}


// 작성 안내 저장
async function saveGuide() {
    try {
        // 작성 안내 항목 파싱 (자유형식 - 전체 텍스트 저장)
        const guideTextarea = document.getElementById('guideItemsTextarea');
        const guideContent = guideTextarea.value.trim();
        
        if (!guideContent || guideContent.length === 0) {
            alert('작성 안내 내용을 입력해주세요.');
            return;
        }
        
        // 줄바꿈으로 구분하여 배열로 저장 (기존 호환성 유지)
        const guideItems = guideContent
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        // 작성 항목 파싱 (자유형식)
        const writingTextarea = document.getElementById('writingItemsTextarea');
        const writingItems = [];
        const writingLines = writingTextarea.value.split('\n');
        
        for (let i = 0; i < writingLines.length; i++) {
            const line = writingLines[i].trim();
            if (line.length === 0) continue;
            
            let name = '';
            let limit = 2000; // 기본값
            
            // 다양한 형식 파싱 시도
            // 1. "이름:숫자" 형식 (예: 자기소개서:2000)
            if (line.includes(':')) {
                const parts = line.split(':');
                name = parts[0].trim();
                const limitStr = parts[1].trim();
                const limitMatch = limitStr.match(/\d+/);
                if (limitMatch) {
                    limit = parseInt(limitMatch[0]);
                }
            }
            // 2. "이름 숫자자" 형식 (예: 자기소개서 2000자)
            else if (/\d+자/.test(line)) {
                const match = line.match(/^(.+?)\s*(\d+)자/);
                if (match) {
                    name = match[1].trim();
                    limit = parseInt(match[2]);
                } else {
                    name = line.replace(/\d+자/g, '').trim();
                    const limitMatch = line.match(/(\d+)자/);
                    if (limitMatch) {
                        limit = parseInt(limitMatch[1]);
                    }
                }
            }
            // 3. "이름 (숫자자)" 형식 (예: 자기소개서 (2000자))
            else if (/\(.*\d+.*자.*\)/.test(line)) {
                const match = line.match(/^(.+?)\s*\(.*?(\d+).*?자.*?\)/);
                if (match) {
                    name = match[1].trim();
                    limit = parseInt(match[2]);
                } else {
                    name = line.replace(/\(.*?\)/g, '').trim();
                    const limitMatch = line.match(/(\d+)/);
                    if (limitMatch) {
                        limit = parseInt(limitMatch[1]);
                    }
                }
            }
            // 4. "이름 숫자" 형식 (예: 자기소개서 2000)
            else if (/\d+/.test(line)) {
                const match = line.match(/^(.+?)\s+(\d+)/);
                if (match) {
                    name = match[1].trim();
                    limit = parseInt(match[2]);
                } else {
                    // 숫자가 포함되어 있지만 형식이 불명확한 경우
                    const limitMatch = line.match(/(\d+)/);
                    if (limitMatch) {
                        limit = parseInt(limitMatch[1]);
                        name = line.replace(/\d+/g, '').trim();
                    } else {
                        name = line;
                    }
                }
            }
            // 5. 이름만 있는 경우 (기본값 2000자 사용)
            else {
                name = line;
            }
            
            // 이름이 비어있으면 전체 라인을 이름으로 사용
            if (!name || name.length === 0) {
                name = line;
            }
            
            writingItems.push({ name, limit });
        }
        
        if (writingItems.length === 0) {
            alert('작성 항목이 최소 1개 이상 필요합니다.');
            return;
        }

        // 문의 정보 파싱 (자유형식 - 전체 텍스트 저장)
        const contactTextarea = document.getElementById('contactTextarea');
        const contactContent = contactTextarea.value.trim();
        
        // 문의 정보 유효성 검사 (최소 1글자 이상)
        if (!contactContent || contactContent.length === 0) {
            alert('문의 내용을 입력해주세요.');
            return;
        }
        
        // 데이터 업데이트
        currentGuideData.guide_items = guideItems;
        currentGuideData.writing_items = writingItems;
        
        await saveApplicationGuide(currentGuideData);
        // 문의 정보를 자유 텍스트로 저장 (description 필드에 전체 텍스트 저장)
        await saveContactInfo({
            title: '',
            email: '',
            description: contactContent
        });
        alert('작성 안내와 문의 정보가 저장되었습니다.');
        closeGuideEditor();
    } catch (error) {
        console.error('Error saving guide:', error);
        alert('저장 중 오류가 발생했습니다.\n' + error.message);
    }
}

// ==================== 채용공고 관리 ====================

let currentJobPostings = null;

// 채용공고 관리 모달 열기
async function openJobPostingEditor() {
    try {
        currentJobPostings = await getAllJobPostings();
        renderJobPostingEditor();
        const modal = document.getElementById('jobPostingEditorModal');
        modal.style.display = 'flex';
        modal.classList.add('active');
        
        // 모달 배경 클릭 시 닫기
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeJobPostingEditor();
            }
        });
    } catch (error) {
        console.error('Error loading job postings:', error);
        alert('채용공고를 불러오는 중 오류가 발생했습니다.');
    }
}

// 채용공고 관리 모달 닫기
function closeJobPostingEditor() {
    const modal = document.getElementById('jobPostingEditorModal');
    modal.style.display = 'none';
    modal.classList.remove('active');
}

// 채용공고 편집기 렌더링
function renderJobPostingEditor() {
    const container = document.getElementById('jobPostingsContainer');
    container.innerHTML = '';
    
    if (!currentJobPostings || currentJobPostings.length === 0) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">등록된 채용공고가 없습니다.</div>';
        return;
    }
    
    currentJobPostings.forEach((posting, index) => {
        const row = document.createElement('div');
        row.className = 'guide-item-row';
        row.style.marginBottom = '12px';
        row.innerHTML = `
            <input type="text" value="${posting.title.replace(/"/g, '&quot;')}" 
                   onchange="updateJobPostingItem(${posting.id}, this.value)" 
                   placeholder="채용공고명" style="flex: 1;">
            <button onclick="deleteJobPostingItem(${posting.id}, ${index})" class="btn-remove-item">삭제</button>
        `;
        container.appendChild(row);
    });
}

// 채용공고 업데이트
async function updateJobPostingItem(id, title) {
    try {
        if (!title || title.trim() === '') {
            alert('채용공고명을 입력해주세요.');
            return;
        }
        
        await updateJobPosting(id, title.trim());
        
        // 로컬 데이터 업데이트
        const posting = currentJobPostings.find(p => p.id === id);
        if (posting) {
            posting.title = title.trim();
        }
        
        // jobPostings 배열도 업데이트
        await loadJobPostings();
        
        // 현재 페이지가 채용공고 페이지면 다시 렌더링
        if (document.getElementById('jobPostingPage').classList.contains('active')) {
            renderJobPostings();
        }
    } catch (error) {
        console.error('Error updating job posting:', error);
        alert('수정 중 오류가 발생했습니다.\n' + error.message);
    }
}

// 채용공고 삭제
async function deleteJobPostingItem(id, index) {
    if (!confirm('이 채용공고를 삭제하시겠습니까?\n삭제된 채용공고는 복구할 수 없습니다.')) {
        return;
    }
    
    try {
        await deleteJobPosting(id);
        
        // 로컬 데이터에서 제거
        currentJobPostings.splice(index, 1);
        renderJobPostingEditor();
        
        // jobPostings 배열도 업데이트
        await loadJobPostings();
        
        // 현재 페이지가 채용공고 페이지면 다시 렌더링
        if (document.getElementById('jobPostingPage').classList.contains('active')) {
            renderJobPostings();
        }
        
        alert('채용공고가 삭제되었습니다.');
    } catch (error) {
        console.error('Error deleting job posting:', error);
        alert('삭제 중 오류가 발생했습니다.\n' + error.message);
    }
}

// 새 채용공고 추가
async function addNewJobPosting() {
    const title = prompt('새 채용공고명을 입력하세요:');
    if (!title || title.trim() === '') {
        return;
    }
    
    try {
        const newPosting = await createJobPosting(title.trim());
        currentJobPostings.push(newPosting);
        renderJobPostingEditor();
        
        // jobPostings 배열도 업데이트
        await loadJobPostings();
        
        // 현재 페이지가 채용공고 페이지면 다시 렌더링
        if (document.getElementById('jobPostingPage').classList.contains('active')) {
            renderJobPostings();
        }
        
        alert('채용공고가 추가되었습니다.');
    } catch (error) {
        console.error('Error creating job posting:', error);
        alert('추가 중 오류가 발생했습니다.\n' + error.message);
    }
}

// ==================== 평가자 관리 ====================

let currentEvaluators = null;

// 평가자 관리 모달 열기
async function openEvaluatorEditor() {
    try {
        currentEvaluators = await getAllEvaluators();
        renderEvaluatorEditor();
        const modal = document.getElementById('evaluatorEditorModal');
        modal.style.display = 'flex';
        modal.classList.add('active');
        
        // 모달 배경 클릭 시 닫기
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeEvaluatorEditor();
            }
        });
    } catch (error) {
        console.error('Error loading evaluators:', error);
        alert('평가자 목록을 불러오는 중 오류가 발생했습니다.');
    }
}

// 평가자 관리 모달 닫기
function closeEvaluatorEditor() {
    const modal = document.getElementById('evaluatorEditorModal');
    modal.style.display = 'none';
    modal.classList.remove('active');
}

// 평가자 편집기 렌더링
function renderEvaluatorEditor() {
    const container = document.getElementById('evaluatorsContainer');
    container.innerHTML = '';
    
    if (!currentEvaluators || currentEvaluators.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 24px;">등록된 평가자가 없습니다.</p>';
        return;
    }
    
    currentEvaluators.forEach((evaluator) => {
        const row = document.createElement('div');
        const isAdmin = evaluator.is_admin === true;
        row.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr 1fr auto auto auto; gap: 12px; align-items: center; padding: 16px; background: #f8fafc; border-radius: 8px; margin-bottom: 12px;';
        row.innerHTML = `
            <div>
                <strong style="color: var(--text-primary);">${evaluator.id}</strong>
                ${isAdmin ? '<span style="margin-left: 8px; padding: 2px 8px; background: #fef3c7; color: #f59e0b; border-radius: 4px; font-size: 11px; font-weight: 600;">관리자</span>' : ''}
            </div>
            <div style="color: var(--text-secondary); font-size: 14px;">
                ${evaluator.name || '이름 없음'}
            </div>
            <div style="color: var(--text-secondary); font-size: 13px;">
                생성일: ${new Date(evaluator.created_at).toLocaleDateString('ko-KR')}
            </div>
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="checkbox" ${isAdmin ? 'checked' : ''} 
                       onchange="toggleEvaluatorAdmin('${evaluator.id}', this.checked)"
                       style="width: 18px; height: 18px; cursor: pointer;">
                <span style="font-size: 13px; color: var(--text-primary); font-weight: 600;">관리자 권한</span>
            </label>
            <button onclick="openChangeEvaluatorPasswordModal('${evaluator.id}', '${evaluator.name || evaluator.id}')" 
                    style="padding: 6px 12px; background: var(--primary-color); color: white; border: none; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.3s;">
                비밀번호 변경
            </button>
            <button onclick="deleteEvaluatorItem('${evaluator.id}')" class="btn-remove-item">삭제</button>
        `;
        container.appendChild(row);
    });
}

// 새 평가자 추가
async function addNewEvaluator() {
    try {
        const evaluatorId = document.getElementById('newEvaluatorId').value.trim();
        const password = document.getElementById('newEvaluatorPassword').value.trim();
        const name = document.getElementById('newEvaluatorName').value.trim();
        
        // 유효성 검사
        if (!evaluatorId) {
            alert('평가자 아이디를 입력해주세요.');
            return;
        }
        if (!password) {
            alert('비밀번호를 입력해주세요.');
            return;
        }
        if (password.length < 4) {
            alert('비밀번호는 최소 4자 이상이어야 합니다.');
            return;
        }
        if (!name) {
            alert('평가자 이름을 입력해주세요.');
            return;
        }
        
        // 중복 확인
        const existing = currentEvaluators.find(e => e.id === evaluatorId);
        if (existing) {
            alert('이미 존재하는 평가자 아이디입니다.');
            return;
        }
        
        await createEvaluator(evaluatorId, password, name);
        
        // 입력 필드 초기화
        document.getElementById('newEvaluatorId').value = '';
        document.getElementById('newEvaluatorPassword').value = '';
        document.getElementById('newEvaluatorName').value = '';
        
        // 목록 새로고침
        currentEvaluators = await getAllEvaluators();
        renderEvaluatorEditor();
        
        alert('평가자가 추가되었습니다.');
    } catch (error) {
        console.error('Error adding evaluator:', error);
        alert('평가자 추가 중 오류가 발생했습니다.\n' + error.message);
    }
}

// 평가자 관리자 권한 토글
async function toggleEvaluatorAdmin(evaluatorId, isAdmin) {
    try {
        await updateEvaluatorAdminStatus(evaluatorId, isAdmin);
        
        // 목록 새로고침
        currentEvaluators = await getAllEvaluators();
        renderEvaluatorEditor();
        
        const status = isAdmin ? '부여' : '해제';
        alert(`평가자 "${evaluatorId}"의 관리자 권한이 ${status}되었습니다.`);
    } catch (error) {
        console.error('Error toggling evaluator admin status:', error);
        alert('관리자 권한 변경 중 오류가 발생했습니다.\n' + error.message);
        // 오류 발생 시 목록 새로고침하여 원래 상태로 복구
        currentEvaluators = await getAllEvaluators();
        renderEvaluatorEditor();
    }
}

// 평가자 삭제
async function deleteEvaluatorItem(evaluatorId) {
    if (!confirm(`평가자 "${evaluatorId}"를 삭제하시겠습니까?\n\n주의: 이 평가자의 모든 평가 데이터는 유지되지만, 더 이상 로그인할 수 없습니다.`)) {
        return;
    }
    
    try {
        await deleteEvaluator(evaluatorId);
        
        // 목록 새로고침
        currentEvaluators = await getAllEvaluators();
        renderEvaluatorEditor();
        
        alert('평가자가 삭제되었습니다.');
    } catch (error) {
        console.error('Error deleting evaluator:', error);
        alert('평가자 삭제 중 오류가 발생했습니다.\n' + error.message);
    }
}

// 평가자 비밀번호 변경 모달 열기
let currentPasswordChangeEvaluatorId = null;
function openChangeEvaluatorPasswordModal(evaluatorId, evaluatorName) {
    currentPasswordChangeEvaluatorId = evaluatorId;
    const modal = document.getElementById('changeEvaluatorPasswordModal');
    document.getElementById('changePasswordEvaluatorName').textContent = evaluatorName;
    document.getElementById('adminNewPassword').value = '';
    document.getElementById('adminConfirmPassword').value = '';
    modal.style.display = 'flex';
    modal.classList.add('active');
    
    // 모달 배경 클릭 시 닫기
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeChangeEvaluatorPasswordModal();
        }
    });
}

// 평가자 비밀번호 변경 모달 닫기
function closeChangeEvaluatorPasswordModal() {
    const modal = document.getElementById('changeEvaluatorPasswordModal');
    modal.style.display = 'none';
    modal.classList.remove('active');
    currentPasswordChangeEvaluatorId = null;
    document.getElementById('adminNewPassword').value = '';
    document.getElementById('adminConfirmPassword').value = '';
}

// 관리자가 평가자 비밀번호 변경
async function changeEvaluatorPasswordByAdmin() {
    try {
        if (!currentPasswordChangeEvaluatorId) {
            alert('평가자를 선택해주세요.');
            return;
        }
        
        const newPassword = document.getElementById('adminNewPassword').value.trim();
        const confirmPassword = document.getElementById('adminConfirmPassword').value.trim();
        
        // 유효성 검사
        if (!newPassword) {
            alert('새 비밀번호를 입력해주세요.');
            return;
        }
        if (newPassword.length < 4) {
            alert('비밀번호는 최소 4자 이상이어야 합니다.');
            return;
        }
        if (newPassword !== confirmPassword) {
            alert('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
            return;
        }
        
        await updateEvaluatorPasswordByAdmin(currentPasswordChangeEvaluatorId, newPassword);
        
        alert('비밀번호가 변경되었습니다.');
        closeChangeEvaluatorPasswordModal();
    } catch (error) {
        console.error('Error changing evaluator password:', error);
        alert('비밀번호 변경 중 오류가 발생했습니다.\n' + error.message);
    }
}

// ==================== 문의 관리 ====================
// (작성 안내 관리에 통합됨)
