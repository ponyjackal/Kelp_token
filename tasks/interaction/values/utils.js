const { config: dotenvConfig } = require("dotenv");
const fs = require("fs");
const path = require("path");

dotenvConfig({ path: path.resolve(__dirname, "../../../.env") });

console.log("DEPLOY_NETWORK: ", process.env.DEPLOY_NETWORK);

const network = () => {
  const { DEPLOY_NETWORK } = process.env;
  if (DEPLOY_NETWORK) return DEPLOY_NETWORK;
  return "goerli";
};

const writeValue = (valueFileName, value, key) => {
  const NETWORK = network();

  const rawData = fs.readFileSync(
    path.join(__dirname, `${NETWORK}/${valueFileName}.json`)
  );
  const info = JSON.parse(rawData.toString());

  fs.writeFileSync(
    path.join(__dirname, `${NETWORK}/${valueFileName}.json`),
    JSON.stringify({
      ...info,
      [key]: value,
    })
  );
};

const readValue = (valueFileName, key) => {
  const NETWORK = network();

  const rawData = fs.readFileSync(
    path.join(__dirname, `${NETWORK}/${valueFileName}.json`)
  );
  const info = JSON.parse(rawData.toString());

  return info[key];
};

module.exports = {
  writeValue,
  readValue,
};
