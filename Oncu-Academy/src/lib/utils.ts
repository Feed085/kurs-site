import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const formatSecondsToClock = (totalSeconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

export function formatVideoDuration(duration: string | number | null | undefined) {
  if (duration === null || duration === undefined) {
    return '0:00';
  }

  if (typeof duration === 'number') {
    return formatSecondsToClock(duration);
  }

  const normalized = duration.trim();
  if (!normalized) {
    return '0:00';
  }

  if (/^\d+$/.test(normalized)) {
    return formatSecondsToClock(Number(normalized));
  }

  if (/^\d{1,2}:\d{2}(?::\d{2})?$/.test(normalized)) {
    return normalized;
  }

  return normalized;
}
