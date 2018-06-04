pragma solidity ^0.4.21;

import "zeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";


contract Subscription is Ownable {
  using SafeMath for uint256;

  /// @dev The token being use (C8)
  ERC20 public token;

  /// @dev Address where fee are collected
  address public wallet;

  /// @dev Cost per day of membership for C8 token
  uint256 public subscriptionRate;

  uint public fee;

  struct Application {
    /// @dev Application Id.
    uint256 appId;

    /// @dev Application name.
    bytes32 appName;

    /// @dev Cost per day of membership for C8 token
    uint256 price;

    /// @dev Beneficiary address.
    address beneficiary;

    /// @dev Owner address.
    address owner;

    /// @dev Timestamp of when Membership expires UserId=>timestamp of expire.
    mapping(uint256 => uint256) subscriptionExpiration;
  }

  mapping(uint256 => Application) public applications;

  /**
   * Event for subscription purchase logging
   * @param purchaser who paid for the subscription
   * @param userId user id who will benefit from purchase
   * @param amount amount of tokens purchased
   * @param expiration expiration of user subscription.
   */
  event SubscriptionPurchase(
    address indexed purchaser,
    uint256 indexed _appId,
    uint256 indexed userId,
    uint256 amount,
    uint256 expiration
  );

  event Registration(
    address indexed creator,
    uint256 _appId,
    bytes32 _appName,
    uint256 _price,
    address _beneficiary
  );

  function Subscription(
    uint _fee,
    address _fundWallet,
    ERC20 _token) public
  {
    require(_token != address(0));
    require(_fundWallet != address(0));
    require(_fee > 0);
    token = _token;
    wallet = _fundWallet;
    fee = _fee;
  }

  function renewSubscriptionByDays(uint256 _appId, uint256 _userId, uint _day) external {
    Application storage app = applications[_appId];
    require(app.appId == _appId);
    uint256 amount = _day * app.price;
    renewSubscriptionByAmount(_appId, _userId, amount);
  }

  function registration(
    uint256 _appId,
    bytes32 _appName,
    uint256 _price,
    address _beneficiary)
  external
  {
    require(applications[_appId].appId == 0);
    require(_appName != "");
    require(_price > 0);
    require(_beneficiary != address(0));
    Application storage app = applications[_appId];
    app.appId = _appId;
    app.appName = _appName;
    app.price = _price;
    app.beneficiary = _beneficiary;
    app.owner = msg.sender;
    emit Registration(
      msg.sender,
      _appId,
      _appName,
      _price,
      _beneficiary);
  }

  function setPrice(uint256 _appId, uint256 _price) external {
    Application storage app = applications[_appId];
    require(app.owner == msg.sender);
    app.price = _price;
  }

  /// @dev Set fee percent for Carboneum team.
  function setFee(uint _fee) external onlyOwner {
    fee = _fee;
  }

  function getExpiration(uint256 _appId, uint256 _userId) public view returns (uint256) {
    Application storage app = applications[_appId];
    return app.subscriptionExpiration[_userId];
  }

  function renewSubscriptionByAmount(uint256 _appId, uint256 _userId, uint256 _weiAmount) public {
    Application storage app = applications[_appId];
    require(app.appId == _appId);
    uint256 txFee = processFee(_weiAmount);
    uint256 toAppOwner = _weiAmount - txFee;
    require(token.transferFrom(msg.sender, app.beneficiary, toAppOwner));

    uint256 daysToAdd = _weiAmount / app.price;
    require(daysToAdd >= 1, "Purchase period must longer than 1 day.");
    uint256 currentExpiration = app.subscriptionExpiration[_userId];
    // If their membership already expired...
    if (currentExpiration < now) {
      // ...use `now` as the starting point of their new subscription
      currentExpiration = now;
    }
    uint256 newExpiration = currentExpiration + daysToAdd * 1 days;
    app.subscriptionExpiration[_userId] = newExpiration;
    emit SubscriptionPurchase(
      msg.sender,
      _appId,
      _userId,
      _weiAmount,
      newExpiration);
  }

  function processFee(uint256 _weiAmount) internal returns (uint256) {
    uint256 txFee = _weiAmount * fee / 100;
    require(token.transferFrom(msg.sender, wallet, txFee));
    return txFee;
  }
}
