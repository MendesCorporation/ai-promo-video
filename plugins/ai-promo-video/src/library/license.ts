export interface LicenseDecision {
  selectable: boolean;
  requiresAttribution: boolean;
  requiresShareAlike: boolean;
  reason: string;
}

function normalized(value: string): string {
  return value
    .toLowerCase()
    .replace(/creative commons/g, 'cc')
    .replace(/public domain mark/g, 'pdm')
    .replace(/[^a-z0-9+.-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function assessFreeLicense(license: string, options: { includeShareAlike?: boolean } = {}): LicenseDecision {
  const value = normalized(license || 'unknown');
  if (!value || value === 'unknown') {
    return { selectable: false, requiresAttribution: false, requiresShareAlike: false, reason: 'License metadata is missing.' };
  }
  if (/\b(nc|noncommercial|non commercial)\b/.test(value)) {
    return { selectable: false, requiresAttribution: true, requiresShareAlike: value.includes('sa'), reason: 'Non-commercial licenses are excluded from SaaS promos.' };
  }
  if (/\b(nd|no derivatives|noderivatives)\b/.test(value)) {
    return { selectable: false, requiresAttribution: true, requiresShareAlike: false, reason: 'No-derivatives licenses are excluded because promo compositing modifies the media.' };
  }
  if (/\b(cc0|pdm|public domain|unlicense)\b/.test(value)) {
    return { selectable: true, requiresAttribution: false, requiresShareAlike: false, reason: 'Public-domain or equivalent permissive media.' };
  }
  if (/\bpexels license\b/.test(value)) {
    return { selectable: true, requiresAttribution: false, requiresShareAlike: false, reason: 'Free commercial use under the Pexels License; preserve source metadata and avoid implied endorsement.' };
  }
  if (/\b(by-sa|by sa|sharealike|share alike)\b/.test(value)) {
    return {
      selectable: options.includeShareAlike === true,
      requiresAttribution: true,
      requiresShareAlike: true,
      reason: options.includeShareAlike === true
        ? 'Share-alike media enabled by the caller; preserve attribution and license obligations.'
        : 'Share-alike media requires explicit opt-in because the final promo may inherit obligations.',
    };
  }
  if (/\b(cc by|by 1|by 2|by 3|by 4)\b/.test(value)) {
    return { selectable: true, requiresAttribution: true, requiresShareAlike: false, reason: 'Creative Commons Attribution media.' };
  }
  if (/\b(mit|apache|bsd|isc|ofl)\b/.test(value)) {
    return { selectable: true, requiresAttribution: true, requiresShareAlike: false, reason: 'Permissive open-source asset license; retain the license notice.' };
  }
  return { selectable: false, requiresAttribution: false, requiresShareAlike: false, reason: `Unsupported or ambiguous license: ${license}` };
}

export function orientation(width?: number, height?: number): 'landscape' | 'portrait' | 'square' | undefined {
  if (!width || !height) return undefined;
  const ratio = width / height;
  if (ratio > 1.08) return 'landscape';
  if (ratio < 0.92) return 'portrait';
  return 'square';
}
