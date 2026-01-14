// 전역 변수
let currentApplicant = null;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    setupEventListeners();
    loadDraft(); // 임시 저장 데이터 불러오기
    setupAutoSave(); // 자동 저장 설정
});

// 로그인 상태 확인
function checkLoginStatus() {
    const loggedInEmail = localStorage.getItem('loggedInApplicant');
    if (loggedInEmail) {
        loadApplicantData(loggedInEmail);
        showEditApplicationPage();
    } else {
        showWelcomePage();
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 로그인 폼
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // 신규 지원서 제출 폼
    const applyForm = document.getElementById('applyForm');
    if (applyForm) {
        applyForm.addEventListener('submit', handleSubmit);
    }

    // 지원서 수정 폼
    const editForm = document.getElementById('editForm');
    if (editForm) {
        editForm.addEventListener('submit', handleEdit);
    }

    // 글자 수 카운트 설정
    setupCharCount('selfIntroduction', 'charCount1', 800);
    setupCharCount('careerDescription', 'charCount2', 500);
    setupCharCount('motivation', 'charCount3', 500);
    setupCharCount('aspiration', 'charCount4', 500);

    // 전화번호 자동 포맷팅
    setupPhoneFormatting('phone');
}

// 글자 수 카운트 설정
function setupCharCount(textareaId, countId, maxLength) {
    const textarea = document.getElementById(textareaId);
    const counter = document.getElementById(countId);
    
    if (textarea && counter) {
        textarea.addEventListener('input', function() {
            const count = this.value.length;
            counter.textContent = `${count} / ${maxLength}자`;
            
            if (count >= maxLength) {
                counter.style.color = '#ef4444';
            } else if (count >= maxLength * 0.9) {
                counter.style.color = '#f59e0b';
            } else {
                counter.style.color = '#10b981';
            }
        });
    }
}

// 전화번호 자동 포맷팅 설정
function setupPhoneFormatting(inputId) {
    const phoneInput = document.getElementById(inputId);
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/[^0-9]/g, '');
            
            if (value.length <= 3) {
                e.target.value = value;
            } else if (value.length <= 7) {
                e.target.value = value.slice(0, 3) + '-' + value.slice(3);
            } else if (value.length <= 11) {
                e.target.value = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7);
            } else {
                e.target.value = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7, 11);
            }
        });
    }
}

// 페이지 전환 함수들
function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

function showWelcomePage() {
    showPage('welcomePage');
}

function showLoginPage() {
    showPage('loginPage');
}

function showNewApplicationPage() {
    showPage('newApplicationPage');
}

function showEditApplicationPage() {
    showPage('editApplicationPage');
}

// 로그인 처리
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    const applicants = JSON.parse(localStorage.getItem('applicants') || '[]');
    const applicant = applicants.find(a => a.email === email);

    if (!applicant) {
        alert('등록되지 않은 이메일입니다.');
        return;
    }

    if (applicant.password !== password) {
        alert('비밀번호가 올바르지 않습니다.');
        return;
    }

    localStorage.setItem('loggedInApplicant', email);
    currentApplicant = applicant;
    loadApplicantData(email);
    showEditApplicationPage();
}

// 로그아웃 처리
function handleLogout() {
    if (confirm('로그아웃 하시겠습니까?')) {
        localStorage.removeItem('loggedInApplicant');
        currentApplicant = null;
        showWelcomePage();
        
        if (document.getElementById('loginForm')) {
            document.getElementById('loginForm').reset();
        }
    }
}

// 지원자 데이터 로드
function loadApplicantData(email) {
    const applicants = JSON.parse(localStorage.getItem('applicants') || '[]');
    const applicant = applicants.find(a => a.email === email);
    
    if (!applicant) {
        alert('지원자 정보를 찾을 수 없습니다.');
        handleLogout();
        return;
    }

    currentApplicant = applicant;

    document.getElementById('applicantWelcome').textContent = `${applicant.name}님, 환영합니다!`;

    // 상태 배너 표시
    updateStatusBanner(applicant);

    // 지원 현황 표시
    updateApplicationStatus(applicant);

    // 수정 폼 생성
    createEditForm(applicant);
}

// 수정 폼 생성
function createEditForm(applicant) {
    const formContent = document.getElementById('editFormContent');
    const isDisabled = applicant.evaluations && applicant.evaluations.length > 0;

    formContent.innerHTML = `
        <!-- 기본 정보 섹션 -->
        <div class="form-section">
            <h2 class="section-title">
                <span class="section-number">01</span>
                기본 정보
            </h2>
            
            <div class="form-field full-width">
                <label for="editJobPosting">채용공고 <span class="required">*</span></label>
                <select id="editJobPosting" ${isDisabled ? 'disabled' : ''} required>
                    <option value="">선택하세요</option>
                    <option value="2026년 상반기 신입사원 공채" ${applicant.jobPosting === '2026년 상반기 신입사원 공채' ? 'selected' : ''}>2026년 상반기 신입사원 공채</option>
                    <option value="2026년 상반기 경력직 수시채용" ${applicant.jobPosting === '2026년 상반기 경력직 수시채용' ? 'selected' : ''}>2026년 상반기 경력직 수시채용</option>
                    <option value="2026년 인턴 채용" ${applicant.jobPosting === '2026년 인턴 채용' ? 'selected' : ''}>2026년 인턴 채용</option>
                    <option value="2026년 계약직 채용" ${applicant.jobPosting === '2026년 계약직 채용' ? 'selected' : ''}>2026년 계약직 채용</option>
                </select>
            </div>
            
            <div class="form-row">
                <div class="form-field">
                    <label for="editName">이름 <span class="required">*</span></label>
                    <input type="text" id="editName" value="${applicant.name}" ${isDisabled ? 'disabled' : ''} required>
                </div>
                
                <div class="form-field">
                    <label for="editBirthdate">생년월일 <span class="required">*</span></label>
                    <input type="date" id="editBirthdate" value="${applicant.birthdate}" ${isDisabled ? 'disabled' : ''} required>
                </div>
            </div>

            <div class="form-row">
                <div class="form-field">
                    <label for="editEmail">이메일 <span class="required">*</span></label>
                    <input type="email" id="editEmail" value="${applicant.email}" readonly>
                    <small class="field-hint">이메일은 변경할 수 없습니다</small>
                </div>

                <div class="form-field">
                    <label for="editPhone">연락처 <span class="required">*</span></label>
                    <input type="tel" id="editPhone" value="${applicant.phone}" ${isDisabled ? 'disabled' : ''} required>
                </div>
            </div>

            <div class="form-row">
                <div class="form-field">
                    <label for="editBranch">지원 지점 <span class="required">*</span></label>
                    <select id="editBranch" ${isDisabled ? 'disabled' : ''} required>
                        <option value="">선택하세요</option>
                        <option value="영등포점" ${applicant.branch === '영등포점' ? 'selected' : ''}>영등포점</option>
                        <option value="수원시청점" ${applicant.branch === '수원시청점' ? 'selected' : ''}>수원시청점</option>
                        <option value="천안아산점" ${applicant.branch === '천안아산점' ? 'selected' : ''}>천안아산점</option>
                        <option value="부산점" ${applicant.branch === '부산점' ? 'selected' : ''}>부산점</option>
                        <option value="수원인계점" ${applicant.branch === '수원인계점' ? 'selected' : ''}>수원인계점</option>
                        <option value="고양일산점" ${applicant.branch === '고양일산점' ? 'selected' : ''}>고양일산점</option>
                        <option value="청주점" ${applicant.branch === '청주점' ? 'selected' : ''}>청주점</option>
                    </select>
                </div>

                <div class="form-field">
                    <label for="editPosition">지원 직무 <span class="required">*</span></label>
                    <select id="editPosition" ${isDisabled ? 'disabled' : ''} required>
                        <option value="">선택하세요</option>
                        <option value="TAX팀" ${applicant.position === 'TAX팀' ? 'selected' : ''}>TAX팀</option>
                        <option value="원천팀" ${applicant.position === '원천팀' ? 'selected' : ''}>원천팀</option>
                        <option value="결산팀" ${applicant.position === '결산팀' ? 'selected' : ''}>결산팀</option>
                        <option value="경리팀" ${applicant.position === '경리팀' ? 'selected' : ''}>경리팀</option>
                    </select>
                </div>
            </div>

            <div class="form-field full-width">
                <label for="editAddress">주소 <span class="required">*</span></label>
                <input type="text" id="editAddress" value="${applicant.address}" ${isDisabled ? 'disabled' : ''} required>
            </div>

            <div class="form-field full-width">
                <label for="editEducation">학력사항 <span class="required">*</span></label>
                <textarea id="editEducation" rows="3" ${isDisabled ? 'disabled' : ''} required>${applicant.education}</textarea>
            </div>

            <div class="form-field full-width">
                <label for="editCertifications">자격 및 교육사항</label>
                <textarea id="editCertifications" rows="3" ${isDisabled ? 'disabled' : ''}>${applicant.certifications || ''}</textarea>
            </div>

            <div class="form-field full-width">
                <label for="editCareer">경력사항</label>
                <textarea id="editCareer" rows="4" ${isDisabled ? 'disabled' : ''}>${applicant.career || ''}</textarea>
            </div>
        </div>

        <!-- 자기소개서 섹션 -->
        <div class="form-section">
            <h2 class="section-title">
                <span class="section-number">02</span>
                자기소개서
            </h2>
            
            <div class="form-field full-width">
                <label for="editSelfIntroduction">
                    자기소개서 <span class="required">*</span>
                    <span class="char-count" id="editCharCount1">${applicant.selfIntroduction.length} / 800자</span>
                </label>
                <textarea 
                    id="editSelfIntroduction" 
                    rows="8" 
                    maxlength="800"
                    ${isDisabled ? 'disabled' : ''}
                    required
                >${applicant.selfIntroduction}</textarea>
            </div>
        </div>

        <!-- 경력기술서 섹션 -->
        <div class="form-section">
            <h2 class="section-title">
                <span class="section-number">03</span>
                경력기술서
            </h2>
            
            <div class="form-field full-width">
                <label for="editCareerDescription">
                    경력기술서 <span class="required">*</span>
                    <span class="char-count" id="editCharCount2">${applicant.careerDescription.length} / 500자</span>
                </label>
                <textarea 
                    id="editCareerDescription" 
                    rows="6" 
                    maxlength="500"
                    ${isDisabled ? 'disabled' : ''}
                    required
                >${applicant.careerDescription}</textarea>
            </div>
        </div>

        <!-- 지원동기 섹션 -->
        <div class="form-section">
            <h2 class="section-title">
                <span class="section-number">04</span>
                지원동기
            </h2>
            
            <div class="form-field full-width">
                <label for="editMotivation">
                    지원동기 <span class="required">*</span>
                    <span class="char-count" id="editCharCount3">${applicant.motivation.length} / 500자</span>
                </label>
                <textarea 
                    id="editMotivation" 
                    rows="6" 
                    maxlength="500"
                    ${isDisabled ? 'disabled' : ''}
                    required
                >${applicant.motivation}</textarea>
            </div>
        </div>

        <!-- 입사 후 포부 섹션 -->
        <div class="form-section">
            <h2 class="section-title">
                <span class="section-number">05</span>
                입사 후 포부
            </h2>
            
            <div class="form-field full-width">
                <label for="editAspiration">
                    입사 후 포부 <span class="required">*</span>
                    <span class="char-count" id="editCharCount4">${applicant.aspiration.length} / 500자</span>
                </label>
                <textarea 
                    id="editAspiration" 
                    rows="6" 
                    maxlength="500"
                    ${isDisabled ? 'disabled' : ''}
                    required
                >${applicant.aspiration}</textarea>
            </div>
        </div>

        <!-- 비밀번호 변경 섹션 -->
        <div class="form-section">
            <h2 class="section-title">
                <span class="section-number">06</span>
                비밀번호 변경 (선택)
            </h2>
            
            <div class="form-row">
                <div class="form-field">
                    <label for="newPassword">새 비밀번호</label>
                    <input type="password" id="newPassword" placeholder="변경하지 않으려면 비워두세요" minlength="8" ${isDisabled ? 'disabled' : ''}>
                </div>

                <div class="form-field">
                    <label for="newPasswordConfirm">새 비밀번호 확인</label>
                    <input type="password" id="newPasswordConfirm" placeholder="새 비밀번호 재입력" ${isDisabled ? 'disabled' : ''}>
                </div>
            </div>
        </div>
    `;

    // 글자 수 카운트 재설정
    if (!isDisabled) {
        setupCharCount('editSelfIntroduction', 'editCharCount1', 800);
        setupCharCount('editCareerDescription', 'editCharCount2', 500);
        setupCharCount('editMotivation', 'editCharCount3', 500);
        setupCharCount('editAspiration', 'editCharCount4', 500);
        setupPhoneFormatting('editPhone');
    }
}

// 상태 배너 업데이트
function updateStatusBanner(applicant) {
    const banner = document.getElementById('statusBanner');
    const hasEvaluations = applicant.evaluations && applicant.evaluations.length > 0;
    
    if (hasEvaluations) {
        banner.className = 'status-banner evaluated';
        banner.innerHTML = `
            <div class="status-info">
                <div class="status-icon">🔒</div>
                <div class="status-text">
                    <h4>평가 완료 - 수정 불가</h4>
                    <p>서류 전형이 완료되었습니다. (평가자 ${applicant.evaluations.length}명)</p>
                    <p style="margin-top: 8px; color: #ef4444; font-weight: 600; font-size: 15px;">
                        ⚠️ 평가가 완료되어 지원서를 수정할 수 없습니다.<br>
                        수정이 필요한 경우 담당자에게 문의하시기 바랍니다.
                    </p>
                </div>
            </div>
        `;
        
        // 수정 버튼 숨기고 취소 버튼을 "확인" 버튼으로 변경
        const submitBtn = document.querySelector('#editForm .btn-submit');
        const cancelBtn = document.querySelector('#editForm .btn-reset');
        
        if (submitBtn) {
            submitBtn.style.display = 'none';
        }
        
        if (cancelBtn) {
            cancelBtn.textContent = '확인';
            cancelBtn.onclick = function() { handleLogout(); };
        }
        
        // 폼 전체를 읽기 전용으로 표시
        const formContent = document.getElementById('editFormContent');
        if (formContent) {
            formContent.style.opacity = '0.7';
            formContent.style.pointerEvents = 'none';
        }
    } else {
        banner.className = 'status-banner pending';
        banner.innerHTML = `
            <div class="status-info">
                <div class="status-icon">✏️</div>
                <div class="status-text">
                    <h4>평가 대기 중 - 수정 가능</h4>
                    <p>서류 전형 중입니다. 평가가 완료되기 전까지 지원서를 자유롭게 수정할 수 있습니다.</p>
                    <p style="margin-top: 8px; color: #10b981; font-weight: 600;">
                        💡 평가 완료 후에는 수정이 불가능하니 신중하게 작성해주세요.
                    </p>
                </div>
            </div>
        `;
    }
}

// 지원 현황 업데이트
function updateApplicationStatus(applicant) {
    const statusDiv = document.getElementById('applicationStatus');
    const hasEvaluations = applicant.evaluations && applicant.evaluations.length > 0;
    
    statusDiv.innerHTML = `
        <p><strong>채용공고</strong> <span style="color: #6366f1; font-weight: 600;">${applicant.jobPosting || '미선택'}</span></p>
        <p><strong>제출일</strong> <span>${applicant.submitDate}</span></p>
        <p><strong>평가상태</strong> <span>${hasEvaluations ? '평가완료' : '평가대기'}</span></p>
        ${hasEvaluations ? `<p><strong>평가자 수</strong> <span>${applicant.evaluations.length}명</span></p>` : ''}
    `;
}

// 신규 지원서 제출 처리
function handleSubmit(e) {
    e.preventDefault();

    const formData = {
        jobPosting: document.getElementById('jobPosting').value,
        name: document.getElementById('name').value.trim(),
        birthdate: document.getElementById('birthdate').value,
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        branch: document.getElementById('branch').value,
        position: document.getElementById('position').value,
        password: document.getElementById('password').value,
        passwordConfirm: document.getElementById('passwordConfirm').value,
        address: document.getElementById('address').value.trim(),
        education: document.getElementById('education').value.trim(),
        certifications: document.getElementById('certifications').value.trim(),
        career: document.getElementById('career').value.trim(),
        selfIntroduction: document.getElementById('selfIntroduction').value.trim(),
        careerDescription: document.getElementById('careerDescription').value.trim(),
        motivation: document.getElementById('motivation').value.trim(),
        aspiration: document.getElementById('aspiration').value.trim()
    };

    if (!validateNewApplication(formData)) {
        return;
    }

    const applicants = JSON.parse(localStorage.getItem('applicants') || '[]');
    if (applicants.some(a => a.email === formData.email)) {
        alert('이미 등록된 이메일입니다. 로그인하여 지원서를 수정하세요.');
        return;
    }

    const application = {
        id: Date.now(),
        jobPosting: formData.jobPosting,
        name: formData.name,
        birthdate: formData.birthdate,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        branch: formData.branch,
        position: formData.position,
        address: formData.address,
        education: formData.education,
        certifications: formData.certifications,
        career: formData.career,
        selfIntroduction: formData.selfIntroduction,
        careerDescription: formData.careerDescription,
        motivation: formData.motivation,
        aspiration: formData.aspiration,
        submitDate: new Date().toISOString().split('T')[0],
        evaluation: null
    };

    applicants.push(application);
    localStorage.setItem('applicants', JSON.stringify(applicants));

    // 임시 저장 데이터 삭제
    localStorage.removeItem('applicationDraft');
    updateDraftInfo();

    // 제출 후 자동 로그인 및 지원서 확인 페이지로 이동
    currentApplicant = application;
    
    alert('✅ 지원서 제출 완료\n\n입사지원서가 성공적으로 제출되었습니다.\n제출하신 내용을 확인하실 수 있습니다.');
    
    // 지원서 수정 페이지로 이동
    loadApplicantData(application.email);
}

// 지원서 수정 처리
function handleEdit(e) {
    e.preventDefault();

    // 평가 완료 여부 재확인
    if (!currentApplicant) {
        alert('로그인이 필요합니다.');
        handleLogout();
        return;
    }
    
    // LocalStorage에서 최신 데이터 확인 (다른 탭에서 평가되었을 수 있음)
    const applicants = JSON.parse(localStorage.getItem('applicants') || '[]');
    const latestApplicant = applicants.find(a => a.email === currentApplicant.email);
    
    if (!latestApplicant) {
        alert('지원자 정보를 찾을 수 없습니다.');
        handleLogout();
        return;
    }
    
    // evaluations 배열 확인으로 변경
    if (latestApplicant.evaluations && latestApplicant.evaluations.length > 0) {
        alert('⚠️ 평가가 완료된 지원서는 수정할 수 없습니다.\n\n평가자 수: ' + latestApplicant.evaluations.length + '명\n\n수정이 필요한 경우 담당자에게 문의하시기 바랍니다.');
        // 최신 데이터로 화면 갱신
        currentApplicant = latestApplicant;
        loadApplicantData(currentApplicant.email);
        return;
    }

    const formData = {
        jobPosting: document.getElementById('editJobPosting').value,
        name: document.getElementById('editName').value.trim(),
        birthdate: document.getElementById('editBirthdate').value,
        phone: document.getElementById('editPhone').value.trim(),
        branch: document.getElementById('editBranch').value,
        position: document.getElementById('editPosition').value,
        address: document.getElementById('editAddress').value.trim(),
        education: document.getElementById('editEducation').value.trim(),
        certifications: document.getElementById('editCertifications').value.trim(),
        career: document.getElementById('editCareer').value.trim(),
        selfIntroduction: document.getElementById('editSelfIntroduction').value.trim(),
        careerDescription: document.getElementById('editCareerDescription').value.trim(),
        motivation: document.getElementById('editMotivation').value.trim(),
        aspiration: document.getElementById('editAspiration').value.trim(),
        newPassword: document.getElementById('newPassword').value,
        newPasswordConfirm: document.getElementById('newPasswordConfirm').value
    };

    if (!validateEditApplication(formData)) {
        return;
    }

    const index = applicants.findIndex(a => a.email === currentApplicant.email);
    
    if (index === -1) {
        alert('지원자 정보를 찾을 수 없습니다.');
        return;
    }
    
    // 저장 직전 한번 더 평가 여부 확인
    if (applicants[index].evaluations && applicants[index].evaluations.length > 0) {
        alert('⚠️ 다른 곳에서 평가가 완료되어 수정할 수 없습니다.');
        currentApplicant = applicants[index];
        loadApplicantData(currentApplicant.email);
        return;
    }

    applicants[index].jobPosting = formData.jobPosting;
    applicants[index].name = formData.name;
    applicants[index].birthdate = formData.birthdate;
    applicants[index].phone = formData.phone;
    applicants[index].branch = formData.branch;
    applicants[index].position = formData.position;
    applicants[index].address = formData.address;
    applicants[index].education = formData.education;
    applicants[index].certifications = formData.certifications;
    applicants[index].career = formData.career;
    applicants[index].selfIntroduction = formData.selfIntroduction;
    applicants[index].careerDescription = formData.careerDescription;
    applicants[index].motivation = formData.motivation;
    applicants[index].aspiration = formData.aspiration;

    if (formData.newPassword) {
        applicants[index].password = formData.newPassword;
    }

    localStorage.setItem('applicants', JSON.stringify(applicants));
    currentApplicant = applicants[index];

    showSuccessModal(
        '수정 완료',
        '지원서가 성공적으로 수정되었습니다.',
        '변경사항이 저장되었습니다.'
    );

    document.getElementById('newPassword').value = '';
    document.getElementById('newPasswordConfirm').value = '';
}

// 신규 지원서 유효성 검사
function validateNewApplication(data) {
    if (!data.jobPosting) {
        alert('채용공고를 선택해주세요.');
        return false;
    }

    if (data.name.length < 2) {
        alert('이름을 올바르게 입력해주세요.');
        return false;
    }

    if (!data.birthdate) {
        alert('생년월일을 입력해주세요.');
        return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        alert('이메일 주소를 올바르게 입력해주세요.');
        return false;
    }

    if (data.password.length < 8) {
        alert('비밀번호는 8자 이상 입력해주세요.');
        return false;
    }

    if (data.password !== data.passwordConfirm) {
        alert('비밀번호가 일치하지 않습니다.');
        return false;
    }

    const phoneRegex = /^\d{3}-\d{3,4}-\d{4}$/;
    if (!phoneRegex.test(data.phone)) {
        alert('연락처를 올바른 형식으로 입력해주세요. (예: 010-1234-5678)');
        return false;
    }

    if (!document.getElementById('privacy').checked) {
        alert('개인정보 수집 및 이용에 동의해주세요.');
        return false;
    }

    return true;
}

// 지원서 수정 유효성 검사
function validateEditApplication(data) {
    if (data.name.length < 2) {
        alert('이름을 올바르게 입력해주세요.');
        return false;
    }

    const phoneRegex = /^\d{3}-\d{3,4}-\d{4}$/;
    if (!phoneRegex.test(data.phone)) {
        alert('연락처를 올바른 형식으로 입력해주세요.');
        return false;
    }

    if (data.newPassword || data.newPasswordConfirm) {
        if (data.newPassword.length < 8) {
            alert('새 비밀번호는 8자 이상 입력해주세요.');
            return false;
        }

        if (data.newPassword !== data.newPasswordConfirm) {
            alert('새 비밀번호가 일치하지 않습니다.');
            return false;
        }
    }

    return true;
}

// 성공 모달 표시
function showSuccessModal(title, message, detail) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').textContent = message;
    document.getElementById('modalDetail').textContent = detail;
    
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.classList.add('active');
    }
}

// 성공 모달 닫기
function closeSuccessModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.classList.remove('active');
    }
    window.scrollTo(0, 0);
}

// 임시 저장 기능
function saveDraft() {
    const draft = {
        jobPosting: document.getElementById('jobPosting').value,
        name: document.getElementById('name').value,
        birthdate: document.getElementById('birthdate').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        branch: document.getElementById('branch').value,
        position: document.getElementById('position').value,
        password: document.getElementById('password').value,
        passwordConfirm: document.getElementById('passwordConfirm').value,
        address: document.getElementById('address').value,
        education: document.getElementById('education').value,
        certifications: document.getElementById('certifications').value,
        career: document.getElementById('career').value,
        selfIntroduction: document.getElementById('selfIntroduction').value,
        careerDescription: document.getElementById('careerDescription').value,
        motivation: document.getElementById('motivation').value,
        aspiration: document.getElementById('aspiration').value,
        savedAt: new Date().toISOString()
    };

    localStorage.setItem('applicationDraft', JSON.stringify(draft));
    
    // 저장 알림 표시
    showSaveNotification();
    
    // 사이드바 정보 업데이트
    updateDraftInfo();
}

// 임시 저장 데이터 불러오기
function loadDraft() {
    const draftJson = localStorage.getItem('applicationDraft');
    if (!draftJson) return;

    const draft = JSON.parse(draftJson);
    
    // 폼이 비어있을 때만 복원 (이미 입력한 내용이 있으면 물어봄)
    const nameInput = document.getElementById('name');
    if (nameInput && nameInput.value) {
        // 이미 입력된 내용이 있으면 물어보지 않고 그냥 사이드바에만 표시
        updateDraftInfo();
        return;
    }

    if (confirm('작성 중이던 지원서가 있습니다.\n임시 저장된 내용을 불러오시겠습니까?')) {
        // 폼에 데이터 채우기
        document.getElementById('jobPosting').value = draft.jobPosting || '';
        document.getElementById('name').value = draft.name || '';
        document.getElementById('birthdate').value = draft.birthdate || '';
        document.getElementById('email').value = draft.email || '';
        document.getElementById('phone').value = draft.phone || '';
        document.getElementById('branch').value = draft.branch || '';
        document.getElementById('position').value = draft.position || '';
        document.getElementById('password').value = draft.password || '';
        document.getElementById('passwordConfirm').value = draft.passwordConfirm || '';
        document.getElementById('address').value = draft.address || '';
        document.getElementById('education').value = draft.education || '';
        document.getElementById('certifications').value = draft.certifications || '';
        document.getElementById('career').value = draft.career || '';
        document.getElementById('selfIntroduction').value = draft.selfIntroduction || '';
        document.getElementById('careerDescription').value = draft.careerDescription || '';
        document.getElementById('motivation').value = draft.motivation || '';
        document.getElementById('aspiration').value = draft.aspiration || '';

        // 글자 수 업데이트
        const event = new Event('input');
        document.getElementById('selfIntroduction').dispatchEvent(event);
        document.getElementById('careerDescription').dispatchEvent(event);
        document.getElementById('motivation').dispatchEvent(event);
        document.getElementById('aspiration').dispatchEvent(event);
    }
    
    updateDraftInfo();
}

// 임시 저장 정보 업데이트
function updateDraftInfo() {
    const draftJson = localStorage.getItem('applicationDraft');
    const draftInfo = document.getElementById('draftInfo');
    const draftTime = document.getElementById('draftTime');
    
    if (draftJson && draftInfo && draftTime) {
        const draft = JSON.parse(draftJson);
        const savedDate = new Date(draft.savedAt);
        const now = new Date();
        const diffMinutes = Math.floor((now - savedDate) / 1000 / 60);
        
        let timeText;
        if (diffMinutes < 1) {
            timeText = '방금 전';
        } else if (diffMinutes < 60) {
            timeText = `${diffMinutes}분 전`;
        } else if (diffMinutes < 1440) {
            const hours = Math.floor(diffMinutes / 60);
            timeText = `${hours}시간 전`;
        } else {
            timeText = savedDate.toLocaleString('ko-KR');
        }
        
        draftTime.textContent = timeText;
        draftInfo.style.display = 'block';
    } else if (draftInfo) {
        draftInfo.style.display = 'none';
    }
}

// 임시 저장 삭제
function clearDraft() {
    if (confirm('임시 저장된 내용을 삭제하시겠습니까?\n(현재 작성 중인 내용은 유지됩니다)')) {
        localStorage.removeItem('applicationDraft');
        const draftInfo = document.getElementById('draftInfo');
        if (draftInfo) {
            draftInfo.style.display = 'none';
        }
        alert('임시 저장된 내용이 삭제되었습니다.');
    }
}

// 저장 알림 표시
function showSaveNotification() {
    const notification = document.getElementById('saveNotification');
    if (notification) {
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 2000);
    }
}

// 초기화 확인
function confirmReset(event) {
    event.preventDefault();
    if (confirm('작성 중인 내용을 모두 지우시겠습니까?\n임시 저장된 내용도 함께 삭제됩니다.')) {
        localStorage.removeItem('applicationDraft');
        document.getElementById('applyForm').reset();
        updateDraftInfo();
    }
}

// 자동 저장 설정 (3분마다)
let autoSaveTimer = null;
function setupAutoSave() {
    const form = document.getElementById('applyForm');
    if (!form) return;

    // 폼 입력 시 자동 저장 타이머 설정
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            // 기존 타이머 취소
            if (autoSaveTimer) {
                clearTimeout(autoSaveTimer);
            }
            
            // 3분 후 자동 저장
            autoSaveTimer = setTimeout(() => {
                const nameInput = document.getElementById('name');
                const emailInput = document.getElementById('email');
                
                // 이름이나 이메일이 입력되어 있으면 자동 저장
                if (nameInput && nameInput.value.trim() || emailInput && emailInput.value.trim()) {
                    saveDraftQuietly();
                }
            }, 180000); // 3분 = 180000ms
        });
    });
}

// 조용히 저장 (알림 없이)
function saveDraftQuietly() {
    const draft = {
        jobPosting: document.getElementById('jobPosting').value,
        name: document.getElementById('name').value,
        birthdate: document.getElementById('birthdate').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        branch: document.getElementById('branch').value,
        position: document.getElementById('position').value,
        password: document.getElementById('password').value,
        passwordConfirm: document.getElementById('passwordConfirm').value,
        address: document.getElementById('address').value,
        education: document.getElementById('education').value,
        certifications: document.getElementById('certifications').value,
        career: document.getElementById('career').value,
        selfIntroduction: document.getElementById('selfIntroduction').value,
        careerDescription: document.getElementById('careerDescription').value,
        motivation: document.getElementById('motivation').value,
        aspiration: document.getElementById('aspiration').value,
        savedAt: new Date().toISOString()
    };

    localStorage.setItem('applicationDraft', JSON.stringify(draft));
    updateDraftInfo();
}
