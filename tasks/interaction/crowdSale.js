const { task } = require("hardhat/config");
const { readContractAddress } = require("../deploy/addresses/utils");
const { readValue } = require("./values/utils");

task("interaction:CrowdSale-initialize")
  .addParam("signer", "Index of the signer in the metamask address list")
  .setAction(async (taskArguments, { ethers }) => {
    const accounts = await ethers.getSigners();
    const index = Number(taskArguments.signer);

    const crowdSaleProxyAddress = readContractAddress("crowdSaleProxy");
    const kelpTokenProxyAddress = readContractAddress("kelpTokenProxy");
    const crowdSaleWalletAddress = readContractAddress("crowdSaleWallet");

    const CrowdSale = await ethers.getContractFactory(
      "CrowdSale",
      accounts[index]
    );
    const crowdSale = await CrowdSale.attach(crowdSaleProxyAddress);

    try {
      await crowdSale.initialize(kelpTokenProxyAddress, crowdSaleWalletAddress);
      console.log("initialize success");
    } catch (e) {
      console.log("initialize error", e);
    }
  });

task("interaction:CrowdSale-addPrivateSaleInfo")
  .addParam("signer", "Index of the signer in the metamask address list")
  .setAction(async (taskArguments, { ethers }) => {
    const accounts = await ethers.getSigners();
    const index = Number(taskArguments.signer);

    const crowdSaleProxyAddress = readContractAddress("crowdSaleProxy");

    const rate = readValue("privateSaleInfo", "rate");
    const startTime = readValue("privateSaleInfo", "startTime");
    const limitPerAccount = readValue("privateSaleInfo", "limitPerAccount");
    const totalLimit = readValue("privateSaleInfo", "totalLimit");
    const paused = readValue("privateSaleInfo", "paused");

    const CrowdSale = await ethers.getContractFactory(
      "CrowdSale",
      accounts[index]
    );
    const crowdSale = await CrowdSale.attach(crowdSaleProxyAddress);

    try {
      await crowdSale.addSaleInfo(
        ethers.utils.parseEther(rate),
        startTime,
        ethers.utils.parseEther(limitPerAccount),
        ethers.utils.parseEther(totalLimit),
        paused
      );
      console.log("addPrivateSaleInfo success");
    } catch (e) {
      console.log("addPrivateSaleInfo error", e);
    }
  });

task("interaction:CrowdSale-addPreSaleInfo")
  .addParam("signer", "Index of the signer in the metamask address list")
  .setAction(async (taskArguments, { ethers }) => {
    const accounts = await ethers.getSigners();
    const index = Number(taskArguments.signer);

    const crowdSaleProxyAddress = readContractAddress("crowdSaleProxy");

    const rate = readValue("preSaleInfo", "rate");
    const startTime = readValue("preSaleInfo", "startTime");
    const limitPerAccount = readValue("preSaleInfo", "limitPerAccount");
    const totalLimit = readValue("preSaleInfo", "totalLimit");
    const paused = readValue("preSaleInfo", "paused");

    const CrowdSale = await ethers.getContractFactory(
      "CrowdSale",
      accounts[index]
    );
    const crowdSale = await CrowdSale.attach(crowdSaleProxyAddress);

    try {
      await crowdSale.addSaleInfo(
        ethers.utils.parseEther(rate),
        startTime,
        ethers.utils.parseEther(limitPerAccount),
        ethers.utils.parseEther(totalLimit),
        paused
      );
      console.log("addPreSaleInfo success");
    } catch (e) {
      console.log("addPreSaleInfo error", e);
    }
  });
