pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/crowdsale/validation/IndividuallyCappedCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/emission/AllowanceCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/validation/TimedCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/distribution/PostDeliveryCrowdsale.sol";


/**
 * @title CarboneumCrowdsale
 * @dev This is Carboneum fully fledged crowdsale.
 * CappedCrowdsale - sets a max boundary for raised funds.
 * AllowanceCrowdsale - token held by a wallet.
 * IndividuallyCappedCrowdsale - Crowdsale with per-user caps.
 * TimedCrowdsale - Crowdsale accepting contributions only within a time frame.
 */
contract CarboneumCrowdsale is CappedCrowdsale, AllowanceCrowdsale, IndividuallyCappedCrowdsale, TimedCrowdsale, PostDeliveryCrowdsale {

  uint256 public pre_sale_end;

  function CarboneumCrowdsale(
    uint256 _openingTime,
    uint256 _closingTime,
    uint256 _rate,
    address _tokenWallet,
    address _fundWallet,
    uint256 _cap,
    ERC20 _token,
    uint256 _preSaleEnd) public
  AllowanceCrowdsale(_tokenWallet)
  Crowdsale(_rate, _fundWallet, _token)
  CappedCrowdsale(_cap)
  TimedCrowdsale(_openingTime, _closingTime)
  {
    require(_preSaleEnd < _closingTime);
    pre_sale_end = _preSaleEnd;
  }

  function setRate(uint256 _rate) external onlyOwner {
    rate = _rate;
  }

  /**
   * @dev Add bonus to pre-sale period.
   * @param _weiAmount Value in wei to be converted into tokens
   * @return Number of tokens that can be purchased with the specified _weiAmount
   */
  function _getTokenAmount(uint256 _weiAmount) internal view returns (uint256) {
    uint256 newRate = rate;
    if (now < pre_sale_end) {// solium-disable-line security/no-block-members
      // Bonus 8%
      newRate += rate * 8 / 100;
    }
    return _weiAmount.mul(newRate);
  }

}
