require("@nomicfoundation/hardhat-ethers");
require("dotenv").config();
const { ethers } = require("ethers");

const abi = [
  "event Staked(address indexed user, uint256 indexed amountStaked)",
];

const core = "0x66329Fdd4042928BfCAB60b179e1538D56eeeeeE";
const UserToTrack = "0x2Bf034ecCEbc8CD60Dab9c249b6c2996Dcb7D8EC";
const genesisBlock = 17821509;
const epochDuration = 150276;

let fromBlock;
let toBlock;
let TotalAmountsStaked = 0n;
let provider;

async function main(_user) {
  //create Provider 
   provider = new ethers.JsonRpcProvider(`https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`);

  console.log("Initiating from and to with current Epoch");
  //get the currentEpoch
  let _epoch = await getCurrentEpoch();
  //pass the current epoch here
  [fromBlock, toBlock] = getFromAndToBlock(_epoch);

  let Core = new ethers.Contract(core, abi, provider);
  console.log("Fetching Staked events from core");
  
  // Create the filter for the specific user address
  let eventFilter = Core.filters.Staked(_user);
  let events = await Core.queryFilter(eventFilter, fromBlock, toBlock);

  console.log(
    `Total ${events.length} events found for user ${_user} between blocks ${fromBlock} and ${toBlock}`
  );
  events.forEach((event, index) => {
    TotalAmountsStaked += event.args.amountStaked;
  });

  console.log(
    `Total Amount staked in epoch ${_epoch}: ${TotalAmountsStaked}`
  );
}
//To get from and to Block number for a given epoch
function getFromAndToBlock(epoch) {
  let fromBlock=  genesisBlock + epochDuration * epoch - epochDuration;
  let ToBlock = genesisBlock + epochDuration * epoch - 1
  return [fromBlock, ToBlock];
}

//To get the cuurent epoch 
async function getCurrentEpoch() {
  let currentBlock = await provider.getBlockNumber();
  let epoch =  (currentBlock - genesisBlock) / epochDuration + 1;
  return ~~epoch;
}

main(UserToTrack)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
