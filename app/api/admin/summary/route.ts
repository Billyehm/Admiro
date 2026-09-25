import { NextResponse } from 'next/server'
import { getApiUser } from '@/lib/api-auth'
import { getDashboardSummary } from '@/lib/data/admin'

export async function GET() {
  const { user, staff } = await getApiUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  if (!staff) return NextResponse.json({ error: 'Staff access required' }, { status: 403 })

  try {
    return NextResponse.json(await getDashboardSummary())
  } catch (error) {
    console.error('Failed to fetch dashboard summary', error)
    return NextResponse.json({ error: 'Unable to fetch dashboard summary' }, { status: 500 })
  }
}
