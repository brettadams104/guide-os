'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { logCatch, deleteCatch, addSpeciesPreset, addLurePreset, uploadTripLivePhoto, deleteTripPhoto } from '@/lib/actions/trip-mode'

interface Catch {
  id: string
  species: string
  count: number
  logged_at: string
  size_inches?: number | null
  weight_lbs?: number | null
  caught_on?: string | null
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

export function FishLogTab({ tripId, initialCatches, initialPhotos, speciesPresets: initialSpecies, lurePresets: initialLures }: Props) {
  const [catches, setCatches] = useState<Catch[]>(initialCatches)
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
  const [speciesPresets, setSpeciesPresets] = useState<string[]>(initialSpecies)
  const [lurePresets, setLurePresets] = useState<string[]>(initialLures)

  const [species, setSpecies] = useState('')
  const [caughtOn, setCaughtOn] = useState('')
  const [count, setCount] = useState(1)
  // Per-fish size/weight when count > 1; single values when count === 1
  const [fishDetails, setFishDetails] = useState<FishDetail[]>([{ sizeInches: '', weightLbs: '' }])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const caughtOnRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  // Keep fishDetails array in sync with count
  useEffect(() => {
    setFishDetails(prev => {
      if (prev.length === count) return prev
      if (prev.length < count) {
        return [...prev, ...Array(count - prev.length).fill(null).map(() => ({ sizeInches: '', weightLbs: '' }))]
      }
      return prev.slice(0, count)
    })
  }, [count])

  function updateFish(index: number, field: keyof FishDetail, value: string) {
    setFishDetails(prev => prev.map((f, i) => i === index ? { ...f, [field]: value } : f))
  }

  const handlePhoto = useCallback(async (file: File) => {
    setUploading(true)
    const result = await uploadTripLivePhoto(tripId, file)
    if (result.url && result.id) {
      setPhotos(prev => [{ id: result.id!, url: result.url! }, ...prev])
    }
    setUploading(false)
  }, [tripId])

  async function handleDeletePhoto(photoId: string, e: React.MouseEvent) {
    e.stopPropagation()
    setPhotos(prev => prev.filter(p => p.id !== photoId))
    await deleteTripPhoto(photoId)
  }

  const totalFish = catches.reduce((s, c) => s + c.count, 0)

  async function handleLog() {
    if (!species.trim()) return
    setSaving(true)

    const s = species.trim()
    const lure = caughtOn.trim() || undefined
    const now = new Date().toISOString()
    const newCatches: Catch[] = []

    // Log each fish individually so every one gets its own record
    for (let i = 0; i < count; i++) {
      const fd = fishDetails[i] ?? { sizeInches: '', weightLbs: '' }
      const result = await logCatch(tripId, s, 1, {
        sizeInches: fd.sizeInches ? parseFloat(fd.sizeInches) : undefined,
        weightLbs: fd.weightLbs ? parseFloat(fd.weightLbs) : undefined,
        caughtOn: lure,
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
        })
      }
    }

    if (newCatches.length > 0) {
      setCatches(prev => [...newCatches.reverse(), ...prev])

      // Auto-add to presets if new
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
                <button
                  key={sp}
                  type="button"
                  onClick={() => setSpecies(sp)}
                  className={`px-3.5 py-2 rounded-full text-sm font-medium border transition-colors ${
                    species === sp
                      ? 'bg-sky-500 text-white border-sky-500'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-sky-400 hover:text-sky-600'
                  }`}
                >
                  {sp}
                </button>
              ))}
            </div>
          )}
          <input
            type="text"
            value={species}
            onChange={e => setSpecies(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') caughtOnRef.current?.focus() }}
            placeholder={speciesPresets.length > 0 ? 'Or type a different species…' : 'Species (e.g. Largemouth Bass)'}
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Caught On */}
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Caught On</p>
          {lurePresets.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {lurePresets.map(sp => (
                <button
                  key={sp}
                  type="button"
                  onClick={() => setCaughtOn(sp)}
                  className={`px-3.5 py-2 rounded-full text-sm font-medium border transition-colors ${
                    caughtOn === sp
                      ? 'bg-sky-500 text-white border-sky-500'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-sky-400 hover:text-sky-600'
                  }`}
                >
                  {sp}
                </button>
              ))}
            </div>
          )}
          <input
            ref={caughtOnRef}
            type="text"
            value={caughtOn}
            onChange={e => setCaughtOn(e.target.value)}
            placeholder={lurePresets.length > 0 ? 'Or type a lure / bait…' : 'Lure or bait (optional)'}
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Count stepper */}
        <div className="pt-1 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">How Many?</p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setCount(c => Math.max(1, c - 1))}
                className="w-9 h-9 rounded-full border border-slate-200 text-slate-600 text-xl font-bold hover:bg-slate-50 flex items-center justify-center transition-colors"
              >
                −
              </button>
              <span className="text-2xl font-black text-slate-900 w-6 text-center">{count}</span>
              <button
                type="button"
                onClick={() => setCount(c => c + 1)}
                className="w-9 h-9 rounded-full border border-slate-200 text-slate-600 text-xl font-bold hover:bg-slate-50 flex items-center justify-center transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Per-fish detail rows */}
          <div className="space-y-2">
            {fishDetails.map((fd, i) => (
              <div key={i} className="flex items-center gap-2">
                {count > 1 && (
                  <span className="text-xs font-semibold text-slate-400 w-11 shrink-0 text-right">Fish {i + 1}</span>
                )}
                <div className={`grid gap-2 flex-1 ${count === 1 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                  <div>
                    {i === 0 && (
                      <label className="block text-xs text-slate-400 mb-1">Size (in) <span className="text-slate-300">optional</span></label>
                    )}
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={fd.sizeInches}
                      onChange={e => updateFish(i, 'sizeInches', e.target.value)}
                      placeholder="—"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    {i === 0 && (
                      <label className="block text-xs text-slate-400 mb-1">Weight (lb) <span className="text-slate-300">optional</span></label>
                    )}
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={fd.weightLbs}
                      onChange={e => updateFish(i, 'weightLbs', e.target.value)}
                      placeholder="—"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleLog}
            disabled={saving || !species.trim()}
            className="w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-50 transition-colors"
          >
            {saving ? 'Logging…' : count === 1 ? '+ Log Catch' : `+ Log ${count} Catches`}
          </button>
        </div>
      </div>

      {/* Photos */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Photos</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => cameraRef.current?.click()}
            className="bg-[#0f1f35] text-white rounded-xl py-4 flex flex-col items-center gap-1.5 font-semibold text-sm hover:bg-[#1a3254] transition-colors"
          >
            <span className="text-2xl">📷</span>
            Take Photo
          </button>
          <button
            onClick={() => galleryRef.current?.click()}
            className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl py-4 flex flex-col items-center gap-1.5 font-semibold text-sm hover:bg-slate-100 transition-colors"
          >
            <span className="text-2xl">🖼️</span>
            Camera Roll
          </button>
        </div>

        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={e => e.target.files?.[0] && handlePhoto(e.target.files[0])} />
        <input ref={galleryRef} type="file" accept="image/*" className="hidden"
          onChange={e => e.target.files?.[0] && handlePhoto(e.target.files[0])} />

        {uploading && (
          <p className="text-xs text-sky-500 font-medium text-center">Uploading...</p>
        )}

        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {photos.map(p => (
              <div key={p.id} className="relative">
                <img src={p.url} alt="Trip photo" className="w-full h-24 object-cover rounded-xl" />
                <button
                  onClick={e => handleDeletePhoto(p.id, e)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center text-xs leading-none transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Catch log */}
      {catches.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="font-semibold text-slate-900 text-sm">Today's Catches</p>
          </div>
          <ul className="divide-y divide-slate-100">
            {catches.map(c => (
              <li key={c.id} className="flex items-start justify-between px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900 text-sm">{c.species}</p>
                  {c.caught_on && (
                    <p className="text-xs text-slate-500 mt-0.5">on {c.caught_on}</p>
                  )}
                  <div className="flex gap-3 mt-0.5">
                    {c.size_inches != null && (
                      <p className="text-xs text-slate-400">{c.size_inches}&quot;</p>
                    )}
                    {c.weight_lbs != null && (
                      <p className="text-xs text-slate-400">{c.weight_lbs} lb</p>
                    )}
                    <p className="text-xs text-slate-400">{new Date(c.logged_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-3 shrink-0">
                  <button onClick={() => handleDelete(c.id)} className="text-slate-300 hover:text-red-400 text-sm transition-colors">✕</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
