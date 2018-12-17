pragma solidity ^0.4.18;

import "./libs/LibUserInfo.sol";
import "./interfaces/ISocialTrading.sol";

contract SocialTrading is ISocialTrading {
  mapping(address => mapping(address => LibUserInfo.Following)) public followerToLeaders; // Following list
  mapping(address => address[]) public followerToLeadersIndex; // Following list
  mapping(address => mapping(address => uint)) public leaderToFollowers;
  mapping(address => address[]) public leaderToFollowersIndex; // Follower list

  event Follow(address indexed leader, address indexed follower, uint percentage);
  event UnFollow(address indexed leader, address indexed follower);

  function() public {
    revert();
  }

  /**
   * @dev Follow leader to copy trade.
   */
  function follow(address _leader, uint _percentage) external {
    require(getCurrentPercentage(msg.sender) + _percentage <= 100 ether, "Your percentage more than 100%.");
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

  function getCurrentPercentage(address _user) internal returns (uint) {
    uint sum = 0;
    for (uint i = 0; i < followerToLeadersIndex[_user].length; i++) {
      address leader = followerToLeadersIndex[_user][i];
      sum += followerToLeaders[_user][leader].percentage;
    }
    return sum;
  }
}
