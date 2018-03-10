import ether from '../helpers/ether';
import { advanceBlock } from '../helpers/advanceToBlock';
import { increaseTimeTo, duration } from '../helpers/increaseTime';
import latestTime from '../helpers/latestTime';
import EVMRevert from '../helpers/EVMRevert';

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const CarboneumCrowdsale = artifacts.require('CarboneumCrowdsale');
const CarboneumToken = artifacts.require('CarboneumToken');

contract('CarboneumCrowdsale', function ([_, tokenWallet, fundWallet, arty, max, printer]) {
  const rate = new BigNumber(8000);
  const presaleRate = new BigNumber(8640);
  const capAll = ether(14);
  const capArty = ether(10);
  const capMax = ether(2);
  const lessThanCapArty = ether(4);
  const lessThanCapBoth = ether(1);
  const tokenAllowance = new BigNumber('120e24');
  const expectedPresaleTokenAmount = presaleRate.mul(lessThanCapBoth);
  const expectedTokenAmount = rate.mul(lessThanCapBoth);

  beforeEach(async function () {
    await advanceBlock();
    this.openingTime = latestTime() + duration.seconds(100);
    this.closingPreSaleTime = this.openingTime + duration.hours(1);
    this.afterclosingPreSaleTime = this.closingPreSaleTime + duration.seconds(1);
    this.closingTime = this.openingTime + duration.weeks(1);
    this.afterClosingTime = this.closingTime + duration.seconds(1);
    this.token = await CarboneumToken.new({ from: tokenWallet });
    this.crowdsale = await CarboneumCrowdsale.new(this.openingTime, this.closingTime,
      rate, tokenWallet, fundWallet, capAll, this.token.address, this.closingPreSaleTime);
    this.crowdsale.setUserCap(arty, capArty);
    this.crowdsale.setUserCap(max, capMax);
    await this.token.approve(this.crowdsale.address, tokenAllowance, { from: tokenWallet });
  });

  describe('accepting payments', function () {
    it('should accept payments within cap', async function () {
      await increaseTimeTo(this.openingTime);
      await this.crowdsale.buyTokens(arty, { value: lessThanCapArty }).should.be.fulfilled;
      await this.crowdsale.buyTokens(max, { value: lessThanCapBoth }).should.be.fulfilled;
    });

    it('should reject payments outside cap', async function () {
      await increaseTimeTo(this.openingTime);
      await this.crowdsale.buyTokens(arty, { value: capArty });
      await this.crowdsale.buyTokens(arty, { value: 1 }).should.be.rejectedWith(EVMRevert);
    });

    it('should reject payments that exceed cap', async function () {
      await increaseTimeTo(this.openingTime);
      await this.crowdsale.buyTokens(arty, { value: capArty.plus(1) }).should.be.rejectedWith(EVMRevert);
      await this.crowdsale.buyTokens(max, { value: capMax.plus(1) }).should.be.rejectedWith(EVMRevert);
    });

    it('should manage independent caps', async function () {
      await increaseTimeTo(this.openingTime);
      await this.crowdsale.buyTokens(arty, { value: lessThanCapArty }).should.be.fulfilled;
      await this.crowdsale.buyTokens(max, { value: lessThanCapArty }).should.be.rejectedWith(EVMRevert);
    });

    it('should default to a cap of zero', async function () {
      await increaseTimeTo(this.openingTime);
      await this.crowdsale.buyTokens(printer, { value: lessThanCapBoth }).should.be.rejectedWith(EVMRevert);
    });

    it('should add bonus to pre-sale', async function () {
      await increaseTimeTo(this.openingTime);
      await this.crowdsale.buyTokens(arty, { value: lessThanCapBoth });
      let artyBalance = await this.token.balanceOf(arty);
      artyBalance.should.be.bignumber.equal(expectedPresaleTokenAmount);

      await this.crowdsale.buyTokens(max, { value: lessThanCapBoth });
      let maxBalance = await this.token.balanceOf(max);
      maxBalance.should.be.bignumber.equal(expectedPresaleTokenAmount);
    });

    it('should be no bonus after pre-sale end', async function () {
      await increaseTimeTo(this.afterclosingPreSaleTime);
      await this.crowdsale.buyTokens(arty, { value: lessThanCapBoth });
      let artyBalance = await this.token.balanceOf(arty);
      artyBalance.should.be.bignumber.equal(expectedTokenAmount);

      await this.crowdsale.buyTokens(max, { value: lessThanCapBoth });
      let maxBalance = await this.token.balanceOf(max);
      maxBalance.should.be.bignumber.equal(expectedTokenAmount);
    });

    it('should reject payments that exceed cap', async function () {
      await increaseTimeTo(this.openingTime);
      await this.crowdsale.buyTokens(arty, { value: capAll.plus(1) }).should.be.rejectedWith(EVMRevert);
    });

    it('should reject payments after sale end', async function () {
      await increaseTimeTo(this.afterClosingTime);
      await this.crowdsale.send(lessThanCapBoth).should.be.rejectedWith(EVMRevert);
      await this.crowdsale.buyTokens(arty, { value: lessThanCapBoth }).should.be.rejectedWith(EVMRevert);
    });
  });
});