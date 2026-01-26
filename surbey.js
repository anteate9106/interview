// 전역 변수
let currentApplicant = null;
let surveyQuestions = [];

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', async function() {
    setupEventListeners();
    await loadSurveyQuestions();
    checkLoginStatus();
});

// 이벤트 리스너 설정
function setupEventListeners() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const surveyForm = document.getElementById('surveyForm');
    if (surveyForm) {
        surveyForm.addEventListener('submit', handleSurveySubmit);
    }
}

// 로그인 상태 확인
async function checkLoginStatus() {
    const loggedInEmail = localStorage.getItem('surveyLoggedInEmail');
    if (loggedInEmail) {
        await loadApplicantData(loggedInEmail);
        showSurveyPage();
    }
}

// 로그인 처리
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        alert('이메일과 비밀번호를 입력해주세요.');
        return;
    }

    try {
        // 지원자 정보 가져오기
        const applicant = await getApplicantByEmail(email);
        
        if (!applicant) {
            alert('등록된 지원자 정보가 없습니다.');
            return;
        }

        // 비밀번호 확인
        if (applicant.password !== password) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }

        // 합격 여부 확인
        if (applicant.status !== 'passed') {
            alert('1차 서류전형 합격자만 설문조사에 참여할 수 있습니다.');
            return;
        }

        // 결과 통보 여부 확인
        if (!applicant.notification_sent) {
            alert('아직 결과 통보가 완료되지 않았습니다. 잠시 후 다시 시도해주세요.');
            return;
        }

        // 로그인 성공
        currentApplicant = applicant;
        localStorage.setItem('surveyLoggedInEmail', email);
        
        await loadApplicantData(email);
        showSurveyPage();
        
    } catch (error) {
        console.error('Login error:', error);
        alert('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
}

// 설문조사 항목 로드
async function loadSurveyQuestions() {
    try {
        surveyQuestions = await getAllSurveyQuestions();
        renderSurveyQuestions();
        
        // 안내문도 함께 로드
        await loadSurveyIntro();
    } catch (error) {
        console.error('Error loading survey questions:', error);
    }
}

// URL을 링크로 변환하는 함수
function convertUrlsToLinks(text) {
    if (!text) return '';
    
    // URL 패턴 매칭 (http://, https://, www.로 시작하는 URL)
    const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
    
    return text.replace(urlPattern, (url) => {
        // www.로 시작하는 경우 http:// 추가
        let href = url;
        if (url.startsWith('www.')) {
            href = 'http://' + url;
        }
        return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="color: #6366f1; text-decoration: underline;">${url}</a>`;
    });
}

// 줄바꿈을 <br>로 변환
function convertNewlinesToBreaks(text) {
    return text.replace(/\n/g, '<br>');
}

// 설문조사 안내문 로드
async function loadSurveyIntro() {
    try {
        const intro = await getSurveyIntro();
        const introSection = document.getElementById('surveyIntroText');
        if (introSection && intro && intro.intro_text) {
            let introText = intro.intro_text;
            // 줄바꿈 변환
            introText = convertNewlinesToBreaks(introText);
            // URL을 링크로 변환
            introText = convertUrlsToLinks(introText);
            introSection.innerHTML = introText;
        } else if (introSection) {
            introSection.innerHTML = '1차 서류전형에 합격하신 것을 진심으로 축하드립니다.<br><br>다음 단계로 설문조사를 진행해주시기 바랍니다.';
        }
    } catch (error) {
        console.error('Error loading survey intro:', error);
    }
}

// 설문조사 항목 렌더링
function renderSurveyQuestions() {
    const container = document.getElementById('surveyQuestionsContainer');
    if (!container) return;

    if (surveyQuestions.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #94a3b8; padding: 40px;">설문조사 항목이 없습니다.</p>';
        return;
    }

    container.innerHTML = surveyQuestions.map((q, index) => `
        <div class="form-field full-width">
            <label for="q${q.question_number}">
                ${q.question_number}. ${q.question_text}
                ${q.is_required ? '<span class="required">*</span>' : ''}
            </label>
            <textarea id="q${q.question_number}" name="q${q.question_number}" rows="5" 
                placeholder="${q.question_text}" 
                ${q.is_required ? 'required' : ''}></textarea>
        </div>
    `).join('');
}

// 지원자 데이터 로드
async function loadApplicantData(email) {
    try {
        const applicant = await getApplicantByEmail(email);
        if (applicant) {
            currentApplicant = applicant;
            
            // 인적사항 표시
            document.getElementById('applicantName').value = applicant.name || '';
            document.getElementById('applicantEmail').value = applicant.email || '';
            
            // 환영 메시지
            document.getElementById('welcomeText').textContent = `${applicant.name}님, 환영합니다!`;
            
            // 기존 설문 데이터가 있으면 불러오기
            await loadSurveyData(applicant.id);
        }
    } catch (error) {
        console.error('Error loading applicant data:', error);
    }
}

// 설문 데이터 불러오기
async function loadSurveyData(applicantId) {
    try {
        const survey = await getSurveyByApplicantId(applicantId);
        if (survey) {
            // 설문 항목 채우기 (동적으로 생성된 필드에 맞춰서)
            surveyQuestions.forEach(q => {
                const field = document.getElementById(`q${q.question_number}`);
                if (field && survey[`q${q.question_number}`]) {
                    field.value = survey[`q${q.question_number}`];
                }
            });
        }
    } catch (error) {
        console.error('Error loading survey data:', error);
    }
}

// 설문 제출 처리
async function handleSurveySubmit(e) {
    e.preventDefault();

    if (!currentApplicant) {
        alert('로그인이 필요합니다.');
        return;
    }

    // 필수 항목 확인
    const requiredQuestions = surveyQuestions.filter(q => q.is_required);
    for (const q of requiredQuestions) {
        const field = document.getElementById(`q${q.question_number}`);
        if (!field || !field.value.trim()) {
            alert(`${q.question_number}. ${q.question_text} 항목을 작성해주세요.`);
            if (field) field.focus();
            return;
        }
    }

    // 제출 확인
    if (!confirm('설문조사를 제출하시겠습니까?\n제출 후에는 수정이 불가능합니다.')) {
        return;
    }

    try {
        // 설문 데이터 수집 (동적으로 생성된 필드에서)
        const surveyData = {
            applicant_id: currentApplicant.id,
            applicant_name: currentApplicant.name,
            applicant_email: currentApplicant.email,
            submitted_at: new Date().toISOString()
        };
        
        // 각 설문 항목의 답변 수집
        surveyQuestions.forEach(q => {
            const field = document.getElementById(`q${q.question_number}`);
            if (field) {
                surveyData[`q${q.question_number}`] = field.value.trim() || null;
            }
        });

        // 설문 데이터 저장
        await saveSurvey(surveyData);

        alert('✅ 설문조사가 성공적으로 제출되었습니다.\n\n다음 단계인 DiSC 검사 안내는 별도로 연락드리겠습니다.');
        
        // 폼 비활성화
        const form = document.getElementById('surveyForm');
        const inputs = form.querySelectorAll('input, textarea, button');
        inputs.forEach(input => {
            input.disabled = true;
            if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {
                input.style.background = '#f3f4f6';
            }
        });

    } catch (error) {
        console.error('Survey submit error:', error);
        alert('설문조사 제출 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
}

// 페이지 표시 함수
function showSurveyPage() {
    document.getElementById('loginPage').classList.remove('active');
    document.getElementById('surveyPage').classList.add('active');
}

// 로그아웃
function handleLogout() {
    localStorage.removeItem('surveyLoggedInEmail');
    currentApplicant = null;
    document.getElementById('loginPage').classList.add('active');
    document.getElementById('surveyPage').classList.remove('active');
    document.getElementById('loginForm').reset();
}
