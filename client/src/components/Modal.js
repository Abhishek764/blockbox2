import { useCallback, useEffect, useState } from "react";
import "./Modal.css";

const Modal = ({ setModalOpen, contract }) => {
  const [accessList, setAccessList] = useState([]);
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const loadAccess = useCallback(async () => {
    if (!contract) return;
    try {
      const list = await contract.shareAccess();
      setAccessList(
        list.map((entry) => ({
          user: entry.user,
          access: entry.access,
        }))
      );
    } catch (e) {
      setStatus(`Failed to load access list: ${e.message || e}`);
    }
  }, [contract]);

  useEffect(() => {
    loadAccess();
  }, [loadAccess]);

  const share = async () => {
    const target = address.trim();
    if (!target) {
      setStatus("Enter an address.");
      return;
    }
    setBusy(true);
    setStatus("Submitting allow transaction...");
    try {
      const tx = await contract.allow(target);
      await tx.wait();
      setStatus(`Granted access to ${target.slice(0, 6)}...${target.slice(-4)}`);
      setAddress("");
      await loadAccess();
    } catch (e) {
      setStatus(`Allow failed: ${e?.reason || e?.message || e}`);
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (user) => {
    setBusy(true);
    setStatus(`Revoking ${user.slice(0, 6)}...${user.slice(-4)}`);
    try {
      const tx = await contract.disallow(user);
      await tx.wait();
      setStatus(`Revoked ${user.slice(0, 6)}...${user.slice(-4)}`);
      await loadAccess();
    } catch (e) {
      setStatus(`Revoke failed: ${e?.reason || e?.message || e}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modalBackground">
      <div className="modalContainer">
        <div className="title">Share with</div>
        <div className="body">
          <input
            type="text"
            className="share-address"
            placeholder="Enter Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={busy}
          />
        </div>

        <div className="access-list">
          <div className="access-header">People with access</div>
          {accessList.length === 0 && (
            <div className="access-empty">No one yet.</div>
          )}
          {accessList.map((a, i) => (
            <div key={`${a.user}-${i}`} className="access-row">
              <span className="access-user" title={a.user}>
                {a.user.slice(0, 6)}...{a.user.slice(-4)}
              </span>
              <span className={`access-flag ${a.access ? "on" : "off"}`}>
                {a.access ? "granted" : "revoked"}
              </span>
              {a.access && (
                <button
                  className="access-revoke"
                  onClick={() => revoke(a.user)}
                  disabled={busy}
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>

        {status && <div className="modal-status">{status}</div>}

        <div className="footer">
          <button
            onClick={() => setModalOpen(false)}
            id="cancelBtn"
            disabled={busy}
          >
            Close
          </button>
          <button onClick={share} disabled={busy}>
            {busy ? "..." : "Share"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
