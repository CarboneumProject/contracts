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
  mapping(address => mapping(address => uint)) public leaderToFollowers;
  mapping(address => address[]) public leaderToFollowersIndex; // Follower list

  mapping(address => bool) public relays;
  mapping(address => bool) public verifiers;

  mapping(address => uint256) public rewards;
  mapping(address => uint256) public claimedRewards;

  mapping(bytes32 => LibActivityInfo.Info) public closePositionActivities;

  event Follow(address indexed leader, address indexed follower, uint percentage);
  event UnFollow(address indexed leader, address indexed follower);
  event AddRelay(address indexed relay);
  event AddVerifier(address indexed verifier);
  event Activities(bytes32 indexed offChainHash);
  event CloseActivity(bytes32 indexed activityHash, address indexed verifier);

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
    require(getCurrentPercentage(msg.sender) + _percentage <= 100 ether);
    uint index = followerToLeadersIndex[msg.sender].push(_leader) - 1;
    followerToLeaders[msg.sender][_leader] = LibUserInfo.Following(_leader, _percentage, now, index);

    uint index2 = leaderToFollowersIndex[_leader].push(msg.sender) - 1;
    leaderToFollowers[_leader][msg.sender] = index2;
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

    uint rowToDelete2 = leaderToFollowers[_leader][msg.sender];
    address keyToMove2 = leaderToFollowersIndex[_leader][leaderToFollowersIndex[_leader].length - 1];
    leaderToFollowersIndex[_leader][rowToDelete2] = keyToMove2;
    leaderToFollowers[_leader][keyToMove2] = rowToDelete2;
    leaderToFollowersIndex[_leader].length -= 1;
    emit UnFollow(_leader, msg.sender);
  }

  /**
   * @dev Register relay to contract by the owner.
   */
  function registerRelay(address _relay) onlyOwner external {
    relays[_relay] = true;
    emit AddRelay(_relay);
  }

  /**
   * @dev Register verifier to contract by the owner.
   */
  function registerVerifier(address _verifier) onlyOwner external {
    verifiers[_verifier] = true;
    emit AddVerifier(_verifier);
  }

  /**
   * @dev add trade activity log to contract by a trusted relay.
   */
  function tradeActivityBatch(bytes32 _sideChainHash) external {
    require(relays[msg.sender]);
    emit Activities(_sideChainHash);
  }

  /**
   * @dev add close activities from relay.
   */
  function addCloseActivities(bytes32[] activitiesHash) external {
    require(relays[msg.sender]);
    for (uint i = 0; i < activitiesHash.length; i++) {
      emit CloseActivity(activitiesHash[i], getVerifier(activitiesHash[i]));
    }
  }

  /**
   * @dev add activity log result to contract by trusted verifier.
   */
  function verifyActivityBatch(bytes32[] _activitiesHash, bool[] _result) external {
    require(verifiers[msg.sender]);
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
    address[] memory result = new address[](leaderToFollowersIndex[_user].length);
    uint counter = 0;
    for (uint i = 0; i < leaderToFollowersIndex[_user].length; i++) {
      result[counter] = leaderToFollowersIndex[_user][i];
      counter++;
    }
    return result;
  }

  function getVerifier(bytes32 hash) private returns (address) {
    return address(0);
  }

  function getCurrentPercentage(address _user) internal returns (uint) {
    uint sum = 0;
    for (uint i = 0; i < followerToLeadersIndex[_user].length; i++) {
      address leader = followerToLeadersIndex[_user][i];
      sum += followerToLeaders[_user][leader].percentage;
    }
    return sum;
  }
}