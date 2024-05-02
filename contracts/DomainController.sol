// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "../library/DomainRewards.sol";

/**
 * @title DomainController
 * @dev A simple domain registry contract that stores domain records.
 * Each controller can create multiple domains. Domains are reserved forever.
 */

contract DomainController is Initializable, OwnableUpgradeable {
    using DomainRewardLibrary for DomainRewardLibrary.RewardData;

    struct Domain {
        address owner;
        mapping(string => address) subdomains;
    }

    /// @custom:storage-location erc7201:domainController.main
    struct DomainStorage {
        uint256 domainRegistrationFee;
        mapping(string => Domain) domains;
        mapping(string => DomainRewardLibrary.RewardData) domainRewards;
    }

    /** constants */
    uint8 private constant TOP_LEVEL_DOMAIN_MAX_LENGTH = 63;

    // keccak256(abi.encode(uint256(keccak256("domainController.main")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant DOMAIN_STORAGE_LOCATION =
        0x2850e3fc9c6856aeed0065311ef06e8ac9dfe4b55c18476acd9c4567ff43d000;

    DomainRewardLibrary.RewardData private _rewardData;

    error OnlyOwnerAllowed();
    error IncorrectAmountOfPayment();
    error OnlyTopLevelDomainAllowed();
    error FailedWithdrawal();
    error InvalidTargetAddress();
    error DomainIsAlreadyRegistered();
    error ParentDomainIsNotRegistered();
    error TooLongLength();
    error NoRewardAvailable();

    /** events */
    event DomainRegistered(
        string domain,
        address indexed controller,
        uint256 timestamp
    );
    event SubdomainRegistered(
        string subdomain,
        string domain,
        uint256 timestamp,
        address owner
    );
    event MoneyWithdrawn(
        uint256 amount,
        address indexed controller,
        uint256 timestamp
    );
    event ConversionRateUpdated(int256 conversionRate);

    function _getDomainStorage()
        private
        pure
        returns (DomainStorage storage $)
    {
        assembly {
            $.slot := DOMAIN_STORAGE_LOCATION
        }
    }
    AggregatorV3Interface internal priceFeed;

    function initialize(
        address owner,
        uint256 domainRegistrationFee
    ) public initializer {
        __Ownable_init(owner);
        _getDomainStorage().domainRegistrationFee = domainRegistrationFee;
        priceFeed = AggregatorV3Interface(
            0x694AA1769357215DE4FAC081bf1f309aDC325306
        );
    }

    /**
     * @dev Modifier to check if domain is exist.
     */
    modifier isDomainExist(string memory domain) {
        if (_getDomainStorage().domains[domain].owner != address(0x0))
            revert DomainIsAlreadyRegistered();
        _;
    }

    /**
     * @dev Allows the contract owner to set the domain registration fee.
     * @param newFee The new domain registration fee.
     */
    function setDomainRegistrationFee(uint256 newFee) external onlyOwner {
        _getDomainStorage().domainRegistrationFee = newFee;
    }

    function getPriceFee() public view returns (int256) {
        (, int256 answer, , , ) = priceFeed.latestRoundData();
        // If the round is not complete yet, timestamp is 0
        return answer;
    }
    /**
     * @dev Registers a top-level domain with the specified name.
     * @param domain The domain name to register.
     */
    function registerDomain(
        string memory domain
    ) external payable isDomainExist(domain) {
        uint256 registrationFeeEth = _getDomainStorage().domainRegistrationFee;

        _rewardData.addReward(owner(), registrationFeeEth);

        _getDomainStorage().domains[domain].owner = msg.sender;

        emit DomainRegistered(domain, msg.sender, block.timestamp);
    }

    /**
     * @dev Registers a sub domain with the specified name.
     * @param subdomain The subdomain name to register.
     */
    function registerSubdomain(
        string memory subdomain,
        string memory parentDomain
    ) external payable {
        uint256 registrationFeeEth = _getDomainStorage().domainRegistrationFee;

        if (_getDomainStorage().domains[parentDomain].owner == address(0x0))
            revert ParentDomainIsNotRegistered();

        _rewardData.addReward(owner(), registrationFeeEth);

        _registerSubdomain(
            subdomain,
            parentDomain,
            _getDomainStorage().domains[parentDomain]
        );
    }

    /**
     * @dev Registers a subdomain with the specified name.
     * @param subdomain The subdomain name to register.
     * @param parentDomain The parent domain name under which to register the subdomain.
     */
    function _registerSubdomain(
        string memory subdomain,
        string memory parentDomain,
        Domain storage parent
    ) private {
        if (parent.subdomains[subdomain] != address(0x0))
            revert DomainIsAlreadyRegistered();

        parent.subdomains[subdomain] = msg.sender;
        _rewardData.addReward(
            parent.owner,
            _getDomainStorage().domainRegistrationFee
        );

        emit SubdomainRegistered(
            subdomain,
            parentDomain,
            block.timestamp,
            msg.sender
        );
    }

    /**
     * @dev Retrieves the controller address of the specified domain.
     * @param domain The domain name to query.
     * @return The address of the controller of the domain.
     */
    function getDomainController(
        string memory domain
    ) external view returns (address) {
        return _getDomainStorage().domains[domain].owner;
    }

    /**
     * @dev Retrieves the controller address of the specified subdomain.
     * @param subdomain The subdomain name to query.
     * @param parentDomain The parent domain name of the subdomain.
     * @return The address of the controller of the subdomain.
     */
    function getSubdomainController(
        string memory subdomain,
        string memory parentDomain
    ) external view returns (address) {
        return _getDomainStorage().domains[parentDomain].subdomains[subdomain];
    }

    /**
     * @dev Retrieves the current domain registration fee.
     * @return The current domain registration fee.
     */
    function getRegistrationFee() external view returns (uint256) {
        return _getDomainStorage().domainRegistrationFee;
    }

    /**
     * @dev Retrieves the controller address of the specified domain.
     * @dev Checks if a domain is a top-level domain.
     * @param domain The domain name to check.
     */
    function _isTopLevelDomain(
        string memory domain
    ) private pure returns (bool) {
        bytes memory domainBytes = bytes(domain);

        if (domainBytes.length > TOP_LEVEL_DOMAIN_MAX_LENGTH)
            revert TooLongLength();

        for (uint256 i = 0; i < domainBytes.length; i++) {
            if (domainBytes[i] == ".") {
                return false;
            }
        }
        return true;
    }

    /**
     * @dev Allows the contract owner to withdraw accumulated funds.
     */
    function withdrawFunds(address payable target) external {
        if (target == address(0x0)) revert InvalidTargetAddress();

        uint256 reward = _rewardData.claimReward(msg.sender);

        (bool success, ) = target.call{value: reward}("");

        emit MoneyWithdrawn(reward, msg.sender, block.timestamp);
    }

    function walletBalance() public view returns (uint256) {
        return _rewardData.getAmountOfReward(msg.sender);
    }
}
