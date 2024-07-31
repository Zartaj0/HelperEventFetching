require("@nomicfoundation/hardhat-ethers");
require("dotenv").config();
const { ethers } = require("ethers");

const abi = [
  "event Deposit(address indexed user, address indexed tokenAddress, uint256 amount)",
  "event Withdraw(address indexed user, address indexed tokenAddress, uint256 amount)",
];

const uniV2StakingAddress = "0x9D2513F5b539DC774C66b28ACEc94e4bD00105C2";
const userAddress = "0x6417Ef5291AEB0df83b31555Dc449d172bcc988A"; //Dynamic Value from frontend

const epochStart = 1689085800;
const epochDuration = 1814400;
let latestBlock;
let provider;
async function main(user) {
  provider = new ethers.JsonRpcProvider(
    `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
  );
  latestBlock = await provider.getBlock("latest");

  let epoch = await getCurrentEpoch();
  let fromTimestamp;
  let toTimestamp;
  let fromBlock;
  let toBlock;

  //get from and to block numbers and timestamps
  [fromTimestamp, toTimestamp] = getFromAndToTimestamp(epoch);

  [fromBlock, toBlock] = await getFromAndToBlockNumber(epoch);

  let UniV2Staking = new ethers.Contract(uniV2StakingAddress, abi, provider);
  console.log(
    "Fetching Staked events from:",
    fromTimestamp,
    "To:",
    toTimestamp
  );

  let TotalDepositedAmount = BigInt(0); // Initialize as BigInt
  let events = [];

  // Fetch Deposit events
  let depositEventFilter = UniV2Staking.filters.Deposit(user);
  let depositEvents = await UniV2Staking.queryFilter(
    depositEventFilter,
    fromBlock,
    toBlock
  );

  depositEvents.forEach((event) => {
    events.push({
      type: "Deposit",
      amount: event.args.amount,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
    });
  });

  // Fetch Withdraw events
  let WithdrawEventFilter = UniV2Staking.filters.Withdraw(user);
  let withdrawEvents = await UniV2Staking.queryFilter(
    WithdrawEventFilter,
    fromBlock,
    toBlock
  );

  withdrawEvents.forEach((event) => {
    events.push({
      type: "Withdraw",
      amount: event.args.amount,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
    });
  });

  // Sort events by block number to process them in chronological order
  events.sort((a, b) => a.blockNumber - b.blockNumber);

  // Process events
  events.forEach((event, index) => {

    if (event.type === "Deposit") {
      TotalDepositedAmount += BigInt(event.amount); // Convert to BigInt
    } else if (event.type === "Withdraw") {
      TotalDepositedAmount -= BigInt(event.amount); // Convert to BigInt
    }
  });

  console.log(
    "Total Amount Staked in epoch:",
    epoch,
    TotalDepositedAmount.toString()
  );
}

//To get from and to Timestamp for a given epoch
function getFromAndToTimestamp(epoch) {
  let to = epochStart + epoch * epochDuration - 1;
  let from = to - epochDuration;

  return [from, to];
}

//To get the block number in correspondance to the Timestamps for a given epoch
async function getFromAndToBlockNumber(epoch) {
  [fromTimestamp, toTimestamp] = getFromAndToTimestamp(epoch);
  const fromBlock = await getBlockNumberFromTimestamp(fromTimestamp);
  const toBlock = await getBlockNumberFromTimestamp(toTimestamp, provider);
  return [fromBlock, toBlock];
}


//To get the cuurent epoch 
async function getCurrentEpoch() {
  let epoch = (latestBlock.timestamp - epochStart) / epochDuration + 1;
  return ~~epoch;
}

// To find out the block number given the timestamp
async function getBlockNumberFromTimestamp(timestamp) {
  let earliestBlock = await provider.getBlock(0);
  if (timestamp > latestBlock.timestamp) {
    timestamp = latestBlock.timestamp;
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

main(userAddress)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
