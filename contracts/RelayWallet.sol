pragma solidity ^0.4.19;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./socialtrading/libs/Wrap9.sol";
import "./socialtrading/Wallet.sol";
import "./socialtrading/interfaces/IExchange.sol";
import "./socialtrading/libs/LibBytes.sol";


contract RelayWallet is Wallet {
  using SafeMath for uint256;
  using LibBytes for bytes;
  mapping(address => mapping(address => uint256)) public tokens; //mapping of token addresses to mapping of account balances (token=0 means Ether)

  WETH9 weth;
  IExchange internal EXCHANGE;

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

  constructor(WETH9 _weth, address _exchange) public {
    weth = _weth;
    EXCHANGE = IExchange(_exchange);
  }

  function() public {
    revert("Unused fallback function");
  }

  function deposit() public payable {
    tokens[address(weth)][msg.sender] = tokens[address(weth)][msg.sender].add(msg.value);
    weth.deposit.value(msg.value)();
    weth.transfer(address(this), msg.value);
    Deposit(address(weth), msg.sender, msg.value, tokens[address(weth)][msg.sender]);
    abi.encode();
  }

  function depositToken(address token, uint256 amount) public {
    //remember to call ERC20(address).approve(this, amount) or this contract will not be able to do the transfer on your behalf.
    require(ERC20(token).transferFrom(msg.sender, address(this), amount), "Cannot transfer token from sender");
    tokens[token][msg.sender] = tokens[token][msg.sender].add(amount);
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

    bytes orderTakerAssetData = order.takerAssetData;
    bytes orderMakerAssetData = order.makerAssetData;
    address takerToken = orderTakerAssetData.readAddress(16);
    address makerToken = orderMakerAssetData.readAddress(16);

    require(tokens[takerToken][msg.sender] >= takerAssetFillAmount, "takerAssetFillAmount is more than user's balance");
    tokens[takerToken][msg.sender] = tokens[takerToken][msg.sender].sub(order.takerAssetAmount);
    tokens[makerToken][msg.sender] = tokens[makerToken][msg.sender].add(order.makerAssetAmount);

    // Call `fillOrder` via `executeTransaction`.
    EXCHANGE.executeTransaction(
      salt,
      takerAddress,
      data,
      takerSignature
    );
  }
}
