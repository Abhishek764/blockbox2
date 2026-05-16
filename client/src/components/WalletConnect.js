import { useEffect, useState } from "react";
import { detectWallets, WALLET_KIND } from "../wallet/connectors";
import "./WalletConnect.css";

const WalletConnect = ({ onConnect, onDisconnect, address, walletKind }) => {
  const [installed, setInstalled] = useState({ metamask: false, phantom: false });
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setInstalled(detectWallets());
  }, []);

  const handle = async (kind) => {
    setError("");
    setBusy(kind);
    try {
      await onConnect(kind);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setBusy(null);
    }
  };

  if (address) {
    const short = `${address.slice(0, 6)}...${address.slice(-4)}`;
    return (
      <div className="wallet-bar">
        <span className="wallet-pill">
          {walletKind === WALLET_KIND.PHANTOM ? "Phantom" : "MetaMask"}: {short}
        </span>
        <button className="wallet-disconnect" onClick={onDisconnect}>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="wallet-picker">
      <h2>Connect wallet</h2>
      <p className="wallet-sub">Decentralized image storage on Ethereum + IPFS.</p>
      <div className="wallet-buttons">
        <button
          className="wallet-btn metamask"
          disabled={busy !== null}
          onClick={() =>
            installed.metamask
              ? handle(WALLET_KIND.METAMASK)
              : window.open("https://metamask.io/download/", "_blank")
          }
        >
          {busy === WALLET_KIND.METAMASK
            ? "Connecting..."
            : installed.metamask
            ? "Connect MetaMask"
            : "Install MetaMask"}
        </button>
        <button
          className="wallet-btn phantom"
          disabled={busy !== null}
          onClick={() =>
            installed.phantom
              ? handle(WALLET_KIND.PHANTOM)
              : window.open("https://phantom.app/download", "_blank")
          }
        >
          {busy === WALLET_KIND.PHANTOM
            ? "Connecting..."
            : installed.phantom
            ? "Connect Phantom"
            : "Install Phantom"}
        </button>
      </div>
      {error && <p className="wallet-error">{error}</p>}
    </div>
  );
};

export default WalletConnect;
