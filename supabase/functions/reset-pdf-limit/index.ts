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

    const { username } = await req.json();

    if (!username) {
      return new Response(
        JSON.stringify({ success: false, error: '缺少用户名' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Attempting to reset PDF limit for username: ${username}`);

    // 查询用户
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (fetchError || !userData) {
      console.error('Error fetching user:', fetchError);
      return new Response(
        JSON.stringify({ success: false, error: '用户不存在' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // 重置pdf_limit为0
    const { error: updateError } = await supabase
      .from('users')
      .update({ pdf_limit: 0 })
      .eq('username', username);

    if (updateError) {
      console.error('Error resetting pdf_limit:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: '重置PDF积分失败' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log(`Successfully reset PDF limit to 0 for user: ${username}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `成功将用户 ${username} 的PDF积分重置为 0` 
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
