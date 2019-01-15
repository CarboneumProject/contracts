pragma solidity ^0.4.13;

import "openzeppelin-solidity/contracts/token/ERC20/BurnableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol";


contract CarboneumToken is StandardToken, BurnableToken {
  string public name = "Carboneum";
  string public symbol = "C8";
  uint8 public decimals = 18;
  uint256 public constant INITIAL_SUPPLY = 200000000000000000000000000; // 200 million tokens, 18 decimal places

  function CarboneumToken() public {
    totalSupply_ = INITIAL_SUPPLY;
    balances[msg.sender] = INITIAL_SUPPLY;
    emit Transfer(0x0, msg.sender, INITIAL_SUPPLY);
  }
}
