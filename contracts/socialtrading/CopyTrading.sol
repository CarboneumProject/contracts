pragma solidity 0.4.24;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/token/ERC20/ERC20.sol";


contract CopyTrading is Ownable {
  enum FeeType {
    REWARD_FEE,
    RELAYER_FEE,
    VERIFIER_FEE
  }
  uint public rewardFee; //percentage times (1 ether)
  uint public relayerFee; //percentage times (1 ether)
  uint public verifierFee; //percentage times (1 ether)
  ERC20 public feeToken;
  address public feeAccount;

  mapping(address => mapping(address => bool)) public following;
  address[] public relayers;
  address[] public verifiers;


  function CopyTrading(
    address _feeAccount,
    ERC20 _feeToken,
    uint _rewardFee,
    uint _relayerFee,
    uint _verifierFee
  ) public
  {
    feeAccount = _feeAccount;
    rewardFee = _rewardFee;
    feeToken = _feeToken;
    relayerFee = _relayerFee;
    verifierFee = _verifierFee;
  }

  event Follow(address leader, address follower);
  event UnFollow(address leader, address follower);
  event FeeChange(FeeType feeType, uint oldFee, uint newFee);
  event AddRelayer(address relayer);
  event AddVerifier(address verifier);
  event Activities(bytes32 offChainHash);

  function() public {
    revert();
  }

  function changeRewardFee(uint _fee) external onlyOwner {
    emit FeeChange(FeeType.REWARD_FEE, rewardFee, _fee);
    rewardFee = _fee;
  }

  function changeRelayerFee(uint _fee) external onlyOwner {
    emit FeeChange(FeeType.RELAYER_FEE, relayerFee, _fee);
    relayerFee = _fee;
  }

  function changeVerifierFee(uint _fee) external onlyOwner {
    emit FeeChange(FeeType.VERIFIER_FEE, verifierFee, _fee);
    verifierFee = _fee;
  }

  /**
   * @dev Follow leader to copy trade.
   */
  function follow(address leader) external {
    following[leader][msg.sender] = true;
    emit Follow(leader, msg.sender);
  }

  /**
   * @dev UnFollow leader to stop copy trade.
   */
  function unfollow(address leader) external {
    following[leader][msg.sender] = false;
    emit UnFollow(leader, msg.sender);
  }

  /**
   * @dev Register relayer to contract by the owner.
   */
  function registerRelayer(address relayer) onlyOwner external {
    relayers.push(relayer);
    emit AddRelayer(relayer);
  }

  /**
   * @dev Register verifier to contract by the owner.
   */
  function registerVerifier(address verifier) onlyOwner external {
    verifiers.push(verifier);
    emit AddVerifier(verifier);
  }

  /**
   * @dev add trade activity log to contract by trusted relayer.
   */
  function tradeActivityBatch(bytes32 offChainHash) onlyRelay external {
    emit Activities(offChainHash);
  }

  /**
   * @dev Throws if called by any account other than the relayer.
   */
  modifier onlyRelay() {
    require(msg.sender == owner);
    _;
  }
}