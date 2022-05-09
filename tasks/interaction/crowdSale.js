const { task } = require("hardhat/config");
const { readContractAddress } = require("../deploy/addresses/utils");
const { readValue } = require("./values/utils");

task("interaction:CrowdSale-initialize")
  .addParam("signer", "Index of the signer in the metamask address list")
  .setAction(async (taskArguments, { ethers }) => {
    const accounts = await ethers.getSigners();
    const index = Number(taskArguments.signer);

    const crowdSalekelpTokenAddress = readContractAddress("crowdSale");
    const kelpTokenProxyAddress = readContractAddress("kelpTokenProxy");
    const crowdSaleWalletAddress = readContractAddress("crowdSaleWallet");

    const CrowdSale = await ethers.getContractFactory(
      "CrowdSale",
      accounts[index]
    );
    const crowdSale = await CrowdSale.attach(crowdSalekelpTokenAddress);

    try {
      await crowdSale.initialize(kelpTokenProxyAddress, crowdSaleWalletAddress);
      console.log("initialize success");
    } catch (e) {
      console.log("initialize error", e);
    }
  });
