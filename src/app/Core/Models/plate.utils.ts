export function formatPlateNumber(plateNumber: string): string {
  return plateNumber.replace(/\s+/g, '').split('').join(' ');
}
