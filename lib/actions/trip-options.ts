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

export async function deleteTimeSlot(id: string) {
  const supabase = await createClient()
  await supabase.from('guide_time_slots').delete().eq('id', id)
  revalidatePath('/settings')
}

// ── Trip Types ────────────────────────────────────────────────────────────────

export async function addTripType(label: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase.from('guide_trip_types').insert({ guide_id: user!.id, label })
  if (error) throw new Error(error.message)
  revalidatePath('/settings')
}

export async function deleteTripType(id: string) {
  const supabase = await createClient()
  await supabase.from('guide_trip_types').delete().eq('id', id)
  revalidatePath('/settings')
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
