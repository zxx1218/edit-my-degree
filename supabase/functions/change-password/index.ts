import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { username, oldPassword, newPassword } = await req.json();

    console.log(`Password change attempt for username: ${username}`);

    if (!username || !oldPassword || !newPassword) {
      return new Response(
        JSON.stringify({ success: false, error: '请提供完整的信息' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // 验证原密码是否正确
    const { data: user, error: queryError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', oldPassword)
      .single();

    if (queryError || !user) {
      console.error('Password verification failed:', queryError);
      return new Response(
        JSON.stringify({ success: false, error: '用户名或原密码错误' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // 更新密码
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: newPassword, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (updateError) {
      console.error('Password update failed:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: '密码更新失败' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log(`Password changed successfully for user: ${username}`);
    return new Response(
      JSON.stringify({ success: true, message: '密码修改成功' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error changing password:', error);
    return new Response(
      JSON.stringify({ success: false, error: '服务器错误' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
