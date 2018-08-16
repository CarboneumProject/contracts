pragma solidity 0.4.24;
pragma experimental ABIEncoderV2;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/token/ERC20/ERC20.sol";


contract SocialTrading is Ownable {
  enum FeeType {
    REWARD_FEE,
    RELAY_FEE,
    VERIFIER_FEE
  }
  uint public rewardFee; //percentage times (1 ether)
  uint public relayFee; //percentage times (1 ether)
  uint public verifierFee; //percentage times (1 ether)
  ERC20 public feeToken;
  address public feeAccount;

  mapping(address => mapping(address => bool)) public following;
  mapping(address => uint) public relays;
  mapping(address => uint) public verifiers;

  mapping(address => uint256) rewards;
  mapping(address => uint256) claimedRewards;

  struct ClosePositionActivity {
    bytes32 buyTx;
    bytes32 sellTx;
    address leaders;
    address followers;
    int256 gainLoss;
  }


  function CopyTrading(
    address _feeAccount,
    ERC20 _feeToken,
    uint _rewardFee,
    uint _relayFee,
    uint _verifierFee
  ) public
  {
    feeAccount = _feeAccount;
    rewardFee = _rewardFee;
    feeToken = _feeToken;
    relayFee = _relayFee;
    verifierFee = _verifierFee;
  }

  event Follow(address leader, address follower);
  event UnFollow(address leader, address follower);
  event FeeChange(FeeType feeType, uint oldFee, uint newFee);
  event AddRelay(address relay);
  event AddVerifier(address verifier);
  event Activities(bytes32 offChainHash);

  function() public {
    revert();
  }

  function changeRewardFee(uint _fee) external onlyOwner {
    emit FeeChange(FeeType.REWARD_FEE, rewardFee, _fee);
    rewardFee = _fee;
  }

  function changeRelayFee(uint _fee) external onlyOwner {
    emit FeeChange(FeeType.RELAY_FEE, relayFee, _fee);
    relayFee = _fee;
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
   * @dev Register relay to contract by the owner.
   */
  function registerRelay(address relay) onlyOwner external {
    relays[relay] = 1;
    emit AddRelay(relay);
  }

  /**
   * @dev Register verifier to contract by the owner.
   */
  function registerVerifier(address verifier) onlyOwner external {
    verifiers[verifier] = 1;
    emit AddVerifier(verifier);
  }

  /**
   * @dev add trade activity log to contract by trusted relay.
   */
  function tradeActivityBatch(bytes32 sideChainHash) external {
    require(relays[msg.sender] == 1);
    emit Activities(sideChainHash);
  }

  /**
   * @dev add verify activity log result to contract by trusted verifier.
   */
  function verifyActivityBatch(ClosePositionActivity[] activity) external {
    require(verifiers[msg.sender] == 1);
    // TODO Calc reward.
    // Transfer token from follower to this contract.
    // Contract spiting fee to leader, relay and verifier the keep balance.
  }

  function claimReward() external {
    claimedRewards[msg.sender] += rewards[msg.sender];
    rewards[msg.sender] = 0;
    require(feeToken.transfer(msg.sender, rewards[msg.sender]));
  }
}