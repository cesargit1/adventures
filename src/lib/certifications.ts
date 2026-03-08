export type ProfileCertification = {
  title: string
  pdfUrl: string | null
  pdfPath: string | null
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export function parseProfileCertifications(raw: unknown): ProfileCertification[] {
  if (!Array.isArray(raw)) {
    return []
  }

  return raw
    .map((entry): ProfileCertification | null => {
      if (typeof entry === 'string') {
        const title = entry.trim()
        if (!title) return null
        return { title, pdfUrl: null, pdfPath: null }
      }

      if (!entry || typeof entry !== 'object') {
        return null
      }

      const value = entry as Record<string, unknown>
      const title = normalizeText(value.title)
      const pdfUrl = normalizeText(value.pdfUrl ?? value.pdf_url)
      const pdfPath = normalizeText(value.pdfPath ?? value.pdf_path)

      if (!title) {
        return null
      }

      return {
        title,
        pdfUrl: pdfUrl || null,
        pdfPath: pdfPath || null,
      }
    })
    .filter((entry): entry is ProfileCertification => !!entry)
}

export function toCertificationStoragePayload(entries: ProfileCertification[]) {
  return entries.map((entry) => ({
    title: entry.title,
    pdf_url: entry.pdfUrl,
    pdf_path: entry.pdfPath,
  }))
}
