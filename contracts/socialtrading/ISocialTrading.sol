pragma solidity ^0.4.18;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
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
   * @dev Register verifier to contract by stake.
   */
  function registerVerifier(uint256 _stakeAmount) external;

  /**
     * @dev Cancel verifier withdraw token from stake.
   */
  function cancelVerifier() external;

  /**
   * @dev add trade activity log to contract by a trusted relay.
   */
  function tradeActivityBatch(bytes32 _sideChainHash) external;

  /**
   * @dev add close activities from relay.
   */
  function addCloseActivities(
    address _leader,
    address _follower,
    address _relay,
    address _verifier,
    bytes32 _buyTx,
    bytes32 _sellTx,
    uint256 _rewardFee,
    uint256 _relayFee,
    uint256 _verifierFee,
    uint _closePositionTimestampInSec,
    bytes32 _activitiesHash) external;

  /**
   * @dev add activity log result to contract by trusted verifier.
   */
  function verifyActivityBatch(bytes32 _activitiesHash, bool _result) external;

  /**
     * @dev call getPickedVerifiers and calculate selected chance
   */
  function pickVerifier(uint seed) public onlyOwner;

  /**
   * @dev claim reward or fee from this contract.
   */
  function claimReward() external;

  /**
     * @dev count address who has registered to be verifiers
   */
  function getPickedVerifiers() public view returns (address[]);

  /**
     * @dev choose who registered from calculate random.
   */
  function _pickOne(uint seed) private returns (uint256);

  /**
     * @dev return block calculate.
   */
  function randomGen(uint seed, uint max) private view returns (uint randomNumber);

    /**
    * Friends - we refer to "friends" as the users that a specific user follows (e.g., following).
    */
  function getFriends(address _user) public view returns (address[]);

  /**
  * Followers - refers to the users that follow a specific user.
  */
  function getFollowers(address _user) public view returns (address[]);
}
