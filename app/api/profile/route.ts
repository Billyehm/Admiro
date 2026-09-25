import { NextResponse } from 'next/server'
import { getApiUser } from '@/lib/api-auth'
import { profileSchema, zodErrorMessage } from '@/lib/validation'

export async function PATCH(request: Request) {
  const { supabase, user } = await getApiUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  const parsed = profileSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 })
  const [profileResult, applicationResult] = await Promise.all([
    supabase.from('user_profiles').update({ full_name: parsed.data.fullName, phone: parsed.data.phone || null, date_of_birth: parsed.data.dateOfBirth || null }).eq('user_id', user.id),
    supabase.from('applications').update({ jamb_registration_number: parsed.data.jambRegistrationNumber || null, state_of_residence: parsed.data.stateOfResidence || null }).eq('user_id', user.id),
  ])
  const error = profileResult.error || applicationResult.error
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
