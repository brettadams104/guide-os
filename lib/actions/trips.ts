'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { fetchWeatherForTrip } from '@/lib/weather'
import type { PaymentMethod } from '@/lib/types'

export async function scheduleTrip(input: {
  client_id: string | null
  trip_date: string
  location: string | null
  notes: string | null
  price: number | null
  deposit_paid: number
  payment_method: PaymentMethod | null
  time_slot_id: string | null
  trip_type_id: string | null
  assigned_staff_id: string | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: trip, error } = await supabase.from('trips').insert({
    guide_id: user!.id,
    client_id: input.client_id || null,
    trip_date: input.trip_date,
    location: input.location,
    notes: input.notes,
    price: input.price,
    deposit_paid: input.deposit_paid,
    amount_collected: input.deposit_paid,
    payment_method: input.payment_method,
    status: 'scheduled',
    time_slot_id: input.time_slot_id || null,
    trip_type_id: input.trip_type_id || null,
    assigned_staff_id: input.assigned_staff_id || null,
  }).select('id').single()
  if (error) throw new Error(error.message)
  revalidatePath('/trips')
  revalidatePath('/dashboard')
  return trip.id
}

export async function logTripDetails(tripId: string, input: {
  catches: { species: string; count: number }[]
  amount_collected: number
  payment_method: PaymentMethod | null
  notes: string | null
  latitude?: number
  longitude?: number
  trip_date: string
}) {
  const supabase = await createClient()

  await supabase.from('trips').update({
    amount_collected: input.amount_collected,
    payment_method: input.payment_method,
    notes: input.notes,
    status: 'completed',
  }).eq('id', tripId)

  // Insert catches
  if (input.catches.length > 0) {
    await supabase.from('trip_catches').delete().eq('trip_id', tripId)
    await supabase.from('trip_catches').insert(
      input.catches.map(c => ({ trip_id: tripId, species: c.species, count: c.count }))
    )
  }

  // Fetch weather if not already fetched
  const { data: existing } = await supabase.from('trip_conditions').select('id').eq('trip_id', tripId).single()
  if (!existing) {
    const lat = input.latitude ?? 44.5
    const lon = input.longitude ?? -89.5
    const conditions = await fetchWeatherForTrip(input.trip_date, lat, lon)
    if (conditions) {
      await supabase.from('trip_conditions').insert({ trip_id: tripId, ...conditions })
    }
  }

  revalidatePath('/trips')
  revalidatePath(`/trips/${tripId}`)
  revalidatePath('/dashboard')
}

export async function createTrip(input: {
  client_id: string | null
  trip_date: string
  location: string | null
  notes: string | null
  price: number | null
  deposit_paid: number
  amount_collected: number
  payment_method: PaymentMethod | null
  catches: { species: string; count: number }[]
  latitude?: number
  longitude?: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: trip, error } = await supabase.from('trips').insert({
    guide_id: user!.id,
    client_id: input.client_id || null,
    trip_date: input.trip_date,
    location: input.location,
    notes: input.notes,
    price: input.price,
    deposit_paid: input.deposit_paid,
    amount_collected: input.amount_collected,
    payment_method: input.payment_method,
  }).select('id').single()

  if (error) throw new Error(error.message)

  // Insert catches
  if (input.catches.length > 0) {
    await supabase.from('trip_catches').insert(
      input.catches.map(c => ({ trip_id: trip.id, species: c.species, count: c.count }))
    )
  }

  // Fetch and store weather conditions (default to Wisconsin if no location coords)
  const lat = input.latitude ?? 44.5
  const lon = input.longitude ?? -89.5
  const conditions = await fetchWeatherForTrip(input.trip_date, lat, lon)
  if (conditions) {
    await supabase.from('trip_conditions').insert({ trip_id: trip.id, ...conditions })
  }

  revalidatePath('/trips')
  revalidatePath('/dashboard')
  return trip.id
}

export async function deleteTrip(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('trips').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/trips')
  revalidatePath('/dashboard')
}

export async function updateTrip(id: string, input: {
  trip_date: string
  location: string | null
  notes: string | null
  price: number | null
  deposit_paid: number
  amount_collected: number
  payment_method: PaymentMethod | null
  time_slot_id: string | null
  assigned_staff_id: string | null
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('trips').update({
    trip_date: input.trip_date,
    location: input.location,
    notes: input.notes,
    price: input.price,
    deposit_paid: input.deposit_paid,
    amount_collected: input.amount_collected,
    payment_method: input.payment_method,
    time_slot_id: input.time_slot_id || null,
    assigned_staff_id: input.assigned_staff_id || null,
  }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/trips/${id}`)
  revalidatePath('/trips')
  revalidatePath('/dashboard')
  return {}
}

export async function rescheduleTrip(id: string, newDate: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('trips').update({ trip_date: newDate, status: 'scheduled' }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/trips/${id}`)
  revalidatePath('/trips')
  revalidatePath('/dashboard')
  return {}
}

export async function uploadTripPhoto(tripId: string, file: File) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const ext = file.name.split('.').pop()
  const path = `${user!.id}/${tripId}/${Date.now()}.${ext}`
  const { error: uploadError } = await supabase.storage.from('trip-photos').upload(path, file)
  if (uploadError) throw new Error(uploadError.message)
  const { data: { publicUrl } } = supabase.storage.from('trip-photos').getPublicUrl(path)
  const { error } = await supabase.from('trip_photos').insert({ trip_id: tripId, url: publicUrl })
  if (error) throw new Error(error.message)
  revalidatePath(`/trips/${tripId}`)
}
