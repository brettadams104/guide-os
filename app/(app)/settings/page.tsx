import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { addStaff, deleteStaff } from '@/lib/actions/trip-options'
import { TimeSlotManager } from '@/components/time-slot-manager'
import { AccountSettings } from '@/components/account-settings'
import { SpeciesPresetManager } from '@/components/species-preset-manager'
import { LurePresetManager } from '@/components/lure-preset-manager'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: guide } = await supabase.from('guides').select('*').eq('id', user!.id).single()

  const [{ data: timeSlots }, { data: staff }] = await Promise.all([
    supabase.from('guide_time_slots').select('id, label, start_time, end_time, price').eq('guide_id', user!.id).order('sort_order').order('created_at'),
    supabase.from('guide_staff').select('*').eq('guide_id', user!.id).order('name'),
  ])
  const speciesPresets: string[] = (guide as any)?.species_presets ?? []
  const lurePresets: string[] = (guide as any)?.lure_presets ?? []

  async function updateProfile(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('guides').update({
      name: formData.get('name') as string,
      business_name: (formData.get('business_name') as string) || null,
      phone: (formData.get('phone') as string) || null,
      address: (formData.get('address') as string) || null,
      location: (formData.get('location') as string) || null,
    }).eq('id', user!.id)
    revalidatePath('/settings')
  }


  async function handleAddStaff(formData: FormData) {
    'use server'
    const name = formData.get('staff_name') as string
    if (name?.trim()) await addStaff(name.trim())
  }

  return (
    <div className="max-w-xl space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>

      {/* Profile */}
      <form action={updateProfile} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <h2 className="font-semibold text-slate-900">Profile</h2>
        {[
          { name: 'name', label: 'Your Name', defaultValue: guide?.name },
          { name: 'business_name', label: 'Business Name', defaultValue: guide?.business_name },
          { name: 'phone', label: 'Phone', defaultValue: (guide as any)?.phone },
          { name: 'address', label: 'Address', defaultValue: (guide as any)?.address },
          { name: 'location', label: 'Default Location (for weather)', defaultValue: guide?.location },
        ].map(f => (
          <div key={f.name}>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{f.label}</label>
            <input name={f.name} type="text" defaultValue={f.defaultValue ?? ''} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
        ))}
        <button type="submit" className="w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">Save Changes</button>
      </form>

      {/* Account */}
      <AccountSettings currentEmail={user!.email ?? ''} />

      {/* Quick Catch Species */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-slate-900">Quick Catch Species</h2>
          <p className="text-xs text-slate-400 mt-0.5">These appear as one-tap buttons in Trip Mode when logging a catch</p>
        </div>
        <SpeciesPresetManager presets={speciesPresets} />
      </div>

      {/* Quick Lure / Bait Presets */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-slate-900">Caught On Presets</h2>
          <p className="text-xs text-slate-400 mt-0.5">Lures and baits that appear as one-tap buttons when logging a catch in Trip Mode</p>
        </div>
        <LurePresetManager presets={lurePresets} />
      </div>

      {/* Offered Packages */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-slate-900">Offered Packages</h2>
          <p className="text-xs text-slate-400 mt-0.5">Add the packages you offer — single day with times (Half Day, Full Day) or multi-day trips (3-Day Float)</p>
        </div>
        <TimeSlotManager slots={(timeSlots ?? []) as any} />
      </div>

      {/* Guides / Staff */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-slate-900">Your Guides</h2>
          <p className="text-xs text-slate-400 mt-0.5">Add guides or staff that can be assigned to trips</p>
        </div>
        {staff?.length ? (
          <ul className="space-y-2">
            {staff.map(s => (
              <li key={s.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5">
                <p className="text-sm font-medium text-slate-900">{s.name}</p>
                <form action={deleteStaff.bind(null, s.id)}>
                  <button type="submit" className="text-xs text-red-400 hover:text-red-600">Remove</button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">No guides added yet.</p>
        )}
        <form action={handleAddStaff} className="flex gap-3 pt-2 border-t border-slate-100">
          <input name="staff_name" type="text" placeholder="Guide name" required className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          <button type="submit" className="border border-sky-300 text-sky-600 hover:bg-sky-50 font-medium px-4 py-2 rounded-xl transition-colors text-sm whitespace-nowrap">+ Add</button>
        </form>
      </div>
    </div>
  )
}
