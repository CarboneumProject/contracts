const CarboneumCrowdsale = artifacts.require('CarboneumCrowdsale');
const CarboneumToken = artifacts.require('CarboneumToken');

function ether (n) {
  return new web3.BigNumber(web3.toWei(n, 'ether'));
}

module.exports = function (deployer, network, accounts) {
  const tokenWallet = accounts[0];
  const fundWallet = new web3.BigNumber('0x966504CE67077C2a1b88a5C7d6CA4EdBc87caebC'); // Real fund address.
  const startTime = new web3.BigNumber(Math.floor(new Date().getTime() / 1000) + 300); // Now + 5 Min
  const presaleEnd = new web3.BigNumber(Math.floor(new Date(2018, 4, 22, 3, 8, 0, 0).getTime() / 1000));
  // Sale end at 22 May 2018 @10:08 (GMT +7)
  const endTime = new web3.BigNumber(Math.floor(new Date(2018, 5, 22, 3, 8, 0, 0).getTime() / 1000));
  const priceETHUSD = 800;
  const priceC8USD = 0.1;
  const rate = new web3.BigNumber(priceETHUSD / priceC8USD);
  const capUSD = 12000000; // Hard cap $12M
  const cap = ether(capUSD / priceETHUSD);
  const tokenAllowance = new web3.BigNumber('100e24'); // 100M token reserve 20M for THB and other sale.

  let token, crowdsale;
  if (network === 'mainnet') {
    return deployer.then(function () {
      return CarboneumToken.at('0xd42debe4edc92bd5a3fbb4243e1eccf6d63a4a5d');
    }).then(function (instance) {
      token = instance;
      return CarboneumCrowdsale.new(startTime, endTime, rate, tokenWallet, fundWallet, cap, token.address, presaleEnd);
    }).then(function (instance) {
      crowdsale = instance;
      token.approve(crowdsale.address, tokenAllowance, { from: tokenWallet });
      console.log('Token Address', token.address);
      console.log('Crowdsale Address', crowdsale.address);
      return true;
    });
  } else {
    // Deploy all new set of contract
    return deployer.then(function () {
      return CarboneumToken.new({ from: tokenWallet });
    }).then(function (instance) {
      token = instance;
      return CarboneumCrowdsale.new(startTime, endTime, rate, tokenWallet, fundWallet, cap, token.address, presaleEnd);
    }).then(function (instance) {
      crowdsale = instance;
      token.approve(crowdsale.address, tokenAllowance, { from: tokenWallet });
      console.log('Token Address', token.address);
      console.log('Crowdsale Address', crowdsale.address);
      return true;
    });
  }
};
