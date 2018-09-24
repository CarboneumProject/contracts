const SocialTrading = artifacts.require('SocialTrading');
// const CarboneumToken = artifacts.require('CarboneumToken');
//
// function ether (n) {
//   return new web3.BigNumber(web3.toWei(n, 'ether'));
// }

module.exports = function (deployer, network) {
  if (network === 'rinkeby') {
    return deployer.then(function () {
      return SocialTrading.new('0x541e36182d2aeb6346c10293d3caf619fe4a17ed',
        '0xd36255cee98d10068d0bc1a394480bf09b3db4d7');
    });
  }
};
