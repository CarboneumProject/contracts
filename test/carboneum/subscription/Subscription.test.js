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
  const priceA = ether(3.2);
  const priceB = ether(32);
  const appA = new BigNumber(1);
  const appB = new BigNumber(2);

  beforeEach(async function () {
    this.token = await CarboneumToken.new({ from: member });
    this.subscription = await Subscription.new(fee, stockradars,
      this.token.address, { from: stockradars });
    await this.token.approve(this.subscription.address, ether(1000), { from: member });
    this.subscription.registration('appA', priceA, appOwnerA, { from: appOwnerA });
    this.subscription.registration('appB', priceB, appOwnerB, { from: appOwnerB });
  });

  describe('subscription', function () {
    it('should accept C8 token for purchasing appA subscription by 20 days', async function () {
      this.subscription.setPrice(appA, [1, 365], [priceA, ether(365)], { from: appOwnerA });
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

    it('should accept C8 token for purchasing appA subscription by 20 days and use best price.', async function () {
      this.subscription.setPrice(appA, [1, 20, 365], [ether(3.2), ether(40), ether(365)], { from: appOwnerA });
      let amountTwentyDay = ether(40);
      let memberId = new BigNumber(8088);
      await this.subscription.renewSubscriptionByDays(appA, memberId, 20, { from: member }).should.be.fulfilled;
      let expectedFee = ether(0.40).mul(fee);
      let stockradarsBalance = await this.token.balanceOf(stockradars);
      stockradarsBalance.should.be.bignumber.equal(expectedFee);
      let appOwnerBalance = await this.token.balanceOf(appOwnerA);
      appOwnerBalance.should.be.bignumber.equal(amountTwentyDay - expectedFee);
      let expiration = await this.subscription.getExpiration(appA, memberId);
      let timestamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
      expiration.should.be.bignumber.equal(timestamp + (20 * 24 * 3600));
    });

    it('should accept C8 token for purchasing appA subscription by 19 days and use best price.', async function () {
      this.subscription.setPrice(appA, [1, 20, 365], [ether(3.2), ether(40), ether(365)], { from: appOwnerA });
      let amount = ether(60.8);
      let memberId = new BigNumber(8088);
      await this.subscription.renewSubscriptionByDays(appA, memberId, 19, { from: member }).should.be.fulfilled;
      let expectedFee = ether(0.608).mul(fee);
      let stockradarsBalance = await this.token.balanceOf(stockradars);
      stockradarsBalance.should.be.bignumber.equal(expectedFee);
      let appOwnerBalance = await this.token.balanceOf(appOwnerA);
      appOwnerBalance.should.be.bignumber.equal(amount - expectedFee);
      let expiration = await this.subscription.getExpiration(appA, memberId);
      let timestamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
      expiration.should.be.bignumber.equal(timestamp + (19 * 24 * 3600));
    });

    it('should not accept C8 token for purchasing appA subscription by day less than 1 day', async function () {
      await this.subscription.renewSubscriptionByDays(appA, new BigNumber(8088),
        0, { from: member }).should.be.rejectedWith(EVMRevert);
    });

    it('should not accept C8 token for purchasing unknown app subscription', async function () {
      await this.subscription.renewSubscriptionByDays(999, new BigNumber(8088),
        1, { from: member }).should.be.rejectedWith(EVMRevert);
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

  describe('price', function () {
    it('should change price from app owner', async function () {
      let price = new BigNumber(1);
      await this.subscription.setPrice(appA, [1], [price], { from: appOwnerA }).should.be.fulfilled;
    });

    it('should change price with completely new set of price', async function () {
      await this.subscription.setPrice(appA, [1, 2], [new BigNumber(1), new BigNumber(2)],
        { from: appOwnerA }).should.be.fulfilled;
      let price1 = await this.subscription.getPrice(appA, 1);
      let price2 = await this.subscription.getPrice(appA, 2);
      price1.should.be.bignumber.equal(new BigNumber(1));
      price2.should.be.bignumber.equal(new BigNumber(2));
      await this.subscription.setPrice(appA, [3, 4], [new BigNumber(3.5), new BigNumber(4)],
        { from: appOwnerA }).should.be.fulfilled;

      let priceA = await this.subscription.getPrice(appA, 1);
      let priceB = await this.subscription.getPrice(appA, 2);
      let priceC = await this.subscription.getPrice(appA, 3);
      let priceD = await this.subscription.getPrice(appA, 4);
      let priceE = await this.subscription.getPrice(appA, 5);
      let priceF = await this.subscription.getPrice(appA, 6);

      // No price
      priceA.should.be.bignumber.equal(new BigNumber(0));
      priceB.should.be.bignumber.equal(new BigNumber(0));

      // Starting price
      priceC.should.be.bignumber.equal(new BigNumber(3));

      // Best value price
      priceD.should.be.bignumber.equal(new BigNumber(4));
      priceE.should.be.bignumber.equal(new BigNumber(5));
      priceF.should.be.bignumber.equal(new BigNumber(6));
    });

    it('should not change price from other', async function () {
      let price = new BigNumber(1);
      await this.subscription.setPrice(appA, [1], [price], { from: appOwnerB }).should.be.rejectedWith(EVMRevert);
    });

    it('should not change price to zero', async function () {
      let price = new BigNumber(0);
      await this.subscription.setPrice(appA, [1], [price], { from: appOwnerB }).should.be.rejectedWith(EVMRevert);
    });
  });
});
