'use server'
import { createClient } from '@/lib/supabase/server'

export async function markOnboardingComplete() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('guides').update({ onboarding_complete: true }).eq('id', user.id)
}
