export function institutionMap(
  name: string,
  city?: string,
  county?: string,
  address?: string
) {
  const query = [name, address, city, county, 'România']
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(', ');
  return {
    search: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
    embed: `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed&hl=ro`,
  };
}

// The iframe has no supported theme parameter; this only changes preview appearance.
export const MAP_DARK_FILTER = 'invert(0.92) hue-rotate(180deg) saturate(0.75)';

// Google embed URLs must be loaded in an iframe, including inside a native WebView.
export function institutionMapDocument(embedUrl: string, dark = false) {
  const src = embedUrl
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `<!doctype html>
<html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:${dark ? '#18171F' : '#FFFFFF'}}iframe{display:block;width:100%;height:100%;border:0;${dark ? `filter:${MAP_DARK_FILTER}` : ''}}</style>
</head><body><iframe title="Google Maps" src="${src}" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></body></html>`;
}
