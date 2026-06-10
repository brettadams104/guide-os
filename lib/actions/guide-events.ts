'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addGuideEvent(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('guide_events').insert({
    guide_id:   user.id,
    title:      formData.get('title') as string,
    event_date: formData.get('event_date') as string,
    start_time: (formData.get('start_time') as string) || null,
    end_time:   (formData.get('end_time') as string) || null,
    notes:      (formData.get('notes') as string) || null,
  })

  revalidatePath('/dashboard')
}

export async function deleteGuideEvent(id: string) {
  const supabase = await createClient()
  await supabase.from('guide_events').delete().eq('id', id)
  revalidatePath('/dashboard')
}
