'use client'

import { useMemo, useState } from 'react'
import { ArrowDownAZ } from 'lucide-react'
import DocumentReviewCard from '@/components/admin/DocumentReviewCard'
import type { DocumentReviewItem } from '@/lib/models'

type SortOption = 'uploaded-desc' | 'uploaded-asc' | 'size-desc' | 'size-asc'

export default function DocumentReviewList({ documents }: { documents: DocumentReviewItem[] }) {
  const [sort, setSort] = useState<SortOption>('uploaded-desc')
  const ordered = useMemo(() => [...documents].sort((left, right) => {
    if (sort === 'size-desc') return right.sizeBytes - left.sizeBytes
    if (sort === 'size-asc') return left.sizeBytes - right.sizeBytes
    const difference = new Date(left.submittedAt).getTime() - new Date(right.submittedAt).getTime()
    return sort === 'uploaded-desc' ? -difference : difference
  }), [documents, sort])

  return <><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-2 text-sm"><span className="rounded-full bg-white px-4 py-2 ring-1 ring-[#dfe3da]">All {documents.length}</span><span className="rounded-full bg-amber-50 px-4 py-2 text-amber-800">Pending {documents.filter((item) => item.reviewStatus === 'pending').length}</span></div><label className="flex h-10 items-center gap-2 rounded-xl border border-[#dfe3da] bg-white px-3 text-sm font-semibold"><ArrowDownAZ className="size-4 text-[#54725d]" /><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value as SortOption)} className="bg-transparent text-sm font-normal outline-none"><option value="uploaded-desc">Newest upload</option><option value="uploaded-asc">Oldest upload</option><option value="size-desc">Largest file</option><option value="size-asc">Smallest file</option></select></label></div><section className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">{ordered.map((document) => <DocumentReviewCard key={document.id} document={document} />)}{!ordered.length && <div className="col-span-full rounded-3xl border border-dashed border-[#cfd6cc] bg-white py-20 text-center text-[#667069]">No uploaded documents yet.</div>}</section></>
}
