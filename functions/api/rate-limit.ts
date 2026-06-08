// Exemplo de Cloudflare Pages Function para endpoint protegido.
// Use para gates simples, logs de abuso ou validação extra em produção.

export async function onRequest(context: EventContext<Env, string, unknown>) {
  const ip = context.request.headers.get('CF-Connecting-IP') ?? 'unknown';
  return Response.json({
    ok: true,
    message: 'Rate-limit hook pronto para integrar com KV/D1/Turnstile.',
    ip
  });
}

interface Env {
  // MY_KV?: KVNamespace;
}
