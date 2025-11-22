import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { username, decreaseLogins } = await req.json();

    if (!username) {
      return new Response(
        JSON.stringify({ success: false, error: '用户名不能为空' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (typeof decreaseLogins !== 'number' || decreaseLogins <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: '减少次数必须为正整数' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Decreasing logins for user: ${username} by ${decreaseLogins}`);

    // 先查询用户当前的登录次数
    const { data: user, error: queryError } = await supabase
      .from('users')
      .select('id, remaining_logins')
      .eq('username', username)
      .maybeSingle();

    if (queryError) {
      console.error('Error querying user:', queryError);
      return new Response(
        JSON.stringify({ success: false, error: queryError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: '用户不存在' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // 计算新的登录次数，不能小于0
    const newLogins = Math.max(0, user.remaining_logins - decreaseLogins);

    // 更新用户的登录次数
    const { error: updateError } = await supabase
      .from('users')
      .update({ remaining_logins: newLogins })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating user logins:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: updateError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Successfully decreased logins for user: ${username}, new remaining: ${newLogins}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        newLogins,
        decreased: user.remaining_logins - newLogins 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
