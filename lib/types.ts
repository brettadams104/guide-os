export interface Guide {
  id: string
  name: string
  business_name: string | null
  location: string | null
  avatar_url: string | null
  created_at: string
}

export interface Client {
  id: string
  guide_id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
  created_at: string
}

export type PaymentMethod = 'cash' | 'card' | 'venmo' | 'zelle' | 'check' | 'other'
export type PressureTrend = 'rising' | 'falling' | 'steady'

export interface Trip {
  id: string
  guide_id: string
  client_id: string | null
  trip_date: string
  location: string | null
  notes: string | null
  price: number | null
  deposit_paid: number
  amount_collected: number
  payment_method: PaymentMethod | null
  created_at: string
}

export interface TripCatch {
  id: string
  trip_id: string
  species: string
  count: number
}

export interface TripPhoto {
  id: string
  trip_id: string
  url: string
  created_at: string
}

export interface TripConditions {
  id: string
  trip_id: string
  temp_high: number | null
  temp_low: number | null
  weather: string | null
  wind_speed: number | null
  wind_direction: string | null
  pressure: number | null
  pressure_trend: PressureTrend | null
  moon_phase: string | null
  moon_illumination: number | null
  sunrise: string | null
  sunset: string | null
}
