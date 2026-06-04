import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ClientList } from './client-list'

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: clients } = await supabase
    .from('clients')
    .select('*, trips(id)')
    .eq('guide_id', user!.id)
    .order('name')

  const clientData = (clients ?? []).map(c => ({
    id: c.id,
    name: c.name,
    phone: c.phone ?? null,
    email: c.email ?? null,
    tripCount: (c.trips as { id: string }[])?.length ?? 0,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
        <Link href="/clients/new" className="bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
          + Add Client
        </Link>
      </div>
      <ClientList clients={clientData} />
    </div>
  )
}
