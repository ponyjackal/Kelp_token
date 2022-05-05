const { readContractAddress } = require("../addresses/utils");

const KELP_AIRDROP_PROXY = readContractAddress("kelpAirdropProxy");

const values = {
  KELP_AIRDROP_PROXY,
};

module.exports = values;
