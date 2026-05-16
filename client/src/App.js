import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import Upload from "./artifacts/contracts/Upload.sol/Upload.json";
import FileUpload from "./components/FileUpload";
import Display from "./components/Display";
import Modal from "./components/Modal";
import Settings from "./components/Settings";
import WalletConnect from "./components/WalletConnect";
import { connectByKind } from "./wallet/connectors";
import "./App.css";

const STORAGE_KIND_KEY = "wallet_kind";

function getContractAddress() {
  const fromEnv = process.env.REACT_APP_CONTRACT_ADDRESS;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  try {
    // eslint-disable-next-line global-require
    const fromFile = require("./contract-address.json");
    return fromFile.address;
  } catch (e) {
    return "";
  }
}

function App() {
  const [account, setAccount] = useState("");
  const [walletKind, setWalletKind] = useState("");
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [injected, setInjected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [configError, setConfigError] = useState("");

  const contractAddress = getContractAddress();

  const buildContract = useCallback(
    (signer) => {
      if (!contractAddress) {
        setConfigError(
          "Contract address not configured. Set REACT_APP_CONTRACT_ADDRESS or deploy the contract."
        );
        return null;
      }
      return new ethers.Contract(contractAddress, Upload.abi, signer);
    },
    [contractAddress]
  );

  const connect = useCallback(
    async (kind) => {
      const session = await connectByKind(kind);
      setAccount(session.address);
      setWalletKind(session.kind);
      setProvider(session.provider);
      setInjected(session.injected);
      const c = buildContract(session.signer);
      setContract(c);
      localStorage.setItem(STORAGE_KIND_KEY, session.kind);
    },
    [buildContract]
  );

  const disconnect = useCallback(() => {
    setAccount("");
    setWalletKind("");
    setContract(null);
    setProvider(null);
    setInjected(null);
    localStorage.removeItem(STORAGE_KIND_KEY);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KIND_KEY);
    if (saved) {
      connect(saved).catch(() => {
        localStorage.removeItem(STORAGE_KIND_KEY);
      });
    }
  }, [connect]);

  useEffect(() => {
    if (!injected) return undefined;
    const reload = () => window.location.reload();
    injected.on?.("chainChanged", reload);
    injected.on?.("accountsChanged", reload);
    return () => {
      injected.removeListener?.("chainChanged", reload);
      injected.removeListener?.("accountsChanged", reload);
    };
  }, [injected]);

  return (
    <>
      <div className="App">
        <div className="bg"></div>
        <div className="bg bg2"></div>
        <div className="bg bg3"></div>

        <h1 style={{ color: "white" }}>Blockbox</h1>

        {!account ? (
          <WalletConnect onConnect={connect} address="" walletKind="" />
        ) : (
          <>
            <WalletConnect
              address={account}
              walletKind={walletKind}
              onDisconnect={disconnect}
            />
            {configError && <p className="config-error">{configError}</p>}
            <div className="top-actions">
              <button className="share" onClick={() => setModalOpen(true)}>
                Share
              </button>
              <button className="share settings" onClick={() => setSettingsOpen(true)}>
                Settings
              </button>
            </div>
            <FileUpload
              account={account}
              provider={provider}
              contract={contract}
              onNeedsSettings={() => setSettingsOpen(true)}
            />
            <Display contract={contract} account={account} />
          </>
        )}

        {modalOpen && (
          <Modal setModalOpen={setModalOpen} contract={contract} />
        )}
        {settingsOpen && (
          <Settings
            account={account}
            setSettingsOpen={setSettingsOpen}
          />
        )}
      </div>
    </>
  );
}

export default App;
