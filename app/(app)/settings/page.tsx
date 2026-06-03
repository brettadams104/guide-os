import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { addTimeSlot, deleteTimeSlot, addTripCategory, deleteTripCategory, addTripOption, deleteTripOption, addStaff, deleteStaff } from '@/lib/actions/trip-options'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: guide } = await supabase.from('guides').select('*').eq('id', user!.id).single()

  const [{ data: timeSlots }, { data: categories }, { data: staff }] = await Promise.all([
    supabase.from('guide_time_slots').select('*').eq('guide_id', user!.id).order('sort_order').order('created_at'),
    supabase.from('guide_trip_categories').select('*, guide_trip_options(*)').eq('guide_id', user!.id).order('sort_order').order('created_at'),
    supabase.from('guide_staff').select('*').eq('guide_id', user!.id).order('name'),
  ])

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

  async function handleAddTimeSlot(formData: FormData) {
    'use server'
    const label = formData.get('slot_label') as string
    const start = (formData.get('slot_start') as string) || null
    const end = (formData.get('slot_end') as string) || null
    if (label?.trim()) await addTimeSlot(label.trim(), start, end)
  }

  async function handleAddCategory(formData: FormData) {
    'use server'
    const name = formData.get('cat_name') as string
    if (name?.trim()) await addTripCategory(name.trim())
  }

  async function handleAddOption(formData: FormData) {
    'use server'
    const categoryId = formData.get('category_id') as string
    const label = formData.get('label') as string
    if (categoryId && label?.trim()) await addTripOption(categoryId, label.trim())
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
          { name: 'location', label: 'Location', defaultValue: guide?.location },
        ].map(f => (
          <div key={f.name}>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{f.label}</label>
            <input name={f.name} type="text" defaultValue={f.defaultValue ?? ''} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
        ))}
        <button type="submit" className="w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">Save Changes</button>
      </form>

      {/* Time Slots */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-slate-900">Time Slots</h2>
          <p className="text-xs text-slate-400 mt-0.5">Create the trip durations you offer (e.g. Half Day, Full Day)</p>
        </div>
        {timeSlots?.length ? (
          <ul className="space-y-2">
            {timeSlots.map(slot => (
              <li key={slot.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5">
                <div>
                  <p className="text-sm font-medium text-slate-900">{slot.label}</p>
                  {(slot.start_time || slot.end_time) && (
                    <p className="text-xs text-slate-400">{slot.start_time}{slot.start_time && slot.end_time ? ' – ' : ''}{slot.end_time}</p>
                  )}
                </div>
                <form action={deleteTimeSlot.bind(null, slot.id)}>
                  <button type="submit" className="text-xs text-red-400 hover:text-red-600">Remove</button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">No time slots yet — add your first below.</p>
        )}
        <form action={handleAddTimeSlot} className="space-y-3 pt-2 border-t border-slate-100">
          <p className="text-xs font-medium text-slate-600">Add Time Slot</p>
          <input name="slot_label" type="text" placeholder='e.g. "Half Day", "Full Day"' required className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Start Time <span className="text-slate-300">(optional)</span></label>
              <input name="slot_start" type="time" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">End Time <span className="text-slate-300">(optional)</span></label>
              <input name="slot_end" type="time" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
          </div>
          <button type="submit" className="w-full border border-sky-300 text-sky-600 hover:bg-sky-50 font-medium py-2 rounded-xl transition-colors text-sm">+ Add Time Slot</button>
        </form>
      </div>

      {/* Trip Categories */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <div>
          <h2 className="font-semibold text-slate-900">Trip Details</h2>
          <p className="text-xs text-slate-400 mt-0.5">Create categories for your trips — e.g. Species Targeted, Gear Type, Boat or Wade, etc.</p>
        </div>

        {categories?.map((cat: any) => {
          const options = cat.guide_trip_options as { id: string; label: string }[]
          return (
            <div key={cat.id} className="border border-slate-100 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-900 text-sm">{cat.name}</p>
                <form action={deleteTripCategory.bind(null, cat.id)}>
                  <button type="submit" className="text-xs text-red-400 hover:text-red-600">Remove category</button>
                </form>
              </div>
              {options?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {options.map(opt => (
                    <div key={opt.id} className="flex items-center gap-1 bg-slate-100 rounded-full pl-3 pr-1.5 py-1">
                      <span className="text-xs font-medium text-slate-700">{opt.label}</span>
                      <form action={deleteTripOption.bind(null, opt.id)}>
                        <button type="submit" className="text-slate-400 hover:text-red-400 text-xs leading-none">✕</button>
                      </form>
                    </div>
                  ))}
                </div>
              )}
              <form action={handleAddOption} className="flex gap-2">
                <input type="hidden" name="category_id" value={cat.id} />
                <input name="label" type="text" placeholder={`Add ${cat.name} option...`} required className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500" />
                <button type="submit" className="border border-sky-300 text-sky-600 hover:bg-sky-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">+ Add</button>
              </form>
            </div>
          )
        })}

        <form action={handleAddCategory} className="flex gap-3 pt-2 border-t border-slate-100">
          <input name="cat_name" type="text" placeholder='e.g. "Species Targeted", "Gear Type", "Boat or Wade"' required className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          <button type="submit" className="border border-sky-300 text-sky-600 hover:bg-sky-50 font-medium px-4 py-2 rounded-xl transition-colors text-sm whitespace-nowrap">+ Add</button>
        </form>
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
