pragma solidity ^0.4.13;


contract LibActivityInfo {
  struct ValidatorResult {
    address validator;
    bool result;
  }
  struct Info {
    address leader;
    address follower;
    address relay;
    address[] verifiers;
    ValidatorResult[] results;
    uint counterTrue;
    uint counterFalse;
    bytes32 buyTx;
    bytes32 sellTx;
    uint256 rewardFee;
    uint256 relayFee;
    uint256 verifierFee;
    uint closePositionTimestampInSec;
    bytes32 activityHash;
  }
}