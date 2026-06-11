'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addWeatherLocation({ name, lat, lon }: { name: string; lat: number; lon: number }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('guide_weather_locations').insert({ guide_id: user.id, name, lat, lon })
  revalidatePath('/water-flows')
}

export async function deleteWeatherLocation(id: string) {
  const supabase = await createClient()
  await supabase.from('guide_weather_locations').delete().eq('id', id)
  revalidatePath('/water-flows')
}
