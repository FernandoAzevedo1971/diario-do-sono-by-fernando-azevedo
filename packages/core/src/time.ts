const CLOCK_TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isClockTime(value: string): boolean {
  return CLOCK_TIME_PATTERN.test(value);
}

export function parseClockTime(value: string): number {
  const match = CLOCK_TIME_PATTERN.exec(value);

  if (!match) {
    throw new Error(`Invalid clock time: ${value}`);
  }

  return Number(match[1]) * 60 + Number(match[2]);
}

export function formatClockTime(totalMinutes: number): string {
  const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalizedMinutes / 60);
  const minutes = normalizedMinutes % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export function addMinutesToClockTime(clockTime: string, minutesToAdd: number): string {
  return formatClockTime(parseClockTime(clockTime) + minutesToAdd);
}

export function minutesBetweenClockTimes(startTime: string, endTime: string): number {
  const startMinutes = parseClockTime(startTime);
  const endMinutes = parseClockTime(endTime);
  const sameDayDifference = endMinutes - startMinutes;

  return sameDayDifference > 0 ? sameDayDifference : sameDayDifference + 1440;
}

export function formatDuration(totalMinutes: number): string {
  const sign = totalMinutes < 0 ? '-' : '';
  const absoluteMinutes = Math.round(Math.abs(totalMinutes));
  const hours = Math.floor(absoluteMinutes / 60);
  const minutes = absoluteMinutes % 60;

  return `${sign}${hours}h${minutes.toString().padStart(2, '0')}`;
}

export function isNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}
