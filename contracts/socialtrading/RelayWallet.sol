pragma solidity ^0.4.19;

import "zeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";


contract RelayWallet is Ownable {
  using SafeMath for uint;
  address adminWallet;
  mapping(address => mapping(address => uint)) public tokens; //mapping of token addresses to mapping of account balances (token=0 means Ether)


  event Deposit(address token, address user, uint amount, uint balance);
  event Withdraw(address token, address user, uint amount, uint balance);

  function RelayWallet(address _adminWallet) {
    adminWallet = _adminWallet;
  }

  function() {
    throw;
  }

  function deposit() payable {
    tokens[0][msg.sender] = tokens[0][msg.sender].add(msg.value);
    Deposit(0, msg.sender, msg.value, tokens[0][msg.sender]);
  }

  function withdraw(uint amount) {
    if (tokens[0][msg.sender] < amount) throw;
    tokens[0][msg.sender] = tokens[0][msg.sender].sub(amount);
    if (!msg.sender.call.value(amount)()) throw;
    Withdraw(0, msg.sender, amount, tokens[0][msg.sender]);
  }

  function depositToken(address token, uint amount) {
    //remember to call Token(address).approve(this, amount) or this contract will not be able to do the transfer on your behalf.
    if (token == 0) throw;
    if (!ERC20(token).transferFrom(msg.sender, relayWallet, amount)) throw;
    tokens[token][msg.sender] = tokens[token][msg.sender].add(amount);
    Deposit(token, msg.sender, amount, tokens[token][msg.sender]);
  }

  function withdrawToken(address token, uint amount) {
    if (token == 0) throw;
    if (tokens[token][msg.sender] < amount) throw;
    tokens[token][msg.sender] = tokens[0][msg.sender].sub(amount);
    if (!Token(token).transfer(msg.sender, amount)) throw;
    Withdraw(token, msg.sender, amount, tokens[token][msg.sender]);
  }

  function balanceOf(address token, address user) constant returns (uint) {
    return tokens[token][user];
  }

}
