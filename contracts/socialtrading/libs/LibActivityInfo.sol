pragma solidity ^0.4.24;


contract LibActivityInfo {
  struct Info {
    address leader;
    address follower;
    address relay;
    address verifier;
    bytes32 buyTx;
    bytes32 sellTx;
    uint256 rewardFee;
    uint256 relayFee;
    uint256 verifierFee;
    uint closePositionTimestampInSec;
    bytes32 activityHash;
  }
}
