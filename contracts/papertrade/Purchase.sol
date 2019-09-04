pragma solidity ^0.4.21;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";


contract Purchase is Ownable {
  uint256 constant UINT256_MAX = ~uint256(0);
  using SafeMath for uint256;

  /// @dev The token being use (C8)
  ERC20 public token;

  /// @dev Address where fee are collected
  address public wallet;

  uint256 resetPrice;

  mapping(uint256 => uint256) public packages;

  constructor (
    address _fundWallet,
    ERC20 _token,
    uint256 _resetPrice) public
  {
    require(_token != address(0), "INVALID TOKEN ADDRESS");
    require(_fundWallet != address(0), "INVALID WALLET ADDRESS");
    token = _token;
    wallet = _fundWallet;
    resetPrice = _resetPrice;
  }

  event Buy(uint256 _accountId, uint256 _amount);

  function setResetPrice(uint256 _resetPrice) external onlyOwner {
    resetPrice = _resetPrice;
  }

  function setPackagePrice(uint256 _amount, uint256 _price) external onlyOwner {
    packages[_amount] = _price;
  }

  function resetPortfolio(uint256 _accountId) external {
    require(token.transferFrom(msg.sender, wallet, resetPrice), "TRANSFER ERROR");
  }

  function buyFund(uint256 _accountId, uint256 _amount) external {
    uint256 price = packages[_amount];
    require(price != 0, "NEED PACKAGE PRICE");
    require(token.transferFrom(msg.sender, wallet, price), "TRANSFER ERROR");
    emit Buy(_accountId, _amount);
  }
}
