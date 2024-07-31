Contains two scripts

1. **FetchPushStake.js** - To fetch stake events in the core contract for Push Tokens in  a particular epcoch 

  To run:
  
`npx hardhat run .\scripts\FetchPushStake.js`

2. **FetchUNIV2Stake.js** - To fetch Deposit and withdraw events from UniV2 LP tokens staking contract. Fetching both events because it allows users to wihdraw in same epoch. 

To run:

`npx hardhat run .\scripts\FetchUNIV2Stake.js`
