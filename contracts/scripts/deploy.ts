import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("=================================================");
  console.log("RoyaltyFlow Contracts Deployment");
  console.log("Deployer account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());
  console.log("=================================================");

  // 1. Deploy MockUSDC
  console.log("\n1. Deploying MockUSDC...");
  const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDCFactory.deploy(deployer.address);
  await mockUSDC.waitForDeployment();
  const mockUSDCAddress = await mockUSDC.getAddress();
  console.log("-> MockUSDC deployed at:", mockUSDCAddress);

  // 2. Deploy ContentRegistry
  console.log("\n2. Deploying ContentRegistry...");
  const ContentRegistryFactory = await ethers.getContractFactory("ContentRegistry");
  const contentRegistry = await ContentRegistryFactory.deploy(deployer.address);
  await contentRegistry.waitForDeployment();
  const contentRegistryAddress = await contentRegistry.getAddress();
  console.log("-> ContentRegistry deployed at:", contentRegistryAddress);

  // 3. Deploy RoyaltySplitter
  console.log("\n3. Deploying RoyaltySplitter...");
  const RoyaltySplitterFactory = await ethers.getContractFactory("RoyaltySplitter");
  const royaltySplitter = await RoyaltySplitterFactory.deploy(contentRegistryAddress, deployer.address);
  await royaltySplitter.waitForDeployment();
  const royaltySplitterAddress = await royaltySplitter.getAddress();
  console.log("-> RoyaltySplitter deployed at:", royaltySplitterAddress);

  // 4. Deploy PaymentVault
  console.log("\n4. Deploying PaymentVault...");
  const PaymentVaultFactory = await ethers.getContractFactory("PaymentVault");
  const paymentVault = await PaymentVaultFactory.deploy(royaltySplitterAddress, deployer.address);
  await paymentVault.waitForDeployment();
  const paymentVaultAddress = await paymentVault.getAddress();
  console.log("-> PaymentVault deployed at:", paymentVaultAddress);

  // 5. Deploy LicenseManager
  console.log("\n5. Deploying LicenseManager...");
  const LicenseManagerFactory = await ethers.getContractFactory("LicenseManager");
  const licenseManager = await LicenseManagerFactory.deploy(
    contentRegistryAddress,
    paymentVaultAddress,
    deployer.address
  );
  await licenseManager.waitForDeployment();
  const licenseManagerAddress = await licenseManager.getAddress();
  console.log("-> LicenseManager deployed at:", licenseManagerAddress);

  // 6. Grant OPERATOR_ROLE of PaymentVault to LicenseManager
  console.log("\n6. Granting OPERATOR_ROLE to LicenseManager...");
  const OPERATOR_ROLE = await paymentVault.OPERATOR_ROLE();
  const grantRoleTx = await paymentVault.grantRole(OPERATOR_ROLE, licenseManagerAddress);
  await grantRoleTx.wait();
  console.log("-> Granted OPERATOR_ROLE successfully!");

  // Summary
  const deploymentSummary = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      MockUSDC: mockUSDCAddress,
      ContentRegistry: contentRegistryAddress,
      RoyaltySplitter: royaltySplitterAddress,
      PaymentVault: paymentVaultAddress,
      LicenseManager: licenseManagerAddress,
    },
  };

  console.log("\n=================================================");
  console.log("DEPLOYMENT COMPLETE SUMMARY:");
  console.log(JSON.stringify(deploymentSummary, null, 2));
  console.log("=================================================");

  // Save to deployment output file
  const outDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(outDir, "latest.json"),
    JSON.stringify(deploymentSummary, null, 2)
  );
  console.log("Deployment details saved to deployments/latest.json");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
