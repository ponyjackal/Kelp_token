const { artifacts, ethers, waffle } = require("hardhat");
const { expect } = require("chai");

const deployCrowdSale = async (signer) => {
  const ARGS = [];

  const crowdSaleArtifact = await artifacts.readArtifact("CrowdSale");
  return await waffle.deployContract(signer, crowdSaleArtifact, ARGS);
};

const deployKelpToken = async (signer) => {
  const ARGS = [];

  const kelpTokenArtifact = await artifacts.readArtifact("KelpToken");
  return await waffle.deployContract(signer, kelpTokenArtifact, ARGS);
};

describe("Unit tests", function () {
  before(async function () {
    this.signers = {};

    const signers = await ethers.getSigners();
    this.signers.owner = signers[0];
    this.signers.airdrop = signers[1];
    this.signers.fundWallet = signers[2];

    this.signers.andy = signers[3];
    this.signers.bell = signers[4];
    this.signers.john = signers[5];
    this.signers.karl = signers[6];
    this.signers.justin = signers[7];

    // Deploy KelpToken
    console.log("Before deploy KelpToken");
    this.kelpToken = await deployKelpToken(this.signers.owner);
    console.log(`KelpToken is deployed to ${this.kelpToken.address}`);
    // initialize KelpToken
    await this.kelpToken.initialize(this.signers.airdrop.address);
    // Deploy CrowdSale
    console.log("Before deploy CrowdSale");
    this.crowdSale = await deployCrowdSale(this.signers.owner);
    console.log(`CrowdSale is deployed to ${this.crowdSale.address}`);
    // initialize CrowdSale
    await this.crowdSale.initialize(
      this.kelpToken.address,
      this.signers.fundWallet.address,
      this.signers.airdrop.address
    );
  });

  it("should return the airdrop address", async function () {
    // airdrop address where transfers tokens from
    const airdrop = await this.crowdSale.airdrop();

    expect(airdrop).to.equal(this.signers.airdrop.address);
  });

  it("should return the kelp token address", async function () {
    // kelp token address
    const kelpToken = await this.crowdSale.kelpToken();

    expect(kelpToken).to.equal(this.kelpToken.address);
  });

  describe("saleInfo", async function () {
    it("should return the sales info", async function () {
      const tenSec = 10;

      const currentBlockNumber = await ethers.provider.getBlockNumber();
      const currentBlock = await ethers.provider.getBlock(currentBlockNumber);
      const currentTimeStamp = currentBlock.timestamp;

      const saleInfo = {
        rate: "0.001",
        startTime: currentTimeStamp + tenSec,
        limitPerAccount: "0",
        totalLimit: "2000000000",
        paused: false,
      };
      // add sales info
      await this.crowdSale.addSaleInfo(
        ethers.utils.parseEther(saleInfo.rate),
        saleInfo.startTime,
        ethers.utils.parseEther(saleInfo.limitPerAccount),
        ethers.utils.parseEther(saleInfo.totalLimit),
        saleInfo.paused
      );
      // rate
      const rate = await this.crowdSale.getRate(0);
      expect(rate).to.equal(ethers.utils.parseEther(saleInfo.rate));
      // startTime
      const startTime = await this.crowdSale.getStartTime(0);
      expect(startTime).to.equal(saleInfo.startTime);
      // limitPerAccount
      const limitPerAccount = await this.crowdSale.getLimitPerAccount(0);
      expect(limitPerAccount).to.equal(
        ethers.utils.parseEther(saleInfo.limitPerAccount)
      );
      // totalLimit
      const totalLimit = await this.crowdSale.getTotalLimit(0);
      expect(totalLimit).to.equal(ethers.utils.parseEther(saleInfo.totalLimit));
      // paused
      const paused = await this.crowdSale.isPaused(0);
      expect(paused).to.equal(saleInfo.paused);
    });

    it("should revert if rate is invalid", async function () {
      const tenSec = 10;

      const currentBlockNumber = await ethers.provider.getBlockNumber();
      const currentBlock = await ethers.provider.getBlock(currentBlockNumber);
      const currentTimeStamp = currentBlock.timestamp;

      const saleInfo = {
        rate: "0",
        startTime: currentTimeStamp + tenSec,
        limitPerAccount: "0",
        totalLimit: "2000000000",
        paused: false,
      };
      // add sales info
      const transaction = this.crowdSale.addSaleInfo(
        ethers.utils.parseEther(saleInfo.rate),
        saleInfo.startTime,
        ethers.utils.parseEther(saleInfo.limitPerAccount),
        ethers.utils.parseEther(saleInfo.totalLimit),
        saleInfo.paused
      );
      // check revert message
      await expect(transaction).to.be.revertedWith("invalid rate");
    });

    it("should revert if startTime is in the past", async function () {
      const tenSec = 10;

      const currentBlockNumber = await ethers.provider.getBlockNumber();
      const currentBlock = await ethers.provider.getBlock(currentBlockNumber);
      const currentTimeStamp = currentBlock.timestamp;

      const saleInfo = {
        rate: "0.001",
        startTime: currentTimeStamp - tenSec,
        limitPerAccount: "0",
        totalLimit: "2000000000",
        paused: false,
      };
      // add sales info
      const transaction = this.crowdSale.addSaleInfo(
        ethers.utils.parseEther(saleInfo.rate),
        saleInfo.startTime,
        ethers.utils.parseEther(saleInfo.limitPerAccount),
        ethers.utils.parseEther(saleInfo.totalLimit),
        saleInfo.paused
      );
      // check revert message
      await expect(transaction).to.be.revertedWith(
        "can't set startTime in the past"
      );
    });

    it("should revert if total limit is invalid", async function () {
      const tenSec = 10;

      const currentBlockNumber = await ethers.provider.getBlockNumber();
      const currentBlock = await ethers.provider.getBlock(currentBlockNumber);
      const currentTimeStamp = currentBlock.timestamp;

      const saleInfo = {
        rate: "0.001",
        startTime: currentTimeStamp + tenSec,
        limitPerAccount: "0",
        totalLimit: "0",
        paused: false,
      };
      // add sales info
      const transaction = this.crowdSale.addSaleInfo(
        ethers.utils.parseEther(saleInfo.rate),
        saleInfo.startTime,
        ethers.utils.parseEther(saleInfo.limitPerAccount),
        ethers.utils.parseEther(saleInfo.totalLimit),
        saleInfo.paused
      );
      // check revert message
      await expect(transaction).to.be.revertedWith("invalid total limit");
    });

    it("should emit SaleAdded event", async function () {
      const tenSec = 10;

      const currentBlockNumber = await ethers.provider.getBlockNumber();
      const currentBlock = await ethers.provider.getBlock(currentBlockNumber);
      const currentTimeStamp = currentBlock.timestamp;

      const saleInfo = {
        rate: "0.001",
        startTime: currentTimeStamp + tenSec,
        limitPerAccount: "0",
        totalLimit: "2000000000",
        paused: false,
      };
      // add sales info
      const transaction = this.crowdSale.addSaleInfo(
        ethers.utils.parseEther(saleInfo.rate),
        saleInfo.startTime,
        ethers.utils.parseEther(saleInfo.limitPerAccount),
        ethers.utils.parseEther(saleInfo.totalLimit),
        saleInfo.paused
      );
      // check revert message
      await expect(transaction)
        .to.be.emit(this.crowdSale, "SaleAdded")
        .withArgs(
          ethers.utils.parseEther(saleInfo.rate),
          saleInfo.startTime,
          ethers.utils.parseEther(saleInfo.limitPerAccount),
          ethers.utils.parseEther(saleInfo.totalLimit),
          saleInfo.paused
        );
    });
  });
});

module.exports = {
  deployKelpToken,
  deployCrowdSale,
};
