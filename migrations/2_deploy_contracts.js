const RelayWallet = artifacts.require('RelayWallet');
// const Weth = artifacts.require('WETH9');

let relay;
module.exports = function (deployer, network) {
  if (network === 'rinkeby') {
    return deployer.then(function () {
      return RelayWallet.new('0xc778417e063141139fce010982780140aa0cd5ab',
        '0x22ebc052f43a88efa06379426120718170f2204e',
        '0x3e809c563c15a295e832e37053798ddc8d6c8dab');
    }).then(function (instance) {
      relay = instance;
      console.log('Contract address: ', relay.address);
    });
  } else if (network === 'kovan') {
    return deployer.then(function () {
      return RelayWallet.new('0xd0a1e359811322d97991e03f863a0c30c2cf029c',
        '0x35dd2932454449b14cee11a94d3674a936d5d7b2',
        '0xf1ec01d6236d3cd881a0bf0130ea25fe4234003e');
    }).then(function (instance) {
      relay = instance;
      console.log('Contract address: ', relay.address);
    });
  }
};
