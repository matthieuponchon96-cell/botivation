export function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  const hue = Math.abs(hash) % 360;
  const sat = 35 + (Math.abs(hash >> 8) % 25);
  const lum = 35 + (Math.abs(hash >> 16) % 15);
  return `hsl(${hue}, ${sat}%, ${lum}%)`;
}

export function avatarLetter(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}
