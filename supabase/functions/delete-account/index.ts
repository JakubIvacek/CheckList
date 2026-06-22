// Supabase Edge Function: permanently delete the calling user's account.
// The browser client can't delete an auth user, so this runs server-side with
// the service-role key. Deleting the auth user cascades to `tasks` + `categories`
// (both reference auth.users ON DELETE CASCADE).
//
// Deploy:  supabase functions deploy delete-account
// (SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are injected automatically.)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Missing authorization header' }, 401)

    const url = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // identify the caller from their JWT
    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: userErr } = await userClient.auth.getUser()
    if (userErr || !user) return json({ error: 'Invalid session' }, 401)

    // delete the user; tasks + categories cascade away
    const admin = createClient(url, serviceKey)
    const { error: delErr } = await admin.auth.admin.deleteUser(user.id)
    if (delErr) return json({ error: delErr.message }, 500)

    return json({ ok: true }, 200)
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})
