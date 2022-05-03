const { task } = require("hardhat/config");
const {
  readContractAddress,
  writeContractAddress,
} = require("./addresses/utils");
const cArguments = require("./arguments/kelpToken");

task("deploy:KelpToken")
  .addParam("signer", "Index of the signer in the metamask address list")
  .setAction(async (taskArguments, { ethers }) => {
    const accounts = await ethers.getSigners();
    const index = Number(taskArguments.signer);

    // deploy proxy first
    const Proxy = await ethers.getContractFactory("Proxy", accounts[index]);
    const proxy = await Proxy.deploy();
    await proxy.deployed();
    writeContractAddress("kelpTokenProxy", proxy.address);
    console.log(`Proxy KelpToken deployed to:`, proxy.address);
    // deploy KelpToken
    const KelpToken = await ethers.getContractFactory(
      "KelpToken",
      accounts[index]
    );
    const kelpToken = await KelpToken.deploy(
      cArguments.KELP_TOKEN_PROXY_ADDRESS,
      cArguments.KELP_AIRDROP_PROXY_ADDRESS
    );
    await kelpToken.deployed();

    writeContractAddress("kelpToken", kelpToken.address);
    console.log("KelpToken deployed to: ", kelpToken.address);

    // set proxy target for KelpToken
    await proxy.setTarget(kelpToken.address);
  });

task("verify:KelpToken").setAction(async (taskArguments, { run }) => {
  const address = readContractAddress("kelpToken");
  const proxyAddress = readContractAddress("kelpAirdropProxy");

  try {
    await run("verify:verify", {
      proxyAddress,
      constructorArguments: [],
    });
  } catch (err) {}

  try {
    await run("verify:verify", {
      address,
      constructorArguments: [
        cArguments.KELP_TOKEN_PROXY_ADDRESS,
        cArguments.KELP_AIRDROP_PROXY_ADDRESS,
      ],
    });
  } catch (err) {}
});
