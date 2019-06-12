pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract PromoCode is Ownable {
  ERC20 public token;
  mapping(bytes32 => bool) public used;
  uint256 public amount;

  event Redeem(address user, uint256 amount, string code);

  constructor(ERC20 _token, uint256 _amount) public {
    amount = _amount;
    token = _token;
  }

  function setAmount(uint256 _amount) public onlyOwner {
    amount = _amount;
  }

  function redeem(string promoCode, bytes signature) public {
    bytes32 hash = keccak256(abi.encodePacked(promoCode));
    bytes32 r;
    bytes32 s;
    uint8 v;
    assembly {
      r := mload(add(signature, 32))
      s := mload(add(signature, 64))
      v := and(mload(add(signature, 65)), 255)
    }
    if (v < 27) {
      v += 27;
    }

    require(!used[hash]);
    used[hash] = true;
    require(ecrecover(keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash)), v, r, s) == owner);
    address user = msg.sender;
    require(token.transferFrom(owner, user, amount));
    emit Redeem(user, amount, promoCode);
  }
}
