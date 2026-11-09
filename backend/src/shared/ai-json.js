// Server-only, bounded JSON provider transport. Never log prompts or credentials.
export async function boundedJson(response) {
  if (!response.body) throw new Error('INVALID_RESPONSE');
  const reader = response.body.getReader(), chunks = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength; if (size > 65536) throw new Error('INVALID_RESPONSE');
      chunks.push(Buffer.from(value));
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } finally { await reader.cancel().catch(() => {}); }
}
export async function aiJson(config, system, input, { fetchImpl = fetch, maxTokens = 2400, temperature = 0.2 } = {}) {
  if (!config.enabled || !config.apiKey || !/^[A-Za-z0-9._:/-]{1,120}$/.test(config.model)) return { ok: false, reason: 'NOT_CONFIGURED' };
  try {
    const response = await fetchImpl('https://api.aimlapi.com/v1/chat/completions', {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(config.timeoutMs),
      headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: config.model, max_tokens: maxTokens, temperature, stream: false,
        messages: [{ role: 'system', content: system }, { role: 'user', content: JSON.stringify(input) }] }),
    });
    if (!response.ok) { await response.body?.cancel().catch(() => {}); return { ok: false, reason: 'PROVIDER_UNAVAILABLE' }; }
    const result = await boundedJson(response), choice = result.choices?.[0];
    if (!choice || choice.finish_reason === 'length' || typeof choice.message?.content !== 'string') throw new Error('INVALID_RESPONSE');
    return { ok: true, value: JSON.parse(choice.message.content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')) };
  } catch (error) { return { ok: false, reason: ['TimeoutError', 'AbortError'].includes(error.name) ? 'TIMEOUT' : 'INVALID_RESPONSE' }; }
}
export const plainText = (value, min, max) => typeof value === 'string' && value.trim().length >= min && value.length <= max && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/u.test(value);
export const exactKeys = (value, keys) => Boolean(value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key)));
