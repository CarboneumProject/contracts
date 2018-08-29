pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "./LibActivityInfo.sol";
import "./LibUserInfo.sol";
import "./ISocialTrading.sol";


contract SocialTrading is ISocialTrading {
  ERC20 public c8Token;
  address public feeAccount;

  mapping(address => mapping(address => LibUserInfo.Following)) public followerToLeaders; // Following list
  mapping(address => address[]) public followerToLeadersIndex; // Following list
  mapping(address => address[]) public leaderToFollowers; // Follower list

  mapping(address => uint) public relays;
  mapping(address => uint) public verifiers;

  mapping(address => uint256) public rewards;
  mapping(address => uint256) public claimedRewards;

  mapping(bytes32 => LibActivityInfo.Info) public closePositionActivities;

  event Follow(address leader, address follower, uint percentage);
  event UnFollow(address leader, address follower);
  event AddRelay(address relay);
  event AddVerifier(address verifier);
  event Activities(bytes32 offChainHash);
  event CloseActivity(bytes32 activityHash, address verifier);

  constructor (
    address _feeAccount,
    ERC20 _c8Token
  ) public
  {
    feeAccount = _feeAccount;
    c8Token = _c8Token;
  }

  function() public {
    revert();
  }

  /**
   * @dev Follow leader to copy trade.
   */
  function follow(address _leader, uint _percentage) external {
    uint index = followerToLeadersIndex[msg.sender].push(_leader);
    followerToLeaders[msg.sender][_leader] = LibUserInfo.Following(_leader, _percentage, index - 1);
    emit Follow(_leader, msg.sender, _percentage);
  }

  /**
   * @dev UnFollow leader to stop copy trade.
   */
  function unfollow(address _leader) external {
    uint rowToDelete = followerToLeaders[msg.sender][_leader].index;
    address keyToMove = followerToLeadersIndex[msg.sender][followerToLeadersIndex[msg.sender].length - 1];
    followerToLeadersIndex[msg.sender][rowToDelete] = keyToMove;
    followerToLeaders[msg.sender][keyToMove].index = rowToDelete;
    followerToLeadersIndex[msg.sender].length -= 1;
    emit UnFollow(_leader, msg.sender);
  }

  /**
   * @dev Register relay to contract by the owner.
   */
  function registerRelay(address _relay) onlyOwner external {
    relays[_relay] = 1;
    emit AddRelay(_relay);
  }

  /**
   * @dev Register verifier to contract by the owner.
   */
  function registerVerifier(address _verifier) onlyOwner external {
    verifiers[_verifier] = 1;
    emit AddVerifier(_verifier);
  }

  /**
   * @dev add trade activity log to contract by a trusted relay.
   */
  function tradeActivityBatch(bytes32 _sideChainHash) external {
    require(relays[msg.sender] == 1);
    emit Activities(_sideChainHash);
  }

  //  /**
  //   * @dev add close position activity log result to contract by a trusted relay.
  //   */
  //  function addCloseActivities(LibActivityInfo.Info[] _activities) external {
  //    require(relays[msg.sender] == 1);
  //    for (uint i = 0; i < _activities.length; i++) {
  //      bytes32 hash = _activities[i].activityHash;
  //      closePositionActivities[_activities[i].activityHash] = _activities[i];
  //      address verifier = getVerifier(hash);
  //      emit CloseActivity(hash, verifier);
  //    }
  //  }

  /**
   * @dev add activity log result to contract by trusted verifier.
   */
  function verifyActivityBatch(bytes32[] _activitiesHash, bool[] _result) external {
    require(verifiers[msg.sender] == 1);
  }

  function claimReward() external {
    require(rewards[msg.sender] > 0);
    claimedRewards[msg.sender] += rewards[msg.sender];
    rewards[msg.sender] = 0;
    require(c8Token.transfer(msg.sender, rewards[msg.sender]));
  }

  function getFriends(address _user) public view returns (address[]) {
    address[] memory result = new address[](followerToLeadersIndex[_user].length);
    uint counter = 0;
    for (uint i = 0; i < followerToLeadersIndex[_user].length; i++) {
      result[counter] = followerToLeadersIndex[_user][i];
      counter++;
    }
    return result;
  }

  function getFollowers(address _user) public view returns (address[]) {
    address[] memory result = new address[](followerToLeadersIndex[_user].length);
    uint counter = 0;
    for (uint i = 0; i < followerToLeadersIndex[_user].length; i++) {
      result[counter] = followerToLeadersIndex[_user][i];
      counter++;
    }
    return result;
  }

  function getVerifier(bytes32 hash) private returns (address) {
    return address(0);
  }
}