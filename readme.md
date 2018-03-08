# Carboneum Smart Contracts

## Deploy
```
$ npm install
$ truffle compile
$ truffle migrate
```

## Debugging
Due to a bug of truffle we cannot debug smart contract with multi files
but we can use truffle-flattener(https://www.npmjs.com/package/truffle-flattener)
merge all contracts into a single file and debug it on https://remix.ethereum.org IDE instread.
```
truffle-flattener contracts/CarboneumCrowdsale.sol > ~/All.sol
```
