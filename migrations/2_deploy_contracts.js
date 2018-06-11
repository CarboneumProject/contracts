const CarboneumCrowdsale = artifacts.require('CarboneumCrowdsale');
const CarboneumToken = artifacts.require('CarboneumToken');
const Subscription = artifacts.require('Subscription');

function ether (n) {
  return new web3.BigNumber(web3.toWei(n, 'ether'));
}

module.exports = function (deployer, network, accounts) {
  const tokenWallet = accounts[0];
  const fundWallet = new web3.BigNumber('0x966504CE67077C2a1b88a5C7d6CA4EdBc87caebC'); // Real fund address.
  const iconAddress = new web3.BigNumber('0x966504CE67077C2a1b88a5C7d6CA4EdBc87caebC'); // Real ICON Token address.
  const startTime = new web3.BigNumber(Math.floor(new Date().getTime() / 1000) + 300); // Now + 5 Min
  const presaleEnd = new web3.BigNumber(Math.floor(new Date(2018, 4, 22, 3, 8, 0, 0).getTime() / 1000));
  // Sale end at 22 May 2018 @10:08 (GMT +7)
  const endTime = new web3.BigNumber(Math.floor(new Date(2018, 5, 22, 3, 8, 0, 0).getTime() / 1000));
  const priceETHUSD = 800;
  const priceC8USD = 0.1;
  const rate = new web3.BigNumber(priceETHUSD / priceC8USD);
  const iconRate = new web3.BigNumber(200);
  const capUSD = 12000000; // Hard cap $12M
  const cap = ether(capUSD / priceETHUSD);
  const tokenAllowance = new web3.BigNumber('100e24'); // 100M token reserve 20M for THB and other sale.
  const stockradarsRate = ether(3.2);
  const fee = new web3.BigNumber(1); // 1%

  let token, crowdsale;
  if (network === 'mainnet') {
    return deployer.then(function () {
      return CarboneumToken.at('0xd42debe4edc92bd5a3fbb4243e1eccf6d63a4a5d');
    }).then(function (instance) {
      token = instance;
      return CarboneumCrowdsale.at('0x65e151d4e56261b4672bdebd76d7045030b38292');
    }).then(function (instance) {
      crowdsale = instance;
      token.approve(crowdsale.address, tokenAllowance, { from: tokenWallet });
      console.log('Token Address', token.address);
      console.log('Crowdsale Address', crowdsale.address);
      return true;
    }).then(function (pass) {
      return Subscription.new(fee, accounts[0], token.address);
    }).then(function (subscription) {
      subscription.registration('StockRadars', stockradarsRate, tokenWallet, { from: tokenWallet });
      console.log('Subscription Address', subscription.address);
    });
  } else if (network === 'rinkeby') {
    return deployer.then(function () {
      return CarboneumToken.at('0xd36255cee98d10068d0bc1a394480bf09b3db4d7');
    }).then(function (instance) {
      token = instance;
      return CarboneumCrowdsale.at('0x7d12617a251e619e3810d847832b97de7bd808b3');
    }).then(function (pass) {
      return Subscription.new(fee, accounts[0], token.address);
    }).then(function (subscription) {
      subscription.registration('StockRadars', stockradarsRate, tokenWallet, { from: tokenWallet });
      console.log('Subscription Address', subscription.address);
    });
  } else {
    // Deploy all new set of contract
    return deployer.then(function () {
      return CarboneumToken.new({ from: tokenWallet });
    }).then(function (instance) {
      token = instance;
      return CarboneumCrowdsale.new(startTime, endTime, rate, iconRate, tokenWallet,
        fundWallet, cap, token.address, iconAddress);
    }).then(function (instance) {
      crowdsale = instance;
      token.approve(crowdsale.address, tokenAllowance, { from: tokenWallet });
      console.log('Token Address', token.address);
      console.log('Crowdsale Address', crowdsale.address);
      return true;
    }).then(function (pass) {
      return Subscription.new(fee, accounts[0], token.address);
    }).then(function (subscription) {
      subscription.registration('StockRadars', stockradarsRate, tokenWallet, { from: tokenWallet });
      console.log('Subscription Address', subscription.address);
    });
  }
};
