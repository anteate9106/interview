// Supabase 설정
const SUPABASE_URL = 'https://qlcnvlzcflocseuvsjcb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsY252bHpjZmxvY3NldXZzamNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczMTA5MDAsImV4cCI6MjA4Mjg4NjkwMH0.-kbuHfACQ8UeQDPIqdpCE-mXeAuFbmQSUUHUktX5LGc';

// Supabase 클라이언트 초기화 (중복 선언 방지)
var supabase;
if (!window.supabaseClient) {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
supabase = window.supabaseClient;
