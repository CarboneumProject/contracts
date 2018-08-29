pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "./LibActivityInfo.sol";


contract ISocialTrading is Ownable {

  /**
   * @dev Follow leader to copy trade.
   */
  function follow(address _leader, uint _percentage) external;

  /**
   * @dev UnFollow leader to stop copy trade.
   */
  function unfollow(address _leader) external;

  /**
   * @dev Register relay to contract by the owner.
   */
  function registerRelay(address _relay) onlyOwner external;
  /**
   * @dev Register verifier to contract by the owner.
   */
  function registerVerifier(address _verifier) onlyOwner external;

  /**
   * @dev add trade activity log to contract by a trusted relay.
   */
  function tradeActivityBatch(bytes32 _sideChainHash) external;



  /**
   * @dev add activity log result to contract by trusted verifier.
   */
  function verifyActivityBatch(bytes32[] _activitiesHash, bool[] _result) external;

  /**
   * @dev claim reward or fee from this contract.
   */
  function claimReward() external;

  /**
  * Friends - we refer to "friends" as the users that a specific user follows (e.g., following).
  */
  function getFriends(address _user) public view returns (address[]);

  /**
  * Followers - refers to the users that follow a specific user.
  */
  function getFollowers(address _user) public view returns (address[]);
}