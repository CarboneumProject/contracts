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
  const iconRate = new BigNumber(200);
  const capAll = ether(14);
  const capArty = ether(13);
  const capMax = ether(2);
  const moreThanCapIcon = ether(561);
  const lessThanCapArty = ether(4);
  const lessThanCapBoth = ether(1);
  const tokenAllowance = new BigNumber('120e24');
  const expectedTokenAmount = rate.mul(lessThanCapBoth);

  beforeEach(async function () {
    await advanceBlock();
    this.openingTime = latestTime() + duration.seconds(100);
    this.closingTime = this.openingTime + duration.weeks(1);
    this.afterClosingTime = this.closingTime + duration.seconds(1);
    this.token = await CarboneumToken.new({ from: tokenWallet });
    this.iconToken = await CarboneumToken.new({ from: arty });
    this.crowdsale = await CarboneumCrowdsale.new(this.openingTime, this.closingTime,
      rate, iconRate, tokenWallet, fundWallet, capAll, this.token.address, this.iconToken.address);
    await this.crowdsale.setUserCap(arty, capArty);
    await this.crowdsale.setUserCap(max, capMax);
    await this.token.approve(this.crowdsale.address, tokenAllowance, { from: tokenWallet });
    await this.iconToken.approve(this.crowdsale.address, tokenAllowance, { from: arty });
  });

  describe('accepting payments', function () {
    it('should accept payments within cap', async function () {
      await increaseTimeTo(this.openingTime);
      await this.crowdsale.buyTokens(arty, { value: lessThanCapArty }).should.be.fulfilled;
      await this.crowdsale.buyTokens(max, { value: lessThanCapBoth }).should.be.fulfilled;
    });

    it('should accept payments with ICON', async function () {
      await increaseTimeTo(this.openingTime);
      await this.crowdsale.buyTokensWithIcon(arty, lessThanCapArty, { from: arty }).should.be.fulfilled;
      let artyBalance = await this.token.balanceOf(arty);
      artyBalance.should.be.bignumber.equal(lessThanCapArty.mul(iconRate));
    });

    it('should accept payments with ICON more than one buyer within cap', async function () {
      await increaseTimeTo(this.openingTime);
      await this.crowdsale.buyTokens(max, { value: capMax }).should.be.fulfilled;
      await this.crowdsale.buyTokensWithIcon(arty, ether(480), { from: arty }).should.be.fulfilled;
    });

    it('should reject payments outside cap with ICON', async function () {
      await increaseTimeTo(this.openingTime);
      await this.crowdsale.buyTokensWithIcon(arty, moreThanCapIcon,
        { from: arty }).should.be.rejectedWith(EVMRevert);
    });

    it('should reject payments outside cap with ICON more than one buyer', async function () {
      await increaseTimeTo(this.openingTime);
      await this.crowdsale.buyTokens(max, { value: capMax }).should.be.fulfilled;
      await this.crowdsale.buyTokensWithIcon(arty, ether(480.1),
        { from: arty }).should.be.rejectedWith(EVMRevert);
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

    it('should reject payments that exceed cap', async function () {
      await increaseTimeTo(this.openingTime);
      await this.crowdsale.buyTokens(arty, { value: capAll.plus(1) }).should.be.rejectedWith(EVMRevert);
    });

    it('should reject payments after sale end', async function () {
      await increaseTimeTo(this.afterClosingTime);
      await this.crowdsale.send(lessThanCapBoth).should.be.rejectedWith(EVMRevert);
      await this.crowdsale.buyTokens(arty, { value: lessThanCapBoth }).should.be.rejectedWith(EVMRevert);
    });

    it('should return the amount of tokens bought', async function () {
      await increaseTimeTo(this.openingTime);
      await this.crowdsale.buyTokens(arty, { value: lessThanCapBoth, from: max });
      await increaseTimeTo(this.afterClosingTime);
      const balance = await this.token.balanceOf(arty);
      balance.should.be.bignumber.equal(expectedTokenAmount);
    });
  });

  describe('set rate', function () {
    it('should apply new rate when owner set them', async function () {
      await increaseTimeTo(this.openingTime);
      await this.crowdsale.setRate(new web3.BigNumber(100));
      await this.crowdsale.buyTokens(arty, { value: lessThanCapBoth });
      let artyBalance = await this.token.balanceOf(arty);
      artyBalance.should.be.bignumber.equal(lessThanCapBoth.mul(100));
      await this.crowdsale.buyTokens(max, { value: lessThanCapBoth });
      let maxBalance = await this.token.balanceOf(max);
      maxBalance.should.be.bignumber.equal(lessThanCapBoth.mul(100));
    });
  });

  describe('set ICON rate', function () {
    it('should apply new ICON rate when owner set it', async function () {
      await increaseTimeTo(this.openingTime);
      let expectRate = new web3.BigNumber(100);
      await this.crowdsale.setIconRate(expectRate);
      await this.crowdsale.buyTokensWithIcon(arty, lessThanCapBoth, { from: arty });
      await increaseTimeTo(this.afterClosingTime);
      let artyBalance = await this.token.balanceOf(arty);
      artyBalance.should.be.bignumber.equal(lessThanCapBoth.mul(100));
    });
  });
});
