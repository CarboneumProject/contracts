pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/crowdsale/validation/IndividuallyCappedCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/validation/WhitelistedCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/emission/AllowanceCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/validation/TimedCrowdsale.sol";

/**
 * @title CarboneumCrowdsale
 * @dev This is Carboneum fully fledged crowdsale.
 * CappedCrowdsale - sets a max boundary for raised funds.
 * AllowanceCrowdsale - token held by a wallet.
 * IndividuallyCappedCrowdsale - Crowdsale with per-user caps.
 * TimedCrowdsale - Crowdsale accepting contributions only within a time frame.
 * After adding multiple features it's good practice to run integration tests
 * to ensure that subcontracts works together as intended.
 */
contract CarboneumCrowdsale is CappedCrowdsale, AllowanceCrowdsale, IndividuallyCappedCrowdsale, TimedCrowdsale {

    uint256 public private_sale_end;
    uint256 public pre_sale_end;

    function CarboneumCrowdsale(uint256 _openingTime, uint256 _closingTime, uint256 _rate,
        address _wallet, uint256 _cap, ERC20 _token, uint256 _private_sale_end, uint256 _pre_sale_end) public
    AllowanceCrowdsale(_wallet)
    Crowdsale(_rate, _wallet, _token)
    CappedCrowdsale(_cap)
    TimedCrowdsale(_openingTime, _closingTime)
    {
        require(_private_sale_end < _pre_sale_end);
        private_sale_end = _private_sale_end;
        pre_sale_end = _pre_sale_end;
    }

    /**
     * @dev Add bonus to private sale and pre-sale period.
     * @param _weiAmount Value in wei to be converted into tokens
     * @return Number of tokens that can be purchased with the specified _weiAmount
     */
    function _getTokenAmount(uint256 _weiAmount) internal view returns (uint256) {
        if (block.timestamp < private_sale_end) {
            rate += rate * 168 / 1000;
            // Bonus 16.8%
        } else if (block.timestamp < pre_sale_end) {
            rate += rate * 8 / 100;
            // Bonus 8%
        }
        return _weiAmount.mul(rate);
    }
}
