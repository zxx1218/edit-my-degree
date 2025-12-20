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

    const { username, password } = await req.json();

    console.log('Admin login attempt for username:', username);

    if (!username || !password) {
      return new Response(
        JSON.stringify({ success: false, error: '请输入用户名和密码' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // 查询管理员
    const { data: admins, error: queryError } = await supabase
      .from('admins')
      .select('*')
      .eq('username', username)
      .eq('password', password);

    if (queryError) {
      console.error('Query error:', queryError);
      return new Response(
        JSON.stringify({ success: false, error: '验证失败，请重试' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!admins || admins.length === 0) {
      console.log('Admin not found or password incorrect');
      return new Response(
        JSON.stringify({ success: false, error: '用户名或密码错误' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const admin = admins[0];
    console.log('Admin verified successfully:', admin.username);

    return new Response(
      JSON.stringify({ 
        success: true, 
        admin: {
          id: admin.id,
          username: admin.username
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
