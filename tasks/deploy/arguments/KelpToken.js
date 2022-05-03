const { readContractAddress } = require("../addresses/utils");

const STARKEX_ADDRSS = readContractAddress("starkEx");

const values = {
  STARKEX_ADDRSS,
};

module.exports = values;
