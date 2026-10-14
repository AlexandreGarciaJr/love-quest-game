import { sanitizeName, type Gender } from './content';

export interface Invite {
  partnerName: string;
  partnerGender: Gender | null;
}

/**
 * Lê o convite opcional do link: ?de=Alexandre&g=m
 * (g = gênero de quem enviou: "m" parceiro, "f" parceira).
 */
export function readInvite(search: string = window.location.search): Invite | null {
  const params = new URLSearchParams(search);
  const name = sanitizeName(params.get('de') ?? '');
  if (!name) return null;
  const g = params.get('g');
  return { partnerName: name, partnerGender: g === 'f' || g === 'm' ? g : null };
}
