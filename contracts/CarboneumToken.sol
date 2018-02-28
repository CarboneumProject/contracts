pragma solidity ^0.4.13;

import 'zeppelin-solidity/contracts/token/ERC20/MintableToken.sol';
import 'zeppelin-solidity/contracts/token/ERC20/BurnableToken.sol';

contract CarboneumToken is MintableToken, BurnableToken {
    string public name = "Carboneum";
    string public symbol = "C8";
    uint8 public decimals = 18;
    function CarboneumToken() public {
    }
}