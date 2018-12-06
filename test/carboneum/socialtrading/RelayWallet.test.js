import ether from '../../helpers/ether';

const BigNumber = web3.BigNumber;
require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const Token = artifacts.require('CarboneumToken');

const Weth = artifacts.require('WETH9');
const RelayWallet = artifacts.require('RelayWallet');
const ZeroExchageAddress = '0x4f833a24e1f95d70f028921e27040ca56e09ab0b';
const ERC20Proxy = '0x2240dab907db71e64d3e0dba4800c83b5c502d4e';
const MAX_ALLOWANCE = new BigNumber(1e50);

contract('RelayWallet', function ([_, user1, user2]) {
  beforeEach(async function () {
    this.tokenA = await Token.new({ from: _ });
    this.tokenB = await Token.new({ from: _ });
    this.weth = await Weth.new({ from: _ });
    this.relayWallet = await RelayWallet.new(this.weth.address, ZeroExchageAddress, ERC20Proxy, { from: _ });
    await this.tokenA.transfer(user1, ether(1000), { from: _ });
    await this.tokenA.transfer(user2, ether(1000), { from: _ });
    await this.tokenB.transfer(user1, ether(1000), { from: _ });
    await this.tokenB.transfer(user2, ether(1000), { from: _ });
    await this.tokenA.approve(this.relayWallet.address, ether(1000), { from: user1 });
    await this.tokenA.approve(this.relayWallet.address, ether(1000), { from: user2 });
    await this.tokenB.approve(this.relayWallet.address, ether(1000), { from: user1 });
    await this.tokenB.approve(this.relayWallet.address, ether(1000), { from: user2 });
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

      let allTokenA = await this.tokenA.balanceOf(this.relayWallet.address);
      allTokenA.should.be.bignumber.equal(ether(5));
      let allTokenB = await this.tokenB.balanceOf(this.relayWallet.address);
      allTokenB.should.be.bignumber.equal(ether(12));
    });

    it('wallet should allow user to deposit Ether and convert to WETH', async function () {
      await this.relayWallet.deposit({ value: ether(3), from: user1 });
      await this.relayWallet.deposit({ value: ether(5), from: user2 });
      let balanceWethBUser1 = await this.relayWallet.balanceOf(this.weth.address, user1);
      balanceWethBUser1.should.be.bignumber.equal(ether(3));
      let balanceWethBUser2 = await this.relayWallet.balanceOf(this.weth.address, user2);
      balanceWethBUser2.should.be.bignumber.equal(ether(5));
      let allWeth = await this.weth.balanceOf(this.relayWallet.address);
      allWeth.should.be.bignumber.equal(ether(8));
    });
  });

  describe('Check Allowance', function () {
    it('WETH Allowance should increased if some user deposit ETH to smart contract.', async function () {
      let allowance1 = await this.weth.allowance(this.relayWallet.address, ERC20Proxy);
      allowance1.should.be.bignumber.equal(0);
      await this.relayWallet.deposit({ value: ether(3), from: user1 });
      let allowance2 = await this.weth.allowance(this.relayWallet.address, ERC20Proxy);
      allowance2.should.be.bignumber.equal(MAX_ALLOWANCE);
    });

    it('Token A Allowance should increased if some user deposit Token A to smart contract.', async function () {
      let allowanceA1 = await this.tokenA.allowance(this.relayWallet.address, ERC20Proxy);
      allowanceA1.should.be.bignumber.equal(0);
      let allowanceWETH = await this.weth.allowance(this.relayWallet.address, ERC20Proxy);
      allowanceWETH.should.be.bignumber.equal(0);
      await this.relayWallet.depositToken(this.tokenA.address, ether(7), { from: user2 });
      let allowanceA2 = await this.tokenA.allowance(this.relayWallet.address, ERC20Proxy);
      allowanceA2.should.be.bignumber.equal(MAX_ALLOWANCE);
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
