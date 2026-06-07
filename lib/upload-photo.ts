import { createClient } from '@/lib/supabase/client'
import { saveTripPhotoRecord } from '@/lib/actions/trip-mode'

// Compress image to max 1200px wide, 85% quality JPEG — reduces 5-10MB phone photos to ~200-400KB
async function compressImage(file: File): Promise<Blob> {
  return new Promise(resolve => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const MAX = 1200
      const ratio = Math.min(1, MAX / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * ratio)
      canvas.height = Math.round(img.height * ratio)
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(blob => resolve(blob!), 'image/jpeg', 0.85)
    }
    img.src = url
  })
}

// Upload directly from browser to Supabase Storage — no server middleman
export async function uploadPhotoDirectly(
  file: File,
  tripId: string
): Promise<{ url?: string; id?: string; error?: string }> {
  try {
    const compressed = await compressImage(file)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const path = `${user.id}/${tripId}/live-${Date.now()}.jpg`
    const { error: uploadError } = await supabase.storage
      .from('trip-photos')
      .upload(path, compressed, { contentType: 'image/jpeg' })

    if (uploadError) return { error: uploadError.message }

    const { data: { publicUrl } } = supabase.storage.from('trip-photos').getPublicUrl(path)

    // Only the URL goes through the server action — tiny payload, instant
    const { id, error } = await saveTripPhotoRecord(tripId, publicUrl)
    if (error) return { error }

    return { url: publicUrl, id }
  } catch (err) {
    return { error: (err as Error).message }
  }
}
