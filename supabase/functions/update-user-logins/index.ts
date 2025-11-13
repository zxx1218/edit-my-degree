// import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

// const corsHeaders = {
//   'Access-Control-Allow-Origin': '*',
//   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
// }

// Deno.serve(async (req) => {
//   if (req.method === 'OPTIONS') {
//     return new Response(null, { headers: corsHeaders });
//   }

//   try {
//     const supabase = createClient(
//       Deno.env.get('SUPABASE_URL') ?? '',
//       Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
//     );

//     const { userId, username, password, remaining_logins } = await req.json();

//     if (!userId || !username || !password || remaining_logins === undefined) {
//       return new Response(
//         JSON.stringify({ error: 'Invalid parameters' }),
//         { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
//       );
//     }

//     // 检查用户名是否已被其他用户使用
//     const { data: existingUser, error: checkError } = await supabase
//       .from('users')
//       .select('id')
//       .eq('username', username)
//       .neq('id', userId)
//       .maybeSingle();

//     if (checkError) {
//       console.error('Check error:', checkError);
//       return new Response(
//         JSON.stringify({ error: checkError.message }),
//         { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
//       );
//     }

//     if (existingUser) {
//       return new Response(
//         JSON.stringify({ error: 'Username already exists' }),
//         { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
//       );
//     }

//     // 更新用户信息
//     const { error: updateError } = await supabase
//       .from('users')
//       .update({
//         username,
//         password,
//         remaining_logins,
//         updated_at: new Date().toISOString(),
//       })
//       .eq('id', userId);

//     if (updateError) {
//       console.error('Update error:', updateError);
//       return new Response(
//         JSON.stringify({ error: updateError.message }),
//         { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
//       );
//     }

//     return new Response(
//       JSON.stringify({ 
//         success: true,
//         message: '用户信息更新成功'
//       }),
//       { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
//     );

//   } catch (error) {
//     console.error('Error:', error);
//     const errorMessage = error instanceof Error ? error.message : 'Unknown error';
//     return new Response(
//       JSON.stringify({ error: errorMessage }),
//       { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
//     );
//   }
// });
