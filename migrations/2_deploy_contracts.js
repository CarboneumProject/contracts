const SocialTrading = artifacts.require('RelayWalletIDEX.sol');
module.exports = function (deployer, network) {
  if (network === 'rinkeby') {
    return deployer.then(function () {
      return SocialTrading.new('0xa250a55a282aF49809B7BE653631f12603c3797B');
    });
  }
};
