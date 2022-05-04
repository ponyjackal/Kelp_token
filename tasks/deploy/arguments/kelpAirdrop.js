const { readContractAddress } = require("../addresses/utils");
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const KELP_AIRDROP_PROXY_ADDRESS = readContractAddress("kelpAirdropProxy");
const KELP_TOKEN_PROXY_ADDRESS =
  readContractAddress("kelpTokenProxy") || ZERO_ADDRESS;
const START_TIME = Math.round(new Date("2022-05-03").getTime() / 1000);

const values = {
  KELP_AIRDROP_PROXY_ADDRESS,
  KELP_TOKEN_PROXY_ADDRESS,
  START_TIME,
};

module.exports = values;
