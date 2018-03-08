import ether from '../helpers/ether';
import {advanceBlock} from '../helpers/advanceToBlock';
import {increaseTimeTo, duration} from '../helpers/increaseTime';
import latestTime from '../helpers/latestTime';
import EVMRevert from '../helpers/EVMRevert';

const BigNumber = web3.BigNumber;

const should = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();

const CarboneumCrowdsale = artifacts.require('CarboneumCrowdsale');
const CarboneumToken = artifacts.require('CarboneumToken');

contract('CarboneumCrowdsale', function ([_, wallet, arty, max, printer]) {
    const rate = new BigNumber(8000);
    const presale_rate = new BigNumber(8640);
    const capAll = ether(14000);
    const capArty = ether(10);
    const capMax = ether(2);
    const lessThanCapArty = ether(6);
    const lessThanCapBoth = ether(1);
    const tokenAllowance = new BigNumber('120e24');


    beforeEach(async function () {
        this.openingTime = latestTime() + duration.seconds(100);
        this.closingPreSaleTime = this.openingTime + duration.hours(1);
        this.closingTime = this.openingTime + duration.weeks(1);
        this.afterClosingTime = this.closingTime + duration.seconds(1);
        this.token = await CarboneumToken.new({from: wallet});
        this.crowdsale = await CarboneumCrowdsale.new(this.openingTime, this.closingTime,
            rate, wallet, capAll, this.token.address, this.closingPreSaleTime);
        this.crowdsale.setUserCap(arty, capArty);
        this.crowdsale.setUserCap(max, capMax);
        await this.token.approve(this.crowdsale.address, tokenAllowance, {from: wallet});
    });

    describe('accepting payments', function () {
        it('should accept payments within cap', async function () {
            await increaseTimeTo(this.openingTime);
            await this.crowdsale.buyTokens(arty, {value: lessThanCapArty}).should.be.fulfilled;
            await this.crowdsale.buyTokens(max, {value: lessThanCapBoth}).should.be.fulfilled;
        });

        it('should reject payments outside cap', async function () {
            await increaseTimeTo(this.openingTime);
            await this.crowdsale.buyTokens(arty, {value: capArty});
            await this.crowdsale.buyTokens(arty, {value: 1}).should.be.rejectedWith(EVMRevert);
        });

        it('should reject payments that exceed cap', async function () {
            await increaseTimeTo(this.openingTime);
            await this.crowdsale.buyTokens(arty, {value: capArty.plus(1)}).should.be.rejectedWith(EVMRevert);
            await this.crowdsale.buyTokens(max, {value: capMax.plus(1)}).should.be.rejectedWith(EVMRevert);
        });

        it('should manage independent caps', async function () {
            await increaseTimeTo(this.openingTime);
            await this.crowdsale.buyTokens(arty, {value: lessThanCapArty}).should.be.fulfilled;
            await this.crowdsale.buyTokens(max, {value: lessThanCapArty}).should.be.rejectedWith(EVMRevert);
        });

        it('should default to a cap of zero', async function () {
            await increaseTimeTo(this.openingTime);
            await this.crowdsale.buyTokens(printer, {value: lessThanCapBoth}).should.be.rejectedWith(EVMRevert);
        });
    });
});
