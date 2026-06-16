import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const state = req.nextUrl.searchParams.get('state') ?? ''
  const name = req.nextUrl.searchParams.get('name') ?? ''
  const siteNo = req.nextUrl.searchParams.get('siteNo') ?? ''

  // Direct site number lookup
  if (siteNo) {
    const url = `https://api.waterservices.usgs.gov/nwis/site/?format=rdb&sites=${siteNo.trim()}&siteOutput=basic`
    const res = await fetch(url, { cache: 'no-store' })
    const text = await res.text()
    const sites = parseRDB(text, '')
    return Response.json(sites)
  }

  if (!state) return Response.json([])

  const url = `https://api.waterservices.usgs.gov/nwis/site/?format=rdb&stateCd=${state}&siteType=ST&siteStatus=active&parameterCd=00060&hasDataTypeCd=iv&siteOutput=basic`
  const res = await fetch(url, { cache: 'no-store' })
  const text = await res.text()
  return Response.json(parseRDB(text, name))
}

function parseRDB(text: string, nameFilter: string) {
  const lines = text.split('\n')
  const dataLines = lines.filter(l => !l.startsWith('#') && l.trim())
  if (dataLines.length < 3) return []

  const headers = dataLines[0].split('\t').map(h => h.trim())
  return dataLines
    .slice(2)
    .map(line => {
      const vals = line.split('\t')
      return Object.fromEntries(headers.map((h, i) => [h, (vals[i] ?? '').trim()]))
    })
    .filter(s => s.site_no && s.station_nm)
    .filter(s => !nameFilter || s.station_nm.toLowerCase().includes(nameFilter.toLowerCase()))
    .slice(0, 25)
    .map(s => ({ siteNo: s.site_no, name: s.station_nm }))
}
