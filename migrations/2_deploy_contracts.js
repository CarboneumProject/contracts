const CarboneumCrowdsale = artifacts.require('CarboneumCrowdsale');
const CarboneumToken = artifacts.require('CarboneumToken');

function ether (n) {
  return new web3.BigNumber(web3.toWei(n, 'ether'));
}

module.exports = function (deployer, network, accounts) {
  const tokenWallet = accounts[0];
  const fundWallet = new web3.BigNumber('0x966504CE67077C2a1b88a5C7d6CA4EdBc87caebC'); // Real fund address.
  const startTime = new web3.BigNumber(Math.floor(new Date().getTime() / 1000) + 300); // Now + 5 Min
  // Sale end at 8 July 2018 @10:00 (GMT +7)
  const endTime = new web3.BigNumber(Math.floor(new Date('2018-07-08T03:00:00').getTime() / 1000));
  const priceETHUSD = 500;
  const rate = new web3.BigNumber(5000);
  const iconRate = new web3.BigNumber(20);
  const capUSD = 12000000; // Hard cap $12M
  const cap = ether(capUSD / priceETHUSD);

  let token, crowdsale;
  if (network === 'mainnet') {
    return deployer.then(function () {
      return CarboneumToken.at('0xd42debe4edc92bd5a3fbb4243e1eccf6d63a4a5d');
    }).then(function (instance) {
      token = instance;
      const iconAddress = new web3.BigNumber('0xb5a5f22694352c15b00323844ad545abb2b11028'); // Real ICON Token address.
      return CarboneumCrowdsale.new(startTime, endTime, rate, iconRate, tokenWallet,
        fundWallet, cap, token.address, iconAddress);
    }).then(function (instance) {
      crowdsale = instance;
      console.log('Token Address', token.address);
      console.log('Crowdsale Address', crowdsale.address);
      return true;
    });
  } else if (network === 'rinkeby') {
    return deployer.then(function () {
      return CarboneumToken.at('0xd36255cee98d10068d0bc1a394480bf09b3db4d7');
    }).then(function (instance) {
      token = instance;
      const iconAddress = new web3.BigNumber('0xd42debe4edc92bd5a3fbb4243e1eccf6d63a4a5d'); // C8 old For ICON test
      return CarboneumCrowdsale.new(startTime, endTime, rate, iconRate, tokenWallet,
        fundWallet, cap, token.address, iconAddress);
    }).then(function (instance) {
      crowdsale = instance;
      console.log('Crowdsale Address', crowdsale.address);
    });
  }
};
