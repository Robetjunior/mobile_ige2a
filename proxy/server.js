// Minimal proxy server for Orchestrator on port 8086
// Do NOT expose the X-API-Key to the mobile app; it stays here.
// Env:
// - ORCH_BASE_URL (default: http://localhost:3001/v1)
// - ORCH_API_KEY (default: minha_chave_super_secreta)

const http = require('http');
const url = require('url');

const PORT = Number(process.env.PORT || 8086);
const ORCH_BASE_URL = process.env.ORCH_BASE_URL || 'http://localhost:3001/v1';
const ORCH_API_KEY = process.env.ORCH_API_KEY || 'minha_chave_super_secreta';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
  };
}

function sendJson(res, statusCode, json) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    ...corsHeaders(),
  };
  res.writeHead(statusCode, headers);
  res.end(JSON.stringify(json));
}

function notFound(res) {
  sendJson(res, 404, { error: 'Not Found' });
}

function methodNotAllowed(res) {
  sendJson(res, 405, { error: 'Method Not Allowed' });
}

const server = http.createServer(async (req, res) => {
  const started = Date.now();
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname || '';

  // Preflight CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders());
    return res.end();
  }

  // Health check
  if (pathname === '/health') {
    return sendJson(res, 200, { ok: true, ts: new Date().toISOString() });
  }

  // Route: /charge/:chargeBoxId
  const chargeMatch = pathname.match(/^\/charge\/([^\/]+)$/);
  if (chargeMatch) {
    if (req.method !== 'GET') return methodNotAllowed(res);
    const chargeBoxId = decodeURIComponent(chargeMatch[1]);
    const target = `${ORCH_BASE_URL}/sessions/active/${encodeURIComponent(chargeBoxId)}/detail`;

    try {
      const r = await fetch(target, {
        headers: { 'X-API-Key': ORCH_API_KEY },
      });

      const elapsed = Date.now() - started;
      const status = r.status;

      if (status === 404) {
        console.log(`[proxy] ${chargeBoxId} -> 404 in ${elapsed}ms`);
        return sendJson(res, 404, { session: null });
      }

      if (status >= 500) {
        const text = await r.text().catch(() => '');
        console.warn(`[proxy] upstream ${status} for ${chargeBoxId} in ${elapsed}ms: ${text.slice(0, 200)}`);
        return sendJson(res, 502, { error: 'Upstream error', status });
      }

      const json = await r.json().catch(() => ({}));
      const s = json.session || {};
      const t = json.telemetry || {};

      const payload = {
        transaction_id: s.transactionId ?? s.transaction_id ?? t.transaction_id ?? null,
        charge_box_id: s.chargeBoxId ?? s.charge_box_id ?? chargeBoxId,
        started_at: s.startedAt ?? s.started_at ?? t.started_at ?? null,
        duration_seconds: s.durationSeconds ?? s.duration_seconds ?? t.duration_seconds ?? null,
        kwh: t.kwh ?? t.energy_kwh ?? null,
        power_kw: t.power_kw ?? t.power ?? null,
        voltage_v: t.voltage_v ?? t.voltage ?? null,
        current_a: t.current_a ?? t.current ?? null,
        temperature_c: t.temperature_c ?? null,
        soc_percent_at: t.soc_percent_at ?? t.soc ?? null,
      };

      if (payload.transaction_id == null) {
        console.log(`[proxy] ${chargeBoxId} -> no active session in ${elapsed}ms`);
        return sendJson(res, 404, { session: null });
      }

      console.log(`[proxy] ${chargeBoxId} -> 200 in ${elapsed}ms`);
      return sendJson(res, 200, payload);
    } catch (e) {
      console.error(`[proxy] error ${chargeBoxId}:`, e);
      return sendJson(res, 500, { error: 'Proxy failure' });
    }
  }

  return notFound(res);
});

server.listen(PORT, () => {
  console.log(`Proxy server listening on http://localhost:${PORT}/`);
});