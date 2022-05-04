const { readContractAddress } = require("../addresses/utils");
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const KELP_TOKEN = readContractAddress("kelpToken") || ZERO_ADDRESS;
const START_TIME = Math.round(new Date("2022-05-03").getTime() / 1000);

const values = {
  KELP_TOKEN,
  START_TIME,
};

module.exports = values;
