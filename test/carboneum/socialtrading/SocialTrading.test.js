import ether from '../../helpers/ether';

const CarboneumToken = artifacts.require('CarboneumToken');
const SocialTrading = artifacts.require('SocialTrading');

contract('SocialTrading', function ([_, feeWallet, leader1, leader2, leader3, followerA, followerB, followerC]) {
  beforeEach(async function () {
    this.token = await CarboneumToken.new({ from: _ });
    await this.token.transfer(followerA, ether(1000), { from: _ });
    await this.token.transfer(followerB, ether(1000), { from: _ });
    await this.token.transfer(followerC, ether(1000), { from: _ });
    this.socialTrading = await SocialTrading.new(feeWallet, this.token.address, { from: _ });
    await this.token.approve(this.socialTrading.address, ether(1000), { from: followerA });
    await this.token.approve(this.socialTrading.address, ether(1000), { from: followerB });
    await this.token.approve(this.socialTrading.address, ether(1000), { from: followerC });
  });

  describe('follow', function () {
    it('should allow follow leaders', async function () {
      await this.socialTrading.follow(leader1, ether(50), { from: followerA });
      await this.socialTrading.follow(leader2, ether(50), { from: followerA });
      await this.socialTrading.follow(leader3, ether(50), { from: followerA });
      let friends = await this.socialTrading.getFriends(followerA, { from: followerA });
      assert.equal(friends[0], leader1);
      assert.equal(friends[1], leader2);
      assert.equal(friends[2], leader3);
    });

    it('should allow unfollow leaders', async function () {
      await this.socialTrading.follow(leader1, ether(50), { from: followerA });
      await this.socialTrading.follow(leader2, ether(50), { from: followerA });
      await this.socialTrading.follow(leader3, ether(50), { from: followerA });
      let friends = await this.socialTrading.getFriends(followerA, { from: followerA });
      assert.equal(friends[0], leader1);
      assert.equal(friends[1], leader2);
      assert.equal(friends[2], leader3);
      await this.socialTrading.unfollow(leader1, { from: followerA });
      await this.socialTrading.unfollow(leader3, { from: followerA });
      let friends2 = await this.socialTrading.getFriends(followerA, { from: followerA });
      assert.equal(friends2[0], leader2);
    });
  });
});
