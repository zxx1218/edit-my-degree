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

    // 获取今天的开始时间（中国时区 UTC+8）
    const now = new Date();
    const chinaOffset = 8 * 60 * 60 * 1000;
    const chinaTime = new Date(now.getTime() + chinaOffset);
    const todayStart = new Date(chinaTime.getFullYear(), chinaTime.getMonth(), chinaTime.getDate());
    todayStart.setTime(todayStart.getTime() - chinaOffset); // 转换回UTC

    console.log('Querying hourly login stats since:', todayStart.toISOString());

    // 查询今天的所有登录记录
    const { data: loginLogs, error: queryError } = await supabase
      .from('login_logs')
      .select('login_time, user_id')
      .gte('login_time', todayStart.toISOString())
      .order('login_time', { ascending: true });

    if (queryError) {
      console.error('Query error:', queryError);
      return new Response(
        JSON.stringify({ error: '查询失败' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // 按小时分组统计
    const hourlyStats: { [hour: number]: { total: number; users: Set<string> } } = {};
    
    // 初始化0-23小时的统计
    for (let i = 0; i < 24; i++) {
      hourlyStats[i] = { total: 0, users: new Set() };
    }

    // 统计每小时的登录数据
    loginLogs?.forEach(log => {
      const loginTime = new Date(log.login_time);
      // 转换为中国时区
      const chinaLoginTime = new Date(loginTime.getTime() + chinaOffset);
      const hour = chinaLoginTime.getHours();
      
      hourlyStats[hour].total++;
      hourlyStats[hour].users.add(log.user_id);
    });

    // 转换为数组格式
    const result = Object.entries(hourlyStats).map(([hour, stats]) => ({
      hour: parseInt(hour),
      hourLabel: `${hour.padStart(2, '0')}:00`,
      totalLogins: stats.total,
      uniqueUsers: stats.users.size,
    }));

    console.log('Hourly stats generated:', result.length, 'hours');

    return new Response(
      JSON.stringify({ 
        success: true, 
        hourlyStats: result,
        date: chinaTime.toISOString().split('T')[0]
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
