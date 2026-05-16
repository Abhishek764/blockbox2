import { useEffect, useState } from "react";
import {
  DEFAULT_GATEWAY,
  DEFAULT_LOCAL_NODE,
  getGateway,
  getLocalMode,
  getLocalNodeUrl,
  getPinataJwt,
  setGateway,
  setLocalMode,
  setLocalNodeUrl,
  setPinataJwt,
} from "../pinata";
import "./Settings.css";

const Settings = ({ account, setSettingsOpen }) => {
  const [jwt, setJwt] = useState("");
  const [gateway, setGw] = useState(DEFAULT_GATEWAY);
  const [localMode, setLocalModeState] = useState(false);
  const [localUrl, setLocalUrlState] = useState(DEFAULT_LOCAL_NODE);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    setJwt(getPinataJwt(account));
    setGw(getGateway(account));
    setLocalModeState(getLocalMode(account));
    setLocalUrlState(getLocalNodeUrl(account));
  }, [account]);

  const save = () => {
    setPinataJwt(account, jwt.trim());
    setGateway(account, gateway.trim());
    setLocalMode(account, localMode);
    setLocalNodeUrl(account, localUrl.trim());
    setStatus("Saved.");
  };

  const testJwt = async () => {
    setTesting(true);
    setStatus("");
    try {
      const res = await fetch("https://api.pinata.cloud/data/testAuthentication", {
        headers: { Authorization: `Bearer ${jwt.trim()}` },
      });
      if (res.ok) setStatus("Pinata JWT works.");
      else setStatus(`Pinata auth failed: ${res.status}`);
    } catch (e) {
      setStatus(`Network error: ${e.message}`);
    } finally {
      setTesting(false);
    }
  };

  const testLocal = async () => {
    setTesting(true);
    setStatus("");
    try {
      const url = `${localUrl.replace(/\/$/, "")}/api/v0/version`;
      const res = await fetch(url, { method: "POST" });
      if (res.ok) {
        const j = await res.json();
        setStatus(`Local node OK. Kubo ${j.Version || "?"}`);
      } else {
        setStatus(`Local node ${res.status}. Check CORS config.`);
      }
    } catch (e) {
      setStatus(`Cannot reach local node: ${e.message}. CORS or node down.`);
    } finally {
      setTesting(false);
    }
  };

  const clearJwt = () => {
    setJwt("");
    setPinataJwt(account, "");
    setStatus("Pinata JWT cleared.");
  };

  return (
    <div className="settings-bg">
      <div className="settings-box">
        <h2>IPFS settings</h2>
        <p className="settings-note">
          All settings stored in this browser only ({account ? account.slice(0, 6) + "..." + account.slice(-4) : "no account"}).
        </p>

        <div className="settings-section">
          <label className="settings-toggle">
            <input
              type="checkbox"
              checked={localMode}
              onChange={(e) => setLocalModeState(e.target.checked)}
            />
            Use local IPFS node (skip Pinata)
          </label>
          <p className="settings-hint">
            Requires Kubo / IPFS Desktop running with CORS allowed for this origin. See README.
          </p>
        </div>

        {localMode ? (
          <>
            <label>Local node API URL</label>
            <input
              type="text"
              value={localUrl}
              onChange={(e) => setLocalUrlState(e.target.value)}
              placeholder={DEFAULT_LOCAL_NODE}
            />
          </>
        ) : (
          <>
            <label>Pinata JWT</label>
            <p className="settings-hint">
              Get one at{" "}
              <a href="https://app.pinata.cloud/developers/api-keys" target="_blank" rel="noreferrer">
                app.pinata.cloud → API Keys
              </a>{" "}
              (scope: pinFileToIPFS).
            </p>
            <textarea
              rows={4}
              value={jwt}
              onChange={(e) => setJwt(e.target.value)}
              placeholder="eyJhbGciOi..."
            />
          </>
        )}

        <label>Read gateway URL</label>
        <p className="settings-hint">
          Used as the preferred gateway. Display auto-falls-back to ipfs.io, cloudflare, dweb.link if this one fails.
        </p>
        <input
          type="text"
          value={gateway}
          onChange={(e) => setGw(e.target.value)}
          placeholder={DEFAULT_GATEWAY}
        />

        {status && <p className="settings-status">{status}</p>}

        <div className="settings-actions">
          {localMode ? (
            <button onClick={testLocal} disabled={testing}>
              {testing ? "Testing..." : "Test node"}
            </button>
          ) : (
            <>
              <button onClick={testJwt} disabled={!jwt || testing}>
                {testing ? "Testing..." : "Test JWT"}
              </button>
              <button onClick={clearJwt}>Clear JWT</button>
            </>
          )}
          <button className="primary" onClick={save}>Save</button>
          <button onClick={() => setSettingsOpen(false)}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
