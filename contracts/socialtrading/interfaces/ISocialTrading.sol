pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract ISocialTrading is Ownable {

  /**
   * @dev Follow leader to copy trade.
   */
  function follow(address _leader, uint8 _percentage) external;

  /**
   * @dev UnFollow leader to stop copy trade.
   */
  function unfollow(address _leader) external;

  /**
  * Friends - we refer to "friends" as the users that a specific user follows (e.g., following).
  */
  function getFriends(address _user) public view returns (address[]);

  /**
  * Followers - refers to the users that follow a specific user.
  */
  function getFollowers(address _user) public view returns (address[]);
}
