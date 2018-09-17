import ether from '../../helpers/ether';
const BigNumber = web3.BigNumber;
require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const Token = artifacts.require('CarboneumToken');

const Weth = artifacts.require('WETH9');
const RelayWallet = artifacts.require('RelayWallet');

contract('RelayWallet', function ([_, adminWallet, user1, user2]) {
  beforeEach(async function () {
    this.tokenA = await Token.new({ from: _ });
    this.tokenB = await Token.new({ from: _ });
    this.weth = await Weth.new({ from: _ });
    this.relayWallet = await RelayWallet.new(adminWallet, this.weth.address, { from: _ });
    await this.tokenA.transfer(user1, ether(1000), { from: _ });
    await this.tokenA.transfer(user2, ether(1000), { from: _ });
    await this.tokenB.transfer(user1, ether(1000), { from: _ });
    await this.tokenB.transfer(user2, ether(1000), { from: _ });
    await this.tokenA.approve(this.relayWallet.address, ether(1000), { from: user1 });
    await this.tokenA.approve(this.relayWallet.address, ether(1000), { from: user2 });
    await this.tokenB.approve(this.relayWallet.address, ether(1000), { from: user1 });
    await this.tokenB.approve(this.relayWallet.address, ether(1000), { from: user2 });

    await this.tokenA.approve(this.relayWallet.address, ether(10000000000), { from: adminWallet });
    await this.tokenB.approve(this.relayWallet.address, ether(10000000000), { from: adminWallet });
    await this.weth.approve(this.relayWallet.address, ether(10000000000), { from: adminWallet });
  });

  describe('deposit', function () {
    it('wallet should allow user to deposit token', async function () {
      await this.relayWallet.depositToken(this.tokenA.address, ether(2), { from: user1 });
      await this.relayWallet.depositToken(this.tokenA.address, ether(3), { from: user2 });
      await this.relayWallet.depositToken(this.tokenB.address, ether(5), { from: user1 });
      await this.relayWallet.depositToken(this.tokenB.address, ether(7), { from: user2 });
      let balanceTokenAUser1 = await this.relayWallet.balanceOf(this.tokenA.address, user1);
      balanceTokenAUser1.should.be.bignumber.equal(ether(2));
      let balanceTokenAUser2 = await this.relayWallet.balanceOf(this.tokenA.address, user2);
      balanceTokenAUser2.should.be.bignumber.equal(ether(3));
      let balanceTokenBUser1 = await this.relayWallet.balanceOf(this.tokenB.address, user1);
      balanceTokenBUser1.should.be.bignumber.equal(ether(5));
      let balanceTokenBUser2 = await this.relayWallet.balanceOf(this.tokenB.address, user2);
      balanceTokenBUser2.should.be.bignumber.equal(ether(7));

      let allTokenA = await this.tokenA.balanceOf(adminWallet);
      allTokenA.should.be.bignumber.equal(ether(5));
      let allTokenB = await this.tokenB.balanceOf(adminWallet);
      allTokenB.should.be.bignumber.equal(ether(12));
    });

    it('wallet should allow user to deposit Ether and convert to WETH', async function () {
      await this.relayWallet.deposit({ value: ether(3), from: user1 });
      await this.relayWallet.deposit({ value: ether(5), from: user2 });
      let balanceWethBUser1 = await this.relayWallet.balanceOf(this.weth.address, user1);
      balanceWethBUser1.should.be.bignumber.equal(ether(3));
      let balanceWethBUser2 = await this.relayWallet.balanceOf(this.weth.address, user2);
      balanceWethBUser2.should.be.bignumber.equal(ether(5));
      let allWeth = await this.weth.balanceOf(adminWallet);
      allWeth.should.be.bignumber.equal(ether(8));
    });
  });

  describe('withdraw', function () {
    it('wallet should allow user to withdraw token', async function () {
      await this.relayWallet.depositToken(this.tokenA.address, ether(2), { from: user1 });
      await this.relayWallet.withdrawToken(this.tokenA.address, ether(1), { from: user1 });
      await this.relayWallet.withdrawToken(this.tokenA.address, ether(1), { from: user1 });
      let balanceTokenA = await this.tokenA.balanceOf(user1);
      balanceTokenA.should.be.bignumber.equal(ether(1000));
    });

    it('wallet should allow user to withdraw WETH token when deposit with ETH', async function () {
      await this.relayWallet.deposit({ value: ether(3), from: user1 });
      await this.relayWallet.withdrawToken(this.weth.address, ether(1), { from: user1 });
      await this.relayWallet.withdrawToken(this.weth.address, ether(1), { from: user1 });
      let balanceWeth = await this.weth.balanceOf(user1);
      balanceWeth.should.be.bignumber.equal(ether(2));
    });
  });
});
