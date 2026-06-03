import type { TripConditions } from '@/lib/types'

const MOON_EMOJI: Record<string, string> = {
  'New Moon': '🌑', 'Waxing Crescent': '🌒', 'First Quarter': '🌓',
  'Waxing Gibbous': '🌔', 'Full Moon': '🌕', 'Waning Gibbous': '🌖',
  'Last Quarter': '🌗', 'Waning Crescent': '🌘',
}

const PRESSURE_ICON: Record<string, string> = {
  rising: '↑', falling: '↓', steady: '→'
}

const PRESSURE_COLOR: Record<string, string> = {
  rising: 'text-green-500', falling: 'text-red-500', steady: 'text-slate-400'
}

export function ConditionsDisplay({ conditions }: { conditions: TripConditions }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {conditions.temp_high != null && (
        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Temperature</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{conditions.temp_high}°F</p>
          <p className="text-xs text-slate-400">Low: {conditions.temp_low}°F</p>
        </div>
      )}
      {conditions.weather && (
        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Conditions</p>
          <p className="text-lg font-bold text-slate-900 mt-1">{conditions.weather}</p>
          {conditions.wind_speed != null && (
            <p className="text-xs text-slate-400">{conditions.wind_speed} mph {conditions.wind_direction}</p>
          )}
        </div>
      )}
      {conditions.pressure != null && (
        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Pressure</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {conditions.pressure}{' '}
            <span className={`text-lg ${PRESSURE_COLOR[conditions.pressure_trend ?? 'steady']}`}>
              {PRESSURE_ICON[conditions.pressure_trend ?? 'steady']}
            </span>
          </p>
          <p className="text-xs text-slate-400 capitalize">{conditions.pressure_trend}</p>
        </div>
      )}
      {conditions.moon_phase && (
        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Moon</p>
          <p className="text-2xl mt-1">{MOON_EMOJI[conditions.moon_phase] ?? '🌙'}</p>
          <p className="text-xs text-slate-700 font-medium">{conditions.moon_phase}</p>
          <p className="text-xs text-slate-400">{conditions.moon_illumination}% illuminated</p>
        </div>
      )}
    </div>
  )
}
