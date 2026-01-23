// 전역 변수
let currentEvaluator = null;
let applicants = [];
let selectedApplicantId = null;
let selectedJobPosting = null;
let jobPostings = []; // 동적으로 로드

// 평가자 계정 (Supabase에서 동적으로 로드)
let evaluators = {};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', async function() {
    await loadEvaluators();
    await loadData();
    await loadJobPostings();
    checkAuth();
    setupEventListeners();
});

// 평가자 목록 로드
async function loadEvaluators() {
    try {
        const evaluatorList = await getAllEvaluators();
        evaluators = {};
        evaluatorList.forEach(eval => {
            evaluators[eval.id] = {
                password: eval.password,
                name: eval.name || eval.id
            };
        });
        console.log('Loaded evaluators from Supabase:', evaluators);
    } catch (error) {
        console.error('Error loading evaluators:', error);
        // 기본값 사용 (하위 호환성)
        evaluators = {
            'evaluator1': { password: 'eval123', name: '평가자 1' },
            'evaluator2': { password: 'eval123', name: '평가자 2' },
            'evaluator3': { password: 'eval123', name: '평가자 3' }
        };
    }
}

// 데이터 로드 (Supabase에서)
async function loadData() {
    try {
        applicants = await getAllApplicants();
        console.log('Loaded applicants from Supabase:', applicants);
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
    const evaluatorId = localStorage.getItem('currentEvaluator');
    if (evaluatorId && evaluators[evaluatorId]) {
        currentEvaluator = evaluatorId;
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

    const evaluationForm = document.getElementById('evaluationForm');
    if (evaluationForm) {
        evaluationForm.addEventListener('submit', handleEvaluation);
        
        for (let i = 1; i <= 4; i++) {
            const scoreInput = document.getElementById(`score${i}`);
            if (scoreInput) {
                scoreInput.addEventListener('change', calculateTotalScore);
            }
        }
    }
}

// 로그인 처리
function handleLogin(e) {
    e.preventDefault();
    const evaluatorId = document.getElementById('evaluatorId').value.trim();
    const password = document.getElementById('password').value;

    if (evaluators[evaluatorId] && evaluators[evaluatorId].password === password) {
        currentEvaluator = evaluatorId;
        localStorage.setItem('currentEvaluator', evaluatorId);
        showJobPostingPage();
    } else {
        alert('평가자 ID 또는 비밀번호가 올바르지 않습니다.');
    }
}

// 비밀번호 변경 모달 열기
function openChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    modal.style.display = 'flex';
    modal.classList.add('active');
    
    // 입력 필드 초기화
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    
    // 모달 배경 클릭 시 닫기
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeChangePasswordModal();
        }
    });
}

// 비밀번호 변경 모달 닫기
function closeChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    modal.style.display = 'none';
    modal.classList.remove('active');
    
    // 입력 필드 초기화
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
}

// 비밀번호 변경
async function changePassword() {
    try {
        const currentPassword = document.getElementById('currentPassword').value.trim();
        const newPassword = document.getElementById('newPassword').value.trim();
        const confirmPassword = document.getElementById('confirmPassword').value.trim();
        
        // 유효성 검사
        if (!currentPassword) {
            alert('현재 비밀번호를 입력해주세요.');
            return;
        }
        if (!newPassword) {
            alert('새 비밀번호를 입력해주세요.');
            return;
        }
        if (newPassword.length < 4) {
            alert('새 비밀번호는 최소 4자 이상이어야 합니다.');
            return;
        }
        if (newPassword !== confirmPassword) {
            alert('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
            return;
        }
        if (currentPassword === newPassword) {
            alert('현재 비밀번호와 새 비밀번호가 동일합니다.');
            return;
        }
        
        // 비밀번호 변경
        await updateEvaluatorPassword(currentEvaluator, currentPassword, newPassword);
        
        // 로컬 evaluators 객체도 업데이트
        if (evaluators[currentEvaluator]) {
            evaluators[currentEvaluator].password = newPassword;
        }
        
        alert('비밀번호가 변경되었습니다.');
        closeChangePasswordModal();
    } catch (error) {
        console.error('Error changing password:', error);
        alert('비밀번호 변경 중 오류가 발생했습니다.\n' + error.message);
    }
}

// 로그아웃
function logout() {
    if (confirm('로그아웃 하시겠습니까?')) {
        currentEvaluator = null;
        selectedApplicantId = null;
        selectedJobPosting = null;
        localStorage.removeItem('currentEvaluator');
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
    const evaluatorName = evaluators[currentEvaluator].name;
    document.getElementById('evaluatorNamePosting').textContent = evaluatorName;
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
            </div>
            ${jobPostings.map(posting => {
                const postingApplicants = applicants.filter(a => a.job_posting === posting);
                const totalCount = postingApplicants.length;
                const myEvaluatedCount = postingApplicants.filter(a => 
                    a.evaluations && a.evaluations.some(e => e.evaluator_id === currentEvaluator)
                ).length;
                const evaluationRate = totalCount > 0 ? Math.round((myEvaluatedCount / totalCount) * 100) : 0;
                
                return `
                    <div class="job-posting-item" onclick="selectJobPosting('${posting}')">
                        <div class="list-col-title">
                            <span class="posting-title">${posting}</span>
                        </div>
                        <div class="list-col-count">
                            <span class="count-badge">${totalCount}명</span>
                        </div>
                        <div class="list-col-count">
                            <span class="count-badge success">${myEvaluatedCount}명</span>
                        </div>
                        <div class="list-col-count">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${evaluationRate}%"></div>
                            </div>
                            <span class="progress-text">${evaluationRate}%</span>
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
}

// UI 업데이트
function updateUI() {
    const evaluatorName = evaluators[currentEvaluator].name;
    document.getElementById('evaluatorName').textContent = evaluatorName;
    
    // 현재 선택된 채용공고 표시
    if (selectedJobPosting) {
        document.getElementById('currentJobPosting').textContent = selectedJobPosting;
    }
    
    // 해당 공고의 지원자만 필터링
    const filteredApplicants = selectedJobPosting 
        ? applicants.filter(a => a.job_posting === selectedJobPosting)
        : applicants;
    
    document.getElementById('applicantCount').textContent = `${filteredApplicants.length}명`;
    renderApplicantList();
    
    // 지원자를 선택하지 않은 경우 빈 상태 표시 (평가 폼은 항상 보이도록)
    if (!selectedApplicantId) {
        const header = document.getElementById('applicantInfoHeader');
        const content = document.getElementById('coverLetterContent');
        if (header) header.innerHTML = '';
        if (content) {
            content.innerHTML = `
                <div class="empty-state">
                    <p>👈 왼쪽에서 지원자를 선택하세요</p>
                </div>
            `;
        }
        
        // 평가 폼 초기화 (평가 저장 버튼은 항상 보이도록)
        const form = document.getElementById('evaluationForm');
        if (form) {
            form.reset();
            const totalScoreEl = document.getElementById('totalScore');
            if (totalScoreEl) totalScoreEl.textContent = '0';
            // 지원자를 선택하지 않았을 때는 폼 필드를 비활성화
            const formInputs = form.querySelectorAll('select, textarea');
            formInputs.forEach(input => {
                input.disabled = true;
            });
            // 평가 저장 버튼은 비활성화하되 보이도록
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.6';
            }
        }
    } else {
        // 지원자를 선택했을 때는 폼 필드 활성화
        const form = document.getElementById('evaluationForm');
        if (form) {
            const formInputs = form.querySelectorAll('select, textarea');
            formInputs.forEach(input => {
                input.disabled = false;
            });
            // 평가 저장 버튼 활성화
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
            }
        }
    }
}

// 지원자 필터링
function filterApplicants() {
    renderApplicantList();
}

// 지원자 목록 렌더링
function renderApplicantList() {
    const listContainer = document.getElementById('applicantList');
    const filterValue = document.getElementById('statusFilter').value;
    listContainer.innerHTML = '';

    // 선택된 채용공고의 지원자만 표시
    let filteredApplicants = selectedJobPosting 
        ? applicants.filter(a => a.job_posting === selectedJobPosting)
        : applicants;

    if (filteredApplicants.length === 0) {
        listContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #94a3b8;">해당 공고의 지원자가 없습니다.</div>';
        return;
    }
    
    if (filterValue === 'pending') {
        filteredApplicants = filteredApplicants.filter(a => !hasMyEvaluation(a));
    } else if (filterValue === 'completed') {
        filteredApplicants = filteredApplicants.filter(a => hasMyEvaluation(a));
    }

    // 상태 필터 적용
    
    if (filteredApplicants.length === 0) {
        listContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #94a3b8;">해당하는 지원자가 없습니다.</div>';
        return;
    }

    filteredApplicants.forEach(applicant => {
        const item = document.createElement('div');
        item.className = 'applicant-item';
        if (selectedApplicantId === applicant.id) {
            item.classList.add('active');
        }

        const myEval = hasMyEvaluation(applicant);
        const status = myEval 
            ? '<span class="applicant-status status-completed">평가완료</span>'
            : '<span class="applicant-status status-pending">평가대기</span>';

        const score = myEval 
            ? `<span class="applicant-score">${myEval.total_score}점</span>`
            : '';

        item.innerHTML = `
            <div class="applicant-name">${applicant.name}</div>
            <div class="applicant-position">${applicant.branch || '지점'} - ${applicant.position || '직무'}</div>
            <div>${status}${score}</div>
        `;

        item.addEventListener('click', () => selectApplicant(applicant.id));
        listContainer.appendChild(item);
    });
}

// 내가 평가했는지 확인
function hasMyEvaluation(applicant) {
    if (!applicant.evaluations || !Array.isArray(applicant.evaluations)) {
        return null;
    }
    return applicant.evaluations.find(e => e.evaluator_id === currentEvaluator);
}

// 지원자 선택
function selectApplicant(id) {
    selectedApplicantId = id;
    const applicant = applicants.find(a => a.id === id);
    
    if (!applicant) return;

    renderApplicantList();
    showApplication(applicant);
    loadEvaluation(applicant);
}

// 지원서 표시
function showApplication(applicant) {
    const header = document.getElementById('applicantInfoHeader');
    const content = document.getElementById('coverLetterContent');

    header.innerHTML = `
        <div class="applicant-detail">
            <span><strong>${applicant.name}</strong></span>
            <span>생년월일: ${applicant.birthdate || '미입력'}</span>
            <span>${applicant.email}</span>
            <span>${applicant.phone || '미입력'}</span>
        </div>
        <div class="applicant-detail" style="margin-top: 8px;">
            <span style="color: #6366f1; font-weight: 700;">📢 ${applicant.job_posting || applicant.jobPosting || '채용공고 미선택'}</span>
        </div>
        <div class="applicant-detail" style="margin-top: 4px;">
            <span><strong>지원 지점:</strong> ${applicant.branch || '미입력'}</span>
            <span><strong>지원 직무:</strong> ${applicant.position || '미입력'}</span>
        </div>
    `;

    content.innerHTML = `
        <div class="application-sections">
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

// 평가 로드
function loadEvaluation(applicant) {
    const form = document.getElementById('evaluationForm');
    const myEval = hasMyEvaluation(applicant);
    
    if (myEval) {
        // 이미 평가한 경우 기존 평가 로드
        document.getElementById('score1').value = myEval.score1;
        document.getElementById('score2').value = myEval.score2;
        document.getElementById('score3').value = myEval.score3;
        document.getElementById('score4').value = myEval.score4;
        
        document.getElementById('comment1').value = myEval.comment1 || '';
        document.getElementById('comment2').value = myEval.comment2 || '';
        document.getElementById('comment3').value = myEval.comment3 || '';
        document.getElementById('comment4').value = myEval.comment4 || '';
        
        calculateTotalScore();
    } else {
        // 새로운 평가
        form.reset();
        document.getElementById('totalScore').textContent = '0';
    }
}

// 총점 계산
function calculateTotalScore() {
    let total = 0;
    for (let i = 1; i <= 4; i++) {
        const value = parseInt(document.getElementById(`score${i}`).value) || 0;
        total += value;
    }
    document.getElementById('totalScore').textContent = total;
}

// 평가 저장
async function handleEvaluation(e) {
    e.preventDefault();
    
    if (!selectedApplicantId) {
        alert('지원자를 선택해주세요.');
        return;
    }

    const score1 = parseInt(document.getElementById('score1').value);
    const score2 = parseInt(document.getElementById('score2').value);
    const score3 = parseInt(document.getElementById('score3').value);
    const score4 = parseInt(document.getElementById('score4').value);
    
    if (isNaN(score1) || isNaN(score2) || isNaN(score3) || isNaN(score4)) {
        alert('모든 평가 항목의 점수를 선택해주세요.');
        return;
    }
    
    const totalScore = score1 + score2 + score3 + score4;
    
    const evaluation = {
        applicant_id: selectedApplicantId,
        evaluator_id: currentEvaluator,
        evaluator_name: evaluators[currentEvaluator].name,
        score1,
        score2,
        score3,
        score4,
        comment1: document.getElementById('comment1').value,
        comment2: document.getElementById('comment2').value,
        comment3: document.getElementById('comment3').value,
        comment4: document.getElementById('comment4').value,
        evaluation_date: new Date().toISOString().split('T')[0]
    };

    try {
        console.log('Saving evaluation:', evaluation);
        await saveEvaluation(evaluation);
        alert('평가가 저장되었습니다.');
        
        // 데이터 새로고침
        await loadData();
        renderApplicantList();
        
        // 현재 지원자 다시 선택
        selectApplicant(selectedApplicantId);
    } catch (error) {
        console.error('Error saving evaluation:', error);
        alert('평가 저장 중 오류가 발생했습니다.\n' + error.message);
    }
}

// 데이터 새로고침
async function refreshData() {
    await loadData();
    
    // 채용공고 페이지인지 메인 페이지인지 확인
    const currentPage = document.querySelector('.page.active');
    if (currentPage && currentPage.id === 'jobPostingPage') {
        renderJobPostings();
    } else {
        updateUI();
        if (selectedApplicantId) {
            selectApplicant(selectedApplicantId);
        }
    }
    
    alert('데이터를 새로고침했습니다.');
}
