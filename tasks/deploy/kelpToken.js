const { task } = require("hardhat/config");
const {
  readContractAddress,
  writeContractAddress,
} = require("./addresses/utils");
const cArguments = require("./arguments/kelpToken");

task("deploy:KelpToken")
  .addParam("signer", "Index of the signer in the metamask address list")
  .setAction(async (taskArguments, { ethers, upgrades }) => {
    const accounts = await ethers.getSigners();
    const index = Number(taskArguments.signer);

    // deploy KelpToken
    const KelpToken = await ethers.getContractFactory(
      "KelpToken",
      accounts[index]
    );

    const kelpTokenProxy = await upgrades.deployProxy(KelpToken, [
      cArguments.KELP_AIRDROP_PROXY,
    ]);

    await kelpTokenProxy.deployed();

    writeContractAddress("kelpTokenProxy", kelpTokenProxy.address);
    console.log("KelpToken proxy deployed to: ", kelpTokenProxy.address);

    const kelpToken = await upgrades.erc1967.getImplementationAddress(
      kelpTokenProxy.address
    );
    writeContractAddress("kelpToken", kelpToken);
    console.log("kelpToken deployed to :", kelpToken);
  });

task("upgrade:KelpToken")
  .addParam("signer", "Index of the signer in the metamask address list")
  .setAction(async function (taskArguments, { ethers, upgrades }) {
    console.log("--- start upgrading the KelpToken Contract ---");
    const accounts = await ethers.getSigners();
    const index = Number(taskArguments.signer);

    // Use accounts[1] as the signer for the real roll
    const KelpToken = await ethers.getContractFactory(
      "KelpToken",
      accounts[index]
    );

    const kelpTokenProxyAddress = readContractAddress("kelpTokenProxy");

    const upgraded = await upgrades.upgradeProxy(
      kelpTokenProxyAddress,
      KelpToken
    );

    console.log("KelpToken upgraded to: ", upgraded.address);

    const kelpToken = await upgrades.erc1967.getImplementationAddress(
      upgraded.address
    );
    writeContractAddress("kelpToken", kelpToken);
    console.log("kelpToken deployed to :", kelpToken);
  });

task("verify:KelpToken").setAction(async (taskArguments, { run }) => {
  const address = readContractAddress("kelpToken");

  try {
    await run("verify:verify", {
      address,
      constructorArguments: [],
    });
  } catch (err) {
    console.log(err);
  }
});
