const CarboneumCrowdsale = artifacts.require("CarboneumCrowdsale");
const CarboneumToken = artifacts.require("CarboneumToken");

function ether(n) {
    return new web3.BigNumber(web3.toWei(n, 'ether'));
}

module.exports = function (deployer, network, accounts) {
    const token_wallet = accounts[0];
    const fund_wallet = new web3.BigNumber('0x966504CE67077C2a1b88a5C7d6CA4EdBc87caebC'); // Real fund address.
    const startTime = new web3.BigNumber(Math.floor(new Date().getTime() / 1000)); // Now
    const presaleEnd = new web3.BigNumber(Math.floor(new Date(2018, 4, 22, 3, 8, 0, 0).getTime() / 1000));
    // Sale end at 22 May 2018 @10:08 (GMT +7)
    const endTime = new web3.BigNumber(Math.floor(new Date(2018, 5, 22, 3, 8, 0, 0).getTime() / 1000));
    const priceETH_USD = 800;
    const priceC8_USD = 0.1;
    const rate = new web3.BigNumber(priceETH_USD / priceC8_USD);
    const cap_usd = 12000000; // Hard cap $12M
    const cap = ether(cap_usd / priceETH_USD);
    const tokenAllowance = new web3.BigNumber('120e24'); // 120M token

    let token, crowdsale;
    deployer.then(function () {
        return CarboneumToken.new({from: token_wallet});
    }).then(function (instance) {
        token = instance;
        return CarboneumCrowdsale.new(startTime, endTime, rate, token_wallet, fund_wallet, cap, token.address, presaleEnd);
    }).then(function (instance) {
        crowdsale = instance;
        token.approve(crowdsale.address, tokenAllowance, {from: token_wallet});
        console.log('Token Address', token.address);
        console.log('Crowdsale Address', crowdsale.address);
        return true;
    });
};
