import { createClient } from '@/lib/supabase/server'
import type { Requirement, University, UniversityUpdate } from '@/lib/models'

export async function getRequirements(userId: string): Promise<Requirement[]> {
  const supabase = await createClient()
  const [{ data: definitions, error }, { data: states }, { data: documents }] = await Promise.all([
    supabase.from('requirements').select('*').eq('is_active', true).order('display_order'),
    supabase.from('user_requirements').select('*').eq('user_id', userId),
    supabase.from('uploaded_documents').select('id,document_type,original_name,review_status,updated_at').eq('user_id', userId).order('updated_at', { ascending: false }),
  ])
  if (error) throw error
  const stateMap = new Map((states ?? []).map((state) => [state.requirement_id, state]))
  return (definitions ?? []).map((definition) => {
    const state = stateMap.get(definition.id)
    const document = state?.document_id
      ? (documents ?? []).find((item) => item.id === state.document_id)
      : (documents ?? []).find((item) => item.document_type.toLowerCase() === definition.title.toLowerCase())
    const documentStatus = document?.review_status === 'approved' ? 'completed' : document?.review_status === 'rejected' || document?.review_status === 'resubmission_requested' ? 'action_needed' : document ? 'processing' : null
    return {
      id: definition.id,
      title: definition.title,
      description: definition.description,
      guidance: definition.guidance,
      accepted: definition.accepted_files,
      submissionType: definition.submission_type,
      responseText: state?.response_text ?? null,
      status: documentStatus ?? state?.status ?? 'not_started',
      note: state?.note ?? null,
      updatedAt: state?.updated_at ?? definition.updated_at,
      document: document ? { id: document.id, name: document.original_name, status: document.review_status } : null,
    }
  })
}

export async function getRequirement(userId: string, requirementId: string) {
  const requirement = (await getRequirements(userId)).find((item) => item.id === requirementId) ?? null
  if (!requirement?.document) return requirement
  const supabase = await createClient()
  const { data: document } = await supabase.from('uploaded_documents').select('storage_path').eq('id', requirement.document.id).maybeSingle()
  const { data: signed } = document ? await supabase.storage.from('applicant-documents').createSignedUrl(document.storage_path, 300) : { data: null }
  return { ...requirement, document: { ...requirement.document, previewUrl: signed?.signedUrl ?? null } }
}

export async function getUniversities(userId: string): Promise<University[]> {
  const supabase = await createClient()
  const [{ data: universities, error }, { data: selections }, { data: updates }] = await Promise.all([
    supabase.from('universities').select('*').eq('is_active', true).order('name'),
    supabase.from('university_selections').select('university_id').eq('user_id', userId),
    supabase.from('university_updates').select('university_id,title,published_at').order('published_at', { ascending: false }),
  ])
  if (error) throw error
  const selected = new Set((selections ?? []).map((item) => item.university_id))
  return (universities ?? []).map((university) => ({
    id: university.id,
    name: university.name,
    shortName: university.short_name,
    location: university.location,
    description: university.description,
    programmes: university.programmes,
    deadline: university.application_deadline,
    selected: selected.has(university.id),
    latestUpdate: (updates ?? []).find((item) => item.university_id === university.id)?.title ?? null,
  }))
}

export async function getUniversity(userId: string, universityId: string) {
  const [universities, updates] = await Promise.all([getUniversities(userId), getUniversityUpdates(userId)])
  return { university: universities.find((item) => item.id === universityId) ?? null, updates: updates.filter((item) => item.universityId === universityId) }
}

export async function getUniversityUpdates(userId: string): Promise<UniversityUpdate[]> {
  const supabase = await createClient()
  const [{ data: updates, error }, { data: universities }, { data: selections }] = await Promise.all([
    supabase.from('university_updates').select('*').order('published_at', { ascending: false }),
    supabase.from('universities').select('id,name'),
    supabase.from('university_selections').select('university_id').eq('user_id', userId),
  ])
  if (error) throw error
  const universityMap = new Map((universities ?? []).map((item) => [item.id, item.name]))
  const selected = new Set((selections ?? []).map((item) => item.university_id))
  return (updates ?? []).map((update) => ({ id: update.id, universityId: update.university_id, university: update.university_id ? universityMap.get(update.university_id) || 'University' : 'Admiro', title: update.title, description: update.description, category: update.category, publishedAt: update.published_at, selected: update.university_id ? selected.has(update.university_id) : true }))
}

export async function getNotifications(userId: string) {
  const supabase = await createClient()
  const [{ data: notifications, error }, { data: preferences }] = await Promise.all([
    supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('notification_preferences').select('preferences').eq('user_id', userId).maybeSingle(),
  ])
  if (error) throw error
  return { notifications: notifications ?? [], preferences: preferences?.preferences ?? {} }
}

export async function getApplicantAccount(userId: string) {
  const supabase = await createClient()
  const [{ data: user, error }, { data: profile }, { data: application }] = await Promise.all([
    supabase.from('users').select('*').eq('id', userId).single(),
    supabase.from('user_profiles').select('*').eq('user_id', userId).single(),
    supabase.from('applications').select('*').eq('user_id', userId).maybeSingle(),
  ])
  if (error) throw error
  return { user, profile, application }
}

export async function getActiveSystemNotice() {
  const supabase = await createClient()
  const { data } = await supabase.from('system_notices').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1).maybeSingle()
  return data
}
