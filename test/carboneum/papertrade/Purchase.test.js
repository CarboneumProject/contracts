import EVMRevert from '../../helpers/EVMRevert';

const BigNumber = web3.BigNumber;
require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const CarboneumToken = artifacts.require('CarboneumToken');
const Purchase = artifacts.require('Purchase');

contract('Purchase', accounts => {
  const creator = accounts[0];
  const papertradeFund = accounts[1];
  const user2 = accounts[2];
  const resetPrice = new BigNumber('500e18');

  beforeEach(async function () {
    this.token = await CarboneumToken.new({ from: creator });
    this.purchase = await Purchase.new(papertradeFund, this.token.address, resetPrice, { from: creator });
    await this.token.transfer(user2, new BigNumber('8888e18'), { from: creator });
    await this.token.approve(this.purchase.address, new BigNumber('8888e18'), { from: user2 });
    await this.purchase.setPackagePrice(new BigNumber('1000e18'), new BigNumber('1e18'), { from: creator });
    await this.purchase.setPackagePrice(new BigNumber('12000e18'), new BigNumber('10e18'), { from: creator });
    await this.purchase.setPackagePrice(new BigNumber('150000e18'), new BigNumber('100e18'), { from: creator });
  });

  it('Can purchase portfolio reset', async function () {
    await this.purchase.resetPortfolio(40, { from: user2 });
    let papertradeFundBalance = await this.token.balanceOf(papertradeFund);
    papertradeFundBalance.should.be.bignumber.equal(resetPrice);

    let user2Balance = await this.token.balanceOf(user2);
    user2Balance.should.be.bignumber.equal(new BigNumber('8888e18').sub(resetPrice));
  });

  it('Only can set price for admin', async function () {
    await this.purchase.setResetPrice(
      new BigNumber('1000e18'),
      { from: user2 }).should.be.rejectedWith(EVMRevert);
    await this.purchase.setPackagePrice(
      new BigNumber('2000000e18'),
      new BigNumber('1000e18'),
      { from: user2 }).should.be.rejectedWith(EVMRevert);
  });

  it('Can purchase paper fund with token', async function () {
    await this.purchase.buyFund(40, new BigNumber('1000e18'), { from: user2 });
    let papertradeFundBalance = await this.token.balanceOf(papertradeFund);
    papertradeFundBalance.should.be.bignumber.equal(new BigNumber('1e18'));

    let user2Balance = await this.token.balanceOf(user2);
    user2Balance.should.be.bignumber.equal(new BigNumber('8888e18').sub(new BigNumber('1e18')));

    await this.purchase.buyFund(40, new BigNumber('150000e18'), { from: user2 });
    let user2Balance2 = await this.token.balanceOf(user2);
    user2Balance2.should.be.bignumber.equal(user2Balance.sub(new BigNumber('100e18')));
  });
});
