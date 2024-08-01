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

let provider;

async function main(user) {
  provider = new ethers.JsonRpcProvider(
    `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
  );
  
  let latestBlock = await provider.getBlock("latest");

  console.log("Initiating from and to with current Epoch");

  let epoch = getCurrentEpoch(latestBlock.timestamp);
  let [fromTimestamp, toTimestamp] = getFromAndToTimestamp(epoch);
  let [fromBlock, toBlock] = await getFromAndToBlockNumber(fromTimestamp, toTimestamp);

  let UniV2Staking = new ethers.Contract(uniV2StakingAddress, abi, provider);
  console.log(
    "Fetching Staked events from:",
    fromTimestamp,
    "To:",
    toTimestamp
  );

  let TotalDepositedAmount = BigInt(0); // Initialize as BigInt
  let events = [];

  // Fetch Deposit and Withdraw events in parallel
  let [depositEvents, withdrawEvents] = await Promise.all([
    UniV2Staking.queryFilter(UniV2Staking.filters.Deposit(user), fromBlock, toBlock),
    UniV2Staking.queryFilter(UniV2Staking.filters.Withdraw(user), fromBlock, toBlock),
  ]);

  // Combine events and sort them
  events = [...depositEvents, ...withdrawEvents].sort((a, b) => a.blockNumber - b.blockNumber);

  // Process events
  events.forEach((event) => {
    if (event.event === "Deposit") {
      TotalDepositedAmount += BigInt(event.args.amount);
    } else if (event.event === "Withdraw") {
      TotalDepositedAmount -= BigInt(event.args.amount);
    }
  });

  console.log(
    "Total Amount Staked in epoch:",
    epoch,
    TotalDepositedAmount.toString()
  );
}

// Get from and to timestamp for a given epoch
function getFromAndToTimestamp(epoch) {
  let to = epochStart + epoch * epochDuration - 1;
  let from = to - epochDuration;
  return [from, to];
}

// Get the block number in correspondence to the timestamps for a given epoch
async function getFromAndToBlockNumber(fromTimestamp, toTimestamp) {
  let [fromBlock, toBlock] = await Promise.all([
    getBlockNumberFromTimestamp(fromTimestamp),
    getBlockNumberFromTimestamp(toTimestamp),
  ]);
  return [fromBlock, toBlock];
}

// Get the current epoch
function getCurrentEpoch(currentTimestamp) {
  return Math.floor((currentTimestamp - epochStart) / epochDuration + 1);
}

// Find out the block number given the timestamp
async function getBlockNumberFromTimestamp(timestamp) {
  let latestBlock = await provider.getBlock("latest");
  if (timestamp > latestBlock.timestamp) {
    timestamp = latestBlock.timestamp;
  }

  let low = 0;
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
