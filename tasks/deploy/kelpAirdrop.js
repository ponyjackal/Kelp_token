const { task } = require("hardhat/config");
const {
  readContractAddress,
  writeContractAddress,
} = require("./addresses/utils");
const cArguments = require("./arguments/kelpAirdrop");

task("deploy:KelpAirdrop")
  .addParam("signer", "Index of the signer in the metamask address list")
  .setAction(async (taskArguments, { ethers, upgrades }) => {
    const accounts = await ethers.getSigners();
    const index = Number(taskArguments.signer);

    // deploy KelpAirdrop
    const KelpAirdrop = await ethers.getContractFactory(
      "KelpAirdrop",
      accounts[index]
    );

    const kelpAirdropProxy = await upgrades.deployProxy(KelpAirdrop, [
      cArguments.KELP_TOKEN,
    ]);

    await KelpAirdrop.deployed();

    writeContractAddress("KelpAirdrop", kelpAirdropProxy.address);
    console.log("KelpAirdrop proxy deployed to: ", kelpAirdropProxy.address);

    const impl = await upgrades.erc1967.getImplementationAddress(
      kelpAirdropProxy.address
    );
    console.log("Implementation :", impl);
  });

task("upgrade:KelpAirdrop")
  .addParam("signer", "Index of the signer in the metamask address list")
  .setAction(async function (taskArguments, { ethers, upgrades }) {
    console.log("--- start upgrading the KelpAirdrop Contract ---");
    const accounts = await ethers.getSigners();
    const index = Number(taskArguments.signer);

    // Use accounts[1] as the signer for the real roll
    const KelpAirdrop = await ethers.getContractFactory(
      "KelpAirdrop",
      accounts[index]
    );

    const kelpAirdropAddress = readContractAddress("kelpAirdrop");

    const upgraded = await upgrades.upgradeProxy(
      kelpAirdropAddress,
      KelpAirdrop
    );

    console.log("KelpAirdrop upgraded to: ", upgraded.address);

    const impl = await upgrades.erc1967.getImplementationAddress(
      upgraded.address
    );
    console.log("Implementation :", impl);
  });

task("verify:KelpAirdrop").setAction(async (taskArguments, { run }) => {
  const address = readContractAddress("kelpAirdrop");

  try {
    await run("verify:verify", {
      address,
      constructorArguments: [],
    });
  } catch (err) {
    console.log(err);
  }
});
