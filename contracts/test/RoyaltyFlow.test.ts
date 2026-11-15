import { expect } from "chai";
import { ethers } from "hardhat";
import {
  MockUSDC,
  ContentRegistry,
  RoyaltySplitter,
  PaymentVault,
  LicenseManager,
} from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("RoyaltyFlow Comprehensive Test Suite", function () {
  let deployer: SignerWithAddress;
  let authorA: SignerWithAddress;
  let authorB: SignerWithAddress;
  let authorC: SignerWithAddress;
  let buyerD: SignerWithAddress;
  let authorE: SignerWithAddress;

  let mockUSDC: MockUSDC;
  let contentRegistry: ContentRegistry;
  let royaltySplitter: RoyaltySplitter;
  let paymentVault: PaymentVault;
  let licenseManager: LicenseManager;

  const sampleCid1 = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
  const sampleSha256_1 = ethers.keccak256(ethers.toUtf8Bytes("content-file-1"));
  const sampleCid2 = "QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx";
  const sampleSha256_2 = ethers.keccak256(ethers.toUtf8Bytes("content-file-2-derivative"));

  const ONE_HUNDRED_USDC = ethers.parseUnits("100", 6); // 100 USDC (6 decimals)

  before(async function () {
    [deployer, authorA, authorB, authorC, buyerD, authorE] = await ethers.getSigners();
  });

  describe("1. Khởi tạo & Triển khai Smart Contracts", function () {
    it("Triển khai thành công MockUSDC, ContentRegistry, RoyaltySplitter, PaymentVault, LicenseManager", async function () {
      // Deploy MockUSDC
      const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
      mockUSDC = await MockUSDCFactory.deploy(deployer.address);
      await mockUSDC.waitForDeployment();
      expect(await mockUSDC.getAddress()).to.be.properAddress;
      expect(await mockUSDC.decimals()).to.equal(6);

      // Deploy ContentRegistry
      const ContentRegistryFactory = await ethers.getContractFactory("ContentRegistry");
      contentRegistry = await ContentRegistryFactory.deploy(deployer.address);
      await contentRegistry.waitForDeployment();
      expect(await contentRegistry.getAddress()).to.be.properAddress;

      // Deploy RoyaltySplitter
      const RoyaltySplitterFactory = await ethers.getContractFactory("RoyaltySplitter");
      royaltySplitter = await RoyaltySplitterFactory.deploy(
        await contentRegistry.getAddress(),
        deployer.address
      );
      await royaltySplitter.waitForDeployment();
      expect(await royaltySplitter.getAddress()).to.be.properAddress;

      // Deploy PaymentVault
      const PaymentVaultFactory = await ethers.getContractFactory("PaymentVault");
      paymentVault = await PaymentVaultFactory.deploy(
        await royaltySplitter.getAddress(),
        deployer.address
      );
      await paymentVault.waitForDeployment();
      expect(await paymentVault.getAddress()).to.be.properAddress;

      // Deploy LicenseManager
      const LicenseManagerFactory = await ethers.getContractFactory("LicenseManager");
      licenseManager = await LicenseManagerFactory.deploy(
        await contentRegistry.getAddress(),
        await paymentVault.getAddress(),
        deployer.address
      );
      await licenseManager.waitForDeployment();
      expect(await licenseManager.getAddress()).to.be.properAddress;
    });

    it("Cấp quyền OPERATOR_ROLE của PaymentVault cho LicenseManager", async function () {
      const OPERATOR_ROLE = await paymentVault.OPERATOR_ROLE();
      const tx = await paymentVault.grantRole(OPERATOR_ROLE, await licenseManager.getAddress());
      await tx.wait();

      expect(await paymentVault.hasRole(OPERATOR_ROLE, await licenseManager.getAddress())).to.be.true;
    });
  });

  describe("2. Đăng ký tác phẩm & Cấu hình tỷ lệ phân chia", function () {
    it("Tác giả A đăng ký tác phẩm gốc #1 thành công", async function () {
      const tx = await contentRegistry
        .connect(authorA)
        .registerContent(sampleCid1, sampleSha256_1, 0);
      const receipt = await tx.wait();

      expect(await contentRegistry.totalContents()).to.equal(1);
      const content = await contentRegistry.getContent(1);
      expect(content.contentId).to.equal(1);
      expect(content.primaryCreator).to.equal(authorA.address);
      expect(content.ipfsCid).to.equal(sampleCid1);
      expect(content.contentSha256).to.equal(sampleSha256_1);
      expect(content.parentContentId).to.equal(0);
      expect(content.isFrozen).to.be.false;
    });

    it("Xác nhận thất bại nếu tổng BPS != 10,000 (Ví dụ 50/30/10 = 90% -> revert)", async function () {
      const recipients = [authorA.address, authorB.address, authorC.address];
      const invalidBpsShares = [5000, 3000, 1000]; // Total = 9,000 bps

      await expect(
        royaltySplitter.connect(authorA).setSplits(1, recipients, invalidBpsShares, 0)
      ).to.be.revertedWithCustomError(royaltySplitter, "InvalidTotalBPS");
    });

    it("Cấu hình thành công 3 đồng tác giả A, B, C với tỷ lệ 50% (5,000 bps), 30% (3,000 bps), 20% (2,000 bps)", async function () {
      const recipients = [authorA.address, authorB.address, authorC.address];
      const bpsShares = [5000, 3000, 2000]; // Total = 10,000 bps (100%)

      await expect(royaltySplitter.connect(authorA).setSplits(1, recipients, bpsShares, 0))
        .to.emit(royaltySplitter, "SplitsConfigured")
        .withArgs(1, recipients, bpsShares, 0);

      const rule = await royaltySplitter.getSplitRule(1);
      expect(rule.recipients).to.deep.equal(recipients);
      expect(rule.bpsShares).to.deep.equal(bpsShares.map((b) => BigInt(b)));
      expect(rule.upstreamBps).to.equal(0);
      expect(rule.isConfigured).to.be.true;
    });

    it("Người không có quyền không thể chỉnh sửa cấu hình chia sẻ của tác giả A", async function () {
      const recipients = [authorB.address];
      const bpsShares = [10000];

      await expect(
        royaltySplitter.connect(buyerD).setSplits(1, recipients, bpsShares, 0)
      ).to.be.revertedWithCustomError(royaltySplitter, "UnauthorizedSplitCaller");
    });
  });

  describe("3. Mua bản quyền & Tự động phân phối doanh thu", function () {
    let commercialTierId: bigint;

    it("Tác giả A tạo gói giấy phép Commercial với giá 100 MockUSDC", async function () {
      // LicenseType: 1 = COMMERCIAL, duration: 0 (Perpetual)
      const tx = await licenseManager
        .connect(authorA)
        .createTier(1, 1, await mockUSDC.getAddress(), ONE_HUNDRED_USDC, 0);
      const receipt = await tx.wait();

      expect(await licenseManager.totalTiers()).to.equal(1);
      commercialTierId = 1n;

      const tier = await licenseManager.getTier(commercialTierId);
      expect(tier.contentId).to.equal(1);
      expect(tier.licenseType).to.equal(1);
      expect(tier.paymentToken).to.equal(await mockUSDC.getAddress());
      expect(tier.price).to.equal(ONE_HUNDRED_USDC);
      expect(tier.isActive).to.be.true;
    });

    it("Khách hàng D nhận 100 MockUSDC từ faucet và approve cho LicenseManager", async function () {
      // Faucet 100 USDC to Buyer D
      await mockUSDC.connect(buyerD).faucet(buyerD.address, ONE_HUNDRED_USDC);
      expect(await mockUSDC.balanceOf(buyerD.address)).to.equal(ONE_HUNDRED_USDC);

      // Approve LicenseManager
      await mockUSDC.connect(buyerD).approve(await licenseManager.getAddress(), ONE_HUNDRED_USDC);
      expect(
        await mockUSDC.allowance(buyerD.address, await licenseManager.getAddress())
      ).to.equal(ONE_HUNDRED_USDC);
    });

    it("Khách hàng D gọi purchaseLicense -> Số dư phân bổ tự động vào PaymentVault đúng tỷ lệ", async function () {
      const tx = await licenseManager.connect(buyerD).purchaseLicense(commercialTierId);
      await expect(tx)
        .to.emit(licenseManager, "LicensePurchased")
        .withArgs(1n, commercialTierId, 1n, buyerD.address, ONE_HUNDRED_USDC, 0n);

      const usdcAddress = await mockUSDC.getAddress();

      // Kiểm tra withdrawable balances trong PaymentVault:
      // A (50%) = 50 USDC
      // B (30%) = 30 USDC
      // C (20%) = 20 USDC
      const balanceA = await paymentVault.getPendingBalance(usdcAddress, authorA.address);
      const balanceB = await paymentVault.getPendingBalance(usdcAddress, authorB.address);
      const balanceC = await paymentVault.getPendingBalance(usdcAddress, authorC.address);

      expect(balanceA).to.equal(ethers.parseUnits("50", 6));
      expect(balanceB).to.equal(ethers.parseUnits("30", 6));
      expect(balanceC).to.equal(ethers.parseUnits("20", 6));

      // Buyer D has valid license
      expect(await licenseManager.hasValidLicense(1, buyerD.address)).to.be.true;
    });
  });

  describe("4. Rút tiền (Pull Payment Pattern)", function () {
    it("Tác giả A rút tiền -> Nhận chính xác 50 USDC vào ví cá nhân", async function () {
      const usdcAddress = await mockUSDC.getAddress();
      const initialWalletBalanceA = await mockUSDC.balanceOf(authorA.address);

      await expect(paymentVault.connect(authorA).withdraw(usdcAddress))
        .to.emit(paymentVault, "Withdrawn")
        .withArgs(usdcAddress, authorA.address, ethers.parseUnits("50", 6));

      const finalWalletBalanceA = await mockUSDC.balanceOf(authorA.address);
      expect(finalWalletBalanceA - initialWalletBalanceA).to.equal(ethers.parseUnits("50", 6));

      // Pending balance của A trong PaymentVault phải về 0
      expect(await paymentVault.getPendingBalance(usdcAddress, authorA.address)).to.equal(0);
    });

    it("Tác giả A rút lần 2 bị revert vì không còn số dư khả dụng", async function () {
      const usdcAddress = await mockUSDC.getAddress();
      await expect(
        paymentVault.connect(authorA).withdraw(usdcAddress)
      ).to.be.revertedWithCustomError(paymentVault, "NoWithdrawableBalance");
    });

    it("Tác giả B và C rút tiền thành công theo mô hình Pull", async function () {
      const usdcAddress = await mockUSDC.getAddress();

      await paymentVault.connect(authorB).withdraw(usdcAddress);
      expect(await mockUSDC.balanceOf(authorB.address)).to.equal(ethers.parseUnits("30", 6));
      expect(await paymentVault.getPendingBalance(usdcAddress, authorB.address)).to.equal(0);

      await paymentVault.connect(authorC).withdraw(usdcAddress);
      expect(await mockUSDC.balanceOf(authorC.address)).to.equal(ethers.parseUnits("20", 6));
      expect(await paymentVault.getPendingBalance(usdcAddress, authorC.address)).to.equal(0);
    });
  });

  describe("5. Kiểm thử Tác phẩm phái sinh (Derivative Royalty Graph)", function () {
    let childTierId: bigint;

    it("Tác giả E đăng ký tác phẩm phái sinh #2 kế thừa tác phẩm #1", async function () {
      const tx = await contentRegistry
        .connect(authorE)
        .registerContent(sampleCid2, sampleSha256_2, 1); // parentContentId = 1
      await tx.wait();

      expect(await contentRegistry.totalContents()).to.equal(2);
      const childContent = await contentRegistry.getContent(2);
      expect(childContent.parentContentId).to.equal(1);
      expect(childContent.primaryCreator).to.equal(authorE.address);
    });

    it("Tác giả E cấu hình trích 20% (2,000 bps) cho tác phẩm cha và 100% phần còn lại cho E", async function () {
      // Upstream 2000 bps (20%) cho tác phẩm #1
      // Phần còn lại chia 100% (10,000 bps) cho tác giả E
      await royaltySplitter
        .connect(authorE)
        .setSplits(2, [authorE.address], [10000], 2000);

      const rule = await royaltySplitter.getSplitRule(2);
      expect(rule.upstreamBps).to.equal(2000);
      expect(rule.recipients).to.deep.equal([authorE.address]);
    });

    it("Tạo gói giấy phép cho tác phẩm phái sinh #2 với giá 100 MockUSDC", async function () {
      const tx = await licenseManager
        .connect(authorE)
        .createTier(2, 1, await mockUSDC.getAddress(), ONE_HUNDRED_USDC, 0);
      await tx.wait();
      childTierId = 2n;
    });

    it("Khách hàng D mua tác phẩm #2 -> Doanh thu chia đúng: 20 USDC về cha (A:10, B:6, C:4), 80 USDC về E", async function () {
      const usdcAddress = await mockUSDC.getAddress();

      // Buyer D nạp thêm 100 USDC và approve
      await mockUSDC.connect(buyerD).faucet(buyerD.address, ONE_HUNDRED_USDC);
      await mockUSDC.connect(buyerD).approve(await licenseManager.getAddress(), ONE_HUNDRED_USDC);

      // Mua bản quyền tác phẩm phái sinh #2
      await licenseManager.connect(buyerD).purchaseLicense(childTierId);

      // Kiểm tra phân bổ:
      // Tác phẩm #2 tạo ra 100 USDC.
      // Upstream 20% = 20 USDC chảy về tác phẩm #1:
      //   - A (50% của 20 USDC) = 10 USDC
      //   - B (30% của 20 USDC) = 6 USDC
      //   - C (20% của 20 USDC) = 4 USDC
      // Phần còn lại 80% = 80 USDC phân bổ cho E (100%):
      //   - E = 80 USDC
      const balanceA = await paymentVault.getPendingBalance(usdcAddress, authorA.address);
      const balanceB = await paymentVault.getPendingBalance(usdcAddress, authorB.address);
      const balanceC = await paymentVault.getPendingBalance(usdcAddress, authorC.address);
      const balanceE = await paymentVault.getPendingBalance(usdcAddress, authorE.address);

      expect(balanceA).to.equal(ethers.parseUnits("10", 6));
      expect(balanceB).to.equal(ethers.parseUnits("6", 6));
      expect(balanceC).to.equal(ethers.parseUnits("4", 6));
      expect(balanceE).to.equal(ethers.parseUnits("80", 6));

      // E rút 80 USDC thành công
      await paymentVault.connect(authorE).withdraw(usdcAddress);
      expect(await mockUSDC.balanceOf(authorE.address)).to.equal(ethers.parseUnits("80", 6));
    });
  });

  describe("6. Kiểm thử Tranh chấp & Đóng băng (Dispute & Freeze)", function () {
    it("Admin đóng băng tác phẩm #1 khi có tranh chấp bản quyền", async function () {
      await expect(contentRegistry.connect(deployer).freezeContent(1))
        .to.emit(contentRegistry, "ContentFrozen")
        .withArgs(1);

      expect(await contentRegistry.isContentFrozen(1)).to.be.true;
    });

    it("Hành động mua bản quyền tác phẩm đang bị đóng băng PHẢI BỊ REVERT", async function () {
      // Buyer D chuẩn bị tiền
      await mockUSDC.connect(buyerD).faucet(buyerD.address, ONE_HUNDRED_USDC);
      await mockUSDC.connect(buyerD).approve(await licenseManager.getAddress(), ONE_HUNDRED_USDC);

      // Mua bản quyền tác phẩm #1 (Tier #1) bị revert vì content #1 is frozen
      await expect(
        licenseManager.connect(buyerD).purchaseLicense(1)
      ).to.be.revertedWithCustomError(licenseManager, "ContentIsFrozen");
    });

    it("Không thể đăng ký tác phẩm phái sinh mới từ tác phẩm đang bị đóng băng", async function () {
      await expect(
        contentRegistry.connect(authorE).registerContent(sampleCid1, sampleSha256_1, 1)
      ).to.be.revertedWithCustomError(contentRegistry, "ParentContentFrozen");
    });

    it("Admin mở khóa (unfreeze) tác phẩm sau khi hòa giải tranh chấp", async function () {
      await expect(contentRegistry.connect(deployer).unfreezeContent(1))
        .to.emit(contentRegistry, "ContentUnfrozen")
        .withArgs(1);

      expect(await contentRegistry.isContentFrozen(1)).to.be.false;
    });

    it("Sau khi mở khóa, người dùng có thể mua bản quyền bình thường", async function () {
      await expect(licenseManager.connect(buyerD).purchaseLicense(1)).to.emit(
        licenseManager,
        "LicensePurchased"
      );
    });
  });

  describe("7. Mua bản quyền bằng Native AVAX", function () {
    let avaxTierId: bigint;
    const AVAX_PRICE = ethers.parseEther("1.5"); // 1.5 AVAX

    it("Tác giả A tạo gói bản quyền thanh toán bằng Native AVAX", async function () {
      const tx = await licenseManager
        .connect(authorA)
        .createTier(1, 0, ethers.ZeroAddress, AVAX_PRICE, 30); // 30 days
      await tx.wait();
      avaxTierId = 3n;
    });

    it("Người mua thanh toán sai số lượng AVAX bị revert", async function () {
      await expect(
        licenseManager.connect(buyerD).purchaseLicense(avaxTierId, {
          value: ethers.parseEther("1.0"), // Missing 0.5 AVAX
        })
      ).to.be.revertedWithCustomError(licenseManager, "PaymentAmountMismatch");
    });

    it("Người mua thanh toán đúng AVAX -> Tiền vào PaymentVault và phân chia đúng tỷ lệ", async function () {
      const balanceBefore = await ethers.provider.getBalance(await paymentVault.getAddress());

      await licenseManager.connect(buyerD).purchaseLicense(avaxTierId, {
        value: AVAX_PRICE,
      });

      const balanceAfter = await ethers.provider.getBalance(await paymentVault.getAddress());
      expect(balanceAfter - balanceBefore).to.equal(AVAX_PRICE);

      // Splits for content #1: A (50%), B (30%), C (20%)
      const avaxA = await paymentVault.getPendingBalance(ethers.ZeroAddress, authorA.address);
      const avaxB = await paymentVault.getPendingBalance(ethers.ZeroAddress, authorB.address);
      const avaxC = await paymentVault.getPendingBalance(ethers.ZeroAddress, authorC.address);

      expect(avaxA).to.equal(ethers.parseEther("0.75")); // 50% of 1.5 AVAX
      expect(avaxB).to.equal(ethers.parseEther("0.45")); // 30% of 1.5 AVAX
      expect(avaxC).to.equal(ethers.parseEther("0.30")); // 20% of 1.5 AVAX

      // Author A withdraws native AVAX
      const authorABalanceBefore = await ethers.provider.getBalance(authorA.address);
      const withdrawTx = await paymentVault.connect(authorA).withdraw(ethers.ZeroAddress);
      const receipt = await withdrawTx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const authorABalanceAfter = await ethers.provider.getBalance(authorA.address);
      expect(authorABalanceAfter - authorABalanceBefore + gasUsed).to.equal(ethers.parseEther("0.75"));
    });
  });
});
