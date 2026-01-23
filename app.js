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
        row.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr 1fr auto auto; gap: 12px; align-items: center; padding: 16px; background: #f8fafc; border-radius: 8px; margin-bottom: 12px;';
        row.innerHTML = `
            <div>
                <strong style="color: var(--text-primary);">${evaluator.id}</strong>
            </div>
            <div style="color: var(--text-secondary); font-size: 14px;">
                ${evaluator.name || '이름 없음'}
            </div>
            <div style="color: var(--text-secondary); font-size: 13px;">
                생성일: ${new Date(evaluator.created_at).toLocaleDateString('ko-KR')}
            </div>
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
