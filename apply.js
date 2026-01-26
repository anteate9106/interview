// 전역 변수
let currentApplicant = null;
let applicationGuide = null;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', async function() {
    await loadApplicationGuide(); // 작성 안내 로드
    await loadJobPostingOptions(); // 채용공고 옵션 로드
    await loadContactInfo(); // 문의 정보 로드
    checkLoginStatus();
    setupEventListeners();
    loadDraft(); // 임시 저장 데이터 불러오기
    setupAutoSave(); // 자동 저장 설정
});

// 로그인 상태 확인
async function checkLoginStatus() {
    const loggedInEmail = localStorage.getItem('loggedInApplicant');
    if (loggedInEmail) {
        await loadApplicantData(loggedInEmail);
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

    // 작성 안내가 로드된 후 글자 수 카운트 설정
    if (applicationGuide) {
        setupCharCountsFromGuide();
    } else {
        // 기본값으로 설정 (fallback)
        setupCharCount('selfIntroduction', 'charCount1', 2000);
        setupCharCount('careerDescription', 'charCount2', 2000);
        setupCharCount('motivation', 'charCount3', 2000);
        setupCharCount('aspiration', 'charCount4', 2000);
    }

    // 전화번호 자동 포맷팅
    setupPhoneFormatting('phone');
}

// 채용공고 옵션 로드
async function loadJobPostingOptions() {
    try {
        const postings = await getAllJobPostings();
        const select = document.getElementById('jobPosting');
        if (select) {
            // 기존 옵션 제거 (첫 번째 옵션 제외)
            while (select.options.length > 1) {
                select.remove(1);
            }
            
            // 새 옵션 추가
            postings.forEach(posting => {
                const option = document.createElement('option');
                option.value = posting.title;
                option.textContent = posting.title;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading job posting options:', error);
        // 에러 시 기본값 유지
    }
}

// 작성 안내 로드
async function loadApplicationGuide() {
    try {
        applicationGuide = await getApplicationGuide();
        renderApplicationGuide();
        updateFormFieldsFromGuide();
    } catch (error) {
        console.error('Error loading application guide:', error);
        // 기본값 사용
        applicationGuide = {
            guide_items: [
                '모든 필수 항목(*)을 입력해주세요',
                '각 항목의 글자 수를 확인하세요',
                '비밀번호는 8자 이상 입력해주세요',
                '**💾 임시 저장**으로 작성 중 저장',
                '제출 후 로그인하여 수정 가능합니다'
            ],
            writing_items: [
                { name: '자기소개서', limit: 2000 },
                { name: '경력기술서', limit: 2000 },
                { name: '지원동기', limit: 2000 },
                { name: '입사 후 포부', limit: 2000 }
            ]
        };
        renderApplicationGuide();
    }
}

// 작성 안내 렌더링
function renderApplicationGuide() {
    if (!applicationGuide) return;

    // 작성 안내 항목 렌더링
    const guideList = document.getElementById('guideItemsList');
    if (guideList) {
        guideList.innerHTML = '';
        applicationGuide.guide_items.forEach(item => {
            const li = document.createElement('li');
            // **텍스트** 형식을 <strong>로 변환
            let html = item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            // 💾 같은 이모지가 있으면 그대로 유지
            li.innerHTML = html;
            guideList.appendChild(li);
        });
    }

    // 작성 항목 렌더링
    const writingList = document.getElementById('writingItemsList');
    if (writingList) {
        writingList.innerHTML = '';
        applicationGuide.writing_items.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item.name;
            writingList.appendChild(li);
        });
    }
}

// 문의 정보 로드
async function loadContactInfo() {
    try {
        const contactInfo = await getContactInfo();
        renderContactInfo(contactInfo);
    } catch (error) {
        console.error('Error loading contact info:', error);
        // 기본값 사용
        renderContactInfo({
            title: '채용 관련 문의사항이 있으시면',
            email: 'recruit@company.com',
            description: '으로 연락 주시기 바랍니다.'
        });
    }
}

// 문의 정보 렌더링 (자유형식)
function renderContactInfo(contactInfo) {
    const contactContent = document.getElementById('contactContent');
    if (contactContent && contactInfo) {
        // description에 전체 텍스트가 저장되어 있으면 그대로 표시
        if (contactInfo.description && contactInfo.description.trim().length > 0) {
            // 줄바꿈을 <br>로 변환하여 표시
            const formattedText = contactInfo.description
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0)
                .map(line => `<p>${line}</p>`)
                .join('');
            contactContent.innerHTML = formattedText || '<p>문의 내용이 없습니다.</p>';
        } else if (contactInfo.title || contactInfo.email) {
            // 기존 형식 호환성 (title, email이 있는 경우)
            contactContent.innerHTML = `
                <p>${contactInfo.title || ''}</p>
                <p><strong>${contactInfo.email || ''}</strong></p>
                <p>${contactInfo.description || ''}</p>
            `;
        } else {
            // 기본값
            contactContent.innerHTML = `
                <p>채용 관련 문의사항이 있으시면</p>
                <p><strong>recruit@company.com</strong></p>
                <p>으로 연락 주시기 바랍니다.</p>
            `;
        }
    }
}

// 작성 안내 데이터로 폼 필드 업데이트
function updateFormFieldsFromGuide() {
    if (!applicationGuide || !applicationGuide.writing_items) return;

    const fieldMapping = {
        '자기소개서': { textarea: 'selfIntroduction', count: 'charCount1', label: 'selfIntroduction' },
        '경력기술서': { textarea: 'careerDescription', count: 'charCount2', label: 'careerDescription' },
        '지원동기': { textarea: 'motivation', count: 'charCount3', label: 'motivation' },
        '입사 후 포부': { textarea: 'aspiration', count: 'charCount4', label: 'aspiration' }
    };

    applicationGuide.writing_items.forEach((item, index) => {
        const mapping = fieldMapping[item.name];
        if (mapping) {
            const textarea = document.getElementById(mapping.textarea);
            const counter = document.getElementById(mapping.count);
            const label = document.querySelector(`label[for="${mapping.label}"]`);
            
            if (textarea) {
                textarea.setAttribute('maxlength', item.limit);
            }
            if (counter) {
                counter.textContent = `0 / ${item.limit}자`;
            }
            if (label) {
                const labelText = label.querySelector('span.required') 
                    ? `${item.name} <span class="required">*</span>`
                    : item.name;
                label.innerHTML = labelText + (counter ? ` <span class="char-count" id="${mapping.count}">0 / ${item.limit}자</span>` : '');
            }
        }
    });
}

// 작성 안내 데이터로 글자 수 카운트 설정
function setupCharCountsFromGuide() {
    if (!applicationGuide || !applicationGuide.writing_items) return;

    const fieldMapping = {
        '자기소개서': { textarea: 'selfIntroduction', count: 'charCount1' },
        '경력기술서': { textarea: 'careerDescription', count: 'charCount2' },
        '지원동기': { textarea: 'motivation', count: 'charCount3' },
        '입사 후 포부': { textarea: 'aspiration', count: 'charCount4' }
    };

    applicationGuide.writing_items.forEach(item => {
        const mapping = fieldMapping[item.name];
        if (mapping) {
            setupCharCount(mapping.textarea, mapping.count, item.limit);
        }
    });
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
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
        const applicant = await getApplicantByEmail(email);

        if (!applicant) {
            alert('등록되지 않은 이메일입니다.');
            return;
        }

        if (!verifyPassword(password, applicant.password)) {
            alert('비밀번호가 올바르지 않습니다.');
            return;
        }

        localStorage.setItem('loggedInApplicant', email);
        currentApplicant = applicant;
        await loadApplicantData(email);
        showEditApplicationPage();
    } catch (error) {
        console.error('Login error:', error);
        alert('로그인 중 오류가 발생했습니다.');
    }
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
async function loadApplicantData(email) {
    try {
        const applicant = await getApplicantByEmail(email);
        
        if (!applicant) {
            console.error('Applicant not found:', email);
            alert('지원자 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
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
    } catch (error) {
        console.error('Error loading applicant data:', error);
        alert('지원자 정보를 불러오는 중 오류가 발생했습니다.\n' + error.message);
    }
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
                    <option value="2026년 상반기 신입사원 공채" ${applicant.job_posting === '2026년 상반기 신입사원 공채' ? 'selected' : ''}>2026년 상반기 신입사원 공채</option>
                    <option value="2026년 상반기 경력직 수시채용" ${applicant.job_posting === '2026년 상반기 경력직 수시채용' ? 'selected' : ''}>2026년 상반기 경력직 수시채용</option>
                    <option value="2026년 인턴 채용" ${applicant.job_posting === '2026년 인턴 채용' ? 'selected' : ''}>2026년 인턴 채용</option>
                    <option value="2026년 계약직 채용" ${applicant.job_posting === '2026년 계약직 채용' ? 'selected' : ''}>2026년 계약직 채용</option>
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
                    ${getWritingItemName('자기소개서')} <span class="required">*</span>
                    <span class="char-count" id="editCharCount1">${(applicant.self_introduction || '').length} / ${getWritingItemLimit('자기소개서')}자</span>
                </label>
                <textarea 
                    id="editSelfIntroduction" 
                    rows="8" 
                    maxlength="${getWritingItemLimit('자기소개서')}"
                    ${isDisabled ? 'disabled' : ''}
                    required
                >${applicant.self_introduction || ''}</textarea>
            </div>
        </div>

        <!-- 경력기술서 섹션 -->
        <div class="form-section">
            <h2 class="section-title">
                <span class="section-number">03</span>
                ${getWritingItemName('경력기술서')}
            </h2>
            
            <div class="form-field full-width">
                <label for="editCareerDescription">
                    ${getWritingItemName('경력기술서')} <span class="required">*</span>
                    <span class="char-count" id="editCharCount2">${(applicant.career_description || '').length} / ${getWritingItemLimit('경력기술서')}자</span>
                </label>
                <textarea 
                    id="editCareerDescription" 
                    rows="6" 
                    maxlength="${getWritingItemLimit('경력기술서')}"
                    ${isDisabled ? 'disabled' : ''}
                    required
                >${applicant.career_description || ''}</textarea>
            </div>
        </div>

        <!-- 지원동기 섹션 -->
        <div class="form-section">
            <h2 class="section-title">
                <span class="section-number">04</span>
                ${getWritingItemName('지원동기')}
            </h2>
            
            <div class="form-field full-width">
                <label for="editMotivation">
                    ${getWritingItemName('지원동기')} <span class="required">*</span>
                    <span class="char-count" id="editCharCount3">${(applicant.motivation || '').length} / ${getWritingItemLimit('지원동기')}자</span>
                </label>
                <textarea 
                    id="editMotivation" 
                    rows="6" 
                    maxlength="${getWritingItemLimit('지원동기')}"
                    ${isDisabled ? 'disabled' : ''}
                    required
                >${applicant.motivation || ''}</textarea>
            </div>
        </div>

        <!-- 입사 후 포부 섹션 -->
        <div class="form-section">
            <h2 class="section-title">
                <span class="section-number">05</span>
                ${getWritingItemName('입사 후 포부')}
            </h2>
            
            <div class="form-field full-width">
                <label for="editAspiration">
                    ${getWritingItemName('입사 후 포부')} <span class="required">*</span>
                    <span class="char-count" id="editCharCount4">${(applicant.aspiration || '').length} / ${getWritingItemLimit('입사 후 포부')}자</span>
                </label>
                <textarea 
                    id="editAspiration" 
                    rows="6" 
                    maxlength="${getWritingItemLimit('입사 후 포부')}"
                    ${isDisabled ? 'disabled' : ''}
                    required
                >${applicant.aspiration || ''}</textarea>
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
        setupCharCount('editSelfIntroduction', 'editCharCount1', getWritingItemLimit('자기소개서'));
        setupCharCount('editCareerDescription', 'editCharCount2', getWritingItemLimit('경력기술서'));
        setupCharCount('editMotivation', 'editCharCount3', getWritingItemLimit('지원동기'));
        setupCharCount('editAspiration', 'editCharCount4', getWritingItemLimit('입사 후 포부'));
        setupPhoneFormatting('editPhone');
    }
}

// 작성 항목 이름 가져오기 (기본값 포함)
function getWritingItemName(defaultName) {
    if (!applicationGuide || !applicationGuide.writing_items) return defaultName;
    const item = applicationGuide.writing_items.find(i => 
        i.name === defaultName || 
        (defaultName === '자기소개서' && i.name.includes('자기소개')) ||
        (defaultName === '경력기술서' && i.name.includes('경력기술')) ||
        (defaultName === '지원동기' && i.name.includes('지원동기')) ||
        (defaultName === '입사 후 포부' && i.name.includes('포부'))
    );
    return item ? item.name : defaultName;
}

// 작성 항목 글자수 제한 가져오기 (기본값 포함)
function getWritingItemLimit(defaultName) {
    if (!applicationGuide || !applicationGuide.writing_items) {
        // 기본값
        return 2000;
    }
    const item = applicationGuide.writing_items.find(i => 
        i.name === defaultName || 
        (defaultName === '자기소개서' && i.name.includes('자기소개')) ||
        (defaultName === '경력기술서' && i.name.includes('경력기술')) ||
        (defaultName === '지원동기' && i.name.includes('지원동기')) ||
        (defaultName === '입사 후 포부' && i.name.includes('포부'))
    );
    return item ? item.limit : 2000;
}

// 상태 배너 업데이트
async function updateStatusBanner(applicant) {
    const banner = document.getElementById('statusBanner');
    const hasEvaluations = applicant.evaluations && applicant.evaluations.length > 0;
    const notificationSent = applicant.notification_sent;
    const isPassed = applicant.status === 'passed';
    const isFailed = applicant.status === 'failed';
    
    // 합격/불합격 상태인 경우 무조건 수정 불가
    if (isPassed || isFailed) {
        banner.className = 'status-banner evaluated';
        let resultText = isPassed ? '합격' : '불합격';
        let resultMessage = '';
        
        // 결과 통보가 된 경우 메시지 표시
        if (notificationSent) {
            const templateId = isPassed ? 'passed' : 'failed';
            const template = await getEmailTemplate(templateId);
            
            if (template) {
                const jobPosting = applicant.job_posting || '채용공고';
                resultMessage = template.body
                    .replace(/{이름}/g, applicant.name)
                    .replace(/{채용공고}/g, jobPosting)
                    .replace(/\n/g, '<br>');
            }
        }
        
        // 결과 통보된 경우
        if (notificationSent) {
            banner.style.background = '#ffffff';
            banner.innerHTML = `
                <div class="status-info">
                    <div class="status-text" style="width: 100%;">
                        <h4 style="color: #1f2937; font-size: 18px; margin-bottom: 16px;">
                            서류전형 결과: ${resultText}
                        </h4>
                        ${resultMessage ? `
                        <div style="padding: 20px; background: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb;">
                            <p style="line-height: 1.8; color: #374151; white-space: pre-wrap;">${resultMessage}</p>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
        } else {
            // 합격/불합격 상태지만 아직 통보 전
            banner.innerHTML = `
                <div class="status-info">
                    <div class="status-icon">🔒</div>
                    <div class="status-text">
                        <h4>평가 완료 - 수정 불가</h4>
                        <p>서류 전형이 완료되었습니다. 결과는 별도로 안내될 예정입니다.</p>
                        <p style="margin-top: 8px; color: #ef4444; font-weight: 600; font-size: 15px;">
                            ⚠️ 평가가 완료되어 지원서를 수정할 수 없습니다.<br>
                            수정이 필요한 경우 담당자에게 문의하시기 바랍니다.
                        </p>
                    </div>
                </div>
            `;
        }
        
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
    } else if (hasEvaluations) {
        // 평가는 있지만 합격/불합격 결정 전
        banner.className = 'status-banner evaluated';
        banner.innerHTML = `
            <div class="status-info">
                <div class="status-icon">🔒</div>
                <div class="status-text">
                    <h4>평가 완료 - 수정 불가</h4>
                    <p>서류 전형이 완료되었습니다. 결과는 별도로 안내될 예정입니다.</p>
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
        // 평가 대기 중
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

// 신규 지원서 제출 처리
async function handleSubmit(e) {
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

    try {
        // 이메일 중복 체크
        const existing = await getApplicantByEmail(formData.email);
        if (existing) {
            alert('이미 등록된 이메일입니다. 로그인하여 지원서를 수정하세요.');
            return;
        }

        const application = {
            job_posting: formData.jobPosting,
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
            self_introduction: formData.selfIntroduction,
            career_description: formData.careerDescription,
            motivation: formData.motivation,
            aspiration: formData.aspiration,
            submit_date: new Date().toISOString().split('T')[0]
        };

        console.log('Submitting application:', application);
        const newApplicant = await createApplicant(application);
        console.log('Application created successfully:', newApplicant);

        // 임시 저장 데이터 삭제
        localStorage.removeItem('applicationDraft');
        updateDraftInfo();

        alert('✅ 지원서 제출 완료\n\n입사지원서가 성공적으로 제출되었습니다.\n제출하신 내용을 확인하실 수 있습니다.');
        
        // 로그인 상태로 설정
        localStorage.setItem('loggedInApplicant', application.email);
        
        // 평가 데이터 추가 (빈 배열)
        newApplicant.evaluations = [];
        currentApplicant = newApplicant;
        
        // UI 직접 업데이트
        document.getElementById('applicantWelcome').textContent = `${newApplicant.name}님, 환영합니다!`;
        updateStatusBanner(newApplicant);
        updateApplicationStatus(newApplicant);
        createEditForm(newApplicant);
        
        // 지원서 수정 페이지로 이동
        showEditApplicationPage();
    } catch (error) {
        console.error('Submit error details:', error);
        let errorMessage = '지원서 제출 중 오류가 발생했습니다.';
        if (error.message) {
            errorMessage += '\n\n오류 내용: ' + error.message;
        }
        if (error.details) {
            errorMessage += '\n상세: ' + error.details;
        }
        if (error.hint) {
            errorMessage += '\n힌트: ' + error.hint;
        }
        alert(errorMessage + '\n\n다시 시도해주세요.');
    }
}

// 지원서 수정 처리
async function handleEdit(e) {
    e.preventDefault();

    // 평가 완료 여부 재확인
    if (!currentApplicant) {
        alert('로그인이 필요합니다.');
        handleLogout();
        return;
    }
    
    // Supabase에서 최신 데이터 확인
    const latestApplicant = await getApplicantByEmail(currentApplicant.email);
    
    if (!latestApplicant) {
        alert('지원자 정보를 찾을 수 없습니다.');
        handleLogout();
        return;
    }
    
    // evaluations 배열 확인
    if (latestApplicant.evaluations && latestApplicant.evaluations.length > 0) {
        alert('⚠️ 평가가 완료된 지원서는 수정할 수 없습니다.\n\n수정이 필요한 경우 담당자에게 문의하시기 바랍니다.');
        // 최신 데이터로 화면 갱신
        currentApplicant = latestApplicant;
        await loadApplicantData(currentApplicant.email);
        return;
    }

    const formData = {
        job_posting: document.getElementById('editJobPosting').value,
        name: document.getElementById('editName').value.trim(),
        birthdate: document.getElementById('editBirthdate').value,
        phone: document.getElementById('editPhone').value.trim(),
        branch: document.getElementById('editBranch').value,
        position: document.getElementById('editPosition').value,
        address: document.getElementById('editAddress').value.trim(),
        education: document.getElementById('editEducation').value.trim(),
        certifications: document.getElementById('editCertifications').value.trim(),
        career: document.getElementById('editCareer').value.trim(),
        self_introduction: document.getElementById('editSelfIntroduction').value.trim(),
        career_description: document.getElementById('editCareerDescription').value.trim(),
        motivation: document.getElementById('editMotivation').value.trim(),
        aspiration: document.getElementById('editAspiration').value.trim(),
        newPassword: document.getElementById('newPassword').value,
        newPasswordConfirm: document.getElementById('newPasswordConfirm').value
    };

    if (!validateEditApplication(formData)) {
        return;
    }

    try {
        // 비밀번호 변경이 있는 경우
        if (formData.newPassword) {
            formData.password = formData.newPassword;
        }
        
        // newPassword 필드 제거 (DB에 없는 필드)
        delete formData.newPassword;
        delete formData.newPasswordConfirm;

        console.log('Updating applicant:', formData);
        const updatedApplicant = await updateApplicant(currentApplicant.email, formData);
        console.log('Update successful:', updatedApplicant);

        // 평가 데이터 유지
        updatedApplicant.evaluations = currentApplicant.evaluations || [];
        currentApplicant = updatedApplicant;

        showSuccessModal(
            '수정 완료',
            '지원서가 성공적으로 수정되었습니다.',
            '변경사항이 저장되었습니다.'
        );

        // 화면 갱신
        await loadApplicantData(currentApplicant.email);

        document.getElementById('newPassword').value = '';
        document.getElementById('newPasswordConfirm').value = '';
    } catch (error) {
        console.error('Edit error:', error);
        let errorMessage = '지원서 수정 중 오류가 발생했습니다.';
        if (error.message) {
            errorMessage += '\n\n오류 내용: ' + error.message;
        }
        alert(errorMessage + '\n\n다시 시도해주세요.');
    }
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
