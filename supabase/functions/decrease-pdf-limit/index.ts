import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { username, decreaseAmount } = await req.json();

    if (!username) {
      return new Response(
        JSON.stringify({ success: false, message: '用户名不能为空' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!decreaseAmount || decreaseAmount <= 0) {
      return new Response(
        JSON.stringify({ success: false, message: '扣除数量必须大于0' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Attempting to decrease PDF limit for username: ${username} by ${decreaseAmount}`);

    // Get current pdf_limit
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('id, pdf_limit')
      .eq('username', username)
      .single();

    if (fetchError || !userData) {
      console.error('Error fetching user:', fetchError);
      return new Response(
        JSON.stringify({ success: false, message: '用户不存在' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentPdfLimit = userData.pdf_limit ?? 0;

    if (currentPdfLimit < decreaseAmount) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `PDF下载积分不足，当前积分：${currentPdfLimit}，需要：${decreaseAmount}`,
          currentPdfLimit 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newPdfLimit = Math.max(0, currentPdfLimit - decreaseAmount);

    // Update pdf_limit
    const { error: updateError } = await supabase
      .from('users')
      .update({ pdf_limit: newPdfLimit })
      .eq('username', username);

    if (updateError) {
      console.error('Error updating pdf_limit:', updateError);
      return new Response(
        JSON.stringify({ success: false, message: '更新PDF下载积分失败' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully decreased PDF limit for ${username}. New limit: ${newPdfLimit}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        newPdfLimit, 
        decreased: decreaseAmount,
        message: '成功扣除PDF下载积分'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return new Response(
      JSON.stringify({ success: false, message: '服务器错误', error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
