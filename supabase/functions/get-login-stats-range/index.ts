import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const chinaOffset = 8 * 60 * 60 * 1000;
    let range = 'week'; // 默认周视图
    
    try {
      const body = await req.json();
      if (body.range) {
        range = body.range; // 'week' 或 'month'
      }
    } catch {
      // 使用默认值
    }

    // 计算日期范围
    const now = new Date();
    const chinaTime = new Date(now.getTime() + chinaOffset);
    const today = new Date(chinaTime.getFullYear(), chinaTime.getMonth(), chinaTime.getDate());
    
    let startDate: Date;
    let days: number;
    
    if (range === 'month') {
      // 过去30天
      days = 30;
      startDate = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);
    } else {
      // 过去7天
      days = 7;
      startDate = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
    }

    const startDateUTC = new Date(startDate.getTime() - chinaOffset);
    const endDateUTC = new Date(today.getTime() + 24 * 60 * 60 * 1000 - chinaOffset);

    console.log(`Querying ${range} login stats from ${startDate.toISOString()} to ${today.toISOString()}`);

    // 查询日期范围内的所有登录记录
    const { data: loginLogs, error: queryError } = await supabase
      .from('login_logs')
      .select('login_time, user_id')
      .gte('login_time', startDateUTC.toISOString())
      .lt('login_time', endDateUTC.toISOString())
      .order('login_time', { ascending: true });

    if (queryError) {
      console.error('Query error:', queryError);
      return new Response(
        JSON.stringify({ error: '查询失败' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // 按天分组统计
    const dailyStats: { [date: string]: { total: number; users: Set<string> } } = {};
    
    // 初始化所有日期
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      dailyStats[dateStr] = { total: 0, users: new Set() };
    }

    // 统计每天的登录数据
    loginLogs?.forEach(log => {
      const loginTime = new Date(log.login_time);
      const chinaLoginTime = new Date(loginTime.getTime() + chinaOffset);
      const dateStr = `${chinaLoginTime.getFullYear()}-${String(chinaLoginTime.getMonth() + 1).padStart(2, '0')}-${String(chinaLoginTime.getDate()).padStart(2, '0')}`;
      
      if (dailyStats[dateStr]) {
        dailyStats[dateStr].total++;
        dailyStats[dateStr].users.add(log.user_id);
      }
    });

    // 转换为数组格式
    const result = Object.entries(dailyStats)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, stats]) => {
        const [year, month, day] = date.split('-');
        return {
          date,
          dateLabel: `${month}/${day}`,
          totalLogins: stats.total,
          uniqueUsers: stats.users.size,
        };
      });

    // 计算汇总数据
    const totalLogins = result.reduce((sum, d) => sum + d.totalLogins, 0);
    const avgLogins = days > 0 ? Math.round(totalLogins / days * 10) / 10 : 0;
    const allUsers = new Set<string>();
    loginLogs?.forEach(log => allUsers.add(log.user_id));

    console.log(`${range} stats generated:`, result.length, 'days');

    return new Response(
      JSON.stringify({ 
        success: true, 
        dailyStats: result,
        summary: {
          totalLogins,
          avgLogins,
          totalUniqueUsers: allUsers.size,
          days
        },
        range
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
