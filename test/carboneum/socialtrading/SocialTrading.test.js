import ether from '../../helpers/ether';
import EVMRevert from '../../helpers/EVMRevert';
import { increaseTimeTo, duration } from '../../helpers/increaseTime';
import latestTime from '../../helpers/latestTime';
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

    it('Verify activities success.', async function () {
      await this.socialTrading.follow(leader1, ether(25), { from: followerA });
      await this.socialTrading.follow(leader2, ether(25), { from: followerA });
      await this.socialTrading.follow(leader3, ether(25), { from: followerA });
      let friends = await this.socialTrading.getFriends(followerA, { from: followerA });
      assert.equal(friends[0], leader1);
      assert.equal(friends[1], leader2);
      assert.equal(friends[2], leader3);
      await this.socialTrading.registerRelay(relay, { from: _ });
      await this.socialTrading.registerVerifier(ether(40), { from: verifier });
      await this.socialTrading.registerVerifier(ether(40), { from: leader2 });
      await this.socialTrading.registerVerifier(ether(40), { from: leader3 });
      // await this.socialTrading.pickVerifier(2, 88888, { from: _ });
      await this.socialTrading.fixPickedVerifier({ from: _ });
      let picked = await this.socialTrading.getPickedVerifiers({ from: followerB });
      console.log(picked);
      await this.socialTrading.tradeActivity('0x541e41', { from: relay });
      await this.socialTrading.addCloseActivities(leader1,
        followerA, relay,
        [verifier, leader3, leader2], '0x8352523589203752624',
        '0x8352523589203752625', ether(1), ether(3), ether(1),
        latestTime(), '0x8352523589203752627', false, { from: relay });
      await this.socialTrading.verifyActivity('0x8352523589203752627',
        true, { from: verifier });
      await this.socialTrading.verifyActivity('0x8352523589203752627',
        true, { from: leader2 });
      await this.socialTrading.verifyActivity('0x8352523589203752627',
        false, { from: leader3 });
      await this.socialTrading.claimReward({ from: verifier });
      await this.socialTrading.claimReward({ from: leader1 });
      await this.socialTrading.claimReward({ from: leader2 });
      await this.socialTrading.claimReward({ from: leader3 }).should.be.rejectedWith(EVMRevert);
      await this.socialTrading.claimReward({ from: relay });
      let verifierBalance = await this.token.balanceOf(verifier);
      verifierBalance.should.be.bignumber.equal(ether(961));
      let leader2Balance = await this.token.balanceOf(leader2);
      leader2Balance.should.be.bignumber.equal(ether(961));
      let leader3Balance = await this.token.balanceOf(leader3);
      leader3Balance.should.be.bignumber.equal(ether(960));
      let leader1Balance = await this.token.balanceOf(leader1);
      leader1Balance.should.be.bignumber.equal(ether(1));
      let relayBalance = await this.token.balanceOf(relay);
      relayBalance.should.be.bignumber.equal(ether(3));
      let followerABalance = await this.token.balanceOf(followerA);
      followerABalance.should.be.bignumber.equal(ether(995));
    });

    it('Not verifier send result.', async function () {
      await this.socialTrading.follow(leader1, ether(25), { from: followerA });
      await this.socialTrading.follow(leader2, ether(25), { from: followerA });
      await this.socialTrading.follow(leader3, ether(25), { from: followerA });
      let friends = await this.socialTrading.getFriends(followerA, { from: followerA });
      assert.equal(friends[0], leader1);
      assert.equal(friends[1], leader2);
      assert.equal(friends[2], leader3);
      await this.socialTrading.registerRelay(relay, { from: _ });
      await this.socialTrading.registerVerifier(ether(40), { from: verifier });
      // await this.socialTrading.pickVerifier(1, 88888, { from: _ });
      await this.socialTrading.fixPickedVerifier({ from: _ });
      let picked = await this.socialTrading.getPickedVerifiers({ from: followerB });
      console.log(picked);
      await this.socialTrading.tradeActivity('0x541e41', { from: relay });
      await this.socialTrading.addCloseActivities(leader1,
        followerA, relay,
        [verifier], '0x8352523589203752624',
        '0x8352523589203752625', ether(1), ether(2), ether(1),
        latestTime(), '0x8352523589203752627', false, { from: relay });
      await this.socialTrading.verifyActivity('0x8352523589203752627',
        true, { from: verifier });
      await this.socialTrading.verifyActivity('0x8352523589203752627',
        true, { from: leader3 }).should.be.rejectedWith(EVMRevert);
    });

    it('No have verifiers send result after timeout.', async function () {
      await this.socialTrading.follow(leader1, ether(25), { from: followerA });
      await this.socialTrading.follow(leader2, ether(25), { from: followerA });
      await this.socialTrading.follow(leader3, ether(25), { from: followerA });
      let friends = await this.socialTrading.getFriends(followerA, { from: followerA });
      assert.equal(friends[0], leader1);
      assert.equal(friends[1], leader2);
      assert.equal(friends[2], leader3);
      await this.socialTrading.registerRelay(relay, { from: _ });
      await this.socialTrading.registerVerifier(ether(40), { from: verifier });
      await this.socialTrading.registerVerifier(ether(40), { from: leader2 });
      await this.socialTrading.registerVerifier(ether(40), { from: leader3 });
      // await this.socialTrading.pickVerifier(2, 88888, { from: _ });
      await this.socialTrading.fixPickedVerifier({ from: _ });
      let picked = await this.socialTrading.getPickedVerifiers({ from: followerB });
      console.log(picked);
      await this.socialTrading.tradeActivity('0x541e41', { from: relay });
      await this.socialTrading.addCloseActivities(leader1,
        followerA, relay,
        [verifier, leader2, leader3], '0x8352523589203752624',
        '0x8352523589203752625', ether(1), ether(3), ether(1),
        latestTime(), '0x8352523589203752627', false, { from: relay });
      await this.socialTrading.verifyActivity('0x8352523589203752627',
        true, { from: verifier });
      await this.socialTrading.verifyActivity('0x8352523589203752627',
        true, { from: leader2 });
      await increaseTimeTo(latestTime() + duration.hours(3));
      await this.socialTrading.verifyActivity('0x8352523589203752627',
        true, { from: leader3 });
      await this.socialTrading.ownerTransferFee('0x8352523589203752627', { from: _ });
      await this.socialTrading.claimReward({ from: verifier });
      await this.socialTrading.claimReward({ from: leader1 });
      await this.socialTrading.claimReward({ from: leader2 });
      await this.socialTrading.claimReward({ from: leader3 }).should.be.rejectedWith(EVMRevert);
      await this.socialTrading.claimReward({ from: relay });
      let verifierBalance = await this.token.balanceOf(verifier);
      verifierBalance.should.be.bignumber.equal(ether(961));
      let leader2Balance = await this.token.balanceOf(leader2);
      leader2Balance.should.be.bignumber.equal(ether(961));
      let leader1Balance = await this.token.balanceOf(leader1);
      leader1Balance.should.be.bignumber.equal(ether(1));
      let relayBalance = await this.token.balanceOf(relay);
      relayBalance.should.be.bignumber.equal(ether(3));
      let followerABalance = await this.token.balanceOf(followerA);
      followerABalance.should.be.bignumber.equal(ether(995));
    });

    it('Dont sent result in a time(default is 1 hr after close activities).', async function () {
      await this.socialTrading.follow(leader1, ether(25), { from: followerA });
      await this.socialTrading.follow(leader2, ether(25), { from: followerA });
      await this.socialTrading.follow(leader3, ether(25), { from: followerA });
      let friends = await this.socialTrading.getFriends(followerA, { from: followerA });
      assert.equal(friends[0], leader1);
      assert.equal(friends[1], leader2);
      assert.equal(friends[2], leader3);
      await this.socialTrading.registerRelay(relay, { from: _ });
      await this.socialTrading.registerVerifier(ether(40), { from: verifier });
      await this.socialTrading.registerVerifier(ether(40), { from: leader2 });
      await this.socialTrading.registerVerifier(ether(40), { from: leader3 });
      // await this.socialTrading.pickVerifier(1, 88888, { from: _ });
      await this.socialTrading.fixPickedVerifier({ from: _ });
      let picked = await this.socialTrading.getPickedVerifiers({ from: followerB });
      console.log(picked);
      await this.socialTrading.tradeActivity('0x541e41', { from: relay });
      await this.socialTrading.addCloseActivities(leader1,
        followerA, relay,
        [verifier, leader2, leader3], '0x8352523589203752624',
        '0x8352523589203752625', ether(1), ether(2), ether(1),
        latestTime(), '0x8352523589203752627', false, { from: relay });
      await increaseTimeTo(latestTime() + duration.hours(1) + duration.minutes(50));
      await this.socialTrading.verifyActivity('0x8352523589203752627',
        true, { from: verifier });
      await this.socialTrading.verifyActivity('0x8352523589203752627',
        true, { from: leader2 });
      await this.socialTrading.verifyActivity('0x8352523589203752627',
        true, { from: leader3 });
      await this.socialTrading.claimReward({ from: verifier });
      await this.socialTrading.claimReward({ from: leader2 }).should.be.rejectedWith(EVMRevert);
      await this.socialTrading.claimReward({ from: leader3 }).should.be.rejectedWith(EVMRevert);
      let verifierBalance = await this.token.balanceOf(verifier);
      verifierBalance.should.be.bignumber.equal(ether(961));
      let leader2Balance = await this.token.balanceOf(leader2);
      leader2Balance.should.be.bignumber.equal(ether(960));
    });

    it('False win votes.', async function () {
      await this.socialTrading.follow(leader1, ether(25), { from: followerA });
      await this.socialTrading.follow(leader2, ether(25), { from: followerA });
      await this.socialTrading.follow(leader3, ether(25), { from: followerA });
      let friends = await this.socialTrading.getFriends(followerA, { from: followerA });
      assert.equal(friends[0], leader1);
      assert.equal(friends[1], leader2);
      assert.equal(friends[2], leader3);
      await this.socialTrading.registerRelay(relay, { from: _ });
      await this.socialTrading.registerVerifier(ether(40), { from: verifier });
      await this.socialTrading.registerVerifier(ether(40), { from: leader2 });
      await this.socialTrading.registerVerifier(ether(40), { from: leader3 });
      // await this.socialTrading.pickVerifier(4, 88888, { from: _ });
      await this.socialTrading.fixPickedVerifier({ from: _ });
      let picked = await this.socialTrading.getPickedVerifiers({ from: verifier });
      console.log(picked);
      await this.socialTrading.tradeActivity('0x541e41', { from: relay });
      await this.socialTrading.addCloseActivities(leader1,
        followerA, relay,
        [verifier, leader2, leader3], '0x8352523589203752624',
        '0x8352523589203752625', ether(1), ether(2), ether(1),
        latestTime(), '0x8352523589203752627', false, { from: relay });
      await this.socialTrading.verifyActivity('0x8352523589203752627',
        false, { from: verifier });
      await this.socialTrading.verifyActivity('0x8352523589203752627',
        false, { from: leader2 });
      await this.socialTrading.verifyActivity('0x8352523589203752627',
        true, { from: leader3 });
      await this.socialTrading.claimReward({ from: verifier }).should.be.rejectedWith(EVMRevert);
      await this.socialTrading.claimReward({ from: leader2 }).should.be.rejectedWith(EVMRevert);
      await this.socialTrading.claimReward({ from: leader3 }).should.be.rejectedWith(EVMRevert);
    });

    it('Follower not enough token.', async function () {
      await this.socialTrading.follow(leader1, ether(25), { from: followerC });
      await this.socialTrading.follow(leader2, ether(25), { from: followerC });
      await this.socialTrading.follow(leader3, ether(25), { from: followerC });
      let friends = await this.socialTrading.getFriends(followerC, { from: followerC });
      assert.equal(friends[0], leader1);
      assert.equal(friends[1], leader2);
      assert.equal(friends[2], leader3);
      await this.socialTrading.registerRelay(relay, { from: _ });
      await this.socialTrading.registerVerifier(ether(40), { from: verifier });
      await this.socialTrading.fixPickedVerifier({ from: _ });
      await this.socialTrading.tradeActivity('0x541e41', { from: relay });
      await this.socialTrading.addCloseActivities(leader1,
        followerC, relay,
        [verifier], '0x8352523589203752624',
        '0x8352523589203752625', ether(1), ether(2), ether(1),
        latestTime(), '0x835252358920375267', false, { from: relay });
      await this.socialTrading.verifyActivity('0x835252358920375267',
        true, { from: verifier });
      let friends2 = await this.socialTrading.getFriends(followerC, { from: followerC });
      console.log(friends2);
      assert.equal(friends2[0], leader3);
      assert.equal(friends2[1], leader2);
    });
  });
});