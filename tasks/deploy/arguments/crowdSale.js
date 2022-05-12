const { readContractAddress } = require("../addresses/utils");

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const KELP_TOKEN_PROXY = readContractAddress("kelpTokenProxy") || ZERO_ADDRESS;
const KELP_AIRDROP_PROXY =
  readContractAddress("kelpAirdropProxy") || ZERO_ADDRESS;
const CROWD_SALE_WALLET = readContractAddress("crowdSaleWallet");

const values = {
  KELP_TOKEN_PROXY,
  KELP_AIRDROP_PROXY,
  CROWD_SALE_WALLET,
};

module.exports = values;
