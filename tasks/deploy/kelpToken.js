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
      proxy.address,
      cArguments.KELP_AIRDROP_PROXY_ADDRESS
    );
    await kelpToken.deployed();

    writeContractAddress("kelpToken", kelpToken.address);
    console.log("KelpToken deployed to: ", kelpToken.address);

    // set proxy target for KelpToken
    await proxy.setTarget(kelpToken.address);

    console.log(proxy.address, cArguments.KELP_AIRDROP_PROXY_ADDRESS);
  });

task("verify:KelpToken").setAction(async (taskArguments, { run }) => {
  const address = readContractAddress("kelpToken");
  const proxyAddress = readContractAddress("kelpTokenProxy");

  try {
    await run("verify:verify", {
      address: proxyAddress,
      constructorArguments: [],
    });
  } catch (err) {
    console.log(err);
  }

  try {
    await run("verify:verify", {
      address,
      constructorArguments: [
        proxyAddress,
        cArguments.KELP_AIRDROP_PROXY_ADDRESS,
      ],
    });
  } catch (err) {
    console.log(err);
  }
});
