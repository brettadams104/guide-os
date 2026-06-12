'use server'

import { createClient } from '@/lib/supabase/server'

export async function submitFeedback({
  category,
  message,
}: {
  category: string
  message: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('feedback').insert({
    guide_id: user.id,
    email:    user.email,
    category,
    message,
  })

  if (error) return { error: error.message }
  return { ok: true }
}
