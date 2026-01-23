// Supabase 설정
const SUPABASE_URL = 'https://qlcnvlzcflocseuvsjcb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsY252bHpjZmxvY3NldXZzamNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczMTA5MDAsImV4cCI6MjA4Mjg4NjkwMH0.-kbuHfACQ8UeQDPIqdpCE-mXeAuFbmQSUUHUktX5LGc';

// Supabase 클라이언트 초기화 (중복 선언 방지)
var supabase;

// Supabase 스크립트가 로드될 때까지 대기
function initSupabase() {
    // window.supabase 또는 supabase 전역 객체 확인
    const supabaseLib = window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
    
    if (!supabaseLib) {
        console.error('Supabase library not loaded. Make sure @supabase/supabase-js@2 script is loaded before config.js');
        return null;
    }
    
    // 이미 초기화된 클라이언트가 있으면 재사용
    if (window.supabaseClient) {
        supabase = window.supabaseClient;
        return supabase;
    }
    
    // 새 클라이언트 생성
    try {
        window.supabaseClient = supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        supabase = window.supabaseClient;
        console.log('Supabase client initialized successfully');
        return supabase;
    } catch (error) {
        console.error('Error initializing Supabase client:', error);
        return null;
    }
}

// DOMContentLoaded 또는 즉시 실행
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSupabase);
} else {
    // 이미 로드된 경우 즉시 실행
    initSupabase();
}

// 폴백: 약간의 지연 후 재시도
setTimeout(() => {
    if (!supabase && !window.supabaseClient) {
        console.warn('Retrying Supabase initialization...');
        initSupabase();
    }
}, 100);
