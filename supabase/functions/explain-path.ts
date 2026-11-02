import { json, withUser } from './_shared/http.ts';

type Skill = { name: string };
async function boundedBody(request: Request, limit = 100000) {
  const reader = request.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const buffer = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(buffer);
}
function skills(value: unknown): value is Skill[] {
  return Array.isArray(value) && value.length <= 1000 &&
    value.every((item) =>
      item && typeof item === 'object' && typeof item.name === 'string' &&
      item.name.length <= 200
    );
}

// Deterministic Romanian summary; no external AI service or credentials required.
export default withUser(async ({ request }) => {
  if (Number(request.headers.get('content-length') || 0) > 100000) {
    return json({ error: 'Request too large' }, 413);
  }
  const body = await boundedBody(request);
  if (body === null) return json({ error: 'Request too large' }, 413);
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }
  const gap = payload && typeof payload === 'object' && 'gapAnalysis' in payload
    ? payload.gapAnalysis
    : null;
  if (
    !gap || typeof gap !== 'object' || !('covered' in gap) ||
    !('partial' in gap) || !('missing' in gap) || !skills(gap.covered) ||
    !skills(gap.partial) || !skills(gap.missing)
  ) return json({ error: 'Invalid gapAnalysis' }, 400);
  let explanation =
    `Ai ${gap.covered.length} abilități acoperite, ${gap.partial.length} parțial acoperite și ${gap.missing.length} lipsă. `;
  if (!gap.missing.length && !gap.partial.length) {
    explanation +=
      'Felicitări! Ai toate abilitățile necesare pentru obiectivul ales.';
  } else {explanation += `Abilități de dezvoltat: ${
      [...gap.partial, ...gap.missing].map((skill) => skill.name).join(', ')
    }.`;}
  return json({ explanation });
});
