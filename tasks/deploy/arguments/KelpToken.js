const { readContractAddress } = require("../addresses/utils");

const KELP_AIRDROP = readContractAddress("kelpAirdrop");

const values = {
  KELP_AIRDROP,
};

module.exports = values;
