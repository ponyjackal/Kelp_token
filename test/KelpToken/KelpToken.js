const { artifacts, ethers, waffle } = require("hardhat");
const { expect } = require("chai");

const deployProxy = async (signer) => {
  const ARGS = [];

  const proxyArtifact = await artifacts.readArtifact("Proxy");
  return await waffle.deployContract(signer, proxyArtifact, ARGS);
};

const deployKelpToken = async (signer, proxy, airdrop) => {
  const ARGS = [proxy, airdrop];

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

    // Deploy Proxy
    console.log("Before deploy Proxy");
    this.proxy = await deployProxy(this.signers.admin);
    console.log(`Proxy is deployed to ${this.proxy.address}`);
    // Deploy KelpToken
    console.log("Before deploy KelpToken");
    this.kelpToken = await deployKelpToken(
      this.signers.admin,
      this.proxy.address,
      this.signers.airdrop.address
    );
    console.log(`KelpToken is deployed to ${this.kelpToken.address}`);
    // set target in proxy
    this.proxy.setTarget(this.kelpToken.address);
  });

  it("should work with proxy", async function () {
    // call to proxy, balanceOf should return 0 for alice
    const aliceBalance = await this.proxy.balanceOf(this.signers.alice.address);

    expect(aliceBalance).to.equal("0");
  });
});

module.exports = {
  deployProxy,
  deployKelpToken,
};
