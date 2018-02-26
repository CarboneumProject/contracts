pragma solidity ^0.4.13;

import 'zeppelin-solidity/contracts/token/ERC20/MintableToken.sol';
import 'zeppelin-solidity/contracts/token/ERC20/BurnableToken.sol';

contract CarboneumToken is MintableToken, BurnableToken {
    string public name = "Carboneum Protocol Token";
    string public symbol = "C8";
    uint8 public decimals = 18;

    uint256 public constant MAX_SUPPLY = 200 * (10 ** 6) * (10 ** uint256(decimals));

    function CarboneumToken() public {

    }
}