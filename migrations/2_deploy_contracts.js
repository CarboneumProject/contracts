const SocialTrading = artifacts.require('SocialTrading');
module.exports = function (deployer, network) {
  if (network === 'rinkeby') {
    return deployer.then(function () {
      return SocialTrading.new();
    });
  } else {
    return deployer.then(function () {
      return SocialTrading.new();
    });
  }
};
