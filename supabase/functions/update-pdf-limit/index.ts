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

    const { username, addPdfLimit } = await req.json();

    if (!username) {
      return new Response(
        JSON.stringify({ success: false, error: '缺少用户名' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!addPdfLimit || addPdfLimit <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'PDF积分必须为正整数' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Attempting to add ${addPdfLimit} PDF credits for username: ${username}`);

    // 查询用户并获取当前pdf_limit
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('id, pdf_limit')
      .eq('username', username)
      .single();

    if (fetchError || !userData) {
      console.error('Error fetching user:', fetchError);
      return new Response(
        JSON.stringify({ success: false, error: '用户不存在' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    const currentPdfLimit = userData.pdf_limit ?? 0;
    const newPdfLimit = currentPdfLimit + addPdfLimit;

    // 更新pdf_limit
    const { error: updateError } = await supabase
      .from('users')
      .update({ pdf_limit: newPdfLimit })
      .eq('username', username);

    if (updateError) {
      console.error('Error updating pdf_limit:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: '更新PDF积分失败' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log(`Successfully added ${addPdfLimit} PDF credits. New total: ${newPdfLimit}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        newPdfLimit,
        message: `成功为用户 ${username} 添加 ${addPdfLimit} 个PDF积分，当前积分: ${newPdfLimit}` 
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
