# Carboneum Smart Contracts [![Build Status](https://travis-ci.org/CarboneumProject/contracts.svg?branch=master)](https://travis-ci.org/CarboneumProject/contracts)

## Getting start
```
$ npm install
$ testrpc -u 0
$ truffle compile
$ truffle test
$ truffle migrate
```

## Debugging
Due to a bug of truffle we cannot debug smart contract with multi files
but we can use truffle-flattener(https://www.npmjs.com/package/truffle-flattener)
merge all contracts into a single file and debug it on https://remix.ethereum.org IDE instread.
```
truffle-flattener contracts/*.sol > ~/carboneum-flattened.sol
```
