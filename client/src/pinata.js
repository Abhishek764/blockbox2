export const DEFAULT_GATEWAY = "https://gateway.pinata.cloud";

export const FALLBACK_GATEWAYS = [
  "https://gateway.pinata.cloud",
  "https://ipfs.io",
  "https://cloudflare-ipfs.com",
  "https://dweb.link",
  "https://nftstorage.link",
];

const jwtKey = (account) => `pinata_jwt:${(account || "").toLowerCase()}`;
const gatewayKey = (account) => `pinata_gateway:${(account || "").toLowerCase()}`;
const localModeKey = (account) => `ipfs_local_mode:${(account || "").toLowerCase()}`;
const localUrlKey = (account) => `ipfs_local_url:${(account || "").toLowerCase()}`;

export const DEFAULT_LOCAL_NODE = "http://127.0.0.1:5001";

export function getPinataJwt(account) {
  if (!account) return "";
  return localStorage.getItem(jwtKey(account)) || "";
}

export function setPinataJwt(account, jwt) {
  if (!account) return;
  if (jwt) localStorage.setItem(jwtKey(account), jwt);
  else localStorage.removeItem(jwtKey(account));
}

export function getGateway(account) {
  const v = localStorage.getItem(gatewayKey(account));
  return (v && v.trim()) || DEFAULT_GATEWAY;
}

export function setGateway(account, gateway) {
  if (!account) return;
  if (gateway && gateway.trim()) {
    localStorage.setItem(gatewayKey(account), gateway.trim().replace(/\/$/, ""));
  } else {
    localStorage.removeItem(gatewayKey(account));
  }
}

export function getLocalMode(account) {
  return localStorage.getItem(localModeKey(account)) === "1";
}

export function setLocalMode(account, enabled) {
  if (!account) return;
  if (enabled) localStorage.setItem(localModeKey(account), "1");
  else localStorage.removeItem(localModeKey(account));
}

export function getLocalNodeUrl(account) {
  const v = localStorage.getItem(localUrlKey(account));
  return (v && v.trim()) || DEFAULT_LOCAL_NODE;
}

export function setLocalNodeUrl(account, url) {
  if (!account) return;
  if (url && url.trim()) {
    localStorage.setItem(localUrlKey(account), url.trim().replace(/\/$/, ""));
  } else {
    localStorage.removeItem(localUrlKey(account));
  }
}

export function normalizeGateway(g) {
  if (!g) return DEFAULT_GATEWAY;
  return g.replace(/\/$/, "");
}

export function extractCid(stored) {
  if (!stored) return "";
  const s = String(stored).trim();
  if (s.startsWith("ipfs://")) return s.slice("ipfs://".length).replace(/^\/+/, "");
  const m = s.match(/\/ipfs\/([^/?#]+)/);
  if (m) return m[1];
  return s;
}

export function cidToUrl(stored, gateway) {
  const cid = extractCid(stored);
  if (!cid) return "";
  return `${normalizeGateway(gateway)}/ipfs/${cid}`;
}

export function buildGatewayList(preferred) {
  const norm = normalizeGateway(preferred);
  const seen = new Set();
  const list = [];
  for (const g of [norm, ...FALLBACK_GATEWAYS]) {
    const n = normalizeGateway(g);
    if (!seen.has(n)) {
      seen.add(n);
      list.push(n);
    }
  }
  return list;
}
