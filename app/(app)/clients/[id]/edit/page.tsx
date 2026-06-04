import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { EditClientForm } from './edit-client-form'

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: client }, { data: trips }] = await Promise.all([
    supabase.from('clients').select('*').eq('id', id).single(),
    supabase.from('trips').select('id, trip_date, price, amount_collected, status').eq('client_id', id).eq('status', 'completed').order('trip_date', { ascending: false }),
  ])

  if (!client) notFound()

  const outstanding = (trips ?? []).reduce((sum, t) => sum + Math.max(0, (t.price ?? 0) - (t.amount_collected ?? 0)), 0)

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Edit Client</h1>
      <EditClientForm client={client} trips={trips ?? []} outstanding={outstanding} />
    </div>
  )
}
