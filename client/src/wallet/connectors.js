import { ethers } from "ethers";

export const WALLET_KIND = {
  METAMASK: "metamask",
  PHANTOM: "phantom",
};

function getMetaMaskProvider() {
  const eth = window.ethereum;
  if (!eth) return null;
  if (Array.isArray(eth.providers)) {
    return eth.providers.find((p) => p.isMetaMask) || null;
  }
  return eth.isMetaMask ? eth : null;
}

function getPhantomEvmProvider() {
  return window.phantom?.ethereum || null;
}

export function detectWallets() {
  return {
    metamask: !!getMetaMaskProvider(),
    phantom: !!getPhantomEvmProvider(),
  };
}

async function connectWithInjected(injected, kind) {
  if (!injected) throw new Error(`${kind} not installed`);
  const provider = new ethers.providers.Web3Provider(injected, "any");
  await provider.send("eth_requestAccounts", []);
  const signer = provider.getSigner();
  const address = await signer.getAddress();
  return { kind, injected, provider, signer, address };
}

export async function connectMetaMask() {
  return connectWithInjected(getMetaMaskProvider(), WALLET_KIND.METAMASK);
}

export async function connectPhantom() {
  return connectWithInjected(getPhantomEvmProvider(), WALLET_KIND.PHANTOM);
}

export async function connectByKind(kind) {
  if (kind === WALLET_KIND.METAMASK) return connectMetaMask();
  if (kind === WALLET_KIND.PHANTOM) return connectPhantom();
  throw new Error(`Unknown wallet kind: ${kind}`);
}
