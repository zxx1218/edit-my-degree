import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, type, values, count } = await req.json();
    console.log('Manage cards request:', { action, type, values, count });

    if (action === 'create') {
      // 批量创建充值卡
      if (!type || !values || !count) {
        return new Response(
          JSON.stringify({ success: false, error: '缺少必要参数' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const cardsToCreate = [];
      for (let i = 0; i < count; i++) {
        cardsToCreate.push({
          type,
          values: parseInt(values),
          used: false,
        });
      }

      const { data: createdCards, error: createError } = await supabase
        .from('cards')
        .insert(cardsToCreate)
        .select();

      if (createError) {
        console.error('Error creating cards:', createError);
        return new Response(
          JSON.stringify({ success: false, error: createError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Successfully created ${createdCards?.length} cards`);
      return new Response(
        JSON.stringify({ success: true, cards: createdCards }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'list') {
      // 获取所有充值卡
      const { data: cards, error: listError } = await supabase
        .from('cards')
        .select('*')
        .order('created_at', { ascending: false });

      if (listError) {
        console.error('Error listing cards:', listError);
        return new Response(
          JSON.stringify({ success: false, error: listError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, cards }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'delete') {
      // 删除指定卡
      const { cardId } = await req.json();
      if (!cardId) {
        return new Response(
          JSON.stringify({ success: false, error: '缺少卡密ID' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: deleteError } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardId);

      if (deleteError) {
        console.error('Error deleting card:', deleteError);
        return new Response(
          JSON.stringify({ success: false, error: deleteError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: '无效的操作类型' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in manage-cards function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
