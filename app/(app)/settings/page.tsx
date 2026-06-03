import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: guide } = await supabase.from('guides').select('*').eq('id', user!.id).single()

  async function updateProfile(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('guides').update({
      name: formData.get('name') as string,
      business_name: (formData.get('business_name') as string) || null,
      location: (formData.get('location') as string) || null,
    }).eq('id', user!.id)
    revalidatePath('/settings')
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      <form action={updateProfile} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <h2 className="font-semibold text-slate-900">Profile</h2>
        {[
          { name: 'name', label: 'Your Name', defaultValue: guide?.name },
          { name: 'business_name', label: 'Business Name', defaultValue: guide?.business_name },
          { name: 'location', label: 'Location', defaultValue: guide?.location },
        ].map(f => (
          <div key={f.name}>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{f.label}</label>
            <input
              name={f.name}
              type="text"
              defaultValue={f.defaultValue ?? ''}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        ))}
        <button type="submit" className="w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">
          Save Changes
        </button>
      </form>
    </div>
  )
}
