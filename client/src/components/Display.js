import { useState } from "react";
import { buildGatewayList, extractCid, getGateway } from "../pinata";
import "./Display.css";

const ResilientImage = ({ cid, gateways, alt }) => {
  const [idx, setIdx] = useState(0);
  if (!cid) return null;
  const src = `${gateways[idx]}/ipfs/${cid}`;
  const onError = () => {
    if (idx + 1 < gateways.length) setIdx(idx + 1);
  };
  return (
    <a href={src} target="_blank" rel="noreferrer">
      <img src={src} alt={alt} className="image-list" onError={onError} />
    </a>
  );
};

const Display = ({ contract, account }) => {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("");
  const [address, setAddress] = useState("");

  const getData = async () => {
    if (!contract || !account) return;
    setStatus("Loading...");
    let dataArray;
    try {
      const target = address.trim() || account;
      dataArray = await contract.display(target);
    } catch (e) {
      setItems([]);
      setStatus("You don't have access.");
      return;
    }

    if (!dataArray || dataArray.length === 0) {
      setItems([]);
      setStatus("No images to display.");
      return;
    }

    const gateways = buildGatewayList(getGateway(account));
    const images = Array.from(dataArray).map((stored, i) => {
      const cid = extractCid(stored);
      return (
        <ResilientImage
          key={`${cid}-${i}`}
          cid={cid}
          gateways={gateways}
          alt={`upload-${i}`}
        />
      );
    });
    setItems(images);
    setStatus("");
  };

  return (
    <>
      <div className="image-list">{items}</div>
      {status && <p className="display-status">{status}</p>}
      <input
        type="text"
        placeholder="Enter Address (leave blank for your own)"
        className="display-address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />
      <button className="center button" onClick={getData}>
        Get Data
      </button>
    </>
  );
};

export default Display;
