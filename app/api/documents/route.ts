import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getApiUser } from '@/lib/api-auth'
import { uploadDocumentSchema, zodErrorMessage } from '@/lib/validation'

export async function POST(request: Request) {
  const { supabase, user } = await getApiUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const form = await request.formData()
  const parsed = uploadDocumentSchema.safeParse({
    documentType: form.get('documentType'),
    file: form.get('file'),
  })
  if (!parsed.success) return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 })

  const extension = parsed.data.file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin'
  const storagePath = `${user.id}/${parsed.data.documentType.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/${randomUUID()}.${extension}`
  const bytes = await parsed.data.file.arrayBuffer()
  const { error: uploadError } = await supabase.storage
    .from('applicant-documents')
    .upload(storagePath, bytes, { contentType: parsed.data.file.type, upsert: false })
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data, error } = await supabase.rpc('register_uploaded_document', {
    document_kind: parsed.data.documentType,
    uploaded_name: parsed.data.file.name,
    object_path: storagePath,
    content_type: parsed.data.file.type,
    content_size: parsed.data.file.size,
  })

  if (error) {
    await supabase.storage.from('applicant-documents').remove([storagePath])
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: data }, { status: 201 })
}
