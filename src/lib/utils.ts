import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')
}

export function getFileTypeLabel(ext: string): string {
  const labels: Record<string, string> = {
    cdr: 'CorelDRAW',
    svg: 'SVG Vector',
    psd: 'Photoshop',
    ai: 'Illustrator',
    png: 'PNG Image',
    jpg: 'JPEG Image',
  }
  return labels[ext.toLowerCase()] ?? ext.toUpperCase()
}

export function fileSizeLabel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function getSettlementMonth(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export const PLATFORM_COMMISSION = Number(process.env.PLATFORM_COMMISSION_PERCENT ?? 30) / 100
export const CREATOR_SHARE = 1 - PLATFORM_COMMISSION
