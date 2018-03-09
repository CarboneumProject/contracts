import decodeLogs from '../helpers/decodeLogs';

const BigNumber = web3.BigNumber;

const CarboneumToken = artifacts.require('CarboneumToken');

contract('CarboneumToken', accounts => {
  let token;
  const creator = accounts[0];

  beforeEach(async function () {
    token = await CarboneumToken.new({ from: creator });
  });

  it('has a name', async function () {
    const name = await token.name();
    assert.equal(name, 'Carboneum');
  });

  it('has a symbol', async function () {
    const symbol = await token.symbol();
    assert.equal(symbol, 'C8');
  });

  it('has 18 decimals', async function () {
    const decimals = await token.decimals();
    assert(decimals.eq(18));
  });

  it('has 200M token', async function () {
    const supply = await token.totalSupply();
    assert(supply.eq(new BigNumber('200e24')));
  });

  it('assigns the initial total supply to the creator', async function () {
    const totalSupply = await token.totalSupply();
    const creatorBalance = await token.balanceOf(creator);

    assert(creatorBalance.eq(totalSupply));

    const receipt = web3.eth.getTransactionReceipt(token.transactionHash);
    const logs = decodeLogs(receipt.logs, CarboneumToken, token.address);
    assert.equal(logs.length, 1);
    assert.equal(logs[0].event, 'Transfer');
    assert.equal(logs[0].args.from.valueOf(), 0x0);
    assert.equal(logs[0].args.to.valueOf(), creator);
    assert(logs[0].args.value.eq(totalSupply));
  });
});
