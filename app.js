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
    // 작성 안내 항목을 textarea에 표시
    const guideTextarea = document.getElementById('guideItemsTextarea');
    if (guideTextarea && currentGuideData.guide_items) {
        guideTextarea.value = currentGuideData.guide_items.join('\n');
    }

    // 작성 항목을 textarea에 표시 (이름:글자수 형식)
    const writingTextarea = document.getElementById('writingItemsTextarea');
    if (writingTextarea && currentGuideData.writing_items) {
        const writingText = currentGuideData.writing_items
            .map(item => `${item.name}:${item.limit}`)
            .join('\n');
        writingTextarea.value = writingText;
    }
    
    // 문의 정보 렌더링 (textarea에 3줄로 표시)
    const contactTextarea = document.getElementById('contactTextarea');
    if (contactTextarea && currentContactData) {
        const contactLines = [
            currentContactData.title || '',
            currentContactData.email || '',
            currentContactData.description || ''
        ];
        contactTextarea.value = contactLines.join('\n');
    }
}


// 작성 안내 저장
async function saveGuide() {
    try {
        // 작성 안내 항목 파싱 (textarea에서 줄바꿈으로 구분)
        const guideTextarea = document.getElementById('guideItemsTextarea');
        const guideItems = guideTextarea.value
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
        
        if (guideItems.length === 0) {
            alert('작성 안내 항목이 최소 1개 이상 필요합니다.');
            return;
        }

        // 작성 항목 파싱 (이름:글자수 형식)
        const writingTextarea = document.getElementById('writingItemsTextarea');
        const writingItems = [];
        const writingLines = writingTextarea.value.split('\n');
        
        for (let i = 0; i < writingLines.length; i++) {
            const line = writingLines[i].trim();
            if (line.length === 0) continue;
            
            const parts = line.split(':');
            if (parts.length !== 2) {
                alert(`작성 항목 ${i + 1}번째 줄의 형식이 올바르지 않습니다.\n"이름:글자수" 형식으로 입력해주세요. (예: 자기소개서:2000)`);
                return;
            }
            
            const name = parts[0].trim();
            const limit = parseInt(parts[1].trim());
            
            if (!name || name.length === 0) {
                alert(`작성 항목 ${i + 1}번째 줄의 이름을 입력해주세요.`);
                return;
            }
            if (isNaN(limit) || limit <= 0) {
                alert(`작성 항목 ${i + 1}번째 줄의 글자수 제한을 올바르게 입력해주세요.`);
                return;
            }
            
            writingItems.push({ name, limit });
        }
        
        if (writingItems.length === 0) {
            alert('작성 항목이 최소 1개 이상 필요합니다.');
            return;
        }

        // 문의 정보 파싱 (textarea에서 3줄로 구분)
        const contactTextarea = document.getElementById('contactTextarea');
        const contactLines = contactTextarea.value.split('\n').map(line => line.trim());
        
        const title = contactLines[0] || '';
        const email = contactLines[1] || '';
        const description = contactLines[2] || '';
        
        // 문의 정보 유효성 검사
        if (!title) {
            alert('문의 제목을 입력해주세요. (첫 번째 줄)');
            return;
        }
        if (!email) {
            alert('문의 이메일을 입력해주세요. (두 번째 줄)');
            return;
        }
        if (!description) {
            alert('문의 설명을 입력해주세요. (세 번째 줄)');
            return;
        }
        
        // 이메일 형식 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('올바른 이메일 주소를 입력해주세요. (두 번째 줄)');
            return;
        }
        
        // 데이터 업데이트
        currentGuideData.guide_items = guideItems;
        currentGuideData.writing_items = writingItems;
        
        await saveApplicationGuide(currentGuideData);
        await saveContactInfo({
            title: title,
            email: email,
            description: description
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

// ==================== 문의 관리 ====================
// (작성 안내 관리에 통합됨)
