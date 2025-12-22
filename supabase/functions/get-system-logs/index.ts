import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, limit = 200, search } = await req.json();

    // 验证 token
    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: '未提供认证令牌' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 验证管理员 token
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('id, username')
      .eq('id', token)
      .single();

    if (adminError || !admin) {
      console.error('Admin verification failed:', adminError);
      return new Response(
        JSON.stringify({ success: false, error: '认证失败，请重新登录' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 构建查询
    let query = supabase
      .from('system_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    // 如果有搜索条件
    if (search && search.trim()) {
      query = query.or(`message.ilike.%${search}%,source.ilike.%${search}%,details.ilike.%${search}%`);
    }

    const { data: logs, error: logsError } = await query;

    if (logsError) {
      console.error('Error fetching logs:', logsError);
      throw logsError;
    }

    console.log(`Fetched ${logs?.length || 0} logs for admin ${admin.username}`);

    return new Response(
      JSON.stringify({
        success: true,
        logs: logs || [],
        count: logs?.length || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in get-system-logs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
