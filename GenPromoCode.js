const Web3 = require('web3');
const { bufferToHex } = require('ethereumjs-util');
const HDWalletProvider = require('truffle-hdwallet-provider');
const TokenABI = require('./build/contracts/CarboneumToken').abi;
const PromoCodeABI = require('./build/contracts/PromoCode').abi;

const providerWithMnemonic = (mnemonic, rpcEndpoint) =>
  new HDWalletProvider(mnemonic, rpcEndpoint);

const infuraProvider = network => providerWithMnemonic(
  process.env.MNEMONIC || '',
  `https://${network}.infura.io/v3/96bfc78effaa4a32bf99ce0dd4453132`,
);

const network = process.env.NETWORK || 'mainnet';
const provider = infuraProvider(network);
let w3 = new Web3(provider);
console.log('Promo Code Generator...');
console.log('Owner Address:', provider.address);
const amount = new w3.utils.BN('88000000000000000000');
const numberOfCode = 300;
const approveAmount = amount.mul(new w3.utils.BN(numberOfCode));
let promocodeAddress = '';
if (network === 'mainnet') {
  promocodeAddress = '0xb82545e883a22787b8912c4fbcdbf64156358701';
} else {
  promocodeAddress = '0x5807d311d872e81709de391a8ad13f9e16c5443b';
}
const tokenContractAddress = '0xd42debE4eDc92Bd5a3FBb4243e1ecCf6d63A4A5d';

let i = 0;
let code = '';
let signature = '';
let privateKey = bufferToHex(provider.wallet._privKey);
console.log('==========================================  CODE  ==========================================');
for (i; i <= numberOfCode; i++) {
  code = 'C819' + Math.abs(Math.random() * 1000000).toFixed(0).padStart(6, '0');
  let sign = w3.eth.accounts.sign(w3.utils.fromUtf8(code), privateKey);
  signature = sign.signature;
  if (i < numberOfCode) {
    let link = `https://carboneum.io/p/?c=${code}&s=${signature}`;
    console.log(link);
  }
}
console.log('============================================================================================');
console.log('Approving contract spending...');
const token = new w3.eth.Contract(TokenABI, tokenContractAddress);
token.methods.approve(promocodeAddress, w3.utils.toHex(approveAmount)).send(
  { from: provider.address, gas: 300000 }).on('transactionHash', (hash) => {
  console.log('Approving Tx:', hash);
  console.log('Testing Redeem Code...', code);
  const promoCode = new w3.eth.Contract(PromoCodeABI, promocodeAddress);
  promoCode.methods.redeem(code, signature).send(
    { from: provider.address, gas: 300000 }).on('transactionHash', (redeemHash) => {
    console.log('Test Redeem Tx:', redeemHash);
    process.exit();
  }).on('confirmation', (confirmationNumber, receipt) => {
    console.log('confirmation2');
  }).on('receipt', (receipt) => {
  }).on('error', console.error);
}).on('confirmation', (confirmationNumber, receipt) => {
  console.log('confirmation1');
}).on('receipt', (receipt) => {
  console.log('receipt1');
}).on('error', console.error);
