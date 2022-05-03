const { task } = require("hardhat/config");
const {
  readContractAddress,
  writeContractAddress,
} = require("./addresses/utils");
const cArguments = require("./arguments/kelpAirdrop");

task("deploy:KelpAirdrop")
  .addParam("signer", "Index of the signer in the metamask address list")
  .setAction(async (taskArguments, { ethers }) => {
    const accounts = await ethers.getSigners();
    const index = Number(taskArguments.signer);

    // deploy proxy first
    const Proxy = await ethers.getContractFactory("Proxy", accounts[index]);
    const proxy = await Proxy.deploy();
    await proxy.deployed();
    writeContractAddress("kelpAirdropProxy", proxy.address);
    console.log(`Proxy KelpAirdrop deployed to:`, proxy.address);
    // deploy KelpAirdrop
    const KelpAirdrop = await ethers.getContractFactory(
      "KelpAirdrop",
      accounts[index]
    );
    const kelpAirdrop = await KelpAirdrop.deploy(
      cArguments.KELP_AIRDROP_PROXY_ADDRESS,
      cArguments.START_TIME,
      cArguments.KELP_TOKEN_PROXY_ADDRESS
    );
    await kelpAirdrop.deployed();

    writeContractAddress("kelpAirdrop", kelpAirdrop.address);
    console.log("KelpAirdrop deployed to: ", kelpAirdrop.address);

    // set proxy target for KelpAirdrop
    await proxy.setTarget(kelpAirdrop.address);
  });

task("verify:KelpAirdrop").setAction(async (taskArguments, { run }) => {
  const address = readContractAddress("kelpAirdrop");
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
