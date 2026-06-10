'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveGuideLocation({ name, lat, lon }: { name: string; lat: number; lon: number }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('guides').update({
    location:     name,
    location_lat: lat,
    location_lon: lon,
  }).eq('id', user.id)

  revalidatePath('/settings')
  revalidatePath('/water-flows')
}
