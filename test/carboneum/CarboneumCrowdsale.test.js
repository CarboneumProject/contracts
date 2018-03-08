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

contract('CarboneumCrowdsale', function ([_, token_wallet, fund_wallet, arty, max, printer]) {
    const rate = new BigNumber(8000);
    const presale_rate = new BigNumber(8640);
    const capAll = ether(14);
    const capArty = ether(10);
    const capMax = ether(2);
    const lessThanCapArty = ether(6);
    const lessThanCapBoth = ether(1);
    const tokenAllowance = new BigNumber('120e24');
    const expectedPresaleTokenAmount = presale_rate.mul(lessThanCapBoth);
    const expectedTokenAmount = rate.mul(lessThanCapBoth);

    before(async function () {
        // Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
        await advanceBlock();
    });

    beforeEach(async function () {
        this.openingTime = latestTime() + duration.seconds(100);
        this.closingPreSaleTime = this.openingTime + duration.hours(1);
        this.afterclosingPreSaleTime = this.closingPreSaleTime + duration.seconds(1);
        this.closingTime = this.openingTime + duration.weeks(1);
        this.afterClosingTime = this.closingTime + duration.seconds(1);
        this.token = await CarboneumToken.new({from: token_wallet});
        this.crowdsale = await CarboneumCrowdsale.new(this.openingTime, this.closingTime,
            rate, token_wallet, fund_wallet, capAll, this.token.address, this.closingPreSaleTime);
        this.crowdsale.setUserCap(arty, capArty);
        this.crowdsale.setUserCap(max, capMax);
        await this.token.transfer(this.crowdsale.address, tokenAllowance, {from: token_wallet});
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

        it('should reject payments that exceed cap', async function () {
            await increaseTimeTo(this.openingTime);
            await this.crowdsale.buyTokens(arty, {value: capAll.plus(1)}).should.be.rejectedWith(EVMRevert);
        });

        it('should not immediately assign tokens to beneficiary', async function () {
            await increaseTimeTo(this.openingTime);
            await this.crowdsale.buyTokens(arty, {value: lessThanCapBoth, from: max});
            const balance = await this.token.balanceOf(arty);
            balance.should.be.bignumber.equal(0);
        });


        it('should not allow beneficiaries to withdraw tokens before crowdsale ends', async function () {
            await increaseTimeTo(this.afterclosingPreSaleTime);
            await this.crowdsale.buyTokens(arty, {value: lessThanCapBoth, from: max});
            await this.crowdsale.withdrawTokens({from: arty}).should.be.rejectedWith(EVMRevert);
        });

        it('should allow beneficiaries to withdraw tokens after crowdsale ends with pre-sale bonus', async function () {
            await increaseTimeTo(this.openingTime);
            await this.crowdsale.buyTokens(arty, {value: lessThanCapBoth, from: max});
            await this.crowdsale.buyTokens(max, {value: lessThanCapBoth, from: arty});


            await increaseTimeTo(this.afterClosingTime);
            await this.crowdsale.withdrawTokens({from: arty}).should.be.fulfilled;
            let arty_balance = await this.token.balanceOf(arty);
            arty_balance.should.be.bignumber.equal(expectedPresaleTokenAmount);

            await this.crowdsale.withdrawTokens({from: max}).should.be.fulfilled;
            let max_balance = await this.token.balanceOf(max);
            max_balance.should.be.bignumber.equal(expectedPresaleTokenAmount);
        });

        it('should allow beneficiaries to withdraw tokens after crowdsale ends without pre-sale bonus', async function () {
            await increaseTimeTo(this.afterclosingPreSaleTime);
            await this.crowdsale.buyTokens(arty, {value: lessThanCapBoth, from: max});
            await this.crowdsale.buyTokens(max, {value: lessThanCapBoth, from: arty});


            await increaseTimeTo(this.afterClosingTime);
            await this.crowdsale.withdrawTokens({from: arty}).should.be.fulfilled;
            let arty_balance = await this.token.balanceOf(arty);
            arty_balance.should.be.bignumber.equal(expectedTokenAmount);

            await this.crowdsale.withdrawTokens({from: max}).should.be.fulfilled;
            let max_balance = await this.token.balanceOf(max);
            max_balance.should.be.bignumber.equal(expectedTokenAmount);
        });
    });
});
