'use server'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export async function deleteAccount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Gather their data before deleting
  const [{ data: guide }, { count: tripCount }, { count: clientCount }] = await Promise.all([
    supabase.from('guides').select('*').eq('id', user.id).single(),
    supabase.from('trips').select('*', { count: 'exact', head: true }).eq('guide_id', user.id),
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('guide_id', user.id),
  ])

  // Archive to deleted_accounts before wiping anything
  await adminClient.from('deleted_accounts').insert({
    guide_id:      user.id,
    name:          guide?.name ?? null,
    email:         user.email ?? null,
    phone:         (guide as any)?.phone ?? null,
    business_name: guide?.business_name ?? null,
    location:      guide?.location ?? null,
    total_trips:   tripCount ?? 0,
    total_clients: clientCount ?? 0,
    joined_at:     user.created_at,
  })

  // Sign out first so the session is cleared
  await supabase.auth.signOut()

  // Delete the auth user — cascades to all their data via RLS foreign keys
  await adminClient.auth.admin.deleteUser(user.id)

  redirect('/login')
}
