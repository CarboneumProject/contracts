pragma solidity ^0.4.19;

import "zeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "./Wrap9.sol";


contract RelayWallet is Ownable {
  using SafeMath for uint;
  address wallet;
  mapping(address => mapping(address => uint)) public tokens; //mapping of token addresses to mapping of account balances (token=0 means Ether)

  WETH9 weth;

  event Deposit(address token, address user, uint amount, uint balance);
  event Withdraw(address token, address user, uint amount, uint balance);

  function RelayWallet(address _wallet, WETH9 _weth) {
    wallet = _wallet;
    weth = _weth;
  }

  function() {
    revert();
  }

  function deposit() payable {
    tokens[address(weth)][msg.sender] = tokens[address(weth)][msg.sender].add(msg.value);
    weth.deposit.value(msg.value)();
    weth.transfer(wallet, msg.value);
    Deposit(address(weth), msg.sender, msg.value, tokens[address(weth)][msg.sender]);
  }

  function depositToken(address token, uint amount) {
    //remember to call Token(address).approve(this, amount) or this contract will not be able to do the transfer on your behalf.
    tokens[token][msg.sender] = tokens[token][msg.sender].add(amount);
    require(ERC20(token).transferFrom(msg.sender, wallet, amount));
    Deposit(token, msg.sender, amount, tokens[token][msg.sender]);
  }

  function withdrawToken(address token, uint amount) {
    require(tokens[token][msg.sender] >= amount);
    tokens[token][msg.sender] = tokens[token][msg.sender].sub(amount);
    require(Token(token).transferFrom(wallet, msg.sender, amount));
    Withdraw(token, msg.sender, amount, tokens[token][msg.sender]);
  }

  function balanceOf(address token, address user) constant returns (uint) {
    return tokens[token][user];
  }

}
