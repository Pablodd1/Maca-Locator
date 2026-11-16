/**
 * MACALOCATOR — Jev Route Health & Availability Watchman
 * Powered by TypeSafe AI System-1 (`jev-latest`) with heuristic fallback
 * when TYPESAFE_API_KEY is absent (mirrors the AGENTS.md monitoring contract).
 *
 * Alerts: Telegram (TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID) and/or generic
 * webhook (ALERT_WEBHOOK_URL). Run: npm run audit:jev
 */

import { choice, TypeSafeClient } from '@typesafe-ai/sdk';
import https from 'https';
import http from 'http';
import { URL } from 'url';

const BASE_URL = process.env.BASE_URL || 'https://maca-locator.vercel.app';
const TYPESAFE_API_KEY = process.env.TYPESAFE_API_KEY || '';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';
const ALERT_WEBHOOK_URL = process.env.ALERT_WEBHOOK_URL || '';

const AUDIT_ROUTES = [
  { path: '/', name: 'Client Dashboard (VIP)' },
  { path: '/booking', name: 'Booking Workflow' },
  { path: '/chat', name: 'Concierge Chat' },
  { path: '/profile', name: 'Profile & CRM' },
  { path: '/admin', name: 'Mission Control (Admin)' },
  { path: '/emergency', name: 'Emergency Roadside' },
  { path: '/api/notify', name: 'Notification Hub API' },
  { path: '/api/voice/twiml', name: 'Voice TwiML API' },
];

let typeSafeClient = null;
if (TYPESAFE_API_KEY) {
  try {
    typeSafeClient = new TypeSafeClient({ apiKey: TYPESAFE_API_KEY });
  } catch (e) {
    console.warn('⚠️ Could not initialize TypeSafeClient:', e.message);
  }
}

function fetchUrl(targetUrl, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const parsed = new URL(targetUrl);
    const protocol = parsed.protocol === 'https:' ? https : http;
    const startTime = Date.now();
    const req = protocol.get(targetUrl, { timeout: timeoutMs, headers: { 'User-Agent': 'MACALOCATOR-Jev-Watchman/1.0' } }, (res) => {
      let body = '';
      res.on('data', (chunk) => { if (body.length < 5000) body += chunk; });
      res.on('end', () => {
        resolve({
          url: targetUrl,
          status: res.statusCode,
          bodySnippet: body.substring(0, 500),
          latencyMs: Date.now() - startTime,
          error: null,
        });
      });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ url: targetUrl, status: 408, bodySnippet: '', latencyMs: Date.now() - startTime, error: 'Request Timeout' });
    });
    req.on('error', (err) => {
      resolve({ url: targetUrl, status: 0, bodySnippet: '', latencyMs: Date.now() - startTime, error: err.message });
    });
  });
}

async function classifyWithJev(route, routeResult) {
  if (typeSafeClient) {
    try {
      // SDK 0.6+ API: systemOne() with state + helper-built questions
      const res = await typeSafeClient.systemOne({
        state: {
          service: 'MACALOCATOR (luxury mobile auto service, Miami)',
          route: route.name,
          url: routeResult.url,
          http_status: routeResult.status,
          latency_ms: routeResult.latencyMs,
          detail: routeResult.error || routeResult.bodySnippet.substring(0, 160),
          checked_at: new Date().toISOString(),
        },
        questions: {
          is_operational: choice('Is this web route operational and functioning normally for users?', { yes: 'route serves correctly', no: 'route broken or degraded' }),
          severity: choice('How severe is this result?', { ok: 'fully healthy', warning: 'degraded or slow', critical: 'down or erroring' }),
          should_alert: choice('Should a human be alerted immediately for this result?', { yes: 'alert now', no: 'no alert' }),
        },
      });
      return {
        source: 'jev-latest',
        is_operational: res.answers.is_operational.choice === 'yes',
        severity: res.answers.severity.choice,
        should_alert: res.answers.should_alert.choice === 'yes',
      };
    } catch {
      // graceful fallback on rate limit / network issue
    }
  }
  // Heuristic fallback engine
  const isOk = routeResult.status >= 200 && routeResult.status < 400;
  const isWarn = routeResult.latencyMs > 4000;
  return {
    source: 'heuristic-fallback',
    is_operational: isOk,
    severity: !isOk ? 'critical' : isWarn ? 'warning' : 'ok',
    should_alert: !isOk,
  };
}

async function dispatchAlert(findings) {
  const critical = findings.filter((f) => f.classification.should_alert);
  if (critical.length === 0) return;
  console.log(`\n🚨 Triggering alerts for ${critical.length} issue(s)...`);
  const summary = critical
    .map((a) => `• [${a.route.name}] (${a.route.path}) → status ${a.raw.status}, ${a.raw.latencyMs}ms${a.raw.error ? `, error: ${a.raw.error}` : ''}`)
    .join('\n');

  if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    try {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: `🚨 MACALOCATOR Jev Watchman — ${critical.length} route(s) down on ${BASE_URL}\n\n${summary}` }),
      });
      console.log('✓ Telegram alert dispatched.');
    } catch (e) {
      console.warn('⚠️ Telegram alert failed:', e.message);
    }
  }
  if (ALERT_WEBHOOK_URL) {
    try {
      await fetch(ALERT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `🚨 MACALOCATOR Jev Watchman: ${BASE_URL}\n${summary}`, alerts: critical }),
      });
      console.log('✓ Webhook alert dispatched.');
    } catch (e) {
      console.warn('⚠️ Webhook alert failed:', e.message);
    }
  }
}

async function runAudit() {
  console.log('===============================================================');
  console.log('🔍 MACALOCATOR Jev Route Health Audit');
  console.log(`🎯 Base URL: ${BASE_URL}`);
  console.log(`🤖 Classification Engine: ${typeSafeClient ? 'Jev System-1 (jev-latest)' : 'Heuristic Fallback (no TYPESAFE_API_KEY)'}`);
  console.log(`⏰ ${new Date().toISOString()}`);
  console.log('===============================================================\n');

  const results = [];
  let errorCount = 0;
  for (const route of AUDIT_ROUTES) {
    const fullUrl = new URL(route.path, BASE_URL).toString();
    const raw = await fetchUrl(fullUrl);
    const classification = await classifyWithJev(route, raw);
    results.push({ route, raw, classification });
    const icon = classification.severity === 'ok' ? '🟢' : classification.severity === 'warning' ? '🟡' : '🔴';
    console.log(`${icon} [${classification.severity.toUpperCase()}] ${route.name.padEnd(26)} | ${route.path.padEnd(18)} | ${String(raw.status).padEnd(3)} | ${String(raw.latencyMs).padStart(5)}ms | ${classification.source}`);
    if (!classification.is_operational) errorCount++;
  }

  console.log('\n===============================================================');
  console.log(`📊 Summary: ${results.length} routes | ${results.length - errorCount} operational | ${errorCount} down`);
  console.log('===============================================================');

  if (errorCount > 0) {
    await dispatchAlert(results);
    process.exit(1);
  } else {
    console.log('🎉 All MACALOCATOR routes fully operational.\n');
    process.exit(0);
  }
}

runAudit().catch((err) => {
  console.error('Fatal error during Jev audit:', err);
  process.exit(1);
});
