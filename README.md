# Blockbox — Decentralized Image Upload & Sharing

Purely decentralized image storage. Users authenticate with **MetaMask** or **Phantom** (EVM mode), upload images to **IPFS via Pinata**, and grant per-address read access through a Solidity smart contract. No backend, no shared secrets — each user holds their own Pinata key in their own browser.

## Architecture

- **Smart contract** (`contracts/Upload.sol`) — stores IPFS CIDs per owner, manages an allowlist of addresses that can read each owner's list.
- **Frontend** (`client/`) — React app. Wallet connect → user pastes their own Pinata JWT into Settings → upload pins file to IPFS → CID is recorded on-chain → viewers fetch the CID list via the contract and load images through a Pinata gateway.
- **No server.** No shared API keys. The Pinata JWT lives only in the user's browser (`localStorage`, keyed by wallet address). Two users sharing the same machine each store their own.

## Wallet support

| Wallet | Detection |
|--------|-----------|
| MetaMask | `window.ethereum` (handles multi-provider arrays) |
| Phantom (EVM) | `window.phantom.ethereum` |

Phantom is used in its EVM mode against the same Ethereum-compatible contract — no separate Solana program.

## Prerequisites

- Node.js 18+
- MetaMask or Phantom browser extension
- A free Pinata account → API key with `pinFileToIPFS` scope (JWT)

## Setup

### 1. Install dependencies

```bash
# from repo root
npm install

cd client
npm install
```

### 2. (Optional) Configure deploy secrets

Only needed for deploying to a testnet. Local development on a Hardhat node needs nothing here.

```bash
cp .env.example .env
# fill in DEPLOYER_PRIVATE_KEY and one of SEPOLIA_RPC_URL / AMOY_RPC_URL
```

### 3. Compile + deploy the contract

**Local (Hardhat node):**
```bash
# terminal A
npx hardhat node

# terminal B
npx hardhat run scripts/deploy.js --network localhost
```

**Sepolia:**
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

The deploy script writes `client/src/contract-address.json`. The frontend reads it automatically. You can override with `REACT_APP_CONTRACT_ADDRESS` in `client/.env`.

### 4. Run the frontend

```bash
cd client
npm start
```

Open http://localhost:3000.

## Usage

1. **Connect wallet** — click MetaMask or Phantom. If a wallet isn't installed, the button opens its install page.
2. **Open Settings** — paste your Pinata JWT. The "Test JWT" button hits Pinata's `testAuthentication` endpoint. Optionally set a custom gateway URL.
3. **Upload Image** — pick a file, click Upload. The app pins it to IPFS, gets a CID, and calls `Upload.add(account, cid)`. Transaction must confirm before the upload is considered done.
4. **Get Data** — leave the address field blank to view your own images. Enter another wallet's address to view theirs (only works if they've granted you access).
5. **Share** — opens the share modal. Enter an address and click Share to grant access. The "People with access" list shows current grants and a Revoke button per entry.

## IPFS modes

Blockbox stores `ipfs://<cid>` URIs on-chain. The CID is content-addressable — any IPFS gateway can serve the file. Two upload paths:

### Mode A: Pinata (default)

User pastes their own Pinata JWT in Settings. Upload goes to `pinFileToIPFS`. Pinata pins the file to the public IPFS network.

### Mode B: Local IPFS node

Toggle "Use local IPFS node" in Settings. Upload goes to a Kubo HTTP API (default `http://127.0.0.1:5001/api/v0/add`). No third party touches the file.

Setup:
1. Install [Kubo](https://docs.ipfs.tech/install/) or [IPFS Desktop](https://docs.ipfs.tech/install/ipfs-desktop/).
2. Allow CORS for the React dev origin so the browser can POST to the API:
   ```bash
   ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["http://localhost:3000"]'
   ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["POST"]'
   ipfs daemon
   ```
3. Open Settings → enable Local mode → click "Test node".

### Read-side fallback gateways

Display tries the user-chosen gateway first, then automatically falls back through:
`ipfs.io` → `cloudflare-ipfs.com` → `dweb.link` → `nftstorage.link`. So even if Pinata's gateway is down, images still load.

## Security & decentralization notes

- **Pinata JWT in the browser is unavoidable for a no-backend design.** Each user supplies their own JWT, so a leak only affects that user's pinning quota. Mitigate by minting a JWT scoped to `pinFileToIPFS` only.
- **Files are public.** Anything pinned to IPFS is retrievable by CID. The on-chain ACL only gates who can read *the list of CIDs*, not the files themselves. For private content, encrypt client-side before uploading (not implemented).
- **CIDs only on-chain.** The contract stores CIDs (not full gateway URLs) so gateway choice is decoupled.
- **No tracking.** No analytics, no remote logging. Everything that isn't a blockchain call or a Pinata pin stays in the browser.

## Project layout

```
contracts/Upload.sol                       smart contract
scripts/deploy.js                          deploy + write address json
hardhat.config.js                          networks (hardhat/localhost/sepolia/amoy)
client/src/App.js                          wallet picker, contract wiring
client/src/wallet/connectors.js            MetaMask + Phantom detection/connect
client/src/components/WalletConnect.js     connect UI
client/src/components/Settings.js          per-user Pinata JWT + gateway
client/src/components/FileUpload.js        Pinata upload + on-chain add
client/src/components/Display.js           read CIDs, render gateway URLs
client/src/components/Modal.js             allow / revoke share
client/src/pinata.js                       JWT/gateway storage + CID helpers
```

## License

GPL-3.0 (matches the contract).
