require("@nomicfoundation/hardhat-ethers");
require("dotenv").config();
const { ethers } = require("ethers");

const abi = [
  "function userFeesInfo(address) view returns (uint256 stakedAmount, uint256 stakedWeight, uint256 lastStakedBlock, uint256 lastClaimedBlock)",
];

const core = "0x66329Fdd4042928BfCAB60b179e1538D56eeeeeE";
const UserToTrack = "0x2Bf034ecCEbc8CD60Dab9c249b6c2996Dcb7D8EC";
let provider;

async function main(_user) {
  provider = new ethers.JsonRpcProvider(`https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`);
  let Core = new ethers.Contract(core, abi, provider);


  // Fetch user staking information from the userFeesInfo mapping
  let userInfo = await Core.userFeesInfo(_user);

  // Convert the stakedAmount from wei to a human-readable format (assuming 18 decimals)
  let formattedStakedAmount = ethers.formatUnits(userInfo.stakedAmount, 18); // Use 18 decimals as most tokens follow this

  // Optionally, limit the decimal places (e.g., 2 decimals)
  let trimmedStakedAmount = parseFloat(formattedStakedAmount).toFixed(0);

  console.log(`User ${_user} Staked Amount (formatted): ${trimmedStakedAmount}`);
}


main(UserToTrack)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
