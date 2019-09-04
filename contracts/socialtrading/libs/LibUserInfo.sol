pragma solidity ^0.4.24;


contract LibUserInfo {
  struct Following {
    address leader;
    uint percentage; // percentage (100 = 100%)
    uint index;
  }
}
