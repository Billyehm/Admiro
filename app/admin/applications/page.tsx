export default async function ApplicationsPage() {
  const { redirect } = await import('next/navigation')
  redirect('/admin/students')
}
