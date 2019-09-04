const Purchase = artifacts.require('Purchase');
const tokenAddress = '0xd42debe4edc92bd5a3fbb4243e1eccf6d63a4a5d';
const fundWallet = '0x5023CfABAEa4d331fA78d50cc5de5102341df649';
module.exports = function (deployer, network) {
  if (network === 'rinkeby') {
    return deployer.then(function () {
      return Purchase.new(fundWallet, tokenAddress, new web3.BigNumber('555e18'));
    });
  } else {
    return deployer.then(function () {
      return Purchase.new(fundWallet, tokenAddress, new web3.BigNumber('555e18'));
    });
  }
};
