import ether from '../helpers/ether';
import EVMRevert from '../helpers/EVMRevert';

const CarboneumToken = artifacts.require('CarboneumToken');
const BountyClaims = artifacts.require('BountyClaims');

contract('BountyClaims', function ([tokenWallet, arty, max, printer]) {
  beforeEach(async function () {
    this.token = await CarboneumToken.new({ from: tokenWallet });
    this.bountyClaim = await BountyClaims.new(this.token.address, tokenWallet, { from: tokenWallet });
    await this.token.approve(this.bountyClaim.address, ether(200000), { from: tokenWallet });
    await this.bountyClaim.setUsersBounty([arty], [ether(99)]);
    await this.bountyClaim.setGroupBounty([max], ether(88));
  });

  describe('claims bounty', function () {
    it('should accept claim', async function () {
      await this.bountyClaim.sendTransaction({ from: arty }).should.be.fulfilled;
      let artyBalance = await this.token.balanceOf(arty);
      artyBalance.should.be.bignumber.equal(ether(99));
      await this.bountyClaim.sendTransaction({ from: arty }).should.be.rejectedWith(EVMRevert);

      await this.bountyClaim.sendTransaction({ from: max }).should.be.fulfilled;
      let maxBalance = await this.token.balanceOf(max);
      maxBalance.should.be.bignumber.equal(ether(88));
    });

    it('should reject claim from on bounty address', async function () {
      await this.bountyClaim.sendTransaction({ from: printer }).should.be.rejectedWith(EVMRevert);
    });

    it('should change bounty from owner', async function () {
      await this.bountyClaim.setUsersBounty([arty], [ether(999)]);
      await this.bountyClaim.setGroupBounty([max], ether(888));
    });

    it('should not change bounty from other', async function () {
      await this.bountyClaim.setUsersBounty([arty], [ether(999)], { from: printer }).should.be.rejectedWith(EVMRevert);
      await this.bountyClaim.setGroupBounty([max], ether(888), { from: max }).should.be.rejectedWith(EVMRevert);
    });
  });
});
