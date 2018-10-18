pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "./LibActivityInfo.sol";
import "./LibUserInfo.sol";
import "./ISocialTrading.sol";


contract SocialTrading is ISocialTrading {
  ERC20 public c8Token;
  address public feeAccount;

  address[] public verifiersList;
  address[] public pickedVerifiers;
  uint256 public sumStake;

  mapping(address => mapping(address => LibUserInfo.Following)) public followerToLeaders; // Following list
  mapping(address => address[]) public followerToLeadersIndex; // Following list
  mapping(address => mapping(address => uint)) public leaderToFollowers;
  mapping(address => address[]) public leaderToFollowersIndex; // Follower list

  mapping(address => bool) public relays;

  mapping(address => uint256) public stakeVerifiers;
  mapping(address => uint256) public rewards;
  mapping(address => uint256) public claimedRewards;

  mapping(bytes32 => LibActivityInfo.Info) public closePositionActivity;

  event Follow(address indexed leader, address indexed follower, uint percentage);
  event UnFollow(address indexed leader, address indexed follower);
  event AddRelay(address indexed relay);
  event AddVerifier(address indexed verifier);
  event CancelVerifier(address indexed verifier);
  event Activities(bytes32 indexed offChainHash);
  event CloseActivity(bytes32 indexed activityHash, address indexed verifier);
  event ResultFailed(bytes32 indexed activityHash, bool result);

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
    require(getCurrentPercentage(msg.sender) + _percentage <= 100 ether, "YOUR PERCENTAGE MORE THAN 100%.");
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
    _unfollow(msg.sender, _leader);
  }

  function _unfollow(address _follower, address _leader) private {
    uint rowToDelete = followerToLeaders[_follower][_leader].index;
    address keyToMove = followerToLeadersIndex[_follower][followerToLeadersIndex[_follower].length - 1];
    followerToLeadersIndex[_follower][rowToDelete] = keyToMove;
    followerToLeaders[_follower][keyToMove].index = rowToDelete;
    followerToLeadersIndex[_follower].length -= 1;

    uint rowToDelete2 = leaderToFollowers[_leader][_follower];
    address keyToMove2 = leaderToFollowersIndex[_leader][leaderToFollowersIndex[_leader].length - 1];
    leaderToFollowersIndex[_leader][rowToDelete2] = keyToMove2;
    leaderToFollowers[_leader][keyToMove2] = rowToDelete2;
    leaderToFollowersIndex[_leader].length -= 1;
    emit UnFollow(_leader, _follower);
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
  function registerVerifier(uint256 _stakeAmount) external {
    require(checkListVerifiers(), "YOU HAS BEEN REGISTERED.");
    require(c8Token.balanceOf(msg.sender) > 0, "YOUR AMOUNT MUST BE MORE THAN 0.");
    c8Token.transferFrom(msg.sender, address(this), _stakeAmount);
    verifiersList.push(msg.sender);
    stakeVerifiers[msg.sender] = _stakeAmount;
    sumStake += _stakeAmount;
    emit AddVerifier(msg.sender);
  }

  function cancelVerifier() external {
    require(checkVerifiers(), "YOU HAS NEVER BEEN REGISTERED.");
    require(stakeVerifiers[msg.sender] > 0, "YOUR AMOUNT MUST BE MORE THAN 0.");
    uint256 stakeVerifier = stakeVerifiers[msg.sender];
    stakeVerifiers[msg.sender] = 0;
    require(c8Token.transfer(msg.sender, stakeVerifier));
  }

  /**
   * @dev add trade activity log to contract by a trusted relay.
   */
  function tradeActivity(bytes32 _sideChainHash) external {
    require(relays[msg.sender], "YOU ARE NOT RELAY.");
    emit Activities(_sideChainHash);
  }

  /**
   * @dev add close activities from relay.
   */
  function addCloseActivities(
    address _leader,
    address _follower,
    address _relay,
    address[] _verifiers,
    bytes32 _buyTx,
    bytes32 _sellTx,
    uint256 _rewardFee,
    uint256 _relayFee,
    uint256 _verifierFee,
    uint _closePositionTimestampInSec,
    bytes32 _activityHash,
    bool _isTransfer
  ) external
  {
    require(relays[msg.sender], "YOU ARE NOT RELAY.");
    LibActivityInfo.Info storage activities = closePositionActivity[_activityHash];
    activities.leader = _leader;
    activities.follower = _follower;
    activities.relay = _relay;
    activities.verifiers = _verifiers;
    activities.buyTx = _buyTx;
    activities.sellTx = _sellTx;
    activities.rewardFee = _rewardFee;
    activities.relayFee = _relayFee;
    activities.verifierFee = _verifierFee;
    activities.closePositionTimestampInSec = _closePositionTimestampInSec;
    activities.activityHash = _activityHash;
    activities.isTransfer = _isTransfer;
    emit CloseActivity(_activityHash, getVerifier(_activityHash));
  }

  /**
   * @dev add activity log result to contract by trusted verifier.
   */
  function verifyActivity(bytes32 _activityHash, bool _resultVotes) external {
    require(checkPickedVerifiers(), "YOU ARE NOT VERIFIER.");
    require(getVerifiersToCheck(_activityHash), "CAN NOT SEND ONE MORE VERIFY.");
    LibActivityInfo.Info storage activities = closePositionActivity[_activityHash];
    uint timeout = activities.closePositionTimestampInSec + 1 hours;
    uint latestTimeout = timeout + 1 hours;
    activities.results.push(LibActivityInfo.ValidatorResult({
      validator : msg.sender,
      result : _resultVotes,
      time : now
      }));
    if (_resultVotes) {
      activities.counterTrue++;
    } else {
      activities.counterFalse++;
    }

    if (activities.counterTrue > activities.counterFalse) {
      if (pickedVerifiers.length == activities.results.length && timeout >= now) {
        if (activities.results[activities.results.length - 1].validator == msg.sender) {
          _transferFee(_activityHash);
        }
      } else if (pickedVerifiers.length != activities.results.length && timeout < now) {
        if (activities.isTransfer == false) {
          _transferFee(_activityHash);
          activities.isTransfer = true;
        }
      }
    }
  }

  function _transferFee(bytes32 _activityHash) private {
    LibActivityInfo.Info storage activities = closePositionActivity[_activityHash];
    uint256 value = activities.rewardFee + activities.relayFee + activities.verifierFee;
    uint256 allowance = c8Token.allowance(activities.follower, address(this));
    uint256 balance = c8Token.balanceOf(activities.follower);

    if ((balance >= value) && (allowance >= value)) {
      c8Token.transferFrom(activities.follower, address(this), value);
      rewards[activities.leader] += activities.rewardFee;
      rewards[activities.relay] += activities.relayFee;
      for (uint i = 0; i < activities.results.length; i++) {
        if (activities.results[i].result) {
          rewards[activities.results[i].validator] += activities.verifierFee;
        }
      }
    } else {
      _unfollow(activities.follower, activities.leader);
    }
  }

  /**
   * @dev this function created for test(Can't handle picked same address in verifiersList) .
   */
  function ownerTransferFee(bytes32 _activityHash) onlyOwner external {
    LibActivityInfo.Info storage activities = closePositionActivity[_activityHash];
    uint256 value = activities.rewardFee + activities.relayFee + activities.verifierFee;
    uint256 allowance = c8Token.allowance(activities.follower, address(this));
    uint256 balance = c8Token.balanceOf(activities.follower);
    uint timeout = activities.closePositionTimestampInSec + 1 hours;
    uint latestTimeout = timeout + 1 hours;

    if (activities.counterTrue > activities.counterFalse && now > latestTimeout) {
      if ((balance >= value) && (allowance >= value)) {
        c8Token.transferFrom(activities.follower, address(this), value);
        rewards[activities.leader] += activities.rewardFee;
        rewards[activities.relay] += activities.relayFee;
        for (uint i = 0; i < activities.results.length; i++) {
          if (activities.results[i].result) {
            if (activities.results[i].time < timeout) {
              rewards[activities.results[i].validator] += activities.verifierFee;
            }
          }
        }
      } else {
        _unfollow(activities.follower, activities.leader);
      }
    }
  }

  function pickVerifier(uint pickedSize, uint seed) public onlyOwner {
    pickedVerifiers.length = 0;
    for (uint r = 0; r < pickedSize; r++) {
      uint rnd = _pickOne(seed + r * r);
      pickedVerifiers.push(verifiersList[rnd]);
    }
  }

  function claimReward() external {
    require(rewards[msg.sender] > 0, "YOUR REWARD MUST BE MORE THAN 0.");
    claimedRewards[msg.sender] += rewards[msg.sender];
    uint256 reward = rewards[msg.sender];
    rewards[msg.sender] = 0;
    require(c8Token.transfer(msg.sender, reward), "TRANSFER FAILED.");
  }

  function getPickedVerifiers() public view returns (address[]) {
    address[] memory result = new address[](pickedVerifiers.length);
    uint counter = 0;
    for (uint i = 0; i < pickedVerifiers.length; i++) {
      result[counter] = pickedVerifiers[i];
      counter++;
    }
    return result;
  }

  function _pickOne(uint seed) private returns (uint256) {
    uint rnd = randomGen(seed, sumStake);
    for (uint i = 0; i < verifiersList.length; i++) {
      if (rnd < stakeVerifiers[verifiersList[i]])
        return i;
      rnd -= stakeVerifiers[verifiersList[i]];
    }
  }

  function randomGen(uint seed, uint max) private view returns (uint randomNumber) {
    return (uint(keccak256(abi.encodePacked(block.blockhash(block.number - 1), seed))) % max);
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

  function getVerifiersToCheck(bytes32 _activityHash) internal returns (bool) {
    LibActivityInfo.Info storage activities = closePositionActivity[_activityHash];
    for (uint i = 0; i < activities.results.length; i++) {
      if (activities.results[i].validator == msg.sender) {
        return false;
      }
    }
    return true;
  }

  function checkPickedVerifiers() internal returns (bool) {
    for (uint i = 0; i < pickedVerifiers.length; i++) {
      if (pickedVerifiers[i] == msg.sender) {
        return true;
      }
    }
    return false;
  }

  function checkListVerifiers() internal returns (bool) {
    for (uint i = 0; i < verifiersList.length; i++) {
      if (verifiersList[i] == msg.sender) {
        return false;
      }
    }
    return true;
  }

  function checkVerifiers() internal returns (bool) {
    for (uint i = 0; i < verifiersList.length; i++) {
      if (verifiersList[i] == msg.sender) {
        return true;
      }
    }
    return false;
  }

  /**
   * @dev this function created for test(Can't handle picked same address in verifiersList) .
   */
  function fixPickedVerifier() public onlyOwner {
    for (uint i = 0; i < verifiersList.length; i++) {
      pickedVerifiers.push(verifiersList[i]);
    }
  }

}