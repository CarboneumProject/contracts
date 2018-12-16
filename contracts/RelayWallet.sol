pragma solidity ^0.4.19;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./socialtrading/libs/Wrap9.sol";
import "./socialtrading/Wallet.sol";
import "./socialtrading/interfaces/IExchange.sol";
import "./socialtrading/libs/LibBytes.sol";
import "./socialtrading/Validator.sol";


contract RelayWallet is Validator, Wallet {

  mapping (bytes4 => address) public assetProxies;

  uint256 constant MAX_ALLOWANCE =~uint256(0);
  using SafeMath for uint256;
  using LibBytes for bytes;
  mapping(address => mapping(address => uint256)) public tokens; //mapping of token addresses to mapping of account balances (token=0 means Ether)

  WETH9 weth;
  IExchange internal EXCHANGE;
  address assetProxy;

  event Deposit(
    address token,
    address user,
    uint256 amount,
    uint256 balance
  );

  event Withdraw(
    address token,
    address user,
    uint256 amount,
    uint256 balance
  );

  constructor(WETH9 _weth, address _exchange, address _assetProxy) public {
    weth = _weth;
    EXCHANGE = IExchange(_exchange);
    assetProxy = _assetProxy;
    assetProxies[0xf47261b0] = _assetProxy;
  }

  function() public {
    revert("Unused fallback function");
  }

  function getAssetProxy(bytes4 assetProxyId)
  external
  view
  returns (address)
  {
    return EXCHANGE.getAssetProxy(assetProxyId);
  }

  function deposit() public payable {
    tokens[address(weth)][msg.sender] = tokens[address(weth)][msg.sender].add(msg.value);
    weth.deposit.value(msg.value)();
    weth.transfer(address(this), msg.value);
    uint256 checkAllowance = ERC20(weth).allowance(address(this), assetProxy);
    if (checkAllowance < ERC20(weth).balanceOf(address(this))){
      ERC20(weth).approve(assetProxy, MAX_ALLOWANCE);
    }
    Deposit(address(weth), msg.sender, msg.value, tokens[address(weth)][msg.sender]);
  }

  function depositToken(address token, uint256 amount) public {
    //remember to call ERC20(address).approve(this, amount) or this contract will not be able to do the transfer on your behalf.
    require(ERC20(token).transferFrom(msg.sender, address(this), amount), "Cannot transfer token from sender");
    tokens[token][msg.sender] = tokens[token][msg.sender].add(amount);
    uint256 checkAllowance = ERC20(token).allowance(address(this), assetProxy);
    if (checkAllowance < ERC20(token).balanceOf(address(this))){
      ERC20(token).approve(assetProxy, MAX_ALLOWANCE);
    }
    emit Deposit(
      token,
      msg.sender,
      amount,
      tokens[token][msg.sender]
    );
  }

  function withdrawToken(address token, uint256 amount) public {
    require(tokens[token][msg.sender] >= amount, "Withdraw amount is more than user's balance");
    tokens[token][msg.sender] = tokens[token][msg.sender].sub(amount);
    require(ERC20(token).transfer(msg.sender, amount), "Cannot transfer token");
    emit Withdraw(
      token,
      msg.sender,
      amount,
      tokens[token][msg.sender]
    );
  }

  function balanceOf(address token, address user) public constant returns (uint256) {
    return tokens[token][user];
  }

  /// @dev Cancels all orders created by sender with a salt less than or equal to the targetOrderEpoch
  ///      and senderAddress equal to this contract.
  /// @param targetOrderEpoch Orders created with a salt less or equal to this value will be cancelled.
  /// @param salt Arbitrary value to gaurantee uniqueness of 0x transaction hash.
  /// @param makerSignature Proof that maker wishes to call this function with given params.
  function cancelOrdersUpTo(
    uint256 targetOrderEpoch,
    uint256 salt,
    bytes makerSignature
  )
  external
  {
    address makerAddress = msg.sender;

    // Encode arguments into byte array.
    bytes memory data = abi.encodeWithSelector(
      EXCHANGE.cancelOrdersUpTo.selector,
      targetOrderEpoch
    );

    // Call `cancelOrdersUpTo` via `executeTransaction`.
    EXCHANGE.executeTransaction(
      salt,
      makerAddress,
      data,
      makerSignature
    );
  }

  /// @dev Fills an order using `msg.sender` as the taker.
  /// @param order Order struct containing order specifications.
  /// @param takerAssetFillAmount Desired amount of takerAsset to sell.
  /// @param salt Arbitrary value to gaurantee uniqueness of 0x transaction hash.
  /// @param orderSignature Proof that order has been created by maker.
  /// @param takerSignature Proof that taker wishes to call this function with given params.
  function fillOrder(
    LibOrder.Order memory order,
    uint256 takerAssetFillAmount,
    uint256 salt,
    bytes memory orderSignature,
    bytes memory takerSignature
  )
  public
  {
    address takerAddress = msg.sender;

    // Encode arguments into byte array.
    bytes memory data = abi.encodeWithSelector(
      EXCHANGE.fillOrder.selector,
      order,
      takerAssetFillAmount,
      orderSignature
    );
    // Todo check if it is the token only.
    address takerToken = order.takerAssetData.readAddress(16);
    address makerToken = order.makerAssetData.readAddress(16);

    require(tokens[takerToken][msg.sender] >= takerAssetFillAmount, "takerAssetFillAmount is more than user's balance");
    tokens[takerToken][msg.sender] = tokens[takerToken][msg.sender].sub(order.takerAssetAmount);
    tokens[makerToken][msg.sender] = tokens[makerToken][msg.sender].add(order.makerAssetAmount);

    // Todo can social trading to distribute copy trade fee.

    // Call `fillOrder` via `executeTransaction`.
    EXCHANGE.executeTransaction(
      salt,
      takerAddress,
      data,
      takerSignature
    );
  }
}
