require("@nomicfoundation/hardhat-ethers");
require("dotenv").config();
const { ethers } = require("ethers");

const abi = [
  "function balanceOf(address user, address token) view returns (uint256)"
];

const uniV2StakingAddress = "0x9D2513F5b539DC774C66b28ACEc94e4bD00105C2"; // Staking contract address
const userAddress = "0x6417Ef5291AEB0df83b31555Dc449d172bcc988A"; // Dynamic value from frontend
const tokenAddress = "0xAf31Fd9C3B0350424BF96e551d2D1264d8466205"; // Replace with the token address you're tracking
let provider;

async function main(user, token) {
  provider = new ethers.JsonRpcProvider(
    `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
  );

  // Create contract instance with ABI and provider
  let UniV2Staking = new ethers.Contract(uniV2StakingAddress, abi, provider);
  
  // Fetch the balance of the user from the contract's balances mapping
  let balance = await UniV2Staking.balanceOf(user, token);

  // Format balance to human-readable format (assuming 18 decimals)
  let formattedBalance = ethers.formatUnits(balance, 18); // v6
  // let formattedBalance = ethers.utils.formatUnits(balance, 18); // Use this if you're on v5
  
  // Trim the decimals to display a whole number
  let trimmedBalance = Math.floor(parseFloat(formattedBalance));

  // Log the final balance
  console.log(`Total balance for user ${user} and token ${token}:`, trimmedBalance);
}

main(userAddress, tokenAddress)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
