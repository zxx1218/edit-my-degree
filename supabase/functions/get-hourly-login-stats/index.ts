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

    // 解析请求体获取日期参数
    let targetDate: Date;
    const chinaOffset = 8 * 60 * 60 * 1000;
    
    try {
      const body = await req.json();
      if (body.date) {
        // 使用传入的日期 (格式: YYYY-MM-DD)
        const [year, month, day] = body.date.split('-').map(Number);
        targetDate = new Date(year, month - 1, day);
      } else {
        // 默认使用今天（中国时区）
        const now = new Date();
        const chinaTime = new Date(now.getTime() + chinaOffset);
        targetDate = new Date(chinaTime.getFullYear(), chinaTime.getMonth(), chinaTime.getDate());
      }
    } catch {
      // 如果解析失败，使用今天
      const now = new Date();
      const chinaTime = new Date(now.getTime() + chinaOffset);
      targetDate = new Date(chinaTime.getFullYear(), chinaTime.getMonth(), chinaTime.getDate());
    }

    // 计算目标日期的开始和结束时间（UTC）
    const dayStart = new Date(targetDate.getTime() - chinaOffset);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    console.log('Querying hourly login stats for date:', targetDate.toISOString().split('T')[0]);
    console.log('Day start (UTC):', dayStart.toISOString());
    console.log('Day end (UTC):', dayEnd.toISOString());

    // 查询指定日期的所有登录记录
    const { data: loginLogs, error: queryError } = await supabase
      .from('login_logs')
      .select('login_time, user_id')
      .gte('login_time', dayStart.toISOString())
      .lt('login_time', dayEnd.toISOString())
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

    // 格式化返回的日期
    const formattedDate = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;

    console.log('Hourly stats generated for', formattedDate, ':', result.length, 'hours');

    return new Response(
      JSON.stringify({ 
        success: true, 
        hourlyStats: result,
        date: formattedDate
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
