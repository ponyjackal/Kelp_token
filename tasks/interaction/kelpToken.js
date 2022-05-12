const { task } = require("hardhat/config");
const { readContractAddress } = require("../deploy/addresses/utils");
const { readValue } = require("./values/utils");

task("interaction:KelpToken-initialize")
  .addParam("signer", "Index of the signer in the metamask address list")
  .setAction(async (taskArguments, { ethers }) => {
    const accounts = await ethers.getSigners();
    const index = Number(taskArguments.signer);

    const kelpTokenProxyAddress = readContractAddress("kelpTokenProxy");
    const kelpAirdropProxyAddress = readContractAddress("kelpAirdropProxy");

    const KelpToken = await ethers.getContractFactory(
      "KelpToken",
      accounts[index]
    );
    const kelpToken = await KelpToken.attach(kelpTokenProxyAddress);

    try {
      await kelpToken.initialize(kelpAirdropProxyAddress);
      console.log("initialize success");
    } catch (e) {
      console.log("initialize error", e);
    }
  });
