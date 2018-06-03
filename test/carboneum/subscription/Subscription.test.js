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
    await this.token.approve(this.subscription.address, ether(100), { from: member });
    this.subscription.registration(appA, 'appA', rateA, appOwnerA, { from: appOwnerA });
    this.subscription.registration(appB, 'appB', rateB, appOwnerB, { from: appOwnerB });
  });

  describe('subscription', function () {
    it('should accept C8 token for purchasing appA subscription', async function () {
      let amountTwentyDay = ether(64);
      let memberId = new BigNumber(8088);
      await this.subscription.renewSubscription(appA, memberId,
        amountTwentyDay, { from: member }).should.be.fulfilled;
      let expectedFee = ether(0.64 * fee);
      let stockradarsBalance = await this.token.balanceOf(stockradars);
      stockradarsBalance.should.be.bignumber.equal(expectedFee);
      let appOwnerBalance = await this.token.balanceOf(appOwnerA);
      appOwnerBalance.should.be.bignumber.equal(amountTwentyDay - expectedFee);
      let expiration = await this.subscription.getExpiration(appA, memberId);
      expiration.should.be.bignumber.above(new BigNumber(Date.now() / 1000 + ((20 * 24 * 3600) - 60)));
      expiration.should.be.bignumber.below(new BigNumber(Date.now() / 1000 + ((20 * 24 * 3600) + 60)));
    });

    it('should accept C8 token for purchasing appB subscription', async function () {
      let amountTwoDay = ether(64);
      let memberId = new BigNumber(8888);
      await this.subscription.renewSubscription(appB, memberId,
        amountTwoDay, { from: member }).should.be.fulfilled;
      let expectedFee = ether(0.64 * fee);
      let stockradarsBalance = await this.token.balanceOf(stockradars);
      stockradarsBalance.should.be.bignumber.equal(expectedFee);
      let appOwnerBalance = await this.token.balanceOf(appOwnerB);
      appOwnerBalance.should.be.bignumber.equal(amountTwoDay - expectedFee);
      let expiration = await this.subscription.getExpiration(appB, memberId);
      expiration.should.be.bignumber.above(new BigNumber(Date.now() / 1000 + ((2 * 24 * 3600) - 60)));
      expiration.should.be.bignumber.below(new BigNumber(Date.now() / 1000 + ((2 * 24 * 3600) + 60)));
    });

    it('should not accept C8 token for purchasing appA subscription less than 1 day', async function () {
      let amountLessThan1Day = ether(3.1);
      await this.subscription.renewSubscription(new BigNumber(1), new BigNumber(8088),
        amountLessThan1Day, { from: member }).should.be.rejectedWith(EVMRevert);
    });

    it('should not accept C8 token for purchasing unknown app subscription', async function () {
      let amountLessThan1Day = ether(3.1);
      await this.subscription.renewSubscription(new BigNumber(999), new BigNumber(8088),
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
