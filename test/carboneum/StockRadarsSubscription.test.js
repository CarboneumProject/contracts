import ether from '../helpers/ether';

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
      let amountTwoDay = ether(6.4);
      await this.subscription.renewSubscription(new BigNumber(8088),
        amountTwoDay, { from: member }).should.be.fulfilled;
      let stockradarsBalance = await this.token.balanceOf(stockradars);
      stockradarsBalance.should.be.bignumber.equal(amountTwoDay);
      let expiration = await this.subscription.subscriptionExpiration(new BigNumber(8088));
      expiration.should.be.bignumber.above(new BigNumber(Date.now() / 1000));
    });
  });
});
