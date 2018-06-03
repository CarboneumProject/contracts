pragma solidity ^0.4.21;

import "zeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";


contract StockRadarsSubscription is Ownable {
  using SafeMath for uint256;

  /// @dev The token being use (C8)
  ERC20 public token;

  /// @dev Address where funds are collected
  address public wallet;

  /// @dev Timestamp of when Membership expires UserId=>timestamp of expire.
  mapping(uint256 => uint256) public subscriptionExpiration;

  /// @dev Cost per day of membership for C8 token
  uint256 public subscriptionRate;

  /**
   * Event for subscription purchase logging
   * @param purchaser who paid for the subscription
   * @param userId user id who will benefit from purchase
   * @param amount amount of tokens purchased
   * @param expiration expiration of user subscription.
   */
  event SubscriptionPurchase(address indexed purchaser, uint256 userId, uint256 amount, uint256 expiration);

  function StockRadarsSubscription(
    uint256 _rate,
    address _fundWallet,
    ERC20 _token) public
  {
    require(_token != address(0));
    require(_fundWallet != address(0));
    require(_rate > 0);
    token = _token;
    wallet = _fundWallet;
    subscriptionRate = _rate;
  }

  /// @dev Set Cost per day of membership by owner.
  function setRate(uint256 _rate) public onlyOwner {
    subscriptionRate = _rate;
  }

  function renewSubscription(uint256 _userId, uint256 _weiAmount) external {
    require(token.transferFrom(msg.sender, wallet, _weiAmount));
    uint256 daysToAdd = _weiAmount / subscriptionRate;
    require(daysToAdd >= 1);
    uint256 currentExpiration = subscriptionExpiration[_userId];
    // If their membership already expired...
    if (currentExpiration < now) {
      // ...use `now` as the starting point of their new subscription
      currentExpiration = now;
    }
    uint256 newExpiration = currentExpiration + daysToAdd * 1 days;
    subscriptionExpiration[_userId] = newExpiration;
    emit SubscriptionPurchase(msg.sender, _userId, _weiAmount, newExpiration);
  }
}
