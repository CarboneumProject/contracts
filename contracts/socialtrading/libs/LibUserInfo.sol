pragma solidity ^0.4.24;


contract LibUserInfo {
  struct Following {
    address leader;
    uint percentage; // percentage times (100 = 100%)
    uint index;
  }
}
