const { task } = require("hardhat/config");
const {
  readContractAddress,
  writeContractAddress,
} = require("./addresses/utils");
const cArguments = require("./arguments/kelpToken");

task("deploy:CDINTUSDC")
  .addParam("signer", "Index of the signer in the metamask address list")
  .setAction(async (taskArguments, { ethers }) => {
    const accounts = await ethers.getSigners();
    const index = Number(taskArguments.signer);

    const factory = await ethers.getContractFactory(
      "CDINTUSDC",
      accounts[index]
    );
    const contract = await factory.deploy(cArguments.VAULT_ADDRESS);

    await contract.deployed();

    writeContractAddress("cdintUSDC", contract.address);
    console.log("CDINTUSDC deployed to: ", contract.address);
  });

task("verify:CDINTUSDC").setAction(async (taskArguments, { run }) => {
  const address = readContractAddress("cdintUSDC");

  await run("verify:verify", {
    address,
    constructorArguments: [cArguments.VAULT_ADDRESS],
    contract: "contracts/CDINTUSDC.sol:CDINTUSDC",
  });
});
