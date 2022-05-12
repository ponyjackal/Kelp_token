const { task } = require("hardhat/config");
const {
  readContractAddress,
  writeContractAddress,
} = require("./addresses/utils");
const cArguments = require("./arguments/crowdSale");

task("deploy:CrowdSale")
  .addParam("signer", "Index of the signer in the metamask address list")
  .setAction(async (taskArguments, { ethers, upgrades }) => {
    const accounts = await ethers.getSigners();
    const index = Number(taskArguments.signer);

    // deploy CrowdSale
    const CrowdSale = await ethers.getContractFactory(
      "CrowdSale",
      accounts[index]
    );

    const crowdSaleProxy = await upgrades.deployProxy(CrowdSale, [
      cArguments.KELP_TOKEN_PROXY,
      cArguments.CROWD_SALE_WALLET,
      cArguments.KELP_AIRDROP_PROXY,
    ]);

    await crowdSaleProxy.deployed();

    writeContractAddress("crowdSaleProxy", crowdSaleProxy.address);
    console.log("CrowdSale proxy deployed to: ", crowdSaleProxy.address);

    const crowdSale = await upgrades.erc1967.getImplementationAddress(
      crowdSaleProxy.address
    );
    writeContractAddress("crowdSale", crowdSale);
    console.log("CrowdSale deployed to :", crowdSale);
  });

task("upgrade:CrowdSale")
  .addParam("signer", "Index of the signer in the metamask address list")
  .setAction(async function (taskArguments, { ethers, upgrades }) {
    console.log("--- start upgrading the CrowdSale Contract ---");
    const accounts = await ethers.getSigners();
    const index = Number(taskArguments.signer);

    // Use accounts[1] as the signer for the real roll
    const CrowdSale = await ethers.getContractFactory(
      "CrowdSale",
      accounts[index]
    );

    const crowdSaleProxyAddress = readContractAddress("crowdSaleProxy");

    const upgraded = await upgrades.upgradeProxy(
      crowdSaleProxyAddress,
      CrowdSale
    );

    console.log("CrowdSale upgraded to: ", upgraded.address);

    const crowdSale = await upgrades.erc1967.getImplementationAddress(
      upgraded.address
    );
    writeContractAddress("crowdSale", crowdSale);
    console.log("CrowdSale deployed to :", crowdSale);
  });

task("verify:CrowdSale").setAction(async (taskArguments, { run }) => {
  const address = readContractAddress("crowdSale");

  try {
    await run("verify:verify", {
      address,
      constructorArguments: [],
    });
  } catch (err) {
    console.log(err);
  }
});
