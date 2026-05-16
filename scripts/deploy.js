const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  const Upload = await hre.ethers.getContractFactory("Upload");
  const upload = await Upload.deploy();
  await upload.deployed();

  const address = upload.address;
  const network = hre.network.name;
  const chainId = hre.network.config.chainId || (await hre.ethers.provider.getNetwork()).chainId;

  console.log(`Upload contract deployed to ${address} on ${network} (chainId ${chainId})`);

  const outDir = path.join(__dirname, "..", "client", "src");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "contract-address.json");
  fs.writeFileSync(
    outPath,
    JSON.stringify({ address, network, chainId }, null, 2)
  );
  console.log(`Wrote ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
