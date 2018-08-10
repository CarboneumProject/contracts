pragma solidity 0.4.24;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract CopyTrading is Ownable {

    uint public rewardFee; //percentage times (1 ether)
    uint public relayerFee; //percentage times (1 ether)
    uint public verifierFee; //percentage times (1 ether)

    function CopyTrading(
        address _feeAccount,
        ERC20 _feeToken,
        uint _rewardFee,
        uint _relayerFee,
        uint _verifierFee
    ) {
        rewardFee = _rewardFee;
        relayerFee = _relayerFee;
        verifierFee = _verifierFee;
    }

    function() {
        throw;
    }

    function changeRewardFee(uint _rewardFee) onlyOwner {
        rewardFee = _rewardFee;
    }

    function changeRelayerFee(uint _relayerFee) onlyOwner {
        relayerFee = _relayerFee;
    }

    function changeVerifierFee(uint _verifierFee) onlyOwner {
        verifierFee = _verifierFee;
    }

    /**
     * @dev Follow leader to copy trade.
     */
    function follow(address leader) external;

    /**
     * @dev UnFollow leader to stop copy trade.
     */
    function unfollow(address leader) external;

    /**
     * @dev Register relayer to contract by the owner.
     */
    function registerRelayer(address verifier) onlyOwner external;

    /**
     * @dev Register verifier to contract by the owner.
     */
    function registerVerifier(address verifier) onlyOwner external;

    /**
     * @dev add trade activity log to contract by trusted relayer.
     */
    function tradActivityBatch(bytes32 offChainHash) onlyRelay external;

    /**
     * @dev Throws if called by any account other than the relayer.
     */
    modifier onlyRelay() {
        require(msg.sender == owner);
        _;
    }
}