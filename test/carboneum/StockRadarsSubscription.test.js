import ether from '../helpers/ether';
import EVMRevert from '../helpers/EVMRevert';

const BigNumber = web3.BigNumber;

const StockRadarsSubscription = artifacts.require('StockRadarsSubscription');
const CarboneumToken = artifacts.require('CarboneumToken');

contract('StockRadarsSubscription', accounts => {
  const member = accounts[0];
  const stockradars = accounts[1];
  const rate = ether(3.2);

  beforeEach(async function () {
    this.token = await CarboneumToken.new({ from: member });
    this.subscription = await StockRadarsSubscription.new(rate, stockradars,
      this.token.address, { from: stockradars });
    await this.token.approve(this.subscription.address, ether(100), { from: member });
  });

  describe('subscription', function () {
    it('should accept C8 token for purchasing subscription', async function () {
      let amountTwoDay = ether(64);
      await this.subscription.renewSubscription(new BigNumber(8088),
        amountTwoDay, { from: member }).should.be.fulfilled;
      let stockradarsBalance = await this.token.balanceOf(stockradars);
      stockradarsBalance.should.be.bignumber.equal(amountTwoDay);
      let expiration = await this.subscription.subscriptionExpiration(new BigNumber(8088));
      expiration.should.be.bignumber.above(new BigNumber(Date.now() / 1000 + (20 * 24 * 3600 - 60)));
    });

    it('should not accept C8 token for purchasing subscription less than 1 day', async function () {
      let amountLessThan1Day = ether(3.1);
      await this.subscription.renewSubscription(new BigNumber(8088),
        amountLessThan1Day, { from: member }).should.be.rejectedWith(EVMRevert);
    });

  });

  describe('rate', function () {
    it('should change rate from owner', async function () {
      let rate = ether(6.4);
      await this.subscription.setRate(rate, { from: stockradars }).should.be.fulfilled;
    });

    it('should not change rate from other', async function () {
      let rate = ether(6.4);
      await this.subscription.setRate(rate, { from: member }).should.be.rejectedWith(EVMRevert);
    });
  });
});
