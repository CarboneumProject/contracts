pragma solidity ^0.4.13;


contract LibUserInfo {
  struct Following {
    address leader;
    uint percentage;
    uint index;
  }
}