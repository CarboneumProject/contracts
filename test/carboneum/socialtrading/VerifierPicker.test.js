import ether from '../../helpers/ether';

const BigNumber = web3.BigNumber;
require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const VerifierPicker = artifacts.require('VerifierPicker');

contract('VerifierPicker', function ([owner, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12]) {
  beforeEach(async function () {
    this.picker = await VerifierPicker.new({ from: owner });
  });

  describe('Picker', function () {
    it('should allow add verifier stake', async function () {
      await this.picker.stake(ether(10), { from: v1 });
      await this.picker.stake(ether(20), { from: v2 });
      await this.picker.stake(ether(30), { from: v3 });
      await this.picker.stake(ether(40), { from: v4 });

      await this.picker.pickVerifier(88888, { from: owner });
      let picked = await this.picker.getPickedVerifiers({ from: v1 });
      console.log(v1);
      console.log(v2);
      console.log(v3);
      console.log(v4);
      console.log(picked);

      await this.picker.showLog({ from: v1 });
    });
  });
});
