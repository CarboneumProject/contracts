# Carboneum Smart Contracts

## Deploy
```
$ truffle compile
$ truffle migrate
```

## Try on truffle console 
```
account1 = web3.eth.accounts[1]
CarboneumCrowdsale.deployed().then(inst => { crowdsale = inst })
crowdsale.token().then(addr => { tokenAddress = addr } )
tokenAddress
caboneumTokenInstance = CarboneumToken.at(tokenAddress)
CarboneumCrowdsale.deployed().then(inst => inst.sendTransaction({ from: account1, value: web3.toWei(5, "ether")}))
caboneumTokenInstance.balanceOf(account1).then(balance => account1C8TokenBalance = balance.toString(10))
```