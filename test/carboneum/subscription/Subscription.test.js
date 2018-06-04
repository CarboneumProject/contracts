import ether from '../../helpers/ether';
import EVMRevert from '../../helpers/EVMRevert';

const BigNumber = web3.BigNumber;

const Subscription = artifacts.require('Subscription');
const CarboneumToken = artifacts.require('CarboneumToken');

contract('Subscription', accounts => {
  const member = accounts[0];
  const stockradars = accounts[1];
  const appOwnerA = accounts[2];
  const appOwnerB = accounts[3];
  const fee = 3; // 3%
  const rateA = ether(3.2);
  const rateB = ether(32);
  const appA = new BigNumber(1);
  const appB = new BigNumber(2);

  beforeEach(async function () {
    this.token = await CarboneumToken.new({ from: member });
    this.subscription = await Subscription.new(fee, stockradars,
      this.token.address, { from: stockradars });
    await this.token.approve(this.subscription.address, ether(1000), { from: member });
    this.subscription.registration(appA, 'appA', rateA, appOwnerA, { from: appOwnerA });
    this.subscription.registration(appB, 'appB', rateB, appOwnerB, { from: appOwnerB });
  });

  describe('subscription', function () {
    it('should accept C8 token for purchasing appA subscription by amount', async function () {
      let amountTwentyDay = ether(64);
      let memberId = new BigNumber(8088);
      await this.subscription.renewSubscriptionByAmount(appA, memberId,
        amountTwentyDay, { from: member }).should.be.fulfilled;
      let expectedFee = ether(0.64 * fee);
      let stockradarsBalance = await this.token.balanceOf(stockradars);
      stockradarsBalance.should.be.bignumber.equal(expectedFee);
      let appOwnerBalance = await this.token.balanceOf(appOwnerA);
      appOwnerBalance.should.be.bignumber.equal(amountTwentyDay - expectedFee);
      let expiration = await this.subscription.getExpiration(appA, memberId);
      let timestamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
      expiration.should.be.bignumber.equal(timestamp + (20 * 24 * 3600));
    });

    it('should accept C8 token for purchasing appB subscription by amount', async function () {
      let amountTwoDay = ether(64);
      let memberId = new BigNumber(8888);
      await this.subscription.renewSubscriptionByAmount(appB, memberId,
        amountTwoDay, { from: member }).should.be.fulfilled;
      let expectedFee = ether(0.64 * fee);
      let stockradarsBalance = await this.token.balanceOf(stockradars);
      stockradarsBalance.should.be.bignumber.equal(expectedFee);
      let appOwnerBalance = await this.token.balanceOf(appOwnerB);
      appOwnerBalance.should.be.bignumber.equal(amountTwoDay - expectedFee);
      let expiration = await this.subscription.getExpiration(appB, memberId);
      let timestamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
      expiration.should.be.bignumber.equal(timestamp + (2 * 24 * 3600));
    });

    it('should accept C8 token for purchasing appA subscription by 20 days', async function () {
      let amountTwentyDay = ether(64);
      let memberId = new BigNumber(8088);
      await this.subscription.renewSubscriptionByDays(appA, memberId, 20, { from: member }).should.be.fulfilled;
      let expectedFee = ether(0.64 * fee);
      let stockradarsBalance = await this.token.balanceOf(stockradars);
      stockradarsBalance.should.be.bignumber.equal(expectedFee);
      let appOwnerBalance = await this.token.balanceOf(appOwnerA);
      appOwnerBalance.should.be.bignumber.equal(amountTwentyDay - expectedFee);
      let expiration = await this.subscription.getExpiration(appA, memberId);
      let timestamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
      expiration.should.be.bignumber.equal(timestamp + (20 * 24 * 3600));
    });

    it('should accept C8 token for purchasing appB subscription by 2 days', async function () {
      let amountTwoDay = ether(64);
      let memberId = new BigNumber(8888);
      await this.subscription.renewSubscriptionByDays(appB, memberId, 2, { from: member }).should.be.fulfilled;
      let expectedFee = ether(0.64 * fee);
      let stockradarsBalance = await this.token.balanceOf(stockradars);
      stockradarsBalance.should.be.bignumber.equal(expectedFee);
      let appOwnerBalance = await this.token.balanceOf(appOwnerB);
      appOwnerBalance.should.be.bignumber.equal(amountTwoDay - expectedFee);
      let expiration = await this.subscription.getExpiration(appB, memberId);
      let timestamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
      expiration.should.be.bignumber.equal(timestamp + (2 * 24 * 3600));
    });

    it('should accept C8 token for purchasing appB subscription by 2 days 2 times', async function () {
      let amountFourDay = ether(128);
      let memberId = new BigNumber(8888);
      await this.subscription.renewSubscriptionByDays(appB, memberId, 2, { from: member }).should.be.fulfilled;
      await this.subscription.renewSubscriptionByDays(appB, memberId, 2, { from: member }).should.be.fulfilled;
      let expectedFee = ether(0.64 * fee * 2);
      let stockradarsBalance = await this.token.balanceOf(stockradars);
      stockradarsBalance.should.be.bignumber.equal(expectedFee);
      let appOwnerBalance = await this.token.balanceOf(appOwnerB);
      appOwnerBalance.should.be.bignumber.equal(amountFourDay - expectedFee);
      let expiration = await this.subscription.getExpiration(appB, memberId);
      let timestamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
      expiration.should.be.bignumber.equal(timestamp + (4 * 24 * 3600));
    });

    it('should not accept C8 token for purchasing appA subscription less than 1 day', async function () {
      let amountLessThan1Day = ether(3.1);
      await this.subscription.renewSubscriptionByAmount(appA, new BigNumber(8088),
        amountLessThan1Day, { from: member }).should.be.rejectedWith(EVMRevert);
    });

    it('should not accept C8 token for purchasing appA subscription by day less than 1 day', async function () {
      await this.subscription.renewSubscriptionByDays(appA, new BigNumber(8088),
        0, { from: member }).should.be.rejectedWith(EVMRevert);
    });

    it('should not accept C8 token for purchasing unknown app subscription', async function () {
      let amountLessThan1Day = ether(3.1);
      await this.subscription.renewSubscriptionByAmount(appA, new BigNumber(8088),
        amountLessThan1Day, { from: member }).should.be.rejectedWith(EVMRevert);
    });
  });

  describe('fee', function () {
    it('should change fee from owner', async function () {
      let fee = new BigNumber(1);
      await this.subscription.setFee(fee, { from: stockradars }).should.be.fulfilled;
    });

    it('should not change fee from other', async function () {
      let rate = new BigNumber(1);
      await this.subscription.setFee(rate, { from: member }).should.be.rejectedWith(EVMRevert);
    });
  });
});
