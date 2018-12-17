const SocialTrading = artifacts.require('SocialTrading');
// const CarboneumToken = artifacts.require('CarboneumToken');
//
// function ether (n) {
//   return new web3.BigNumber(web3.toWei(n, 'ether'));
// }

module.exports = function (deployer, network) {
  if (network === 'rinkeby') {
    return deployer.then(function () {
      return SocialTrading.new();
    });
  }
};
