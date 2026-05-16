import { useState } from "react";
import axios from "axios";
import {
  getLocalMode,
  getLocalNodeUrl,
  getPinataJwt,
} from "../pinata";
import "./FileUpload.css";

const PINATA_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS";

async function uploadToPinata(file, jwt) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await axios.post(PINATA_URL, formData, {
    headers: {
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "multipart/form-data",
    },
    maxBodyLength: Infinity,
  });
  return res.data.IpfsHash;
}

async function uploadToLocalNode(file, nodeUrl) {
  const formData = new FormData();
  formData.append("file", file);
  const url = `${nodeUrl.replace(/\/$/, "")}/api/v0/add?pin=true&cid-version=1`;
  const res = await fetch(url, { method: "POST", body: formData });
  if (!res.ok) {
    throw new Error(`Local node ${res.status}: ${await res.text()}`);
  }
  const text = await res.text();
  const lines = text.trim().split("\n").filter(Boolean);
  const last = JSON.parse(lines[lines.length - 1]);
  if (!last.Hash) throw new Error("Local node returned no Hash");
  return last.Hash;
}

const FileUpload = ({ contract, account, onNeedsSettings }) => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("No image selected");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !contract || !account) return;

    const useLocal = getLocalMode(account);
    const jwt = useLocal ? "" : getPinataJwt(account);

    if (!useLocal && !jwt) {
      setStatus("Add your Pinata JWT in Settings, or enable Local node mode.");
      if (onNeedsSettings) onNeedsSettings();
      return;
    }

    setBusy(true);
    setStatus(useLocal ? "Uploading to local IPFS node..." : "Uploading to IPFS via Pinata...");
    try {
      const cid = useLocal
        ? await uploadToLocalNode(file, getLocalNodeUrl(account))
        : await uploadToPinata(file, jwt);

      const uri = `ipfs://${cid}`;
      setStatus(`Pinned ${cid.slice(0, 12)}... Sending transaction...`);

      const tx = await contract.add(account, uri);
      await tx.wait();

      setStatus(`Stored on-chain. CID: ${cid}`);
      setFileName("No image selected");
      setFile(null);
      e.target.reset?.();
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || String(err);
      setStatus(`Upload failed: ${msg}`);
    } finally {
      setBusy(false);
    }
  };

  const retrieveFile = (e) => {
    const data = e.target.files[0];
    if (!data) return;
    setFile(data);
    setFileName(data.name);
    setStatus("");
  };

  return (
    <div className="top">
      <form className="form" onSubmit={handleSubmit}>
        <label htmlFor="file-upload" className="choose">
          Choose Image
        </label>
        <input
          disabled={!account || busy}
          type="file"
          id="file-upload"
          name="data"
          accept="image/*"
          onChange={retrieveFile}
        />
        <span className="textArea">Image: {fileName}</span>
        <button type="submit" className="upload" disabled={!file || busy}>
          {busy ? "Uploading..." : "Upload File"}
        </button>
      </form>
      {status && <p className="upload-status">{status}</p>}
    </div>
  );
};

export default FileUpload;
