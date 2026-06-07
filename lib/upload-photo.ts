import { createClient } from '@/lib/supabase/client'
import { saveTripPhotoRecord } from '@/lib/actions/trip-mode'

// Upload directly from browser to Supabase Storage — no server middleman
// Skips canvas compression to avoid HEIC/format issues on iOS
export async function uploadPhotoDirectly(
  file: File,
  tripId: string
): Promise<{ url?: string; id?: string; error?: string }> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path = `${user.id}/${tripId}/live-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('trip-photos')
      .upload(path, file, { contentType: file.type || 'image/jpeg' })

    if (uploadError) return { error: uploadError.message }

    const { data: { publicUrl } } = supabase.storage.from('trip-photos').getPublicUrl(path)

    const { id, error } = await saveTripPhotoRecord(tripId, publicUrl)
    if (error) return { error }

    return { url: publicUrl, id }
  } catch (err) {
    return { error: (err as Error).message }
  }
}
