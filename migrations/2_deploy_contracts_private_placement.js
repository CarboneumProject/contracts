const CarboneumCrowdsale = artifacts.require("./CarboneumCrowdsale.sol");
const CarboneumToken = artifacts.require("./CarboneumToken.sol");

module.exports = function (deployer, network, accounts) {
    const startTime = new web3.BigNumber(new Date().getTime() / 1000 + 1000); // Now
    const endTime = new web3.BigNumber(new Date(2018, 3, 22, 3, 8, 0, 0).getTime() / 1000); // Util Pre-Sale at 22 March 2018 @10:08 (GMT +7)
    const rate = new web3.BigNumber('9615'); // ETH Price at 800 USD,
    const wallet = accounts[0];
    const cap = web3.toWei(105600000, 'ether'); // Limit 88% of sale token in wei
    const goal = web3.toWei(0, 'ether'); // No goal


    deployer.deploy(CarboneumToken).then(function () {
        return deployer.deploy(CarboneumCrowdsale, startTime, endTime, rate, wallet, cap, CarboneumToken.address, goal);
    });
};