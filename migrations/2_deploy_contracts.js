const PromoCode = artifacts.require('PromoCode');
const tokenAddress = '0xd42debe4edc92bd5a3fbb4243e1eccf6d63a4a5d';
module.exports = function (deployer, network) {
  if (network === 'rinkeby') {
    return deployer.then(function () {
      return PromoCode.new(tokenAddress, new web3.BigNumber('88e18'));
    });
  } else {
    return deployer.then(function () {
      return PromoCode.new(tokenAddress, new web3.BigNumber('88e18'));
    });
  }
};
