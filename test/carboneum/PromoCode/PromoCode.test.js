import EVMRevert from '../../helpers/EVMRevert';
const util = require('ethereumjs-util');

const BigNumber = web3.BigNumber;
require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const CarboneumToken = artifacts.require('CarboneumToken');
const PromoCode = artifacts.require('PromoCode');

function keccak256 (...args) {
  args = args.map(arg => {
    if (typeof arg === 'string') {
      if (arg.substring(0, 2) === '0x') {
        return arg.slice(2);
      } else {
        return web3.toHex(arg).slice(2);
      }
    }

    if (typeof arg === 'number') {
      return (arg).toString(16).padStart(64, '0');
    } else {
      return '';
    }
  });

  args = args.join('');

  return web3.sha3(args, { encoding: 'hex' });
}

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
    // Issuer sign the promocode.
    let code1 = 'CARBONEUM_8564535475';
    let code2 = 'CARBONEUM_8564532322';
    let claimSignature1 = await web3.eth.sign(creator, keccak256(this.promoCode.address, user1, code1));
    let claimSignature2 = await web3.eth.sign(creator, keccak256(this.promoCode.address, user2, code2));

    // User claim token with claim signature.
    await this.promoCode.redeem(user1, code1, claimSignature1, { from: user1 });
    await this.promoCode.redeem(user2, code2, claimSignature2, { from: user2 });
    let user1Balance = await this.token.balanceOf(user1);
    user1Balance.should.be.bignumber.equal(amount);
    let user2Balance = await this.token.balanceOf(user2);
    user2Balance.should.be.bignumber.equal(amount);
  });

  it('Can not redeem a promo code 2rd time', async function () {
    let code1 = 'CARBONEUM_9546435475';
    let claimSignature1 = await web3.eth.sign(creator, keccak256(this.promoCode.address, user1, code1));
    await this.promoCode.redeem(user1, code1, claimSignature1, { from: user1 });
    let user1Balance = await this.token.balanceOf(user1);
    user1Balance.should.be.bignumber.equal(amount);
    await this.promoCode.redeem(user1, code1, claimSignature1, { from: user1 }).should.be.rejectedWith(EVMRevert);
  });

  it('Can not redeem promo code with wrong signature', async function () {
    // Issuer sign the promocode.
    let code1 = 'CARBONEUM_8564535475';
    let code2 = 'CARBONEUM_8564532322';
    let claimSignature1 = await web3.eth.sign(creator, keccak256(this.promoCode.address, user1, code1));
    let claimSignature2 = await web3.eth.sign(creator, keccak256(this.promoCode.address, user2, code2));

    // User claim token with claim signature.
    await this.promoCode.redeem(user1, code1, claimSignature2, { from: user1 }).should.be.rejectedWith(EVMRevert);
    await this.promoCode.redeem(user2, code2, claimSignature1, { from: user2 }).should.be.rejectedWith(EVMRevert);
    await this.promoCode.redeem(user1, code2, claimSignature1, { from: user1 }).should.be.rejectedWith(EVMRevert);
    await this.promoCode.redeem(user2, code1, claimSignature2, { from: user2 }).should.be.rejectedWith(EVMRevert);
    await this.promoCode.redeem(user1, code2, claimSignature2, { from: user1 }).should.be.rejectedWith(EVMRevert);
    await this.promoCode.redeem(user2, code1, claimSignature1, { from: user2 }).should.be.rejectedWith(EVMRevert);
  });
});
