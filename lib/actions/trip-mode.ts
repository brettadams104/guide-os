'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function startTrip(tripId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('trips')
    .update({ started_at: new Date().toISOString(), status: 'scheduled' })
    .eq('id', tripId)
  if (error) return { error: error.message }
  revalidatePath(`/trips/${tripId}`)
  return {}
}

export async function pauseTrip(tripId: string): Promise<{ error?: string }> {
  // Pausing doesn't change DB — just navigation back to trip detail
  revalidatePath(`/trips/${tripId}`)
  return {}
}

export async function finishTrip(tripId: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  // Mark trip ended
  const { error: updateError } = await supabase
    .from('trips')
    .update({ ended_at: new Date().toISOString(), status: 'completed' })
    .eq('id', tripId)
  if (updateError) return { error: updateError.message }

  // Merge live catches into trip_catches
  const { data: liveCatches } = await supabase
    .from('trip_live_catches')
    .select('species, count')
    .eq('trip_id', tripId)

  if (liveCatches && liveCatches.length > 0) {
    // Group by species, sum counts
    const merged: Record<string, number> = {}
    liveCatches.forEach(c => { merged[c.species] = (merged[c.species] ?? 0) + c.count })

    // Get existing catches
    const { data: existing } = await supabase
      .from('trip_catches')
      .select('id, species, count')
      .eq('trip_id', tripId)

    for (const [species, count] of Object.entries(merged)) {
      const existingEntry = existing?.find(e => e.species.toLowerCase() === species.toLowerCase())
      if (existingEntry) {
        await supabase.from('trip_catches').update({ count: existingEntry.count + count }).eq('id', existingEntry.id)
      } else {
        await supabase.from('trip_catches').insert({ trip_id: tripId, species, count })
      }
    }
  }

  revalidatePath(`/trips/${tripId}`)
  return {}
}

export async function logCatch(tripId: string, species: string, count: number): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('trip_live_catches')
    .insert({ trip_id: tripId, species: species.trim(), count })
    .select('id')
    .single()
  if (error) return { error: error.message }
  return { id: data.id }
}

export async function deleteCatch(catchId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('trip_live_catches').delete().eq('id', catchId)
  if (error) return { error: error.message }
  return {}
}

export async function saveLiveNotes(tripId: string, notes: string): Promise<void> {
  const supabase = await createClient()
  await supabase.from('trips').update({ live_notes: notes }).eq('id', tripId)
}

export async function uploadTripLivePhoto(tripId: string, file: File): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${user!.id}/${tripId}/live-${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage.from('trip-photos').upload(path, file)
  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = supabase.storage.from('trip-photos').getPublicUrl(path)
  const { error } = await supabase.from('trip_photos').insert({ trip_id: tripId, url: publicUrl })
  if (error) return { error: error.message }

  return { url: publicUrl }
}
