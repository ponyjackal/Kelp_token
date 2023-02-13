const { artifacts, ethers, waffle } = require("hardhat");
const { expect } = require("chai");
const { describe, before, it } = require("mocha");

const deployKelpToken = async (signer) => {
  const ARGS = [];

  const kelpTokenArtifact = await artifacts.readArtifact("KelpToken");
  return await waffle.deployContract(signer, kelpTokenArtifact, ARGS);
};

describe("Unit tests", function () {
  before(async function () {
    this.signers = {};

    const signers = await ethers.getSigners();
    this.signers.admin = signers[0];
    this.signers.airdrop = signers[1];
    this.signers.alice = signers[2];

    this.signers.andy = signers[3];
    this.signers.bell = signers[4];
    this.signers.john = signers[5];
    this.signers.karl = signers[6];
    this.signers.justin = signers[7];

    // Deploy KelpToken
    console.log("Before deploy KelpToken");
    this.kelpToken = await deployKelpToken(this.signers.admin);
    console.log(`KelpToken is deployed to ${this.kelpToken.address}`);
    // initialize KelpToken
    await this.kelpToken.initialize(this.signers.airdrop.address);
  });

  it("should return the balance", async function () {
    // balanceOf should return 0 for alice
    const aliceBalance = await this.kelpToken.balanceOf(
      this.signers.alice.address
    );

    expect(aliceBalance).to.equal("0");

    // balanceOf should return 1000000000 * 10 ^ 18 for airdrop
    const airdropBalance = await this.kelpToken.balanceOf(
      this.signers.airdrop.address
    );

    expect(airdropBalance).to.equal("1000000000000000000000000000");
  });

  it("should transfer tokens", async function () {
    // transfer tokens from airdrtop to alice
    await this.kelpToken
      .connect(this.signers.airdrop)
      .transfer(this.signers.alice.address, 1000000);
    // balanceOf should return 0 for alice
    const aliceBalance = await this.kelpToken.balanceOf(
      this.signers.alice.address
    );

    expect(aliceBalance).to.equal("1000000");
  });
});

module.exports = {
  deployKelpToken,
};
