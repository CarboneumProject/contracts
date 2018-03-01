const CarboneumCrowdsale = artifacts.require("CarboneumCrowdsale");
const CarboneumToken = artifacts.require("CarboneumToken");
const RefundVault = artifacts.require("RefundVault");

function ether(n) {
    return new web3.BigNumber(web3.toWei(n, 'ether'));
}

module.exports = function (deployer, network, accounts) {
    const startTime = new web3.BigNumber(Math.floor(new Date().getTime() / 1000)); // Now
    const endTime = new web3.BigNumber(Math.floor(new Date(2018, 3, 22, 3, 8, 0, 0).getTime() / 1000)); // Util Pre-Sale at 22 March 2018 @10:08 (GMT +7)
    const rate = new web3.BigNumber(9344); // ETH Price at 800 USD,
    const wallet = accounts[0];
    const goal = ether(1);
    const cap = ether(60000000);

    let token, vault, crowdsale;
    deployer.then(function () {
        return CarboneumToken.new({from: wallet});
    }).then(function (instance) {
        token = instance;
        return RefundVault.new(wallet, {from: wallet});
    }).then(function (instance) {
        vault = instance;
        return CarboneumCrowdsale.new(startTime, endTime, rate, wallet, cap, token.address, goal);
    }).then(function (instance) {
        crowdsale = instance;
        token.transferOwnership(crowdsale.address);
        vault.transferOwnership(crowdsale.address);
        console.log(crowdsale.address);
        return true;
    });
};
