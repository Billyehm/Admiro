const lagosDate = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Africa/Lagos' })
const lagosDateTime = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Lagos' })

export function formatDate(value: string | Date) { return lagosDate.format(new Date(value)) }
export function formatDateTime(value: string | Date) { return lagosDateTime.format(new Date(value)) }
