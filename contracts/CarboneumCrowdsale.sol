pragma solidity ^0.4.18;

import "openzeppelin-solidity/contracts/crowdsale/validation/IndividuallyCappedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/emission/AllowanceCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/TimedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/distribution/PostDeliveryCrowdsale.sol";


/**
 * @title CarboneumCrowdsale
 * @dev This is Carboneum fully fledged crowdsale.
 * CappedCrowdsale - sets a max boundary for raised funds.
 * AllowanceCrowdsale - token held by a wallet.
 * IndividuallyCappedCrowdsale - Crowdsale with per-user caps.
 * TimedCrowdsale - Crowdsale accepting contributions only within a time frame.
 */
contract CarboneumCrowdsale is CappedCrowdsale, AllowanceCrowdsale, IndividuallyCappedCrowdsale, TimedCrowdsale {

  uint256 public iconRate;

  ERC20 public iconToken;

  function CarboneumCrowdsale(
    uint256 _openingTime,
    uint256 _closingTime,
    uint256 _rate,
    uint256 _iconRate,
    address _tokenWallet,
    address _fundWallet,
    uint256 _cap,
    ERC20 _token,
    ERC20 _iconToken) public
  AllowanceCrowdsale(_tokenWallet)
  Crowdsale(_rate, _fundWallet, _token)
  CappedCrowdsale(_cap)
  TimedCrowdsale(_openingTime, _closingTime)
  {
    require(_iconToken != address(0));
    require(_iconRate > 0);
    iconToken = _iconToken;
    iconRate = _iconRate;
  }

  /**
   * Event for token purchase logging
   * @param purchaser who paid for the tokens
   * @param beneficiary who got the tokens
   * @param value Icon token paid for purchase
   * @param amount amount of tokens purchased
   */
  event TokenPurchaseWithIcon(
    address indexed purchaser,
    address indexed beneficiary,
    uint256 value,
    uint256 amount
  );

  function setRate(uint256 _rate) external onlyOwner {
    rate = _rate;
  }

  function setIconRate(uint256 _iconRate) external onlyOwner {
    iconRate = _iconRate;
  }

  function buyTokensWithIcon(address _beneficiary, uint256 _iconAmount) external {
    // Calculate Carboneum token to receive.
    uint256 tokenAmount = iconRate.mul(_iconAmount);
    uint256 weiAmount = tokenAmount.div(rate);

    // Validate purchase.
    _preValidatePurchase(_beneficiary, weiAmount);

    // Update cap.
    contributions[_beneficiary] = contributions[_beneficiary].add(weiAmount);

    // Transfer ICON token to Carboneum fund address.
    require(iconToken.transferFrom(msg.sender, wallet, _iconAmount));

    // Transfer Carboneum token from token owner to sender.
    _deliverTokens(_beneficiary, tokenAmount);

    emit TokenPurchaseWithIcon(
      msg.sender,
      _beneficiary,
      _iconAmount,
      tokenAmount);
  }
}
