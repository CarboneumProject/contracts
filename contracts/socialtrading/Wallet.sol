pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./libs/IWallet.sol";
import "./libs/LibBytes.sol";


contract Wallet is IWallet, Ownable {
  using LibBytes for bytes;

  /// @dev Validates an EIP712 signature.
  ///      The signer must match the owner of this wallet.
  /// @param hash Message hash that is signed.
  /// @param eip712Signature Proof of signing.
  /// @return Validity of signature.
  function isValidSignature(
    bytes32 hash,
    bytes eip712Signature
  )
  external
  view
  returns (bool isValid)
  {
    require(
      eip712Signature.length == 65,
      "LENGTH_65_REQUIRED"
    );

    uint8 v = uint8(eip712Signature[0]);
    bytes32 r = eip712Signature.readBytes32(1);
    bytes32 s = eip712Signature.readBytes32(33);
    address recoveredAddress = ecrecover(hash, v, r, s);
    isValid = owner == recoveredAddress;
    return isValid;
  }
}
