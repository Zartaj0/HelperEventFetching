require("@nomicfoundation/hardhat-ethers");
require("dotenv").config();

const abi = [
  "event Staked(address indexed user, uint256 indexed amountStaked)",
];

const comm = "0x66329Fdd4042928BfCAB60b179e1538D56eeeeeE";
const userAddress = "0x5e2D6e828683Fe785531b21F4DAD96236c1040c2";
const genesisBlock = 17821509;
const epochDuration = 150276; 
let fromBlock ; // specify the starting block number
let toBlock; // specify the ending block number

async function main() {
  fromBlock = getFromBlock(18); 
  toBlock = getToBlock(18); // to fetch between a specific period 
  // toBlock = await ethers.provider.getBlockNumber(); // to fetch events till the latest block

  let Comm = new ethers.Contract(comm, abi, ethers.provider);
  console.log("Fetching Staked events from core");

  // Create the filter for the specific user address
  let eventFilter = Comm.filters.Staked(userAddress);
  let events = await Comm.queryFilter(eventFilter, fromBlock, toBlock);

  console.log(
    `Total ${events.length} events found for user ${userAddress} between blocks ${fromBlock} and ${toBlock}`
  );
  events.forEach((event, index) => {
    console.log(`Event ${index + 1}:`);
    console.log(`User: ${event.args.user}`);
    console.log(`Amount Staked: ${event.args.amountStaked.toString()}`);
    console.log(`Block Number: ${event.blockNumber}`);
    console.log(`Transaction Hash: ${event.transactionHash}`);
    console.log("-------------------------------------------");
  });
}

function getFromBlock(epoch) {
  return ((genesisBlock + (epochDuration * epoch)) - epochDuration);
}
function getToBlock(epoch) {
  return genesisBlock + (epochDuration * epoch) - 1;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
