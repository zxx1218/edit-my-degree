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

    const { cardId, username, type } = await req.json();

    if (!cardId || !username || !type) {
      return new Response(
        JSON.stringify({ error: '缺少必要参数' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Check if card exists and is not used
    const { data: cardData, error: cardError } = await supabase
      .from('cards')
      .select('*')
      .eq('id', cardId)
      .eq('type', type)
      .eq('used', false)
      .maybeSingle();

    if (cardError) {
      console.error('Card query error:', cardError);
      return new Response(
        JSON.stringify({ error: '查询卡密失败' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!cardData) {
      return new Response(
        JSON.stringify({ error: '卡密无效或已被使用' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Check if user exists
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, remaining_logins, pdf_limit')
      .eq('username', username)
      .maybeSingle();

    if (userError || !userData) {
      console.error('User query error:', userError);
      return new Response(
        JSON.stringify({ error: '用户不存在' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Update user credits based on type
    const updateField = type === 'login' ? 'remaining_logins' : 'pdf_limit';
    const currentValue = type === 'login' ? userData.remaining_logins : userData.pdf_limit;
    const newValue = currentValue + cardData.values;

    const { error: updateUserError } = await supabase
      .from('users')
      .update({ [updateField]: newValue })
      .eq('id', userData.id);

    if (updateUserError) {
      console.error('Update user error:', updateUserError);
      return new Response(
        JSON.stringify({ error: '更新用户积分失败' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Mark card as used
    const { error: updateCardError } = await supabase
      .from('cards')
      .update({
        used: true,
        used_by: username,
        used_at: new Date().toISOString()
      })
      .eq('id', cardId);

    if (updateCardError) {
      console.error('Update card error:', updateCardError);
      return new Response(
        JSON.stringify({ error: '更新卡密状态失败' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const typeLabel = type === 'login' ? '登录次数' : 'PDF积分';
    return new Response(
      JSON.stringify({
        success: true,
        message: `成功充值 ${cardData.values} ${typeLabel}，当前${typeLabel}：${newValue}`,
        addedValue: cardData.values,
        newValue
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
