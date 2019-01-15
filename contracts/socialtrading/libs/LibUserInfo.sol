pragma solidity ^0.4.24;


contract LibUserInfo {
  struct Following {
    address leader;
    uint percentage; // percentage times (1 ether)
    uint timeStamp;
    uint index;
  }
}
