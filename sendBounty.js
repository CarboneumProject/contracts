function ether (n) {
  return new web3.BigNumber(web3.toWei(n, 'ether'));
}

module.exports = function () {
  const TokenDistribution = artifacts.require('TokenDistribution');
  let distribution = TokenDistribution.at('0x35b76da03ae6cb0264a51e26177b1e2c92580067');
  let addresses = [
    '0x1C49749B0F260c255460Da714435a24b2bEa01f7',
  ];

  distribution.sendToken(addresses, ether('11.610019446782600000'));
};
