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

export async function logCatch(
  tripId: string,
  species: string,
  count: number,
  opts?: { sizeInches?: number; weightLbs?: number; caughtOn?: string; photoUrl?: string }
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('trip_live_catches')
    .insert({
      trip_id: tripId,
      species: species.trim(),
      count,
      size_inches: opts?.sizeInches ?? null,
      weight_lbs: opts?.weightLbs ?? null,
      caught_on: opts?.caughtOn?.trim() || null,
      photo_url: opts?.photoUrl ?? null,
    })
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

export async function collectTripPayment(tripId: string, amount: number, method: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: trip } = await supabase.from('trips').select('amount_collected').eq('id', tripId).single()
  const newTotal = ((trip as any)?.amount_collected ?? 0) + amount
  const { error } = await supabase.from('trips')
    .update({ amount_collected: newTotal, payment_method: method })
    .eq('id', tripId)
  if (error) return { error: error.message }
  revalidatePath(`/trips/${tripId}/summary`)
  revalidatePath(`/trips/${tripId}`)
  return {}
}

export async function addSpeciesPreset(species: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: guide } = await supabase.from('guides').select('species_presets').eq('id', user!.id).single()
  const current: string[] = (guide as any)?.species_presets ?? []
  if (current.some(s => s.toLowerCase() === species.toLowerCase())) return
  await supabase.from('guides').update({ species_presets: [...current, species] }).eq('id', user!.id)
  revalidatePath('/settings')
}

export async function removeSpeciesPreset(species: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: guide } = await supabase.from('guides').select('species_presets').eq('id', user!.id).single()
  const current: string[] = (guide as any)?.species_presets ?? []
  await supabase.from('guides').update({ species_presets: current.filter(s => s !== species) }).eq('id', user!.id)
  revalidatePath('/settings')
}

export async function addLurePreset(lure: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: guide } = await supabase.from('guides').select('lure_presets').eq('id', user!.id).single()
  const current: string[] = (guide as any)?.lure_presets ?? []
  if (current.some(s => s.toLowerCase() === lure.toLowerCase())) return
  await supabase.from('guides').update({ lure_presets: [...current, lure] }).eq('id', user!.id)
  revalidatePath('/settings')
}

export async function removeLurePreset(lure: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: guide } = await supabase.from('guides').select('lure_presets').eq('id', user!.id).single()
  const current: string[] = (guide as any)?.lure_presets ?? []
  await supabase.from('guides').update({ lure_presets: current.filter(s => s !== lure) }).eq('id', user!.id)
  revalidatePath('/settings')
}

// Legacy server-side upload — kept for backwards compat but prefer saveTripPhotoRecord
export async function uploadTripLivePhoto(tripId: string, file: File): Promise<{ url?: string; id?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${user!.id}/${tripId}/live-${Date.now()}.${ext}`
  const { error: uploadError } = await supabase.storage.from('trip-photos').upload(path, file)
  if (uploadError) return { error: uploadError.message }
  const { data: { publicUrl } } = supabase.storage.from('trip-photos').getPublicUrl(path)
  const { data, error } = await supabase.from('trip_photos').insert({ trip_id: tripId, url: publicUrl }).select('id').single()
  if (error) return { error: error.message }
  return { url: publicUrl, id: data.id }
}

// Lightweight server action — just saves URL after browser-side direct upload
export async function saveTripPhotoRecord(tripId: string, url: string): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('trip_photos').insert({ trip_id: tripId, url }).select('id').single()
  if (error) return { error: error.message }
  revalidatePath(`/trips/${tripId}/live`)
  return { id: data.id }
}

export async function deleteTripPhoto(photoId: string): Promise<void> {
  const supabase = await createClient()
  const { data: photo } = await supabase.from('trip_photos').select('url').eq('id', photoId).single()
  if (photo?.url) {
    const marker = '/trip-photos/'
    const idx = photo.url.indexOf(marker)
    if (idx !== -1) {
      await supabase.storage.from('trip-photos').remove([photo.url.slice(idx + marker.length)])
    }
  }
  await supabase.from('trip_photos').delete().eq('id', photoId)
}
