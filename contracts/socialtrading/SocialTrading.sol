pragma solidity ^0.4.24;

import "./libs/LibUserInfo.sol";
import "./interfaces/ISocialTrading.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";


contract SocialTrading is ISocialTrading {
  ERC20 public feeToken;
  address public feeWallet;

  mapping(address => mapping(address => LibUserInfo.Following)) public followerToLeaders; // Following list
  mapping(address => address[]) public followerToLeadersIndex; // Following list
  mapping(address => mapping(address => uint8)) public leaderToFollowers;
  mapping(address => address[]) public leaderToFollowersIndex; // Follower list

  mapping(address => bool) public relays;
  mapping(address => uint256) public rewards;

  event Follow(address indexed leader, address indexed follower, uint percentage);
  event UnFollow(address indexed leader, address indexed follower);
  event AddRelay(address indexed relay);
  event RemoveRelay(address indexed relay);
  event PaidReward(
    address indexed leader,
    address indexed follower,
    address indexed relay,
    uint rewardAndFee,
    bytes32 leaderOpenOrderHash,
    bytes32 leaderCloseOrderHash,
    bytes32 followerOpenOrderHash,
    bytes32 followercloseOrderHash
  );

  constructor (
    address _feeWallet,
    ERC20 _feeToken
  ) public
  {
    feeWallet = _feeWallet;
    feeToken = _feeToken;
  }

  function() public {
    revert();
  }

  /**
   * @dev Follow leader to copy trade.
   */
  function follow(address _leader, uint256 _percentage) external {
    require(getCurrentPercentage(msg.sender) + _percentage <= 100 ether, "Following percentage more than 100%.");
    uint8 index = uint8(followerToLeadersIndex[msg.sender].push(_leader) - 1);
    followerToLeaders[msg.sender][_leader] = LibUserInfo.Following(
      _leader,
      _percentage,
      index
    );

    uint8 index2 = uint8(leaderToFollowersIndex[_leader].push(msg.sender) - 1);
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
    uint8 rowToDelete = uint8(followerToLeaders[_follower][_leader].index);
    address keyToMove = followerToLeadersIndex[_follower][followerToLeadersIndex[_follower].length - 1];
    followerToLeadersIndex[_follower][rowToDelete] = keyToMove;
    followerToLeaders[_follower][keyToMove].index = rowToDelete;
    followerToLeadersIndex[_follower].length -= 1;

    uint8 rowToDelete2 = uint8(leaderToFollowers[_leader][_follower]);
    address keyToMove2 = leaderToFollowersIndex[_leader][leaderToFollowersIndex[_leader].length - 1];
    leaderToFollowersIndex[_leader][rowToDelete2] = keyToMove2;
    leaderToFollowers[_leader][keyToMove2] = rowToDelete2;
    leaderToFollowersIndex[_leader].length -= 1;
    emit UnFollow(_leader, _follower);
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

  function getCurrentPercentage(address _user) internal view returns (uint) {
    uint sum = 0;
    for (uint i = 0; i < followerToLeadersIndex[_user].length; i++) {
      address leader = followerToLeadersIndex[_user][i];
      sum += followerToLeaders[_user][leader].percentage;
    }
    return sum;
  }

  /**
   * @dev Register relay to contract by the owner.
   */
  function registerRelay(address _relay) onlyOwner external {
    relays[_relay] = true;
    emit AddRelay(_relay);
  }

  /**
   * @dev Remove relay.
   */
  function removeRelay(address _relay) onlyOwner external {
    relays[_relay] = false;
    emit RemoveRelay(_relay);
  }

  function distributeReward(
    address _leader,
    address _follower,
    uint _reward,
    uint _relayFee,
    bytes32[4] _orderHashes
  ) external
  {
    // orderHashes[0] = leaderOpenOrderHash
    // orderHashes[1] = leaderCloseOrderHash
    // orderHashes[2] = followerOpenOrderHash
    // orderHashes[3] = followerCloseOrderHash
    address relay = msg.sender;
    require(relays[relay]);
    // Accept only trusted relay
    uint256 allowance = feeToken.allowance(_follower, address(this));
    uint256 balance = feeToken.balanceOf(_follower);
    uint rewardAndFee = _reward + _relayFee;
    if ((balance >= rewardAndFee) && (allowance >= rewardAndFee)) {
      feeToken.transferFrom(_follower, address(this), rewardAndFee);
      rewards[_leader] += _reward;
      rewards[relay] += _relayFee;
      emit PaidReward(
        _leader,
        _follower,
        relay,
        rewardAndFee,
        _orderHashes[0],
        _orderHashes[1],
        _orderHashes[2],
        _orderHashes[3]
      );
    } else {
      _unfollow(_follower, _leader);
    }
  }

  function claimReward() external {
    require(rewards[msg.sender] > 0);
    uint256 reward = rewards[msg.sender];
    rewards[msg.sender] = 0;
    require(feeToken.transfer(msg.sender, reward));
  }
}
