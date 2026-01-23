// 전역 변수
let currentUser = null;
let applicants = [];
let selectedApplicantId = null;
let selectedJobPosting = null;

// 채용공고 목록
const jobPostings = [
    '2026년 상반기 신입사원 공채',
    '2026년 상반기 경력직 수시채용',
    '2026년 인턴 채용',
    '2026년 계약직 채용'
];

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', async function() {
    await loadData();
    checkAuth();
    setupEventListeners();
});

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
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === 'admin' && password === 'admin123') {
        currentUser = username;
        localStorage.setItem('currentUser', username);
        showJobPostingPage();
    } else {
        alert('아이디 또는 비밀번호가 올바르지 않습니다.');
    }
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
    document.getElementById('currentUser').textContent = `${currentUser}님`;
    
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
}

// 지원자 목록 렌더링
function renderApplicantList() {
    const listContainer = document.getElementById('applicantList');
    listContainer.innerHTML = '';

    // 선택된 채용공고의 지원자만 표시
    const filteredApplicants = selectedJobPosting 
        ? applicants.filter(a => a.job_posting === selectedJobPosting)
        : applicants;

    if (filteredApplicants.length === 0) {
        listContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #94a3b8;">해당 공고의 지원자가 없습니다.</div>';
        return;
    }

    filteredApplicants.forEach(applicant => {
        const item = document.createElement('div');
        item.className = 'applicant-item';
        if (selectedApplicantId === applicant.id) {
            item.classList.add('active');
        }

        // 평가 상태 확인 (evaluations 배열 사용)
        const evaluationCount = applicant.evaluations ? applicant.evaluations.length : 0;
        const avgScore = evaluationCount > 0 
            ? Math.round(applicant.evaluations.reduce((sum, e) => sum + (e.total_score || 0), 0) / evaluationCount)
            : null;

        const status = evaluationCount > 0
            ? `<span class="applicant-status status-completed">평가완료 (${evaluationCount}명)</span>`
            : '<span class="applicant-status status-pending">평가대기</span>';

        const score = avgScore !== null
            ? `<span class="applicant-score">${avgScore}점</span>`
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

// 지원자 선택
function selectApplicant(id) {
    selectedApplicantId = id;
    const applicant = applicants.find(a => a.id === id);
    
    if (!applicant) return;

    renderApplicantList();
    showCoverLetter(applicant);
    loadEvaluation(applicant);
}

// 지원서 표시
function showCoverLetter(applicant) {
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
            <span style="color: #6366f1; font-weight: 700;">📢 ${applicant.job_posting || '채용공고 미선택'}</span>
        </div>
        <div class="applicant-detail" style="margin-top: 4px;">
            <span><strong>지원 지점:</strong> ${applicant.branch || '미입력'}</span>
            <span><strong>지원 직무:</strong> ${applicant.position || '미입력'}</span>
        </div>
    `;

    // 평가 정보 표시
    let evaluationSummary = '';
    if (applicant.evaluations && applicant.evaluations.length > 0) {
        const avgScore = Math.round(applicant.evaluations.reduce((sum, e) => sum + (e.total_score || 0), 0) / applicant.evaluations.length);
        
        evaluationSummary = `
            <div class="section-block" style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-left-color: #10b981;">
                <h3>📊 평가 결과</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 12px;">
                    <div style="background: white; padding: 16px; border-radius: 12px; text-align: center;">
                        <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">평균 점수</div>
                        <div style="font-size: 32px; font-weight: 800; color: #10b981;">${avgScore}점</div>
                    </div>
                    <div style="background: white; padding: 16px; border-radius: 12px; text-align: center;">
                        <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">평가자 수</div>
                        <div style="font-size: 32px; font-weight: 800; color: #6366f1;">${applicant.evaluations.length}명</div>
                    </div>
                </div>
                <div style="margin-top: 16px;">
                    ${applicant.evaluations.map(e => `
                        <div style="background: white; padding: 12px; border-radius: 8px; margin-top: 8px; display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-weight: 600; color: #0f172a;">${e.evaluator_name || e.evaluator_id}</span>
                            <span style="font-size: 18px; font-weight: 700; color: #6366f1;">${e.total_score}점</span>
                        </div>
                    `).join('')}
                </div>
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
                <p class="pre-wrap">${applicant.selfIntroduction || applicant.coverLetter || '미입력'}</p>
            </div>

            <div class="section-block">
                <h3>💻 경력기술서</h3>
                <p class="pre-wrap">${applicant.careerDescription || '미입력'}</p>
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
function loadEvaluation(applicant) {
    const form = document.getElementById('evaluationForm');
    const evaluationContent = document.getElementById('evaluationContent');
    
    // 평가 내역이 있으면 표시
    if (applicant.evaluations && applicant.evaluations.length > 0) {
        const avgScores = {
            score1: Math.round(applicant.evaluations.reduce((sum, e) => sum + e.score1, 0) / applicant.evaluations.length),
            score2: Math.round(applicant.evaluations.reduce((sum, e) => sum + e.score2, 0) / applicant.evaluations.length),
            score3: Math.round(applicant.evaluations.reduce((sum, e) => sum + e.score3, 0) / applicant.evaluations.length),
            score4: Math.round(applicant.evaluations.reduce((sum, e) => sum + e.score4, 0) / applicant.evaluations.length)
        };

        evaluationContent.innerHTML = `
            <div class="evaluation-summary">
                <h3 style="margin-bottom: 20px; color: #10b981;">✅ 평가 완료</h3>
                
                <div class="avg-scores">
                    <div class="score-item">
                        <div class="score-label">내용충실도</div>
                        <div class="score-bar">
                            <div class="score-fill" style="width: ${avgScores.score1 * 4}%"></div>
                        </div>
                        <div class="score-value">${avgScores.score1}/25</div>
                    </div>
                    
                    <div class="score-item">
                        <div class="score-label">경력 및 교육사항</div>
                        <div class="score-bar">
                            <div class="score-fill" style="width: ${avgScores.score2 * 4}%"></div>
                        </div>
                        <div class="score-value">${avgScores.score2}/25</div>
                    </div>
                    
                    <div class="score-item">
                        <div class="score-label">조직적합성</div>
                        <div class="score-bar">
                            <div class="score-fill" style="width: ${avgScores.score3 * 4}%"></div>
                        </div>
                        <div class="score-value">${avgScores.score3}/25</div>
                    </div>
                    
                    <div class="score-item">
                        <div class="score-label">직무적합성</div>
                        <div class="score-bar">
                            <div class="score-fill" style="width: ${avgScores.score4 * 4}%"></div>
                        </div>
                        <div class="score-value">${avgScores.score4}/25</div>
                    </div>
                </div>

                <div class="evaluators-detail" style="margin-top: 32px;">
                    <h4 style="margin-bottom: 16px;">평가자별 상세</h4>
                    ${applicant.evaluations.map(e => `
                        <div class="evaluator-card">
                            <div class="evaluator-header">
                                <strong>${e.evaluator_name || e.evaluator_id}</strong>
                                <span style="font-size: 20px; font-weight: 700; color: #6366f1;">${e.total_score}점</span>
                            </div>
                            <div class="evaluator-scores">
                                <div>내용충실도: ${e.score1}점</div>
                                <div>경력·교육: ${e.score2}점</div>
                                <div>조직적합성: ${e.score3}점</div>
                                <div>직무적합성: ${e.score4}점</div>
                            </div>
                            ${e.comment1 || e.comment2 || e.comment3 || e.comment4 ? `
                                <div class="evaluator-comments">
                                    ${e.comment1 ? `<p><strong>내용충실도:</strong> ${e.comment1}</p>` : ''}
                                    ${e.comment2 ? `<p><strong>경력·교육:</strong> ${e.comment2}</p>` : ''}
                                    ${e.comment3 ? `<p><strong>조직적합성:</strong> ${e.comment3}</p>` : ''}
                                    ${e.comment4 ? `<p><strong>직무적합성:</strong> ${e.comment4}</p>` : ''}
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } else {
        evaluationContent.innerHTML = `
            <div class="empty-evaluation">
                <div style="text-align: center; padding: 60px 20px; color: #94a3b8;">
                    <div style="font-size: 48px; margin-bottom: 16px;">📋</div>
                    <p style="font-size: 16px;">아직 평가가 완료되지 않았습니다.</p>
                    <p style="font-size: 14px; margin-top: 8px;">평가자가 평가를 완료하면 여기에 표시됩니다.</p>
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

// 작성 안내 편집 모달 열기
async function openGuideEditor() {
    try {
        currentGuideData = await getApplicationGuide();
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
    // 작성 안내 항목 렌더링
    const guideContainer = document.getElementById('guideItemsContainer');
    guideContainer.innerHTML = '';
    
    currentGuideData.guide_items.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'guide-item-row';
        row.innerHTML = `
            <input type="text" value="${item.replace(/"/g, '&quot;')}" 
                   onchange="updateGuideItem(${index}, this.value)" 
                   placeholder="작성 안내 항목">
            <button onclick="removeGuideItem(${index})" class="btn-remove-item">삭제</button>
        `;
        guideContainer.appendChild(row);
    });

    // 작성 항목 렌더링
    const writingContainer = document.getElementById('writingItemsContainer');
    writingContainer.innerHTML = '';
    
    currentGuideData.writing_items.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'writing-item-row';
        row.innerHTML = `
            <input type="text" name="name" value="${item.name.replace(/"/g, '&quot;')}" 
                   onchange="updateWritingItem(${index}, 'name', this.value)" 
                   placeholder="항목명">
            <input type="number" name="limit" value="${item.limit}" 
                   onchange="updateWritingItem(${index}, 'limit', parseInt(this.value))" 
                   placeholder="글자수" min="0">
            <span style="color: var(--text-secondary); font-size: 14px;">자 이내</span>
            <button onclick="removeWritingItem(${index})" class="btn-remove-item">삭제</button>
        `;
        writingContainer.appendChild(row);
    });
}

// 작성 안내 항목 업데이트
function updateGuideItem(index, value) {
    currentGuideData.guide_items[index] = value;
}

// 작성 안내 항목 삭제
function removeGuideItem(index) {
    if (confirm('이 항목을 삭제하시겠습니까?')) {
        currentGuideData.guide_items.splice(index, 1);
        renderGuideEditor();
    }
}

// 작성 안내 항목 추가
function addGuideItem() {
    currentGuideData.guide_items.push('새 항목');
    renderGuideEditor();
    // 새로 추가된 입력 필드에 포커스
    const inputs = document.querySelectorAll('#guideItemsContainer input');
    if (inputs.length > 0) {
        inputs[inputs.length - 1].focus();
    }
}

// 작성 항목 업데이트
function updateWritingItem(index, field, value) {
    if (field === 'name') {
        currentGuideData.writing_items[index].name = value;
    } else if (field === 'limit') {
        currentGuideData.writing_items[index].limit = value;
    }
}

// 작성 항목 삭제
function removeWritingItem(index) {
    if (confirm('이 항목을 삭제하시겠습니까?')) {
        currentGuideData.writing_items.splice(index, 1);
        renderGuideEditor();
    }
}

// 작성 항목 추가
function addWritingItem() {
    currentGuideData.writing_items.push({ name: '새 항목', limit: 500 });
    renderGuideEditor();
    // 새로 추가된 입력 필드에 포커스
    const inputs = document.querySelectorAll('#writingItemsContainer input[name="name"]');
    if (inputs.length > 0) {
        inputs[inputs.length - 1].focus();
    }
}

// 작성 안내 저장
async function saveGuide() {
    try {
        // 유효성 검사
        if (currentGuideData.guide_items.length === 0) {
            alert('작성 안내 항목이 최소 1개 이상 필요합니다.');
            return;
        }
        if (currentGuideData.writing_items.length === 0) {
            alert('작성 항목이 최소 1개 이상 필요합니다.');
            return;
        }
        
        for (let i = 0; i < currentGuideData.writing_items.length; i++) {
            const item = currentGuideData.writing_items[i];
            if (!item.name || item.name.trim() === '') {
                alert('작성 항목의 이름을 입력해주세요.');
                return;
            }
            if (!item.limit || item.limit <= 0) {
                alert('작성 항목의 글자수 제한을 올바르게 입력해주세요.');
                return;
            }
        }

        await saveApplicationGuide(currentGuideData);
        alert('작성 안내가 저장되었습니다.');
        closeGuideEditor();
    } catch (error) {
        console.error('Error saving guide:', error);
        alert('저장 중 오류가 발생했습니다.\n' + error.message);
    }
}
