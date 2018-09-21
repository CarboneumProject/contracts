pragma solidity ^0.4.18;

contract EventLogger {

  event Bool(bool b);
  event Uint(uint i);
  event Int(uint i);
  event Address(address a);
  event Fixed(address f);
  event Ufixed(address f);
  event Bytes32(bytes32 b);
  event Bytes(bytes b);
  event String(string str);

  function showLog() public {
    revert();
  }
}
