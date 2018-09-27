pragma solidity ^0.4.13;


contract LibActivityInfo {
  struct Info {
    address leader;
    address follower;
    address relay;
    address[] verifier;
    bool[] result;
    bytes32 buyTx;
    bytes32 sellTx;
    uint256 rewardFee;
    uint256 relayFee;
    uint256 verifierFee;
    uint closePositionTimestampInSec;
    bytes32 activityHash;
  }
}