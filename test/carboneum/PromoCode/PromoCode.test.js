import EVMRevert from '../../helpers/EVMRevert';

const BigNumber = web3.BigNumber;
require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const CarboneumToken = artifacts.require('CarboneumToken');
const PromoCode = artifacts.require('PromoCode');

contract('PromoCode', accounts => {
  const creator = accounts[0];
  const user1 = accounts[1];
  const user2 = accounts[2];
  const amount = new BigNumber('88e18');

  beforeEach(async function () {
    this.token = await CarboneumToken.new({ from: creator });
    this.promoCode = await PromoCode.new(this.token.address, amount, { from: creator });
    await this.token.approve(this.promoCode.address, new BigNumber('8888e18'), { from: creator });
  });

  it('Can redeem a promo code', async function () {
    let code1 = 'CARBONEUM_8564535475';
    let code2 = 'CARBONEUM_0873802979';
    let signature1 = await web3.eth.sign(creator, web3.sha3(code1));
    let signature2 = await web3.eth.sign(creator, web3.sha3(code2));
    await this.promoCode.redeem(code1, signature1, { from: user1 });
    await this.promoCode.redeem(code2, signature2, { from: user2 });
    let user1Balance = await this.token.balanceOf(user1);
    user1Balance.should.be.bignumber.equal(amount);
    let user2Balance = await this.token.balanceOf(user2);
    user2Balance.should.be.bignumber.equal(amount);
  });

  it('Can not redeem a promo code 2rd time', async function () {
    let code1 = 'CARBONEUM_9546435475';
    let signature1 = await web3.eth.sign(creator, web3.sha3(code1));
    await this.promoCode.redeem(code1, signature1, { from: user1 });
    let user1Balance = await this.token.balanceOf(user1);
    user1Balance.should.be.bignumber.equal(amount);
    await this.promoCode.redeem(code1, signature1, { from: user1 }).should.be.rejectedWith(EVMRevert);
  });

  it('Can not redeem promo code with wrong signature', async function () {
    let code1 = 'CARBONEUM_2546415105';
    let code2 = 'CARBONEUM_7543885979';
    let signature1 = await web3.eth.sign(creator, web3.sha3(code1));
    let signature2 = await web3.eth.sign(creator, web3.sha3(code2));
    await this.promoCode.redeem(code1, signature2, { from: user1 }).should.be.rejectedWith(EVMRevert);
    await this.promoCode.redeem(code2, signature1, { from: user2 }).should.be.rejectedWith(EVMRevert);
  });
});
