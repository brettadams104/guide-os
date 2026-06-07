'use client'

import { useState, useRef } from 'react'
import { deleteTripPhoto } from '@/lib/actions/trip-mode'
import { uploadPhotoDirectly } from '@/lib/upload-photo'
import { CameraIcon, GalleryIcon } from '@/components/photo-icons'

interface Photo { id: string; url: string }

function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  async function handleSave() {
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const file = new File([blob], 'trip-photo.jpg', { type: blob.type || 'image/jpeg' })
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Trip Photo' })
      } else {
        // Fallback: open in new tab so user can long-press to save
        window.open(url, '_blank')
      }
    } catch {
      window.open(url, '_blank')
    }
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col" onClick={onClose}>
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <button onClick={onClose} className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center text-white text-lg">✕</button>
        <button
          onClick={e => { e.stopPropagation(); handleSave() }}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Save to Camera Roll
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center p-4" onClick={onClose}>
        <img src={url} alt="Full size" className="max-w-full max-h-full object-contain rounded-xl" onClick={e => e.stopPropagation()} />
      </div>
    </div>
  )
}

export function PhotosTab({ tripId, initialPhotos }: { tripId: string; initialPhotos: Photo[] }) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
  const [uploading, setUploading] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setUploading(true)
    const result = await uploadPhotoDirectly(file, tripId)
    if (result.url && result.id) {
      setPhotos(prev => [{ id: result.id!, url: result.url! }, ...prev])
    }
    setUploading(false)
  }

  async function handleDelete(photoId: string, e: React.MouseEvent) {
    e.stopPropagation()
    setPhotos(prev => prev.filter(p => p.id !== photoId))
    await deleteTripPhoto(photoId)
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => cameraRef.current?.click()}
          className="bg-[#0f1f35] text-white rounded-2xl py-5 flex flex-col items-center gap-2 font-semibold text-sm hover:bg-[#1a3254] transition-colors"
        >
          <CameraIcon size={30} color="white" />
          Take Photo
        </button>
        <button
          onClick={() => galleryRef.current?.click()}
          className="bg-white border border-slate-200 text-slate-700 rounded-2xl py-5 flex flex-col items-center gap-2 font-semibold text-sm hover:bg-slate-50 transition-colors"
        >
          <GalleryIcon size={30} color="#475569" />
          Camera Roll
        </button>
      </div>

      {/* capture="environment" → iOS opens camera directly AND saves to camera roll automatically */}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

      {uploading && (
        <div className="bg-sky-50 border border-sky-200 rounded-xl px-4 py-3 text-sm text-sky-600 font-medium text-center">
          Uploading photo...
        </div>
      )}

      {photos.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {photos.map(p => (
            <div key={p.id} className="relative group cursor-pointer" onClick={() => setSelected(p.url)}>
              <img src={p.url} alt="Trip photo" className="w-full h-40 object-cover rounded-2xl" />
              <button
                onClick={e => handleDelete(p.id, e)}
                className="absolute top-2 right-2 w-6 h-6 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center text-xs leading-none transition-colors"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <p className="text-slate-400 text-sm">No photos yet — tap Take Photo to get started.</p>
        </div>
      )}

      {selected && (
        <Lightbox url={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
