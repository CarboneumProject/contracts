pragma solidity ^0.4.13;

contract LibActivityInfo {
  struct Info {
    address leaders;
    address followers;
    address relay;
    address verifier;
    bytes32 buyTx;
    bytes32 sellTx;
    int256 rewardFee;
    int256 relayFee;
    int256 verifierFee;
    uint closePositionTimestampInSec;
    bytes32 activityHash;
  }
}