const { readContractAddress } = require("../addresses/utils");

const KELP_AIRDROP_PROXY_ADDRESS = readContractAddress("kelpAirdropProxy");
const KELP_TOKEN_PROXY_ADDRESS = readContractAddress("kelpTokenProxy");

const values = {
  KELP_AIRDROP_PROXY_ADDRESS,
  KELP_TOKEN_PROXY_ADDRESS,
};

module.exports = values;