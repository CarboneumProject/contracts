pragma solidity ^0.4.13;

import 'zeppelin-solidity/contracts/token/ERC20/BurnableToken.sol';
import 'zeppelin-solidity/contracts/token/ERC20/StandardToken.sol';

contract CarboneumToken is StandardToken, BurnableToken {
    string public name = "Carboneum";
    string public symbol = "C8";
    uint8 public decimals = 18;
    uint256 public constant INITIAL_SUPPLY = 200 * (10 ** 6) * (10 ** uint256(decimals)); // 200 million tokens, 18 decimal places

    function CarboneumToken() public {
        totalSupply_ = INITIAL_SUPPLY;
        balances[msg.sender] = INITIAL_SUPPLY;
        Transfer(0x0, msg.sender, INITIAL_SUPPLY);
    }
}
