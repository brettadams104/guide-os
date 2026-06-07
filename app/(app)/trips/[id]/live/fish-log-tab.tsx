'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { logCatch, deleteCatch, addSpeciesPreset, addLurePreset } from '@/lib/actions/trip-mode'
import { uploadPhotoDirectly } from '@/lib/upload-photo'
import { CameraIcon, GalleryIcon } from '@/components/photo-icons'


interface Catch {
  id: string
  species: string
  count: number
  logged_at: string
  size_inches?: number | null
  weight_lbs?: number | null
  caught_on?: string | null
  photo_url?: string | null
}

interface FishDetail {
  sizeInches: string
  weightLbs: string
}

interface Photo { id: string; url: string }

interface Props {
  tripId: string
  initialCatches: Catch[]
  initialPhotos: Photo[]
  speciesPresets: string[]
  lurePresets: string[]
}

export function FishLogTab({ tripId, initialCatches, initialPhotos: _initialPhotos, speciesPresets: initialSpecies, lurePresets: initialLures }: Props) {
  const [catches, setCatches] = useState<Catch[]>(initialCatches)
  const [speciesPresets, setSpeciesPresets] = useState<string[]>(initialSpecies)
  const [lurePresets, setLurePresets] = useState<string[]>(initialLures)

  const [species, setSpecies] = useState('')
  const [caughtOn, setCaughtOn] = useState('')
  const [count, setCount] = useState(1)
  const [fishDetails, setFishDetails] = useState<FishDetail[]>([{ sizeInches: '', weightLbs: '' }])

  // Pending photo for the current log entry
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null)
  const [pendingPreview, setPendingPreview] = useState<string | null>(null)

  // Full-screen viewer
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)

  const caughtOnRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  // Keep fishDetails array in sync with count
  useEffect(() => {
    setFishDetails(prev => {
      if (prev.length === count) return prev
      if (prev.length < count)
        return [...prev, ...Array(count - prev.length).fill(null).map(() => ({ sizeInches: '', weightLbs: '' }))]
      return prev.slice(0, count)
    })
  }, [count])

  function updateFish(index: number, field: keyof FishDetail, value: string) {
    setFishDetails(prev => prev.map((f, i) => i === index ? { ...f, [field]: value } : f))
  }

  function handlePhotoFile(file: File) {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview)
    setPendingPhoto(file)
    setPendingPreview(URL.createObjectURL(file))
  }

  function clearPendingPhoto() {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview)
    setPendingPhoto(null)
    setPendingPreview(null)
    if (galleryRef.current) galleryRef.current.value = ''
  }

  const totalFish = catches.reduce((s, c) => s + c.count, 0)

  async function handleLog() {
    if (!species.trim()) return
    setSaving(true)

    const s = species.trim()
    const lure = caughtOn.trim() || undefined
    const now = new Date().toISOString()

    // Upload photo once (shared across all fish in this batch)
    let photoUrl: string | undefined
    if (pendingPhoto) {
      const result = await uploadPhotoDirectly(pendingPhoto, tripId)
      if (result.url) photoUrl = result.url
    }

    const newCatches: Catch[] = []
    for (let i = 0; i < count; i++) {
      const fd = fishDetails[i] ?? { sizeInches: '', weightLbs: '' }
      const result = await logCatch(tripId, s, 1, {
        sizeInches: fd.sizeInches ? parseFloat(fd.sizeInches) : undefined,
        weightLbs: fd.weightLbs ? parseFloat(fd.weightLbs) : undefined,
        caughtOn: lure,
        photoUrl,
      })
      if (!result.error && result.id) {
        newCatches.push({
          id: result.id,
          species: s,
          count: 1,
          logged_at: now,
          size_inches: fd.sizeInches ? parseFloat(fd.sizeInches) : null,
          weight_lbs: fd.weightLbs ? parseFloat(fd.weightLbs) : null,
          caught_on: lure ?? null,
          photo_url: photoUrl ?? null,
        })
      }
    }

    if (newCatches.length > 0) {
      setCatches(prev => [...newCatches.reverse(), ...prev])

      if (!speciesPresets.some(p => p.toLowerCase() === s.toLowerCase())) {
        addSpeciesPreset(s)
        setSpeciesPresets(prev => [...prev, s])
      }
      if (lure && !lurePresets.some(p => p.toLowerCase() === lure.toLowerCase())) {
        addLurePreset(lure)
        setLurePresets(prev => [...prev, lure])
      }

      setSpecies('')
      setCaughtOn('')
      setCount(1)
      setFishDetails([{ sizeInches: '', weightLbs: '' }])
      clearPendingPhoto()
    }

    setSaving(false)
  }

  async function handleDelete(catchId: string) {
    await deleteCatch(catchId)
    setCatches(prev => prev.filter(c => c.id !== catchId))
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Total */}
      <div className="bg-sky-500 rounded-2xl p-5 text-center">
        <p className="text-sky-100 text-xs uppercase tracking-widest font-semibold">Total Fish</p>
        <p className="text-5xl font-black text-white mt-1">{totalFish}</p>
      </div>

      {/* Log entry form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">

        {/* Species */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Species</p>
          {speciesPresets.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {speciesPresets.map(sp => (
                <button key={sp} type="button" onClick={() => setSpecies(sp)}
                  className={`px-3.5 py-2 rounded-full text-sm font-medium border transition-colors ${
                    species === sp ? 'bg-sky-500 text-white border-sky-500' : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-sky-400 hover:text-sky-600'
                  }`}>
                  {sp}
                </button>
              ))}
            </div>
          )}
          <input type="text" value={species} onChange={e => setSpecies(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') caughtOnRef.current?.focus() }}
            placeholder={speciesPresets.length > 0 ? 'Or type a different species…' : 'Species (e.g. Largemouth Bass)'}
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
        </div>

        {/* Caught On */}
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Caught On</p>
          {lurePresets.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {lurePresets.map(sp => (
                <button key={sp} type="button" onClick={() => setCaughtOn(sp)}
                  className={`px-3.5 py-2 rounded-full text-sm font-medium border transition-colors ${
                    caughtOn === sp ? 'bg-sky-500 text-white border-sky-500' : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-sky-400 hover:text-sky-600'
                  }`}>
                  {sp}
                </button>
              ))}
            </div>
          )}
          <input ref={caughtOnRef} type="text" value={caughtOn} onChange={e => setCaughtOn(e.target.value)}
            placeholder={lurePresets.length > 0 ? 'Or type a lure / bait…' : 'Lure or bait (optional)'}
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
        </div>

        {/* Count stepper */}
        <div className="pt-1 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">How Many?</p>
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => setCount(c => Math.max(1, c - 1))}
                className="w-9 h-9 rounded-full border border-slate-200 text-slate-600 text-xl font-bold hover:bg-slate-50 flex items-center justify-center transition-colors">
                −
              </button>
              <span className="text-2xl font-black text-slate-900 w-6 text-center">{count}</span>
              <button type="button" onClick={() => setCount(c => c + 1)}
                className="w-9 h-9 rounded-full border border-slate-200 text-slate-600 text-xl font-bold hover:bg-slate-50 flex items-center justify-center transition-colors">
                +
              </button>
            </div>
          </div>

          {/* Per-fish size / weight rows */}
          <div className="space-y-2">
            {fishDetails.map((fd, i) => (
              <div key={i} className="flex items-center gap-2">
                {count > 1 && (
                  <span className="text-xs font-semibold text-slate-400 w-11 shrink-0 text-right">Fish {i + 1}</span>
                )}
                <div className="grid grid-cols-2 gap-2 flex-1">
                  <div>
                    {i === 0 && <label className="block text-xs text-slate-400 mb-1">Size (in) <span className="text-slate-300">optional</span></label>}
                    <input type="number" min="0" step="0.5" value={fd.sizeInches}
                      onChange={e => updateFish(i, 'sizeInches', e.target.value)} placeholder="—"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-sky-500" />
                  </div>
                  <div>
                    {i === 0 && <label className="block text-xs text-slate-400 mb-1">Weight (lb) <span className="text-slate-300">optional</span></label>}
                    <input type="number" min="0" step="0.1" value={fd.weightLbs}
                      onChange={e => updateFish(i, 'weightLbs', e.target.value)} placeholder="—"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-sky-500" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Photo attach — inside the form */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Photo <span className="text-slate-300 normal-case font-normal">optional</span></p>

            {pendingPreview ? (
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <img src={pendingPreview} alt="Preview" className="w-20 h-20 object-cover rounded-xl" />
                  <button onClick={clearPendingPhoto}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black/70 text-white rounded-full text-xs flex items-center justify-center">
                    ✕
                  </button>
                </div>
                <p className="text-xs text-slate-400">Photo attached — will be saved with this catch</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => cameraRef.current?.click()}
                  className="border border-dashed border-slate-300 rounded-xl py-3 text-xs text-slate-500 hover:border-sky-400 hover:text-sky-500 transition-colors flex items-center justify-center gap-1.5 font-medium">
                  <CameraIcon size={16} color="currentColor" /> Take Photo
                </button>
                <button onClick={() => galleryRef.current?.click()}
                  className="border border-dashed border-slate-300 rounded-xl py-3 text-xs text-slate-500 hover:border-sky-400 hover:text-sky-500 transition-colors flex items-center justify-center gap-1.5 font-medium">
                  <GalleryIcon size={16} color="currentColor" /> Camera Roll
                </button>
              </div>
            )}

            {/* capture="environment" → iOS saves photo to camera roll automatically */}
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={e => e.target.files?.[0] && handlePhotoFile(e.target.files[0])} />
            <input ref={galleryRef} type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files?.[0] && handlePhotoFile(e.target.files[0])} />
          </div>

          <button onClick={handleLog} disabled={saving || !species.trim()}
            className="w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-50 transition-colors">
            {saving ? 'Logging…' : count === 1 ? '+ Log Catch' : `+ Log ${count} Catches`}
          </button>
        </div>
      </div>

      {/* Catch log */}
      {catches.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="font-semibold text-slate-900 text-sm">Today's Catches</p>
          </div>
          <ul className="divide-y divide-slate-100">
            {catches.map(c => (
              <li key={c.id} className="px-4 py-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 text-sm">{c.species}</p>
                    {c.caught_on && <p className="text-xs text-slate-500 mt-0.5">on {c.caught_on}</p>}
                    <div className="flex gap-3 mt-0.5">
                      {c.size_inches != null && <p className="text-xs text-slate-400">{c.size_inches}&quot;</p>}
                      {c.weight_lbs != null && <p className="text-xs text-slate-400">{c.weight_lbs} lb</p>}
                      <p className="text-xs text-slate-400">{new Date(c.logged_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(c.id)}
                    className="text-slate-300 hover:text-red-400 text-sm transition-colors ml-3 shrink-0 mt-0.5">
                    ✕
                  </button>
                </div>

                {/* Attached photo — tap to view full screen */}
                {c.photo_url && (
                  <button
                    onClick={() => setViewingPhoto(c.photo_url!)}
                    className="mt-2 w-full overflow-hidden rounded-xl block"
                  >
                    <img src={c.photo_url} alt={c.species} className="w-full h-48 object-cover" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Full-screen photo viewer */}
      {viewingPhoto && (
        <div
          className="fixed inset-0 bg-black z-50 flex items-center justify-center"
          onClick={() => setViewingPhoto(null)}
        >
          <img src={viewingPhoto} alt="Full size" className="max-w-full max-h-full object-contain" />
          <button
            className="absolute top-6 right-6 w-9 h-9 bg-black/60 rounded-full flex items-center justify-center text-white text-lg"
            onClick={() => setViewingPhoto(null)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
