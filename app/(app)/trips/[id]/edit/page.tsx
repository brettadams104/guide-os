import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { EditTripForm } from './edit-trip-form'

export default async function EditTripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: trip }, { data: timeSlots }, { data: staff }] = await Promise.all([
    supabase.from('trips').select('*').eq('id', id).single(),
    supabase.from('guide_time_slots').select('id, label, start_time, end_time').eq('guide_id', user!.id).order('sort_order'),
    supabase.from('guide_staff').select('id, name').eq('guide_id', user!.id).order('name'),
  ])

  if (!trip) notFound()

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Edit Trip</h1>
      <EditTripForm
        trip={trip}
        timeSlots={timeSlots ?? []}
        staff={staff ?? []}
      />
    </div>
  )
}
