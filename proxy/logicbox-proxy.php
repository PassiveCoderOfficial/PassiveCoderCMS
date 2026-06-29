<?php
/**
 * LogicBox API proxy — deploy on cPanel/shared hosting with a whitelisted static IP.
 *
 * The CMS (on Vercel, no fixed egress IP) cannot be whitelisted in ResellerClub.
 * This script runs on your always-on host; its OUTBOUND IP is whitelisted, so it
 * can reach httpapi.com. The CMS calls this script with a shared secret; the script
 * forwards the request to the real LogicBox API and returns the response verbatim.
 *
 * Deploy:
 *   1. Upload to your cPanel domain, e.g. https://your-cpanel-domain/logicbox-proxy.php
 *   2. Set PROXY_SECRET below (long random string). Put the SAME value in the CMS env
 *      LOGICBOX_PROXY_SECRET, and the script URL in LOGICBOX_PROXY_URL.
 *   3. Hit  https://your-cpanel-domain/logicbox-proxy.php?whoami=1  to print this
 *      server's OUTBOUND IP — whitelist THAT in ResellerClub (Settings -> API).
 *
 * Security: rejects any request without the correct X-Proxy-Secret header.
 * Only forwards to httpapi.com paths.
 */

// ── CONFIG ────────────────────────────────────────────────────────────────
$PROXY_SECRET = getenv('LOGICBOX_PROXY_SECRET') ?: 'CHANGE_ME_to_a_long_random_string';
$LOGICBOX_BASE = 'https://httpapi.com';
// ──────────────────────────────────────────────────────────────────────────

header('Content-Type: application/json');

// Diagnostic: print this server's outbound IP (the one to whitelist).
if (isset($_GET['whoami'])) {
  $ch = curl_init('https://api.ipify.org');
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($ch, CURLOPT_TIMEOUT, 10);
  $ip = curl_exec($ch);
  curl_close($ch);
  echo json_encode(['outbound_ip' => $ip ?: 'unknown']);
  exit;
}

// Auth
$provided = $_SERVER['HTTP_X_PROXY_SECRET'] ?? '';
if (!hash_equals($PROXY_SECRET, $provided)) {
  http_response_code(401);
  echo json_encode(['error' => 'Unauthorized']);
  exit;
}

// Expected: ?path=/api/dns/manage/add-ipv4-record.json  (the LogicBox API path)
$path = $_GET['path'] ?? '';
if ($path === '' || strpos($path, '/api/') !== 0) {
  http_response_code(400);
  echo json_encode(['error' => 'Invalid or missing path (must start with /api/)']);
  exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$target = $LOGICBOX_BASE . $path;

// Pass through query params (except our control params) for GET; body for POST.
$qs = $_GET;
unset($qs['path'], $qs['whoami']);

$ch = curl_init();
if ($method === 'POST') {
  // Forward raw POST body (application/x-www-form-urlencoded), append leftover query.
  $body = file_get_contents('php://input');
  if (!empty($qs)) {
    $extra = http_build_query($qs);
    $body = $body === '' ? $extra : $body . '&' . $extra;
  }
  curl_setopt($ch, CURLOPT_URL, $target);
  curl_setopt($ch, CURLOPT_POST, true);
  curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
  curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);
} else {
  $url = $target . (empty($qs) ? '' : ('?' . http_build_query($qs)));
  curl_setopt($ch, CURLOPT_URL, $url);
}
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);

$resp = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err  = curl_error($ch);
curl_close($ch);

if ($resp === false) {
  http_response_code(502);
  echo json_encode(['error' => 'Upstream request failed', 'detail' => $err]);
  exit;
}

http_response_code($code ?: 200);
echo $resp;
