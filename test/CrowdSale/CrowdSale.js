const { artifacts, ethers, waffle } = require("hardhat");
const { expect } = require("chai");

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const TENSEC = 10;

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

describe("CrowdSale", function () {
  beforeEach(async function () {
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
    // console.log("Before deploy KelpToken");
    this.kelpToken = await deployKelpToken(this.signers.owner);
    // console.log(`KelpToken is deployed to ${this.kelpToken.address}`);
    // initialize KelpToken
    await this.kelpToken.initialize(this.signers.airdrop.address);
    // Deploy CrowdSale
    // console.log("Before deploy CrowdSale");
    this.crowdSale = await deployCrowdSale(this.signers.owner);
    // console.log(`CrowdSale is deployed to ${this.crowdSale.address}`);
    // initialize CrowdSale
    await this.crowdSale.initialize(
      this.kelpToken.address,
      this.signers.fundWallet.address,
      this.signers.airdrop.address
    );
  });

  describe("Airdrop", async function () {
    it("should return the airdrop address", async function () {
      // airdrop address where transfers tokens from
      const airdrop = await this.crowdSale.airdrop();

      expect(airdrop).to.equal(this.signers.airdrop.address);
    });

    it("should update airdrop address", async function () {
      await this.crowdSale.updateAirdrop(this.signers.andy.address);
      const airdrop = await this.crowdSale.airdrop();

      expect(airdrop).to.equal(this.signers.andy.address);
    });

    it("should revert if airdrop address is invalid", async function () {
      const tx = this.crowdSale.updateAirdrop(ZERO_ADDRESS);

      await expect(tx).to.be.revertedWith("invalid address");
    });

    it("should emit AirdropUpdated event", async function () {
      // reset wallet address
      await this.crowdSale.updateAirdrop(this.signers.airdrop.address);
      // update wallet address
      const tx = this.crowdSale.updateAirdrop(this.signers.andy.address);

      await expect(tx)
        .to.be.emit(this.crowdSale, "AirdropUpdated")
        .withArgs(this.signers.airdrop.address, this.signers.andy.address);
    });
  });

  describe("Wallet", async function () {
    it("should return the wallet address", async function () {
      // wallet address where funds go into
      const fundWallet = await this.crowdSale.wallet();

      expect(fundWallet).to.equal(this.signers.fundWallet.address);
    });

    it("should update wallet", async function () {
      await this.crowdSale.updateWallet(this.signers.andy.address);
      const fundWallet = await this.crowdSale.wallet();

      expect(fundWallet).to.equal(this.signers.andy.address);
    });

    it("should revert if wallet address is invalid", async function () {
      const tx = this.crowdSale.updateWallet(ZERO_ADDRESS);

      await expect(tx).to.be.revertedWith("invalid address");
    });

    it("should emit WalletUpdated event", async function () {
      // reset wallet address
      await this.crowdSale.updateWallet(this.signers.fundWallet.address);
      // update wallet address
      const tx = this.crowdSale.updateWallet(this.signers.andy.address);

      await expect(tx)
        .to.be.emit(this.crowdSale, "WalletUpdated")
        .withArgs(this.signers.fundWallet.address, this.signers.andy.address);
    });
  });

  describe("KelpToken", async function () {
    it("should return the kelp token address", async function () {
      // kelp token address
      const kelpToken = await this.crowdSale.kelpToken();

      expect(kelpToken).to.equal(this.kelpToken.address);
    });

    it("should update kelp token address", async function () {
      await this.crowdSale.updateKelpToken(this.signers.andy.address);
      const kelpToken = await this.crowdSale.kelpToken();

      expect(kelpToken).to.equal(this.signers.andy.address);
    });

    it("should revert if kelp token address is invalid", async function () {
      const tx = this.crowdSale.updateKelpToken(ZERO_ADDRESS);

      await expect(tx).to.be.revertedWith("invalid address");
    });

    it("should emit KelpTokenUpdated event", async function () {
      // reset kelp token address
      await this.crowdSale.updateKelpToken(this.kelpToken.address);
      // update kelp token address
      const tx = this.crowdSale.updateKelpToken(this.signers.andy.address);

      await expect(tx)
        .to.be.emit(this.crowdSale, "KelpTokenUpdated")
        .withArgs(this.kelpToken.address, this.signers.andy.address);
    });
  });

  describe("addSaleInfo", async function () {
    it("should return the sales info", async function () {
      const TENSEC = 10;

      const currentBlockNumber = await ethers.provider.getBlockNumber();
      const currentBlock = await ethers.provider.getBlock(currentBlockNumber);
      const currentTimeStamp = currentBlock.timestamp;

      const saleInfo = {
        rate: "0.001",
        startTime: currentTimeStamp + TENSEC,
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
      const TENSEC = 10;

      const currentBlockNumber = await ethers.provider.getBlockNumber();
      const currentBlock = await ethers.provider.getBlock(currentBlockNumber);
      const currentTimeStamp = currentBlock.timestamp;

      const saleInfo = {
        rate: "0",
        startTime: currentTimeStamp + TENSEC,
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
      const TENSEC = 10;

      const currentBlockNumber = await ethers.provider.getBlockNumber();
      const currentBlock = await ethers.provider.getBlock(currentBlockNumber);
      const currentTimeStamp = currentBlock.timestamp;

      const saleInfo = {
        rate: "0.001",
        startTime: currentTimeStamp - TENSEC,
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
      const TENSEC = 10;

      const currentBlockNumber = await ethers.provider.getBlockNumber();
      const currentBlock = await ethers.provider.getBlock(currentBlockNumber);
      const currentTimeStamp = currentBlock.timestamp;

      const saleInfo = {
        rate: "0.001",
        startTime: currentTimeStamp + TENSEC,
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
      const TENSEC = 10;

      const currentBlockNumber = await ethers.provider.getBlockNumber();
      const currentBlock = await ethers.provider.getBlock(currentBlockNumber);
      const currentTimeStamp = currentBlock.timestamp;

      const saleInfo = {
        rate: "0.001",
        startTime: currentTimeStamp + TENSEC,
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

  describe("updateSaleInfo", async function () {
    beforeEach(async function () {
      const TENSEC = 10;

      const currentBlockNumber = await ethers.provider.getBlockNumber();
      const currentBlock = await ethers.provider.getBlock(currentBlockNumber);
      const currentTimeStamp = currentBlock.timestamp;

      const saleInfo = {
        rate: "0.001",
        startTime: currentTimeStamp + TENSEC,
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
    });

    it("should return the updated saleInfo", async function () {
      const TENSEC = 10;
      const type = 0;

      const currentBlockNumber = await ethers.provider.getBlockNumber();
      const currentBlock = await ethers.provider.getBlock(currentBlockNumber);
      const currentTimeStamp = currentBlock.timestamp;

      const saleInfo = {
        rate: "0.001",
        startTime: currentTimeStamp + TENSEC,
        limitPerAccount: "0",
        totalLimit: "2000000000",
        paused: false,
      };
      // update sales info
      await this.crowdSale.updateSaleInfo(
        type,
        ethers.utils.parseEther(saleInfo.rate),
        saleInfo.startTime,
        ethers.utils.parseEther(saleInfo.limitPerAccount),
        ethers.utils.parseEther(saleInfo.totalLimit),
        saleInfo.paused
      );
      // rate
      const rate = await this.crowdSale.getRate(type);
      expect(rate).to.equal(ethers.utils.parseEther(saleInfo.rate));
      // startTime
      const startTime = await this.crowdSale.getStartTime(type);
      expect(startTime).to.equal(saleInfo.startTime);
      // limitPerAccount
      const limitPerAccount = await this.crowdSale.getLimitPerAccount(type);
      expect(limitPerAccount).to.equal(
        ethers.utils.parseEther(saleInfo.limitPerAccount)
      );
      // totalLimit
      const totalLimit = await this.crowdSale.getTotalLimit(type);
      expect(totalLimit).to.equal(ethers.utils.parseEther(saleInfo.totalLimit));
      // paused
      const paused = await this.crowdSale.isPaused(type);
      expect(paused).to.equal(saleInfo.paused);
    });

    it("should revert if rate is invalid", async function () {
      const TENSEC = 10;
      const type = 0;

      const currentBlockNumber = await ethers.provider.getBlockNumber();
      const currentBlock = await ethers.provider.getBlock(currentBlockNumber);
      const currentTimeStamp = currentBlock.timestamp;

      const saleInfo = {
        rate: "0",
        startTime: currentTimeStamp + TENSEC,
        limitPerAccount: "0",
        totalLimit: "2000000000",
        paused: false,
      };
      // update sales info
      const transaction = this.crowdSale.updateSaleInfo(
        type,
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
      const TENSEC = 10;
      const type = 0;

      const currentBlockNumber = await ethers.provider.getBlockNumber();
      const currentBlock = await ethers.provider.getBlock(currentBlockNumber);
      const currentTimeStamp = currentBlock.timestamp;

      const saleInfo = {
        rate: "0.001",
        startTime: currentTimeStamp - TENSEC,
        limitPerAccount: "0",
        totalLimit: "2000000000",
        paused: false,
      };
      // update sales info
      const transaction = this.crowdSale.updateSaleInfo(
        type,
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
      const TENSEC = 10;
      const type = 0;

      const currentBlockNumber = await ethers.provider.getBlockNumber();
      const currentBlock = await ethers.provider.getBlock(currentBlockNumber);
      const currentTimeStamp = currentBlock.timestamp;

      const saleInfo = {
        rate: "0.001",
        startTime: currentTimeStamp + TENSEC,
        limitPerAccount: "0",
        totalLimit: "0",
        paused: false,
      };
      // upadte sales info
      const transaction = this.crowdSale.updateSaleInfo(
        type,
        ethers.utils.parseEther(saleInfo.rate),
        saleInfo.startTime,
        ethers.utils.parseEther(saleInfo.limitPerAccount),
        ethers.utils.parseEther(saleInfo.totalLimit),
        saleInfo.paused
      );
      // check revert message
      await expect(transaction).to.be.revertedWith("invalid total limit");
    });

    it("should emit SaleUpdated event", async function () {
      const TENSEC = 10;
      type = 0;

      const currentBlockNumber = await ethers.provider.getBlockNumber();
      const currentBlock = await ethers.provider.getBlock(currentBlockNumber);
      const currentTimeStamp = currentBlock.timestamp;

      const saleInfo = {
        rate: "0.001",
        startTime: currentTimeStamp + TENSEC,
        limitPerAccount: "0",
        totalLimit: "2000000000",
        paused: false,
      };
      // add sales info
      const transaction = this.crowdSale.updateSaleInfo(
        type,
        ethers.utils.parseEther(saleInfo.rate),
        saleInfo.startTime,
        ethers.utils.parseEther(saleInfo.limitPerAccount),
        ethers.utils.parseEther(saleInfo.totalLimit),
        saleInfo.paused
      );
      // check revert message
      await expect(transaction)
        .to.be.emit(this.crowdSale, "SaleUpdated")
        .withArgs(
          type,
          ethers.utils.parseEther(saleInfo.rate),
          saleInfo.startTime,
          ethers.utils.parseEther(saleInfo.limitPerAccount),
          ethers.utils.parseEther(saleInfo.totalLimit),
          saleInfo.paused
        );
    });
  });

  describe("Pause Sale", async function () {
    beforeEach(async function () {
      // add saleInfo
      const TENSEC = 10;

      const currentBlockNumber = await ethers.provider.getBlockNumber();
      const currentBlock = await ethers.provider.getBlock(currentBlockNumber);
      const currentTimeStamp = currentBlock.timestamp;

      const saleInfo = {
        rate: "0.001",
        startTime: currentTimeStamp + TENSEC,
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
    });

    it("should pause the sale", async function () {
      // pause the sale
      await this.crowdSale.pauseSale(0, true);
      // paused
      const paused = await this.crowdSale.isPaused(0);
      expect(paused).to.equal(true);
    });

    it("should revert if type is invalid", async function () {
      // pause the sale
      const tx = this.crowdSale.pauseSale(1000000, true);
      // check revert message
      await expect(tx).to.be.revertedWith("invalid type");
    });
  });

  describe("buyTokens", async function () {
    beforeEach(async function () {
      const currentBlockNumber = await ethers.provider.getBlockNumber();
      const currentBlock = await ethers.provider.getBlock(currentBlockNumber);
      const currentTimeStamp = currentBlock.timestamp;

      const saleInfo = {
        rate: "0.001",
        startTime: currentTimeStamp + TENSEC,
        limitPerAccount: "0.0",
        totalLimit: "2000000000.0",
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
      // should allow kelp token to crowdSale contract
      await this.kelpToken
        .connect(this.signers.airdrop)
        .approve(this.crowdSale.address, ethers.utils.parseEther("2000000000"));
    });

    it("should buy kelp tokens based on sale rate", async function () {
      // We fast forward to reach the delay
      await ethers.provider.send("evm_increaseTime", [TENSEC + 1]);
      await ethers.provider.send("evm_mine");
      // check if fundwallet is updated
      await expect(() =>
        this.crowdSale
          .connect(this.signers.bell)
          .buyTokens(this.signers.john.address, 0, {
            value: ethers.utils.parseEther("0.0000001"),
          })
      ).to.changeEtherBalance(
        this.signers.fundWallet,
        ethers.utils.parseEther("0.0000001")
      );

      // check if john has tokens
      await expect(() =>
        this.crowdSale
          .connect(this.signers.bell)
          .buyTokens(this.signers.john.address, 0, {
            value: ethers.utils.parseEther("0.0000001"),
          })
      ).to.changeTokenBalance(
        this.kelpToken,
        this.signers.john,
        ethers.utils
          .parseEther("0.0000001")
          .mul(ethers.utils.parseEther("0.001"))
      );
    });

    it("should revert if type is invalid", async function () {
      // We fast forward to reach the delay
      await ethers.provider.send("evm_increaseTime", [TENSEC + 1]);
      await ethers.provider.send("evm_mine");
      // buy tokens
      const tx = this.crowdSale
        .connect(this.signers.bell)
        .buyTokens(this.signers.john.address, 1, {
          value: ethers.utils.parseEther("0.0000001"),
        });
      // check revert message
      await expect(tx).to.be.revertedWith("invalid sale");
    });

    it("should revert if address is invalid", async function () {
      // We fast forward to reach the delay
      await ethers.provider.send("evm_increaseTime", [TENSEC + 1]);
      await ethers.provider.send("evm_mine");
      // buy tokens
      const tx = this.crowdSale
        .connect(this.signers.bell)
        .buyTokens(ZERO_ADDRESS, 0, {
          value: ethers.utils.parseEther("0.0000001"),
        });
      // check revert message
      await expect(tx).to.be.revertedWith("invalid address");
    });

    it("should revert if amount is insufficient", async function () {
      // We fast forward to reach the delay
      await ethers.provider.send("evm_increaseTime", [TENSEC + 1]);
      await ethers.provider.send("evm_mine");
      // buy tokens
      const tx = this.crowdSale
        .connect(this.signers.bell)
        .buyTokens(this.signers.john.address, 0, {
          value: 0,
        });
      // check revert message
      await expect(tx).to.be.revertedWith("insufficient amount");
    });

    it("should revert if sale is paused", async function () {
      // We fast forward to reach the delay
      await ethers.provider.send("evm_increaseTime", [TENSEC + 1]);
      await ethers.provider.send("evm_mine");
      // pause the sale
      await this.crowdSale.pauseSale(0, true);
      // buy tokens
      const tx = this.crowdSale
        .connect(this.signers.bell)
        .buyTokens(this.signers.john.address, 0, {
          value: ethers.utils.parseEther("0.0000001"),
        });
      // check revert message
      await expect(tx).to.be.revertedWith("sale is paused");
    });

    it("should revert if sale is not started yet", async function () {
      // buy tokens
      const tx = this.crowdSale
        .connect(this.signers.bell)
        .buyTokens(this.signers.john.address, 0, {
          value: ethers.utils.parseEther("0.0000001"),
        });
      // check revert message
      await expect(tx).to.be.revertedWith("sale is not started yet");
    });

    it("should revert if total sale limit exceeds", async function () {
      // We fast forward to reach the delay
      await ethers.provider.send("evm_increaseTime", [TENSEC + 1]);
      await ethers.provider.send("evm_mine");
      // buy tokens
      const tx = this.crowdSale
        .connect(this.signers.bell)
        .buyTokens(this.signers.john.address, 0, {
          value: ethers.utils.parseEther("0.1"),
        });
      // check revert message
      await expect(tx).to.be.revertedWith("Total Sale limit exceeds");
    });

    it("should revert if purchase limit exceeds", async function () {
      const currentBlockNumber = await ethers.provider.getBlockNumber();
      const currentBlock = await ethers.provider.getBlock(currentBlockNumber);
      const currentTimeStamp = currentBlock.timestamp;

      const newSaleInfo = {
        rate: "0.001",
        startTime: currentTimeStamp + TENSEC,
        limitPerAccount: "10000000.0",
        totalLimit: "2000000000.0",
        paused: false,
      };
      // add sales info
      await this.crowdSale.addSaleInfo(
        ethers.utils.parseEther(newSaleInfo.rate),
        newSaleInfo.startTime,
        ethers.utils.parseEther(newSaleInfo.limitPerAccount),
        ethers.utils.parseEther(newSaleInfo.totalLimit),
        newSaleInfo.paused
      );
      // We fast forward to reach the delay
      await ethers.provider.send("evm_increaseTime", [TENSEC + 1]);
      await ethers.provider.send("evm_mine");
      // buy tokens
      const tx = this.crowdSale
        .connect(this.signers.bell)
        .buyTokens(this.signers.john.address, 1, {
          value: ethers.utils.parseEther("0.000001"),
        });
      // check revert message
      await expect(tx).to.be.revertedWith("Purchase limit exceeds");
    });
  });
});
