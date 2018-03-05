const CarboneumCrowdsale = artifacts.require("CarboneumCrowdsale");
const CarboneumToken = artifacts.require("CarboneumToken");

function ether(n) {
    return new web3.BigNumber(web3.toWei(n, 'ether'));
}

module.exports = function (deployer, network, accounts) {
    const startTime = new web3.BigNumber(Math.floor(new Date().getTime() / 1000)); // Now
    const privateSaleEnd = new web3.BigNumber(Math.floor(new Date(2018, 3, 22, 3, 8, 0, 0).getTime() / 1000));
    const presaleEnd = new web3.BigNumber(Math.floor(new Date(2018, 4, 22, 3, 8, 0, 0).getTime() / 1000));
    const endTime = new web3.BigNumber(Math.floor(new Date(2018, 5, 22, 3, 8, 0, 0).getTime() / 1000)); // Util Pre-Sale at 22 March 2018 @10:08 (GMT +7)
    const priceETH_USD = 850;
    const priceC8_USD = 0.1;
    const rate = new web3.BigNumber(priceETH_USD / priceC8_USD);
    const wallet = accounts[0];
    const cap = ether(14117.647058824); // Hard cap $12M
    const tokenAllowance = new web3.BigNumber('120e24'); // 120M token

    let token, crowdsale;
    deployer.then(function () {
        return CarboneumToken.new({from: wallet});
    }).then(function (instance) {
        token = instance;
        return CarboneumCrowdsale.new(startTime, endTime, rate, wallet, cap, token.address, privateSaleEnd, presaleEnd);
    }).then(function (instance) {
        crowdsale = instance;
        token.approve(crowdsale.address, tokenAllowance, {from: wallet});
        console.log('Token Address', token.address);
        console.log('Crowdsale Address', crowdsale.address);
        // TODO integration test.
        // crowdsale.setUserCap(new web3.BigNumber('0x93cdfd3cdc90e4303d0dffb143b147eb0d18db23'), ether(10)); // Set test cap.
        return true;
    });
};
