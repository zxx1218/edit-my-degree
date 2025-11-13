// import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1'

// const corsHeaders = {
//   'Access-Control-Allow-Origin': '*',
//   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
// }

// Deno.serve(async (req) => {
//   if (req.method === 'OPTIONS') {
//     return new Response(null, { headers: corsHeaders });
//   }

//   try {
//     const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
//     const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

//     const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

//     console.log('Fetching all users from database');

//     // 使用 service role key 查询所有用户
//     const { data: users, error } = await supabase
//       .from('users')
//       .select('id, username, remaining_logins')
//       .order('username', { ascending: true });

//     if (error) {
//       console.error('Error fetching users:', error);
//       return new Response(
//         JSON.stringify({ success: false, error: error.message }),
//         { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
//       );
//     }

//     console.log(`Successfully fetched ${users?.length || 0} users`);

//     return new Response(
//       JSON.stringify({ success: true, users }),
//       { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
//     );
//   } catch (error: any) {
//     console.error('Unexpected error:', error);
//     return new Response(
//       JSON.stringify({ success: false, error: error.message }),
//       { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
//     );
//   }
// });
