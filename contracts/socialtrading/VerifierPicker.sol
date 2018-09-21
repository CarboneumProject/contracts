pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "./EventLogger.sol";


contract VerifierPicker is Ownable, EventLogger {

  address[] public verifiers;
  address[] public pickerVerifiers;
  mapping(address => uint256) public stakes;
  uint256 public sumStake;


  constructor () {

  }

  function stake(uint256 stakeAmount) public {
    verifiers.push(msg.sender);
    stakes[msg.sender] = stakeAmount;
    sumStake += stakeAmount;
  }

  function pickVerifier(uint seed) public onlyOwner {
    uint pickedSize = 2;
    pickerVerifiers.length = 0;
    for (uint r = 0; r < pickedSize; r++) {
      uint rnd = _pickOne(seed + r * r);
      emit Uint(rnd);
      pickerVerifiers.push(verifiers[rnd]);
    }
  }

  function getPickedVerifiers() public view returns (address[]) {
    address[] memory result = new address[](pickerVerifiers.length);
    uint counter = 0;
    for (uint i = 0; i < pickerVerifiers.length; i++) {
      result[counter] = pickerVerifiers[i];
      counter++;
    }
    return result;
  }

  function _pickOne(uint seed) private returns (uint256) {
    uint rnd = randomGen(seed, sumStake);
    emit Uint(rnd);
    for (uint i = 0; i < verifiers.length; i++) {
      if (rnd < stakes[verifiers[i]])
        return i;
      rnd -= stakes[verifiers[i]];
    }
  }

  function randomGen(uint seed, uint max) private view returns (uint randomNumber) {
    return (uint(keccak256(abi.encodePacked(block.blockhash(block.number - 1), seed))) % max);
  }
}
