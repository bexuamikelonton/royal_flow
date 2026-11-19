import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Seeding Avalanche Fuji contracts with account:", deployer.address);

  const mockUSDCAddr = process.env.MOCK_USDC_ADDRESS || "0xd4982321D81420F4504AFf00FDACaB626a19bC7F";
  const registryAddr = process.env.CONTENT_REGISTRY_ADDRESS || "0x36F9912d229dAC5F8e061633B0240E9dCFbdCc0e";
  const splitterAddr = process.env.ROYALTY_SPLITTER_ADDRESS || "0x2D61b88c0eA9eD339aEa3a6398D1DCFA663167aB";
  const licenseAddr = process.env.LICENSE_MANAGER_ADDRESS || "0x6cD504472999f4cfCAb86dddB3d8967d1647538d";

  const mockUSDC = await ethers.getContractAt("MockUSDC", mockUSDCAddr);
  const registry = await ethers.getContractAt("ContentRegistry", registryAddr);
  const splitter = await ethers.getContractAt("RoyaltySplitter", splitterAddr);
  const licenseManager = await ethers.getContractAt("LicenseManager", licenseAddr);

  const totalContents = await registry.totalContents();
  console.log("Current totalContents on Fuji:", totalContents.toString());

  if (totalContents === 0n) {
    // 1. Register Content #1 (Root Music EP)
    console.log("1. Registering Content #1 (Cyberpunk Ambient Soundtrack EP)...");
    const hash1 = ethers.keccak256(ethers.toUtf8Bytes("Cyberpunk Ambient Soundtrack EP"));
    const tx1 = await registry.registerContent(
      "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
      hash1,
      0n
    );
    await tx1.wait();

    console.log("   Configuring splits for Content #1 (50% Deployer / 30% B / 20% C)...");
    const split1 = await splitter.setSplits(
      1n,
      [
        deployer.address,
        "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
      ],
      [5000n, 3000n, 2000n],
      0n
    );
    await split1.wait();

    console.log("   Creating License Tier #1 (100 MockUSDC)...");
    const tier1 = await licenseManager.createTier(
      1n,
      1, // COMMERCIAL
      mockUSDCAddr,
      100n * 1000000n, // 100 USDC
      0n
    );
    await tier1.wait();

    // 2. Register Content #2 (Derivative Remix of #1)
    console.log("2. Registering Content #2 (Lo-Fi Cyberpunk Remix Edition - Derivative of #1)...");
    const hash2 = ethers.keccak256(ethers.toUtf8Bytes("Lo-Fi Cyberpunk Remix Edition"));
    const tx2 = await registry.registerContent(
      "QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx",
      hash2,
      1n // parentContentId = 1
    );
    await tx2.wait();

    console.log("   Configuring splits for Content #2 (20% Upstream to #1, 100% of child to Remixer)...");
    const split2 = await splitter.setSplits(
      2n,
      ["0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"],
      [10000n],
      2000n // 20% upstream to Content #1
    );
    await split2.wait();

    console.log("   Creating License Tier #2 (100 MockUSDC)...");
    const tier2 = await licenseManager.createTier(
      2n,
      1, // COMMERCIAL
      mockUSDCAddr,
      100n * 1000000n, // 100 USDC
      0n
    );
    await tier2.wait();

    // 3. Register Content #3 (Avalanche Subnet 3D Hologram Asset)
    console.log("3. Registering Content #3 (Avalanche Subnet 3D Hologram Asset)...");
    const hash3 = ethers.keccak256(ethers.toUtf8Bytes("Avalanche Subnet 3D Hologram Asset"));
    const tx3 = await registry.registerContent(
      "QmU7p3N2L9aJ8V6R2vQ8L7c3kXw1mP9bX4uE6vW7zY8qP3",
      hash3,
      0n
    );
    await tx3.wait();

    console.log("   Configuring splits for Content #3 (70% Deployer / 30% Shader Dev)...");
    const split3 = await splitter.setSplits(
      3n,
      [
        deployer.address,
        "0x9965507D1a55bcC2695C58ba16FB37d819B0A4df",
      ],
      [7000n, 3000n],
      0n
    );
    await split3.wait();

    console.log("   Creating License Tier #3 (0.01 AVAX for easy testnet demo)...");
    const tier3 = await licenseManager.createTier(
      3n,
      2, // DERIVATIVE_ALLOW
      "0x0000000000000000000000000000000000000000",
      ethers.parseEther("0.01"), // 0.01 AVAX
      0n
    );
    await tier3.wait();
  } else {
    console.log("Contents already seeded on Fuji!");
  }

  console.log("Seeding complete! Total contents:", (await registry.totalContents()).toString());
  console.log("Total license tiers:", (await licenseManager.totalTiers()).toString());
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
