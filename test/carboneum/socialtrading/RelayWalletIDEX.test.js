import ether from '../../helpers/ether';
import EVMRevert from '../../helpers/EVMRevert';

const BigNumber = web3.BigNumber;
require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const Token = artifacts.require('CarboneumToken');
const Weth = artifacts.require('WETH9');
const RelayWalletIDEX = artifacts.require('RelayWalletIDEX');

contract('RelayWalletIDEX: Transfer Token (C8).', function ([_, user1, user2, user3]) {
  beforeEach(async function () {
    this.tokenA = await Token.new({ from: _ });
    this.tokenB = await Token.new({ from: _ });
    this.weth = await Weth.new({ from: _ });
    this.relayWalletIDEX = await RelayWalletIDEX.new('0x142a77e633d11d555e8e20c329ef5461494c0dc3', user3, { from: _ });
    await this.tokenA.transfer(user1, ether(1000), { from: _ });
    await this.tokenA.transfer(user2, ether(1000), { from: _ });
    await this.tokenB.transfer(user1, ether(1000), { from: _ });
    await this.tokenB.transfer(user2, ether(1000), { from: _ });
    await this.tokenA.approve(this.relayWalletIDEX.address, ether(1000), { from: user1 });
    await this.tokenA.approve(this.relayWalletIDEX.address, ether(1000), { from: user2 });
    await this.tokenB.approve(this.relayWalletIDEX.address, ether(1000), { from: user1 });
    await this.tokenB.approve(this.relayWalletIDEX.address, ether(1000), { from: user2 });
  });

  describe('deposit', function () {
    it('wallet should allow user to deposit token', async function () {
      await this.relayWalletIDEX.depositToken(this.tokenA.address, ether(2), { from: user1 });
      await this.relayWalletIDEX.depositToken(this.tokenA.address, ether(3), { from: user2 });
      await this.relayWalletIDEX.depositToken(this.tokenB.address, ether(5), { from: user1 });
      await this.relayWalletIDEX.depositToken(this.tokenB.address, ether(7), { from: user2 });
      let balanceTokenAUser1 = await this.relayWalletIDEX.balanceOf(this.tokenA.address, user1);
      balanceTokenAUser1.should.be.bignumber.equal(ether(2));
      let balanceTokenAUser2 = await this.relayWalletIDEX.balanceOf(this.tokenA.address, user2);
      balanceTokenAUser2.should.be.bignumber.equal(ether(3));
      let balanceTokenBUser1 = await this.relayWalletIDEX.balanceOf(this.tokenB.address, user1);
      balanceTokenBUser1.should.be.bignumber.equal(ether(5));
      let balanceTokenBUser2 = await this.relayWalletIDEX.balanceOf(this.tokenB.address, user2);
      balanceTokenBUser2.should.be.bignumber.equal(ether(7));

      let allTokenA = await this.tokenA.balanceOf(user3);
      allTokenA.should.be.bignumber.equal(ether(5));
      let allTokenB = await this.tokenB.balanceOf(user3);
      allTokenB.should.be.bignumber.equal(ether(12));
    });
  });

  describe('withdraw', function () {
    it('wallet should allow user to withdraw token', async function () {
      await this.relayWalletIDEX.depositToken(this.tokenA.address, ether(2), { from: user1 });
      let balanceTokenAUser1 = await this.tokenA.balanceOf(user1);
      balanceTokenAUser1.should.be.bignumber.equal(ether(998));
      let balanceTokenAUser2 = await this.tokenA.balanceOf(user2);
      balanceTokenAUser2.should.be.bignumber.equal(ether(1000));

      let balanceTokenAUser31 = await this.tokenA.balanceOf(user3);
      balanceTokenAUser31.should.be.bignumber.equal(ether(2));

      await this.tokenA.approve(this.relayWalletIDEX.address, ether(1000), { from: user3 });
      await this.relayWalletIDEX.withdrawToken(this.tokenA.address, ether(1), { from: user1 });

      let balanceTokenAUser32 = await this.tokenA.balanceOf(user3);
      balanceTokenAUser32.should.be.bignumber.equal(ether(1));

      let balanceTokenUser1 = await this.relayWalletIDEX.balanceOf(this.tokenA.address, user1);
      balanceTokenUser1.should.be.bignumber.equal(ether(1));

      let balanceTokenUser3 = await this.relayWalletIDEX.balanceOf(this.tokenA.address, user3);
      balanceTokenUser3.should.be.bignumber.equal(ether(0));
    });
  });
});

contract('RelayWalletIDEX: Transfer ETH.', function ([_, user1, user2, user3]) {
  beforeEach(async function () {
    this.tokenA = await Token.new({ from: _ });
    this.tokenB = await Token.new({ from: _ });
    this.weth = await Weth.new({ from: _ });
    this.relayWalletIDEX = await RelayWalletIDEX.new('0x142a77e633d11d555e8e20c329ef5461494c0dc3', user3, { from: _ });
  });

  describe('Deposit ETH', function () {
    it('wallet should allow user to deposit Ether', async function () {
      await this.relayWalletIDEX.deposit({ value: ether(3), from: user1 });
      await this.relayWalletIDEX.deposit({ value: ether(5), from: user2 });
      let balanceETHBUser1 = await this.relayWalletIDEX.balanceOf('0x0000000000000000000000000000000000000000', user1);
      let balanceETHBUser2 = await this.relayWalletIDEX.balanceOf('0x0000000000000000000000000000000000000000', user2);
      balanceETHBUser1.should.be.bignumber.equal(ether(3));
      balanceETHBUser2.should.be.bignumber.equal(ether(5));

      let actualBalance = await web3.eth.getBalance(user3);
      actualBalance.should.be.bignumber.equal(ether(1000008));
    });
  });

  describe('Withdraw ETH', function () {
    it('wallet should allow user to withdraw ETH when deposit with ETH', async function () {
      await this.relayWalletIDEX.deposit({ value: ether(3), from: user1 });

      let balanceETHBUser1 = await this.relayWalletIDEX.balanceOf('0x0000000000000000000000000000000000000000', user1);
      let balanceETHBUser2 = await this.relayWalletIDEX.balanceOf('0x0000000000000000000000000000000000000000', user2);
      balanceETHBUser1.should.be.bignumber.equal(ether(3));
      balanceETHBUser2.should.be.bignumber.equal(ether(0));

      let actualBalance = await web3.eth.getBalance(user3);
      actualBalance.should.be.bignumber.equal(ether(1000011));

      await this.relayWalletIDEX.withdraw({ value: ether(1), from: user1 });
      let balanceETHBUser11 = await this.relayWalletIDEX.balanceOf('0x0000000000000000000000000000000000000000', user1);
      balanceETHBUser11.should.be.bignumber.equal(ether(2));
    });

    it('wallet should not allow user to withdraw ETH if have not enough ETH', async function () {
      let actualBalance = await web3.eth.getBalance(user3);
      actualBalance.should.be.bignumber.equal(ether(1000011));
      await this.relayWalletIDEX.deposit({ value: ether(3), from: user1 });
      let balanceETHBUser1 = await this.relayWalletIDEX.balanceOf('0x0000000000000000000000000000000000000000', user1);
      balanceETHBUser1.should.be.bignumber.equal(ether(3));
      await this.relayWalletIDEX.withdraw({ value: ether(4), from: user1 }).should.be.rejectedWith(EVMRevert);
    });
  });
});
