import Link from 'next/link'
import { FileText } from 'lucide-react'
import RequirementDetail from '@/components/dashboard/RequirementDetail'
import { requireUser } from '@/lib/auth'
import { getRequirement } from '@/lib/data/application'

export default async function DocumentRequirementPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  const { id } = await params
  const requirement = await getRequirement(user.id, id)

  if (!requirement) return <div className="adm-card empty-state"><FileText /><h2>Document requirement not found</h2><Link className="adm-button button-primary" href="/dashboard/documents">Back to My Documents</Link></div>

  return <RequirementDetail requirement={requirement} backHref="/dashboard/documents" backLabel="Back to My Documents" />
}
