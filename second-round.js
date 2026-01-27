// 전역 변수
let currentApplicant = null;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', async function() {
    // db.js 함수들이 로드될 때까지 대기
    let retryCount = 0;
    const maxRetries = 100;
    
    const checkDbFunctions = setInterval(() => {
        const requiredFunctions = [
            'getApplicantByEmail',
            'getAllSecondRoundQuestions',
            'getSecondRoundIntro',
            'getSecondRoundResponseByApplicantId',
            'saveSecondRoundResponse',
            'verifyPassword'
        ];
        
        const allLoaded = requiredFunctions.every(funcName => {
            if (typeof window[funcName] === 'function') return true;
            try {
                return typeof eval(funcName) === 'function';
            } catch {
                return false;
            }
        });
        
        if (allLoaded) {
            console.log('[second-round.js] db.js 함수들 확인 완료');
            clearInterval(checkDbFunctions);
            initializeApp();
        } else {
            retryCount++;
            if (retryCount >= maxRetries) {
                console.error('[second-round.js] db.js 함수들을 찾을 수 없습니다.');
                clearInterval(checkDbFunctions);
                alert('데이터베이스 함수를 로드할 수 없습니다. 페이지를 새로고침해주세요.');
            }
        }
    }, 100);
});

// 앱 초기화
async function initializeApp() {
    try {
        // 제출 완료 모달 숨기기 (페이지 로드 시)
        const modal = document.getElementById('successModal');
        if (modal) {
            modal.classList.remove('active');
        }
        
        // 로그인 상태 확인
        const loggedInEmail = localStorage.getItem('secondRoundLoggedIn');
        if (loggedInEmail) {
            try {
                await loadApplicantData(loggedInEmail);
                showQuestionPage();
            } catch (error) {
                console.error('[second-round.js] 로그인 상태 복원 실패:', error);
                // 로그인 상태 복원 실패 시 로그인 페이지로 이동
                localStorage.removeItem('secondRoundLoggedIn');
                showLoginPage();
            }
        } else {
            showLoginPage();
        }
        
        setupEventListeners();
    } catch (error) {
        console.error('[second-round.js] 초기화 오류:', error);
        alert(`시스템 초기화 중 오류가 발생했습니다.\n\n${error.message || '알 수 없는 오류'}`);
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const secondRoundForm = document.getElementById('secondRoundForm');
    if (secondRoundForm) {
        secondRoundForm.addEventListener('submit', handleSubmit);
    }
}

// 페이지 표시
function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

function showLoginPage() {
    showPage('loginPage');
}

function showQuestionPage() {
    showPage('questionPage');
}

// 로그인 처리
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    try {
        const applicant = await getApplicantByEmail(email);

        if (!applicant) {
            alert('등록되지 않은 이메일입니다.');
            return;
        }

        // 합격 여부 확인
        if (applicant.status !== 'passed') {
            alert('⚠️ 2차 서류전형은 합격하신 지원자만 접근할 수 있습니다.\n\n현재 상태: ' + (applicant.status === 'failed' ? '불합격' : applicant.status === 'pending' ? '심사중' : '미정'));
            return;
        }

        if (!verifyPassword(password, applicant.password)) {
            alert('비밀번호가 올바르지 않습니다.');
            return;
        }

        localStorage.setItem('secondRoundLoggedIn', email);
        currentApplicant = applicant;
        await loadApplicantData(email);
        showQuestionPage();
    } catch (error) {
        console.error('Login error:', error);
        alert('로그인 중 오류가 발생했습니다.');
    }
}

// 로그아웃 처리
function handleLogout(skipConfirm = false) {
    // 제출 완료 모달 숨기기
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.classList.remove('active');
    }
    
    // skipConfirm이 true이면 확인 없이 바로 로그아웃 (모달에서 확인 버튼을 클릭한 경우)
    if (!skipConfirm && !confirm('로그아웃 하시겠습니까?')) {
        return;
    }
    
    localStorage.removeItem('secondRoundLoggedIn');
    currentApplicant = null;
    showLoginPage();
    
    if (document.getElementById('loginForm')) {
        document.getElementById('loginForm').reset();
    }
}

// 지원 현황 업데이트
function updateApplicationStatus(applicant) {
    const statusDiv = document.getElementById('applicationStatus');
    if (!statusDiv) return;
    
    const hasEvaluations = applicant.evaluations && applicant.evaluations.length > 0;
    const notificationSent = applicant.notification_sent;
    
    // 제출일 포맷팅
    let submitDate = '미입력';
    if (applicant.submit_date) {
        const date = new Date(applicant.submit_date);
        submitDate = date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } else if (applicant.submitDate) {
        // 하위 호환성
        submitDate = applicant.submitDate;
    }
    
    // 합격/불합격 상태
    let resultText = '';
    let resultStyle = '';
    if (notificationSent && applicant.status === 'passed') {
        resultText = '🎉 합격';
        resultStyle = 'color: #10b981; font-weight: 700; font-size: 16px;';
    } else if (notificationSent && applicant.status === 'failed') {
        resultText = '불합격';
        resultStyle = 'color: #ef4444; font-weight: 700;';
    } else if (applicant.status === 'passed' || applicant.status === 'failed') {
        resultText = '결과 확인 중';
        resultStyle = 'color: #f59e0b; font-weight: 600;';
    } else {
        resultText = hasEvaluations ? '심사중' : '평가대기';
        resultStyle = 'color: #64748b;';
    }

    statusDiv.innerHTML = `
        <p><strong>채용공고</strong> <span style="color: #6366f1; font-weight: 600;">${applicant.job_posting || '미선택'}</span></p>
        <p><strong>제출일</strong> <span>${submitDate}</span></p>
        <p><strong>평가결과</strong> <span style="${resultStyle}">${resultText}</span></p>
    `;
}

// 지원자 데이터 로드
async function loadApplicantData(email) {
    const applicant = await getApplicantByEmail(email);
    
    if (!applicant) {
        console.error('Applicant not found:', email);
        localStorage.removeItem('secondRoundLoggedIn');
        throw new Error('지원자 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
    }

    // 합격 여부 재확인
    if (applicant.status !== 'passed') {
        localStorage.removeItem('secondRoundLoggedIn');
        throw new Error('⚠️ 2차 서류전형은 합격하신 지원자만 접근할 수 있습니다.');
    }
    
    currentApplicant = applicant;

    const welcomeElement = document.getElementById('applicantWelcome');
    if (welcomeElement) {
        welcomeElement.textContent = `${applicant.name}님, 환영합니다!`;
    }

    // 지원 현황 업데이트
    updateApplicationStatus(applicant);

    // 질문지 로드
    await loadQuestions();
    
    // 기존 답변 로드
    await loadExistingResponse();
}

// 질문지 로드
async function loadQuestions() {
    try {
        // 안내문 로드 및 디자인 적용
        const intro = await getSecondRoundIntro();
        const introContainer = document.getElementById('introContainer');
        const introText = document.getElementById('introText');
        
        if (introContainer && introText) {
            let introContent = '';
            if (intro && intro.intro_text) {
                introContent = intro.intro_text;
            } else {
                introContent = '축하합니다! 1차 서류전형에 합격하셨습니다.\n\n2차 서류전형을 위해 아래 질문에 답변해주시기 바랍니다.';
            }
            
            // 이미지 디자인에 맞게 안내문 포맷팅 (관리자가 작성한 내용만 표시)
            introText.innerHTML = `
                <p style="margin: 0; color: #374151;">${introContent.replace(/\n/g, '<br>')}</p>
            `;
        }

        // 질문지 항목 로드
        const questions = await getAllSecondRoundQuestions();
        renderQuestions(questions);
    } catch (error) {
        console.error('Error loading questions:', error);
        const container = document.getElementById('questionsContainer');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: #ef4444;">
                    <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                    <p style="font-size: 16px;">질문지를 불러오는 중 오류가 발생했습니다.</p>
                    <p style="font-size: 14px; margin-top: 8px; color: #64748b;">페이지를 새로고침해주세요.</p>
                </div>
            `;
        }
    }
}

// 질문지 렌더링
function renderQuestions(questions) {
    const container = document.getElementById('questionsContainer');
    if (!container) return;

    if (!questions || questions.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #94a3b8;">
                <div style="font-size: 48px; margin-bottom: 16px;">📝</div>
                <p style="font-size: 16px;">현재 등록된 질문지가 없습니다.</p>
                <p style="font-size: 14px; margin-top: 8px; color: #64748b;">관리자에게 문의해주세요.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = questions.map((q, index) => {
        const questionId = `question_${q.id || index}`;
        // 질문 텍스트에서 줄바꿈 처리 (개행 문자를 <br>로 변환)
        const questionText = (q.question_text || '').replace(/\n/g, '<br>');
        // hint_text도 줄바꿈 처리
        const hintText = q.hint_text ? (q.hint_text.replace(/\n/g, '<br>')) : '';
        
        return `
            <div class="form-section" style="margin-bottom: 40px; padding: 28px; background: white; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
                <div class="form-field full-width">
                    <div style="margin-bottom: 16px;">
                        <div style="display: flex; align-items: start; gap: 12px; margin-bottom: 12px;">
                            <div style="min-width: 36px; height: 36px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; flex-shrink: 0;">
                                ${q.question_number}
                            </div>
                            <div style="flex: 1;">
                                <label for="${questionId}" style="display: block; font-size: 16px; font-weight: 600; color: #1f2937; line-height: 1.6; margin-bottom: 8px;">
                                    ${questionText}
                                    ${q.is_required ? '<span class="required" style="color: #ef4444; margin-left: 4px;">*</span>' : ''}
                                </label>
                                ${hintText ? `
                                <div style="margin-top: 12px; padding: 12px 16px; background: #f8fafc; border-left: 3px solid #10b981; border-radius: 6px;">
                                    <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.7; white-space: pre-wrap;">${hintText}</p>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    <textarea 
                        id="${questionId}"
                        data-question-id="${q.id}"
                        data-question-number="${q.question_number}"
                        rows="8"
                        style="width: 100%; padding: 16px; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 15px; font-family: inherit; resize: vertical; line-height: 1.6; transition: border-color 0.2s;"
                        placeholder="답변을 입력하세요"
                        ${q.is_required ? 'required' : ''}
                        onfocus="this.style.borderColor='#10b981'; this.style.boxShadow='0 0 0 3px rgba(16, 185, 129, 0.1)';"
                        onblur="this.style.borderColor='#e2e8f0'; this.style.boxShadow='none';"
                    ></textarea>
                </div>
            </div>
        `;
    }).join('');

    // 임시 저장 데이터 로드
    loadDraft();
}

// 기존 답변 로드
async function loadExistingResponse() {
    try {
        if (!currentApplicant || !currentApplicant.id) return;

        const existingResponse = await getSecondRoundResponseByApplicantId(currentApplicant.id);
        if (existingResponse && existingResponse.answers) {
            loadAnswers(existingResponse.answers);
        }
    } catch (error) {
        console.error('Error loading existing response:', error);
    }
}

// 답변 로드
function loadAnswers(answers) {
    if (!answers || typeof answers !== 'object') return;

    Object.keys(answers).forEach(questionNumber => {
        const textarea = document.querySelector(`[data-question-number="${questionNumber}"]`);
        if (textarea) {
            textarea.value = answers[questionNumber] || '';
        }
    });
}

// 답변 수집
function collectAnswers() {
    const answers = {};
    const textareas = document.querySelectorAll('#questionsContainer textarea[data-question-number]');
    
    textareas.forEach(textarea => {
        const questionNumber = textarea.getAttribute('data-question-number');
        if (questionNumber) {
            answers[questionNumber] = textarea.value.trim();
        }
    });
    
    return answers;
}

// 임시 저장 데이터 로드
function loadDraft() {
    try {
        const draft = localStorage.getItem('secondRoundDraft');
        if (draft) {
            const draftData = JSON.parse(draft);
            if (draftData.answers) {
                loadAnswers(draftData.answers);
            }
        }
    } catch (error) {
        console.error('Error loading draft:', error);
    }
}

// 임시 저장
function saveDraft() {
    try {
        const answers = collectAnswers();
        const draftData = {
            answers: answers,
            savedAt: new Date().toISOString()
        };
        localStorage.setItem('secondRoundDraft', JSON.stringify(draftData));
        
        // 저장 완료 메시지
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = '✅ 저장됨';
        btn.style.background = '#10b981';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 2000);
    } catch (error) {
        console.error('Error saving draft:', error);
        alert('임시 저장 중 오류가 발생했습니다.');
    }
}

// 제출 처리
async function handleSubmit(e) {
    e.preventDefault();

    if (!currentApplicant) {
        alert('로그인이 필요합니다.');
        return;
    }

    // 합격 여부 재확인
    const latestApplicant = await getApplicantByEmail(currentApplicant.email);
    if (!latestApplicant || latestApplicant.status !== 'passed') {
        alert('⚠️ 2차 서류전형은 합격하신 지원자만 접근할 수 있습니다.');
        return;
    }

    const answers = collectAnswers();
    
    // 필수 항목 확인
    const questions = await getAllSecondRoundQuestions();
    const requiredQuestions = questions.filter(q => q.is_required);
    for (const q of requiredQuestions) {
        const answer = answers[q.question_number];
        if (!answer || answer.trim() === '') {
            alert(`"${q.question_text}" 항목은 필수입니다. 답변을 입력해주세요.`);
            const textarea = document.querySelector(`[data-question-number="${q.question_number}"]`);
            if (textarea) {
                textarea.focus();
                textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }
    }

    if (Object.keys(answers).length === 0) {
        alert('답변을 입력해주세요.');
        return;
    }

    if (!confirm('2차 서류전형 질문지를 제출하시겠습니까?\n\n제출 후에는 수정할 수 없습니다.')) {
        return;
    }

    try {
        const responseData = {
            applicant_id: currentApplicant.id,
            applicant_name: currentApplicant.name,
            applicant_email: currentApplicant.email,
            answers: answers,
            submitted_at: new Date().toISOString()
        };

        await saveSecondRoundResponse(responseData);
        
        // 임시 저장 데이터 삭제
        localStorage.removeItem('secondRoundDraft');
        
        // 제출 완료 모달 표시
        const modal = document.getElementById('successModal');
        if (modal) {
            modal.classList.add('active');
        }
    } catch (error) {
        console.error('Submit error:', error);
        alert('제출 중 오류가 발생했습니다.\n\n' + (error.message || '알 수 없는 오류') + '\n\n다시 시도해주세요.');
    }
}

// 비밀번호 검증 함수 (db.js에서 가져오기)
function verifyPassword(inputPassword, storedPassword) {
    return inputPassword === storedPassword;
}
