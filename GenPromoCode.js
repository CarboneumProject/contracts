const HDWalletProvider = require('truffle-hdwallet-provider');
const Web3 = require('web3');
const ContractABI = require('./build/contracts/CarboneumToken').abi;

const providerWithMnemonic = (mnemonic, rpcEndpoint) =>
  new HDWalletProvider(mnemonic, rpcEndpoint);

const infuraProvider = network => providerWithMnemonic(
  process.env.MNEMONIC || '',
  `https://${network}.infura.io/${process.env.INFURA_API_KEY}`,
);

String.prototype.hashCode = function () {
  let hash = 0, i, chr;
  if (this.length === 0) return hash;
  for (i = 0; i < this.length; i++) {
    chr = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

const provider = infuraProvider(process.env.NETWORK || 'rinkeby');
let w3 = new Web3(provider);
console.log(provider.address);

const amount = new w3.BigNumber('88e18');
const numberOfCode = 10;
let i = 0;
for (i; i < numberOfCode; i++) {
  let code = 'C819' + Math.abs(Math.random() * 1000000).toFixed(0);
  w3.eth.sign(provider.address, w3.fromUtf8(code), function (err, signature) {
    if (!err) {
      console.log(code, signature);
    }
  });
}

// Approve token
const token = w3.eth.contract(ContractABI).at('0xd42debE4eDc92Bd5a3FBb4243e1ecCf6d63A4A5d');
token.approve.sendTransaction('0x5807d311d872e81709de391a8ad13f9e16c5443b', amount.mul(i), { from: provider.address },
  function (err, result) {
    if (!err) {
      console.log('Approve TX:', result);
    }
  });
