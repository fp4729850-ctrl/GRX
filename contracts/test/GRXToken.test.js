const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GRXToken", function () {
  let grxToken;
  let owner;
  let minter;
  let user1;
  let user2;
  let admin;

  const TOKEN_NAME = "GRX Global";
  const TOKEN_SYMBOL = "GRX";
  const DECIMALS = 18;

  beforeEach(async function () {
    [owner, minter, user1, user2, admin] = await ethers.getSigners();

    const GRXToken = await ethers.getContractFactory("GRXToken");
    grxToken = await GRXToken.deploy(owner.address, minter.address);
    await grxToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await grxToken.name()).to.equal(TOKEN_NAME);
      expect(await grxToken.symbol()).to.equal(TOKEN_SYMBOL);
    });

    it("Should have 18 decimals", async function () {
      expect(await grxToken.decimals()).to.equal(DECIMALS);
    });

    it("Should grant MINTER_ROLE to minter address", async function () {
      const MINTER_ROLE = await grxToken.MINTER_ROLE();
      expect(await grxToken.hasRole(MINTER_ROLE, minter.address)).to.be.true;
    });

    it("Should grant DEFAULT_ADMIN_ROLE to owner", async function () {
      const DEFAULT_ADMIN_ROLE = await grxToken.DEFAULT_ADMIN_ROLE();
      expect(await grxToken.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    });

    it("Should start with zero total supply", async function () {
      expect(await grxToken.totalSupply()).to.equal(0);
    });
  });

  describe("Minting with Certificate", function () {
    const certId = ethers.keccak256(ethers.toUtf8Bytes("test-cert-001"));
    const amount = ethers.parseEther("100");
    const metadata = "ipfs://QmTest123";

    it("Should allow minter to mint with certificate", async function () {
      await expect(grxToken.connect(minter).mintWithCert(certId, user1.address, amount, metadata))
        .to.emit(grxToken, "MintedWithCert")
        .withArgs(certId, user1.address, amount, metadata, minter.address);

      expect(await grxToken.balanceOf(user1.address)).to.equal(amount);
      expect(await grxToken.totalSupply()).to.equal(amount);
    });

    it("Should prevent double minting with same certificate", async function () {
      await grxToken.connect(minter).mintWithCert(certId, user1.address, amount, metadata);

      await expect(
        grxToken.connect(minter).mintWithCert(certId, user2.address, amount, metadata)
      ).to.be.revertedWith("GRX: certificate already used");
    });

    it("Should prevent non-minter from minting", async function () {
      await expect(
        grxToken.connect(user1).mintWithCert(certId, user1.address, amount, metadata)
      ).to.be.revertedWithCustomError(grxToken, "AccessControlUnauthorizedAccount");
    });

    it("Should reject zero amount", async function () {
      await expect(
        grxToken.connect(minter).mintWithCert(certId, user1.address, 0, metadata)
      ).to.be.revertedWith("GRX: amount must be > 0");
    });

    it("Should reject zero address recipient", async function () {
      await expect(
        grxToken.connect(minter).mintWithCert(certId, ethers.ZeroAddress, amount, metadata)
      ).to.be.revertedWith("GRX: invalid recipient");
    });

    it("Should reject zero certId", async function () {
      await expect(
        grxToken.connect(minter).mintWithCert(ethers.ZeroHash, user1.address, amount, metadata)
      ).to.be.revertedWith("GRX: invalid certId");
    });

    it("Should track certificate usage correctly", async function () {
      await grxToken.connect(minter).mintWithCert(certId, user1.address, amount, metadata);

      expect(await grxToken.certUsed(certId)).to.be.true;
      expect(await grxToken.certMinter(certId)).to.equal(minter.address);
      expect(await grxToken.certAmount(certId)).to.equal(amount);
      expect(await grxToken.totalCertificatesUsed()).to.equal(1);
    });

    it("Should update minting counters", async function () {
      await grxToken.connect(minter).mintWithCert(certId, user1.address, amount, metadata);

      expect(await grxToken.mintedBy(minter.address)).to.equal(amount);
      expect(await grxToken.totalMinted()).to.equal(amount);
    });
  });

  describe("Burning with Invoice", function () {
    const invoiceId = ethers.keccak256(ethers.toUtf8Bytes("test-invoice-001"));
    const mintAmount = ethers.parseEther("1000");
    const burnAmount = ethers.parseEther("100");
    let certId;

    beforeEach(async function () {
      certId = ethers.keccak256(ethers.toUtf8Bytes("test-cert-burn"));
      await grxToken.connect(minter).mintWithCert(certId, user1.address, mintAmount, "metadata");
    });

    it("Should allow user to burn their own tokens with invoice", async function () {
      await expect(grxToken.connect(user1).burnWithInvoice(invoiceId, burnAmount))
        .to.emit(grxToken, "BurnedWithInvoice")
        .withArgs(invoiceId, user1.address, burnAmount, user1.address);

      expect(await grxToken.balanceOf(user1.address)).to.equal(mintAmount - burnAmount);
      expect(await grxToken.totalSupply()).to.equal(mintAmount - burnAmount);
    });

    it("Should prevent double burning with same invoice", async function () {
      await grxToken.connect(user1).burnWithInvoice(invoiceId, burnAmount);

      await expect(
        grxToken.connect(user1).burnWithInvoice(invoiceId, burnAmount)
      ).to.be.revertedWith("GRX: invoice already used");
    });

    it("Should prevent burning more than balance", async function () {
      const excessiveAmount = mintAmount + ethers.parseEther("1");
      await expect(
        grxToken.connect(user1).burnWithInvoice(invoiceId, excessiveAmount)
      ).to.be.revertedWith("GRX: insufficient balance");
    });

    it("Should reject zero amount", async function () {
      await expect(
        grxToken.connect(user1).burnWithInvoice(invoiceId, 0)
      ).to.be.revertedWith("GRX: amount must be > 0");
    });

    it("Should reject zero invoiceId", async function () {
      await expect(
        grxToken.connect(user1).burnWithInvoice(ethers.ZeroHash, burnAmount)
      ).to.be.revertedWith("GRX: invalid invoiceId");
    });

    it("Should track invoice usage correctly", async function () {
      await grxToken.connect(user1).burnWithInvoice(invoiceId, burnAmount);

      expect(await grxToken.invoiceUsed(invoiceId)).to.be.true;
      expect(await grxToken.invoiceBurner(invoiceId)).to.equal(user1.address);
      expect(await grxToken.invoiceAmount(invoiceId)).to.equal(burnAmount);
      expect(await grxToken.totalInvoicesUsed()).to.equal(1);
    });

    it("Should update burning counters", async function () {
      await grxToken.connect(user1).burnWithInvoice(invoiceId, burnAmount);

      expect(await grxToken.burnedBy(user1.address)).to.equal(burnAmount);
      expect(await grxToken.totalBurned()).to.equal(burnAmount);
    });
  });

  describe("Admin Burning with Invoice", function () {
    const invoiceId = ethers.keccak256(ethers.toUtf8Bytes("test-invoice-admin"));
    const mintAmount = ethers.parseEther("1000");
    const burnAmount = ethers.parseEther("200");
    let certId;

    beforeEach(async function () {
      certId = ethers.keccak256(ethers.toUtf8Bytes("test-cert-admin"));
      await grxToken.connect(minter).mintWithCert(certId, user1.address, mintAmount, "metadata");

      // Grant BURNER_ROLE to admin
      const BURNER_ROLE = await grxToken.BURNER_ROLE();
      await grxToken.connect(owner).grantRole(BURNER_ROLE, admin.address);
    });

    it("Should allow admin to burn tokens from any address", async function () {
      await expect(grxToken.connect(admin).adminBurnWithInvoice(user1.address, invoiceId, burnAmount))
        .to.emit(grxToken, "AdminBurnedWithInvoice")
        .withArgs(invoiceId, user1.address, burnAmount, admin.address);

      expect(await grxToken.balanceOf(user1.address)).to.equal(mintAmount - burnAmount);
    });

    it("Should prevent non-burner from admin burning", async function () {
      await expect(
        grxToken.connect(user2).adminBurnWithInvoice(user1.address, invoiceId, burnAmount)
      ).to.be.revertedWithCustomError(grxToken, "AccessControlUnauthorizedAccount");
    });

    it("Should prevent double burning with same invoice", async function () {
      await grxToken.connect(admin).adminBurnWithInvoice(user1.address, invoiceId, burnAmount);

      await expect(
        grxToken.connect(admin).adminBurnWithInvoice(user1.address, invoiceId, burnAmount)
      ).to.be.revertedWith("GRX: invoice already used");
    });
  });

  describe("Invoice Creation", function () {
    const invoiceId = ethers.keccak256(ethers.toUtf8Bytes("test-invoice-create"));
    const amount = ethers.parseEther("500");

    it("Should allow admin to create invoice event", async function () {
      await expect(grxToken.connect(owner).createInvoice(invoiceId, user1.address, amount))
        .to.emit(grxToken, "InvoiceCreated")
        .withArgs(invoiceId, user1.address, amount);
    });

    it("Should prevent non-admin from creating invoice", async function () {
      await expect(
        grxToken.connect(user1).createInvoice(invoiceId, user1.address, amount)
      ).to.be.revertedWithCustomError(grxToken, "AccessControlUnauthorizedAccount");
    });
  });

  describe("View Functions", function () {
    const certId = ethers.keccak256(ethers.toUtf8Bytes("test-cert-view"));
    const invoiceId = ethers.keccak256(ethers.toUtf8Bytes("test-invoice-view"));
    const amount = ethers.parseEther("100");

    it("Should return correct certificate info", async function () {
      await grxToken.connect(minter).mintWithCert(certId, user1.address, amount, "metadata");

      const [used, minterAddr, certAmount] = await grxToken.getCertificateInfo(certId);
      expect(used).to.be.true;
      expect(minterAddr).to.equal(minter.address);
      expect(certAmount).to.equal(amount);
    });

    it("Should return correct invoice info", async function () {
      await grxToken.connect(minter).mintWithCert(certId, user1.address, amount, "metadata");
      await grxToken.connect(user1).burnWithInvoice(invoiceId, amount);

      const [used, burner, invoiceAmount] = await grxToken.getInvoiceInfo(invoiceId);
      expect(used).to.be.true;
      expect(burner).to.equal(user1.address);
      expect(invoiceAmount).to.equal(amount);
    });

    it("Should return correct minting stats", async function () {
      await grxToken.connect(minter).mintWithCert(certId, user1.address, amount, "metadata");
      expect(await grxToken.getMintingStats(minter.address)).to.equal(amount);
    });

    it("Should return correct burning stats", async function () {
      await grxToken.connect(minter).mintWithCert(certId, user1.address, amount, "metadata");
      await grxToken.connect(user1).burnWithInvoice(invoiceId, amount);
      expect(await grxToken.getBurningStats(user1.address)).to.equal(amount);
    });
  });

  describe("Multiple Operations", function () {
    it("Should handle multiple mints and burns correctly", async function () {
      const cert1 = ethers.keccak256(ethers.toUtf8Bytes("cert-1"));
      const cert2 = ethers.keccak256(ethers.toUtf8Bytes("cert-2"));
      const invoice1 = ethers.keccak256(ethers.toUtf8Bytes("invoice-1"));
      const invoice2 = ethers.keccak256(ethers.toUtf8Bytes("invoice-2"));

      const amount1 = ethers.parseEther("100");
      const amount2 = ethers.parseEther("200");
      const burn1 = ethers.parseEther("50");
      const burn2 = ethers.parseEther("75");

      // Mint twice
      await grxToken.connect(minter).mintWithCert(cert1, user1.address, amount1, "meta1");
      await grxToken.connect(minter).mintWithCert(cert2, user1.address, amount2, "meta2");

      expect(await grxToken.balanceOf(user1.address)).to.equal(amount1 + amount2);
      expect(await grxToken.totalSupply()).to.equal(amount1 + amount2);

      // Burn twice
      await grxToken.connect(user1).burnWithInvoice(invoice1, burn1);
      await grxToken.connect(user1).burnWithInvoice(invoice2, burn2);

      expect(await grxToken.balanceOf(user1.address)).to.equal(amount1 + amount2 - burn1 - burn2);
      expect(await grxToken.totalSupply()).to.equal(amount1 + amount2 - burn1 - burn2);
      expect(await grxToken.totalBurned()).to.equal(burn1 + burn2);
    });
  });
});


