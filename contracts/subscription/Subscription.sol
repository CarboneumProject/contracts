pragma solidity ^0.4.21;

import "zeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";


contract Subscription is Ownable {
  uint256 constant UINT256_MAX = ~uint256(0);
  using SafeMath for uint256;

  /// @dev The token being use (C8)
  ERC20 public token;

  /// @dev Address where fee are collected
  address public wallet;

  /// @dev Cost per day of membership for C8 token
  uint256 public subscriptionRate;

  uint public fee;

  uint256 lastAppId;

  struct Pricing {
    uint256 day;
    uint256 price;
  }

  struct Application {
    /// @dev Application Id.
    uint256 appId;

    /// @dev Application name.
    bytes32 appName;

    /// @dev Beneficiary address.
    address beneficiary;

    /// @dev Owner address.
    address owner;

    /// @dev Timestamp of when Membership expires UserId=>timestamp of expire.
    mapping(uint256 => uint256) subscriptionExpiration;

    Pricing[] prices;
  }

  mapping(uint256 => Application) public applications;

  /**
   * Event for subscription purchase logging
   * @param purchaser who paid for the subscription
   * @param userId user id who will benefit from purchase
   * @param day day of subscription purchased
   * @param expiration expiration of user subscription.
   */
  event SubscriptionPurchase(
    address indexed purchaser,
    uint256 indexed _appId,
    uint256 indexed userId,
    uint256 day,
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
    lastAppId = 0;
  }

  function renewSubscriptionByDays(uint256 _appId, uint256 _userId, uint _day) external {
    Application storage app = applications[_appId];
    require(app.appId == _appId);
    require(_day >= 1);
    uint256 amount = UINT256_MAX;
    for (uint i = 0; i < app.prices.length; i++) {
      if (_day >= app.prices[i].day) {
        uint256 rate = app.prices[i].price / app.prices[i].day;
        uint256 amountInPrice = _day * rate;
        if (amountInPrice < amount) {
          amount = amountInPrice;
        }
      }
    }
    require(amount != UINT256_MAX);

    uint256 txFee = processFee(amount);
    uint256 toAppOwner = amount - txFee;
    require(token.transferFrom(msg.sender, app.beneficiary, toAppOwner));

    uint256 currentExpiration = app.subscriptionExpiration[_userId];
    // If their membership already expired...
    if (currentExpiration < now) {
      // ...use `now` as the starting point of their new subscription
      currentExpiration = now;
    }
    uint256 newExpiration = currentExpiration + _day * 1 days;
    app.subscriptionExpiration[_userId] = newExpiration;
    emit SubscriptionPurchase(
      msg.sender,
      _appId,
      _userId,
      _day,
      newExpiration);
  }

  function registration(
    bytes32 _appName,
    uint256 _price,
    address _beneficiary)
  external
  {
    require(_appName != "");
    require(_price > 0);
    require(_beneficiary != address(0));
    lastAppId = lastAppId + 1;
    Application storage app = applications[lastAppId];
    app.appId = lastAppId;
    app.appName = _appName;
    app.beneficiary = _beneficiary;
    app.owner = msg.sender;
    app.prices.push(Pricing({
      day : 1,
      price : _price
      }));
    emit Registration(
      msg.sender,
      lastAppId,
      _appName,
      _price,
      _beneficiary);
  }

  function setPrice(uint256 _appId, uint256[] _days, uint256[] _prices) external {
    Application storage app = applications[_appId];
    require(app.owner == msg.sender);
    app.prices.length = 0;
    for (uint i = 0; i < _days.length; i++) {
      require(_days[i] > 0);
      require(_prices[i] > 0);
      app.prices.push(Pricing({
        day : _days[i],
        price : _prices[i]
        }));
    }
  }

  /// @dev Set fee percent for Carboneum team.
  function setFee(uint _fee) external onlyOwner {
    fee = _fee;
  }

  function getExpiration(uint256 _appId, uint256 _userId) public view returns (uint256) {
    Application storage app = applications[_appId];
    return app.subscriptionExpiration[_userId];
  }

  function getPrice(uint256 _appId, uint256 _day) public view returns (uint256) {
    Application storage app = applications[_appId];
    uint256 amount = UINT256_MAX;
    for (uint i = 0; i < app.prices.length; i++) {
      if (_day >= app.prices[i].day) {
        uint256 rate = app.prices[i].price / app.prices[i].day;
        uint256 amountInPrice = _day * rate;
        if (amountInPrice < amount) {
          amount = amountInPrice;
        }
      }
    }
    if (amount == UINT256_MAX) {
      amount = 0;
    }
    return amount;
  }

  function processFee(uint256 _weiAmount) internal returns (uint256) {
    uint256 txFee = _weiAmount * fee / 100;
    require(token.transferFrom(msg.sender, wallet, txFee));
    return txFee;
  }
}
