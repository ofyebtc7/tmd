export const DOMINIOS_PERMITIDOS = [
  'i.postimg.cc',
  'postimg.cc',
  'i.imgur.com',
  'imgur.com',
]

export function urlImagemValida(url: string | null | undefined): boolean {
  if (!url || !url.startsWith('http')) return false
  try {
    const hostname = new URL(url).hostname
    return DOMINIOS_PERMITIDOS.includes(hostname)
  } catch {
    return false
  }
}