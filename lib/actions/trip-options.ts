'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// ── Time Slots ────────────────────────────────────────────────────────────────

export async function addTimeSlot(label: string, startTime: string | null, endTime: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase.from('guide_time_slots').insert({
    guide_id: user!.id, label, start_time: startTime || null, end_time: endTime || null
  })
  if (error) throw new Error(error.message)
  revalidatePath('/settings')
}

export async function updateTimeSlot(id: string, label: string, startTime: string | null, endTime: string | null): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('guide_time_slots').update({
    label: label.trim(),
    start_time: startTime || null,
    end_time: endTime || null,
  }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/settings')
  return {}
}

export async function deleteTimeSlot(id: string) {
  const supabase = await createClient()
  await supabase.from('guide_time_slots').delete().eq('id', id)
  revalidatePath('/settings')
}

// ── Trip Categories + Options ─────────────────────────────────────────────────

export async function addTripCategory(name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase.from('guide_trip_categories').insert({ guide_id: user!.id, name })
  if (error) throw new Error(error.message)
  revalidatePath('/settings')
}

export async function deleteTripCategory(id: string) {
  const supabase = await createClient()
  await supabase.from('guide_trip_categories').delete().eq('id', id)
  revalidatePath('/settings')
}

export async function addTripOption(categoryId: string, label: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase.from('guide_trip_options').insert({ category_id: categoryId, guide_id: user!.id, label })
  if (error) throw new Error(error.message)
  revalidatePath('/settings')
}

export async function deleteTripOption(id: string) {
  const supabase = await createClient()
  await supabase.from('guide_trip_options').delete().eq('id', id)
  revalidatePath('/settings')
}

export async function createTripOptionInline(categoryId: string, label: string): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('guide_trip_options')
    .insert({ category_id: categoryId, guide_id: user!.id, label })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return data.id
}

export async function saveTripTypeSelections(tripId: string, optionIds: string[]) {
  const supabase = await createClient()
  await supabase.from('trip_type_selections').delete().eq('trip_id', tripId)
  if (optionIds.length > 0) {
    await supabase.from('trip_type_selections').insert(
      optionIds.map(option_id => ({ trip_id: tripId, option_id }))
    )
  }
}

// ── Staff / Guides ────────────────────────────────────────────────────────────

export async function addStaff(name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase.from('guide_staff').insert({ guide_id: user!.id, name })
  if (error) throw new Error(error.message)
  revalidatePath('/settings')
}

export async function deleteStaff(id: string) {
  const supabase = await createClient()
  await supabase.from('guide_staff').delete().eq('id', id)
  revalidatePath('/settings')
}
