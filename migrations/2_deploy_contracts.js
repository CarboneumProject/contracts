const RelayWallet = artifacts.require('RelayWallet');
// const Weth = artifacts.require('WETH9');

let relay;
module.exports = function (deployer, network) {
  if (network === 'rinkeby') {
    return deployer.then(function () {
      return RelayWallet.new('0xc778417e063141139fce010982780140aa0cd5ab', '0x22ebc052f43a88efa06379426120718170f2204e');
    }).then(function (instance) {
      relay = instance;
      console.log('Contract address: ', relay.address);
    });
  }
};


