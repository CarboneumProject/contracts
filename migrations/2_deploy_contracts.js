const SocialTrading = artifacts.require('SocialTrading');
const feeWallet = '0x100BcEcd8DA3Ec5C4EA2886c5Fd97287815c42f5';
const tokenAddress = '0xd42debe4edc92bd5a3fbb4243e1eccf6d63a4a5d';
module.exports = function (deployer, network) {
  if (network === 'rinkeby') {
    return deployer.then(function () {
      return SocialTrading.new(feeWallet, tokenAddress);
    });
  } else {
    return deployer.then(function () {
      return SocialTrading.new(feeWallet, tokenAddress);
    });
  }
};
