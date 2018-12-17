pragma solidity ^0.4.19;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";


contract RelayWalletIDEX {
  using SafeMath for uint256;
  address custodian;
  mapping(address => mapping(address => uint256)) public tokens; //mapping of token addresses to mapping of account balances (token=0 means Ether)

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

  function() public {
    revert("Unused fallback function");
  }

  function deposit() public payable {
    custodian.transfer(msg.value);
    tokens[address(0)][msg.sender] = tokens[address(0)][msg.sender].add(msg.value);
    emit Deposit(address(0), msg.sender, msg.value, tokens[address(0)][msg.sender]);
  }

  function withdraw() public payable {
    require(tokens[address(0)][msg.sender] >= msg.value, "Withdraw amount is more than user's balance");
    tokens[address(0)][msg.sender] = tokens[address(0)][msg.sender].sub( msg.value);
    msg.sender.transfer( msg.value);
    emit Withdraw(
      address(0),
      msg.sender,
        msg.value,
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

  function balanceOf(address token, address user) public constant returns (uint256) {
    return tokens[token][user];
  }

}
