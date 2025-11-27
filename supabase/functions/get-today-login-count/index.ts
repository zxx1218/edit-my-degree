import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 获取今天的开始时间（中国时区）
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.toISOString();

    console.log('Querying login count since:', todayStart);

    // 查询今天的总登录次数
    const { data: loginData, error: countError, count: totalLogins } = await supabase
      .from('login_logs')
      .select('*', { count: 'exact', head: true })
      .gte('login_time', todayStart);

    if (countError) {
      console.error('Query error:', countError);
      return new Response(
        JSON.stringify({ error: '查询失败' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // 查询今天的不同用户数
    const { data: distinctUsers, error: distinctError } = await supabase
      .from('login_logs')
      .select('user_id')
      .gte('login_time', todayStart);

    if (distinctError) {
      console.error('Distinct users query error:', distinctError);
      return new Response(
        JSON.stringify({ error: '查询失败' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // 计算不同用户数
    const uniqueUsers = new Set(distinctUsers?.map(log => log.user_id) || []).size;

    console.log('Today login stats - Total:', totalLogins, 'Unique users:', uniqueUsers);

    return new Response(
      JSON.stringify({ 
        success: true, 
        total_logins: totalLogins || 0,
        distinct_users: uniqueUsers
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
