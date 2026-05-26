export function getFirstName(name?: string | null, fallback = 'Vera') {
  const trimmed = name?.trim();

  if (!trimmed) {
    return fallback;
  }

  return trimmed.split(/\s+/)[0] ?? fallback;
}

export function getWelcomeMessage(name?: string | null) {
  return `Bem-vinda, ${getFirstName(name)}`;
}
