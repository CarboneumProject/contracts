pragma solidity ^0.4.19;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";


contract RelayWalletIDEX is Ownable{
  using SafeMath for uint256;
  address custodian;

  //mapping of token addresses to mapping of account balances (token=0 means Ether)
  mapping(address => mapping(address => uint256)) public tokens;

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

  constructor(address _custodian) public {
    custodian = _custodian;
  }

  function () external payable {
  }

  function withdrawByAdmin(uint256 amount) public onlyOwner{
    require(msg.sender.send(amount), "Cannot transfer eth.");
  }


  function deposit() public payable {
    custodian.transfer(msg.value);
    tokens[address(0)][msg.sender] = tokens[address(0)][msg.sender].add(msg.value);
    emit Deposit(
      address(0),
      msg.sender,
      msg.value,
      tokens[address(0)][msg.sender]
    );
  }

  function withdraw(uint256 amount) public {
    require(tokens[address(0)][msg.sender] >= amount, "Withdraw amount is more than user's balance");
    tokens[address(0)][msg.sender] = tokens[address(0)][msg.sender].sub(amount);
    require(msg.sender.send(amount), "Cannot transfer eth.");
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
    emit Deposit(
      token,
      msg.sender,
      amount,
      tokens[token][msg.sender]
    );
  }

  function withdrawToken(address token, uint256 amount) public {
    require(token != address(0));
    require(tokens[token][msg.sender] >= amount, "Withdraw amount is more than user's balance");
    tokens[token][msg.sender] = tokens[token][msg.sender].sub(amount);
    require(ERC20(token).transferFrom(custodian, msg.sender, amount), "Cannot transfer token from sender");
    emit Withdraw(
      token,
      msg.sender,
      amount,
      tokens[token][msg.sender]
    );
  }

  function balanceOf(address token, address user) public view returns (uint256) {
    return tokens[token][user];
  }

}
