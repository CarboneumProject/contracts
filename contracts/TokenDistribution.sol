pragma solidity ^0.4.17;

import "zeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";

contract TokenDistribution is Ownable {
  using SafeMath for uint256;

  ERC20 public token;

  address public wallet;

  function TokenDistribution(
    ERC20 _token,
    address _wallet) public
  {
    require(_token != address(0));
    require(_wallet != address(0));
    token = _token;
    wallet = _wallet;
  }

  function sendToken(address[] _beneficiaries, uint256 _amount) external onlyOwner {
    for (uint256 i = 0; i < _beneficiaries.length; i++) {
      require(token.transferFrom(wallet, _beneficiaries[i], _amount));
    }
  }
}
