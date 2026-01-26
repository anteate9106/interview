// 전역 변수
let currentApplicant = null;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
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
            // 설문 항목 채우기
            for (let i = 1; i <= 8; i++) {
                const field = document.getElementById(`q${i}`);
                if (field && survey[`q${i}`]) {
                    field.value = survey[`q${i}`];
                }
            }
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
    const requiredFields = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7'];
    for (const fieldId of requiredFields) {
        const field = document.getElementById(fieldId);
        if (!field || !field.value.trim()) {
            alert(`${field.previousElementSibling.textContent.replace('*', '').trim()} 항목을 작성해주세요.`);
            field.focus();
            return;
        }
    }

    // 제출 확인
    if (!confirm('설문조사를 제출하시겠습니까?\n제출 후에는 수정이 불가능합니다.')) {
        return;
    }

    try {
        // 설문 데이터 수집
        const surveyData = {
            applicant_id: currentApplicant.id,
            applicant_name: currentApplicant.name,
            applicant_email: currentApplicant.email,
            q1: document.getElementById('q1').value.trim(),
            q2: document.getElementById('q2').value.trim(),
            q3: document.getElementById('q3').value.trim(),
            q4: document.getElementById('q4').value.trim(),
            q5: document.getElementById('q5').value.trim(),
            q6: document.getElementById('q6').value.trim(),
            q7: document.getElementById('q7').value.trim(),
            q8: document.getElementById('q8').value.trim() || null,
            submitted_at: new Date().toISOString()
        };

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
