require("@nomicfoundation/hardhat-ethers");
require("dotenv").config();

const abi = [
  "event Deposit(address indexed user, address indexed tokenAddress, uint256 amount)",
  "event Withdraw(address indexed user, address indexed tokenAddress, uint256 amount)",
];

const uniV2StakingAddress = "0x9D2513F5b539DC774C66b28ACEc94e4bD00105C2";
const userAddress = "0x6417Ef5291AEB0df83b31555Dc449d172bcc988A"; //Dynamic Value from frontend

const epochStart = 1689085800;
const epochDuration = 1814400;
let latestBlock;

async function main(epoch, user) {
  const provider = ethers.provider;
  latestBlock = await provider.getBlock("latest");

  let fromTimestamp;
  let toTimestamp;
  [fromTimestamp, toTimestamp] = getFromTimestamp(epoch);

  // fromTimestamp = epochStart;//For testing from the very start

  const fromBlock = await getBlockNumberFromTimestamp(fromTimestamp, provider);
  const toBlock = await getBlockNumberFromTimestamp(toTimestamp, provider);
  // toBlock = await ethers.provider.getBlockNumber(); // to fetch events till the latest block

  let UniV2Staking = new ethers.Contract(uniV2StakingAddress, abi, provider);
  console.log(
    "Fetching Staked events from:",
    fromTimestamp,
    "To:",
    toTimestamp
  );

  let lastDepositBlock;
  let TotalDepositedAmount = 0;
  // Create the filter for the specific user address to fetch the Deposit Events
  let depositEventFilter = UniV2Staking.filters.Deposit(user);
  let depositEvents = await UniV2Staking.queryFilter(
    depositEventFilter,
    fromBlock,
    toBlock
  );

  console.log(
    `Total ${depositEvents.length} Deposit events found for user ${user} between blocks ${fromBlock} and ${toBlock}`
  );
  depositEvents.forEach((event, index) => {
    console.log(`Event ${index + 1}:`);
    console.log(`User: ${event.args.user}`);
    console.log(`Amount Staked: ${event.args.amount.toString()}`);
    console.log(`Block Number: ${event.blockNumber}`);
    console.log(`Transaction Hash: ${event.transactionHash}`);
    console.log("-------------------------------------------");
    lastDepositBlock = event.blockNumber;
    TotalDepositedAmount += event.args.amount;
  });

  let WithdrawEventFilter = UniV2Staking.filters.Withdraw(user);
  let withdrawEvents = await UniV2Staking.queryFilter(
    WithdrawEventFilter,
    fromBlock,
    toBlock
  );

  console.log(
    `Total ${withdrawEvents.length} Withdraw events found for user ${user} between blocks ${fromBlock} and ${toBlock}`
  );
  withdrawEvents.forEach((eventWithdraw, index) => {
    console.log(`Event ${index + 1}:`);
    console.log(`User: ${eventWithdraw.args.user}`);
    console.log(`Amount Staked: ${eventWithdraw.args.amount.toString()}`);
    console.log(`Block Number: ${eventWithdraw.blockNumber}`);
    console.log(`Transaction Hash: ${eventWithdraw.transactionHash}`);
    console.log("-------------------------------------------");
    if (eventWithdraw.blockNumber >= lastDepositBlock) {
      TotalDepositedAmount -= eventWithdraw.args.amount;
    }
  });

  console.log("Total Amount Staked this epoch", TotalDepositedAmount);
}

function getFromTimestamp(epoch) {
  let to = epochStart + epoch * epochDuration - 1;
  let from = to - epochDuration;

  return [from, to];
}
async function getBlockNumberFromTimestamp(timestamp, provider) {
  let earliestBlock = await provider.getBlock(0);

  if (
    timestamp < earliestBlock.timestamp ||
    timestamp > latestBlock.timestamp
  ) {
    throw new Error("Timestamp is out of range.");
  }

  let low = earliestBlock.number;
  let high = latestBlock.number;

  while (low <= high) {
    let mid = Math.floor((low + high) / 2);
    let block = await provider.getBlock(mid);

    if (block.timestamp < timestamp) {
      low = mid + 1;
    } else if (block.timestamp > timestamp) {
      high = mid - 1;
    } else {
      return mid;
    }
  }

  // Return the closest block number that is less than or equal to the given timestamp
  return low - 1;
}
main(18, userAddress)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
