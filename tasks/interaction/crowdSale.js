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
    const kelpAirdropProxyAddress = readContractAddress("kelpAirdropProxy");

    const CrowdSale = await ethers.getContractFactory(
      "CrowdSale",
      accounts[index]
    );
    const crowdSale = await CrowdSale.attach(crowdSaleProxyAddress);

    try {
      await crowdSale.initialize(
        kelpTokenProxyAddress,
        crowdSaleWalletAddress,
        kelpAirdropProxyAddress
      );
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

task("interaction:CrowdSale-getBNBPrice")
  .addParam("signer", "Index of the signer in the metamask address list")
  .setAction(async (taskArguments, { ethers }) => {
    const accounts = await ethers.getSigners();
    const index = Number(taskArguments.signer);

    const crowdSaleProxyAddress = readContractAddress("crowdSaleProxy");

    const CrowdSale = await ethers.getContractFactory(
      "CrowdSale",
      accounts[index]
    );
    const crowdSale = await CrowdSale.attach(crowdSaleProxyAddress);

    try {
      const prices = await crowdSale.getBNBPrice();
      console.log("getBNBPrice success", prices);
    } catch (e) {
      console.log("getBNBPrice error", e);
    }
  });

task("interaction:CrowdSale-buyTokens")
  .addParam("signer", "Index of the signer in the metamask address list")
  .addParam("beneficiary", "The address of token receiver")
  .addParam("type", "The type of toke sale")
  .setAction(async (taskArguments, { ethers }) => {
    const accounts = await ethers.getSigners();
    const index = Number(taskArguments.signer);
    const beneficiary = taskArguments.beneficiary;
    const type = Number(taskArguments.type);

    const crowdSaleProxyAddress = readContractAddress("crowdSaleProxy");

    const CrowdSale = await ethers.getContractFactory(
      "CrowdSale",
      accounts[index]
    );
    const crowdSale = await CrowdSale.attach(crowdSaleProxyAddress);

    try {
      const bnbPrice = await crowdSale.buyTokens(beneficiary, type, {
        value: ethers.utils.parseEther("0.01"),
      });
      console.log("buyTokens success", bnbPrice);
    } catch (e) {
      console.log("buyTokens error", e);
    }
  });
