pragma solidity ^0.4.17;

import "zeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";


contract BountyClaims is Ownable {
  using SafeMath for uint256;

  ERC20 public token;

  address public wallet;

  mapping(address => uint256) bountyTokens;

  event Claim(
    address indexed beneficiary,
    uint256 amount
  );

  function BountyClaims(
    ERC20 _token,
    address _wallet) public
  {
    require(_token != address(0));
    require(_wallet != address(0));
    token = _token;
    wallet = _wallet;
  }

  function() external payable {
    claimToken(msg.sender);
  }

  function setUsersBounty(address[] _beneficiaries, uint256[] _amounts) external onlyOwner {
    for (uint i = 0; i < _beneficiaries.length; i++) {
      bountyTokens[_beneficiaries[i]] = _amounts[i];
    }
  }

  function setGroupBounty(address[] _beneficiaries, uint256 _amount) external onlyOwner {
    for (uint256 i = 0; i < _beneficiaries.length; i++) {
      bountyTokens[_beneficiaries[i]] = _amount;
    }
  }

  function getUserBounty(address _beneficiary) public view returns (uint256) {
    return  bountyTokens[_beneficiary];
  }

  function claimToken(address _beneficiary) public payable {
    uint256 amount = bountyTokens[_beneficiary];
    require(amount > 0);
    bountyTokens[_beneficiary] = 0;
    require(token.transferFrom(wallet, _beneficiary, amount));
    emit Claim(_beneficiary, amount);
  }
}
