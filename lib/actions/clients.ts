'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createClientRecord(input: {
  name: string
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase.from('clients').insert({ ...input, guide_id: user!.id })
  if (error) throw new Error(error.message)
  revalidatePath('/clients')
}

export async function updateClientRecord(id: string, input: {
  name: string
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
}) {
  const supabase = await createClient()
  const { error } = await supabase.from('clients').update(input).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/clients/${id}`)
  revalidatePath('/clients')
}

export async function deleteClientRecord(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/clients')
}
