'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addWaterGauge(siteNo: string, displayName: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase.from('guide_water_gauges').insert({
    guide_id: user!.id,
    site_no: siteNo.trim(),
    display_name: displayName.trim(),
  })
  if (error) return { error: error.message }
  revalidatePath('/water-flows')
  return {}
}

export async function removeWaterGauge(id: string): Promise<void> {
  const supabase = await createClient()
  await supabase.from('guide_water_gauges').delete().eq('id', id)
  revalidatePath('/water-flows')
}
