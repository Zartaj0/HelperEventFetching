require("@nomicfoundation/hardhat-ethers");
require("dotenv").config();

const abi = [
  "event Staked(address indexed user, uint256 indexed amountStaked)",
];

const core = "0x66329Fdd4042928BfCAB60b179e1538D56eeeeeE";
const UserToTrack = "0xB59Cdc85Cacd15097ecE4C77ed9D225014b4D56D";
const genesisBlock = 17821509;
const epochDuration = 150276;
const EpochToTrack = 18;

let fromBlock;
let toBlock;
let TotalAmountsStaked = 0n;

async function main(_epoch, _user) {
  //pass the current epoch here
  fromBlock = getFromBlock(_epoch);
  toBlock = getToBlock(_epoch); // to fetch between a specific period

  //!To fetch from first epoch to latest block
  // fromBlock = genesisBlock; //to Fetch events from the very start
  // toBlock = await ethers.provider.getBlockNumber(); // to fetch events till the latest block

  let Core = new ethers.Contract(core, abi, ethers.provider);
  console.log("Fetching Staked events from core");

  // Create the filter for the specific user address
  let eventFilter = Core.filters.Staked(_user);
  let events = await Core.queryFilter(eventFilter, fromBlock, toBlock);

  console.log(
    `Total ${events.length} events found for user ${_user} between blocks ${fromBlock} and ${toBlock}`
  );
  events.forEach((event, index) => {
    console.log(`Event ${index + 1}:`);
    console.log(`User: ${event.args.user}`);
    console.log(`Amount Staked: ${event.args.amountStaked.toString()}`);
    console.log(`Block Number: ${event.blockNumber}`);
    console.log(`Transaction Hash: ${event.transactionHash}`);
    console.log("-------------------------------------------");
    TotalAmountsStaked += event.args.amountStaked;
  });

  console.log(
    `Total Amount staked in epoch ${EpochToTrack}: ${TotalAmountsStaked}`
  );
}
// Returns the exact Block from where the epoch started
function getFromBlock(epoch) {
  return genesisBlock + epochDuration * epoch - epochDuration;
}
// Returns the exact Block where the epoch will end
function getToBlock(epoch) {
  return genesisBlock + epochDuration * epoch - 1;
}

main(EpochToTrack, UserToTrack)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
