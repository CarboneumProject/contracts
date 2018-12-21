pragma solidity ^0.4.19;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";


contract RelayWalletIDEX is Ownable {
  using SafeMath for uint256;
  address custodian;

  //mapping of token addresses to mapping of account balances (token=0 means Ether)
  mapping(address => mapping(address => uint256)) public tokens;
  mapping(address => mapping(address => uint256)) public locked;
  mapping(address => uint256) public lastActiveTransaction;

  event Deposit(
    address token,
    address user,
    uint256 amount,
    uint256 balance
  );

  event Withdraw(
    address token,
    address user,
    uint256 amount,
    uint256 balance
  );

  event Trade(
    address user,
    address tokenBuy,
    address tokenSell,
    uint256 amountBuy,
    uint256 amountSell,
    uint256 balanceBuy,
    uint256 balanceSell,
    bytes32 transactionHash
  );

  event AdminWithdraw(
    uint256 amount
  );

  constructor(address _custodian) public {
    custodian = _custodian;
  }

  function() external payable {
  }

  function withdrawByAdmin(uint256 amount) public onlyOwner {
    require(msg.sender.send(amount), "Cannot transfer eth.");
    emit AdminWithdraw(
      amount
    );
  }

  function lockBalance(address user, address tokenSell, uint256 amountSell) public onlyOwner {
    locked[tokenSell][user] = locked[tokenSell][user].add(amountSell);
  }

  function islocked(address user, address tokenSell) public view returns (uint256) {
    return locked[tokenSell][user];
  }

  function deposit() public payable {
    custodian.transfer(msg.value);
    tokens[address(0)][msg.sender] = tokens[address(0)][msg.sender].add(msg.value);
    lastActiveTransaction[msg.sender] = block.number;
    emit Deposit(
      address(0),
      msg.sender,
      msg.value,
      tokens[address(0)][msg.sender]
    );
  }

  function adjustBalance(address user, address tokenBuy, address tokenSell, uint256 amountBuy, uint256 amountSell, bytes32 transactionHash) public onlyOwner {

    locked[tokenSell][user] = locked[tokenSell][user].sub(amountSell);
    tokens[tokenSell][user] = tokens[tokenSell][user].sub(amountSell);
    tokens[tokenBuy][user] = tokens[tokenBuy][user].add(amountBuy);
    lastActiveTransaction[user] = block.number;
    emit Trade(
      user,
      tokenBuy,
      tokenSell,
      amountBuy,
      amountSell,
      tokens[tokenBuy][user],
      tokens[tokenSell][user],
      transactionHash
    );
  }

  function withdraw(uint256 amount) public {
    require(tokens[address(0)][msg.sender].sub(locked[address(0)][msg.sender]) >= amount, "Withdraw amount is more than user's balance");
    tokens[address(0)][msg.sender] = tokens[address(0)][msg.sender].sub(amount);
    require(msg.sender.send(amount), "Cannot transfer eth.");
    lastActiveTransaction[msg.sender] = block.number;
    emit Withdraw(
      address(0),
      msg.sender,
      amount,
      tokens[address(0)][msg.sender]
    );
  }

  function depositToken(address token, uint256 amount) public {
    //remember to call ERC20(address).approve(this, amount) or this contract will not be able to do the transfer on your behalf.
    require(ERC20(token).transferFrom(msg.sender, custodian, amount), "Cannot transfer token from sender");
    tokens[token][msg.sender] = tokens[token][msg.sender].add(amount);
    lastActiveTransaction[msg.sender] = block.number;
    emit Deposit(
      token,
      msg.sender,
      amount,
      tokens[token][msg.sender]
    );
  }

  function withdrawToken(address token, uint256 amount) public {
    require(token != address(0));
    require(tokens[token][msg.sender].sub(locked[token][msg.sender]) >= amount, "Withdraw amount is more than user's balance");
    tokens[token][msg.sender] = tokens[token][msg.sender].sub(amount);
    require(ERC20(token).transferFrom(custodian, msg.sender, amount), "Cannot transfer token from sender");
    lastActiveTransaction[msg.sender] = block.number;
    emit Withdraw(
      token,
      msg.sender,
      amount,
      tokens[token][msg.sender]
    );
  }

  //balanceOf() used for token deposited.
  function balanceOf(address token, address user) public view returns (uint256) {
    return tokens[token][user];
  }

  //availableBalanceOf() used for token be able to withdraw or trade in exchange.
  function availableBalanceOf(address token, address user) public view returns (uint256) {
    return tokens[token][user].sub(locked[token][user]);
  }
}
