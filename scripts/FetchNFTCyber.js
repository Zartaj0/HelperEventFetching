const { ethers } = require("ethers");

const rpcUrl = "https://cyber.alt.technology/";
const provider = new ethers.JsonRpcProvider(rpcUrl);

// Replace with the NFT contract address
const contractAddress = "0xc137be6b59e824672aada673e55cf4d150669af8";

// ABI of the relevant functions (e.g., balanceOf, ownerOf)
const contractAbi = [
  "function balanceOf(address owner) view returns (uint256)"
];

// Replace with the address you want to check
const userAddress = "0xd62b800c2c68f17e8394ac8261e3a4b51b978b66";

async function checkNftOwnership(userAddress) {
  const contract = new ethers.Contract(contractAddress, contractAbi, provider);

  try {
    // Check balance of NFTs held by user
    const balance = await contract.balanceOf(userAddress);

    if (balance > 0) {
      console.log(`${userAddress} holds ${balance.toString()} NFT(s) from the contract.`);
    } else {
      console.log(`${userAddress} does not hold any NFTs from the contract.`);
    }
  } catch (error) {
    console.error("Error querying NFT ownership: ", error);
  }
}

// Call the function to check if the user holds an NFT
checkNftOwnership(userAddress);
