const Web3 = require('web3');
const abi = require('./abi.json');
const config = require('./config');
const fs = require('fs');
const HDWalletProvider = require('truffle-hdwallet-provider');

const providerWithMnemonic = (mnemonic, rpcEndpoint) =>
  new HDWalletProvider(mnemonic, rpcEndpoint);

const infuraProvider = network => providerWithMnemonic(
  process.env.MNEMONIC || '',
  `https://${network}.infura.io/lhULVNcYzCpvzKsRFzbm`,
);

let fromBlock = 5934592;
// noinspection JSUnresolvedVariable
const web3 = new Web3(
  infuraProvider('mainnet'),
);

const c8Contract = new web3.eth.Contract(
  abi,
  config.contract.address,
);

// noinspection JSCheckFunctionSignatures
c8Contract.getPastEvents({
  fromBlock: fromBlock,
  toBlock: 'latest',
}, (error, eventResult) => {
  if (error) {
    console.log('Error in myEvent event handler: ' + error);
    return;
  }

  let query = '';
  for (let i = 0; i < eventResult.length; i++) {
    if (eventResult[i].event === 'Transfer') {
      if (eventResult[i].returnValues.from === '0xB8666532d6dB8E936B34DF9a468CC266e7645601') {
        let to = eventResult[i].returnValues.to;
        let value = eventResult[i].returnValues.value;
        query += `${to},${value}\n`;
      }
    }
  }
  fs.writeFile('sent.csv', query, function (err) {
    if (err) throw err;
    console.log('complete');
  });
}).then().catch();
