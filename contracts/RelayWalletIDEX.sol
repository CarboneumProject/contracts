pragma solidity ^0.4.19;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./idex/Exchange.sol";


contract RelayWalletIDEX {
  using SafeMath for uint256;
  mapping(address => mapping(address => uint256)) public tokens; //mapping of token addresses to mapping of account balances (token=0 means Ether)

  Exchange internal IDEX;

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

  constructor(address _exchange) public {
    weth = _weth;
    EXCHANGE = Exchange(_exchange);
  }

  function() public {
    revert("Unused fallback function");
  }

  function deposit() public payable {
    tokens[address(weth)][msg.sender] = tokens[address(weth)][msg.sender].add(msg.value);
    weth.deposit.value(msg.value)();
    weth.transfer(address(this), msg.value);
    Deposit(address(weth), msg.sender, msg.value, tokens[address(weth)][msg.sender]);
  }

  function depositToken(address token, uint256 amount) public {
    //remember to call ERC20(address).approve(this, amount) or this contract will not be able to do the transfer on your behalf.
    require(ERC20(token).transferFrom(msg.sender, address(this), amount), "Cannot transfer token from sender");
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
    require(ERC20(token).transfer(msg.sender, amount), "Cannot transfer token");
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
