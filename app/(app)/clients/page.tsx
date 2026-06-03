import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: clients } = await supabase
    .from('clients')
    .select('*, trips(id)')
    .eq('guide_id', user!.id)
    .order('name')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
        <Link href="/clients/new" className="bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
          + Add Client
        </Link>
      </div>

      {!clients?.length ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <p className="text-slate-400">No clients yet.</p>
          <Link href="/clients/new" className="text-sky-500 text-sm mt-2 inline-block hover:text-sky-400">Add your first client →</Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {clients.map(client => (
              <li key={client.id}>
                <Link href={`/clients/${client.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{client.name}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{client.phone ?? client.email ?? 'No contact info'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">{(client.trips as { id: string }[])?.length ?? 0} trips</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
