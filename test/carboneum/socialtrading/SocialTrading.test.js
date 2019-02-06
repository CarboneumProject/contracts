import ether from '../../helpers/ether';
import EVMRevert from '../../helpers/EVMRevert';

const BigNumber = web3.BigNumber;
require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const CarboneumToken = artifacts.require('CarboneumToken');
const SocialTrading = artifacts.require('SocialTrading');

contract('SocialTrading', function ([_, feeWallet, leader1, leader2, leader3, followerA, followerB, followerC,
  relay, verifier]) {
  beforeEach(async function () {
    this.token = await CarboneumToken.new({ from: _ });
    await this.token.transfer(followerA, ether(1000), { from: _ });
    await this.token.transfer(followerB, ether(1000), { from: _ });
    await this.token.transfer(followerC, ether(1), { from: _ });
    await this.token.transfer(leader2, ether(1000), { from: _ });
    await this.token.transfer(leader3, ether(1000), { from: _ });
    await this.token.transfer(verifier, ether(1000), { from: _ });
    this.socialTrading = await SocialTrading.new(feeWallet, this.token.address, { from: _ });
    await this.token.approve(this.socialTrading.address, ether(1000), { from: followerA });
    await this.token.approve(this.socialTrading.address, ether(1000), { from: followerB });
    await this.token.approve(this.socialTrading.address, ether(2), { from: followerC });
    await this.token.approve(this.socialTrading.address, ether(1000), { from: verifier });
    await this.token.approve(this.socialTrading.address, ether(1000), { from: leader2 });
    await this.token.approve(this.socialTrading.address, ether(1000), { from: leader3 });
  });

  describe('follow', function () {
    it('should allow follow leaders', async function () {
      await this.socialTrading.follow(leader1, ether(25), { from: followerA });
      await this.socialTrading.follow(leader2, ether(25), { from: followerA });
      await this.socialTrading.follow(leader3, ether(25), { from: followerA });
      let friends = await this.socialTrading.getFriends(followerA, { from: followerA });
      assert.equal(friends[0], leader1);
      assert.equal(friends[1], leader2);
      assert.equal(friends[2], leader3);
    });

    it('should allow unfollow leaders', async function () {
      await this.socialTrading.follow(leader1, ether(25), { from: followerA });
      await this.socialTrading.follow(leader2, ether(25), { from: followerA });
      await this.socialTrading.follow(leader3, ether(25), { from: followerA });
      let friends = await this.socialTrading.getFriends(followerA, { from: followerA });
      assert.equal(friends[0], leader1);
      assert.equal(friends[1], leader2);
      assert.equal(friends[2], leader3);
      await this.socialTrading.unfollow(leader1, { from: followerA });
      await this.socialTrading.unfollow(leader3, { from: followerA });
      let friends2 = await this.socialTrading.getFriends(followerA, { from: followerA });
      assert.equal(friends2[0], leader2);
    });

    it('should allow a leader to follow by users', async function () {
      await this.socialTrading.follow(leader1, ether(50), { from: followerA });
      await this.socialTrading.follow(leader1, ether(50), { from: followerB });
      await this.socialTrading.follow(leader1, ether(50), { from: followerC });
      let followers = await this.socialTrading.getFollowers(leader1, { from: leader1 });
      assert.equal(followers[0], followerA);
      assert.equal(followers[1], followerB);
      assert.equal(followers[2], followerC);
      await this.socialTrading.unfollow(leader1, { from: followerB });
      let followers2 = await this.socialTrading.getFollowers(leader1, { from: leader1 });
      assert.equal(followers2[0], followerA);
      assert.equal(followers2[1], followerC);
    });

    it('should reject follow leaders over 100 percentage', async function () {
      await this.socialTrading.follow(leader1, ether(50), { from: followerA }).should.be.fulfilled;
      await this.socialTrading.follow(leader2, ether(50), { from: followerA }).should.be.fulfilled;
      await this.socialTrading.follow(leader3, ether(1), { from: followerA }).should.be.rejectedWith(EVMRevert);
    });
  });

  describe('relay', function () {
    it('should allow owner to add relay', async function () {
      await this.socialTrading.registerRelay(relay, { from: _ });
    });

    it('should allow owner to remove relay', async function () {
      await this.socialTrading.removeRelay(relay, { from: _ });
    });
  });

  describe('reward', function () {
    it('should allow relay to distribute reward', async function () {
      await this.socialTrading.registerRelay(relay, { from: _ });
      await this.socialTrading.distributeReward(
        leader1,
        followerA,
        ether(88),
        ether(8),
        '0x3ec13d8f7ffc514225e459c07609ba951d78971ae4bf67af171080e104868d9a',
        '0x336d38735561dbc08863d4256c757eb493941798a26e2f7d04d92be28c5e4be6',
        { from: relay });

      await this.socialTrading.claimReward({ from: relay });
      let relayBalance = await this.token.balanceOf(relay);
      relayBalance.should.be.bignumber.equal(ether(8));

      await this.socialTrading.claimReward({ from: leader1 });
      let leader1Balance = await this.token.balanceOf(leader1);
      leader1Balance.should.be.bignumber.equal(ether(88));
    });
  });
});
