import { NextRequest, NextResponse } from 'next/server'
import {
  getDrillDownNational,
  getDrillDownCounty,
  getDrillDownConstituency,
  getDrillDownWard,
  getDrillDownStation,
} from '@/services/PublicResults'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const params = url.searchParams
    const action = (params.get('action') || '').toUpperCase()
    const electionId = params.get('electionId') || ''
    const positionId = params.get('positionId') || ''
    const id = params.get('id') || ''

    if (!electionId || !positionId) {
      return NextResponse.json({ error: 'electionId and positionId are required' }, { status: 400 })
    }

    switch (action) {
      case 'COUNTY':
        return NextResponse.json(await getDrillDownCounty(electionId, positionId, id))
      case 'CONSTITUENCY':
        return NextResponse.json(await getDrillDownConstituency(electionId, positionId, id))
      case 'WARD':
        return NextResponse.json(await getDrillDownWard(electionId, positionId, id))
      case 'STATION':
        return NextResponse.json(await getDrillDownStation(electionId, positionId, id))
      default:
        // default to national breakdown by counties
        return NextResponse.json(await getDrillDownNational(electionId, positionId))
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
