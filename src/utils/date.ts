/**
 * Utilities for Date & Time in America/Bogota timezone
 */

const BOGOTA_TZ = 'America/Bogota';

export function formatBogotaDate(isoString?: string): string {
  if (!isoString) return 'Sin fecha';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('es-CO', {
      timeZone: BOGOTA_TZ,
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return isoString;
  }
}

export function formatBogotaFull(isoString?: string): string {
  if (!isoString) return 'Sin registro';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('es-CO', {
      timeZone: BOGOTA_TZ,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return isoString;
  }
}

export function formatBogotaTimeOnly(isoString?: string): string {
  if (!isoString) return '--:--';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('es-CO', {
      timeZone: BOGOTA_TZ,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return isoString;
  }
}

export function getDaysSince(isoString?: string): number {
  if (!isoString) return 999;
  try {
    const date = new Date(isoString).getTime();
    const now = Date.now();
    const diffHours = (now - date) / (1000 * 60 * 60);
    return Math.floor(diffHours / 24);
  } catch {
    return 999;
  }
}

export function getHoursSince(isoString?: string): number {
  if (!isoString) return 9999;
  try {
    const date = new Date(isoString).getTime();
    const now = Date.now();
    return Math.floor((now - date) / (1000 * 60 * 60));
  } catch {
    return 9999;
  }
}

export function isRevisionOutdated(isoString?: string): boolean {
  if (!isoString) return true;
  return getHoursSince(isoString) > 96; // > 4 días
}

export function toLocalDatetimeInput(isoString?: string): string {
  const date = isoString ? new Date(isoString) : new Date();
  // Format for <input type="datetime-local" /> in local time
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
