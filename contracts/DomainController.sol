// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";

/**
 * @title DomainController
 * @dev A simple domain registry contract that stores domain records associated with Ethereum addresses of the controllers.
 * Each controller can create multiple domains. Domains are reserved forever.
 */
contract DomainController {
    address public owner;
    uint256 public domainRegistrationFee;

    /** constants */
    uint8 public constant TOP_LEVEL_DOMAIN_MAX_LENGTH = 63;

    /** errors */
    error OnlyOwnerAllowed();
    error InsufficientPayment();
    error OnlyTopLevelDomainAllowed();
    error FailedWithdrawal();
    error InvalidTargetAddress();
    error DomainIsAlreadyRegistered();
    error TooLongLength();

    mapping(string => address) public domains;

    /** events */
    event DomainRegistered(string domain, address indexed controller);
    event MoneyWithdrawn(uint256 amount, address indexed controller);

    /**
     * @dev Constructor sets the contract owner and the initial domain registration fee.
     */
    constructor() {
        owner = msg.sender;
        domainRegistrationFee = 1 ether;
        // Fixed domain registration fee
    }

    /**
     * @dev Modifier to check if the caller is the contract owner.
     */
    modifier onlyOwner() {
        if (msg.sender != owner)
            revert OnlyOwnerAllowed();
        _;
    }

    /**
     * @dev Modifier to check if domain is exist.
     */
    modifier isDomainExist(string memory domain) {
        if (domains[domain] != address(0x0))
            revert DomainIsAlreadyRegistered();
        _;
    }

    /**
     * @dev Allows the contract owner to set the domain registration fee.
     * @param newFee The new domain registration fee.
     */
    function setDomainRegistrationFee(uint256 newFee) external onlyOwner {
        domainRegistrationFee = newFee;
    }

    /**
     * @dev Registers a top-level domain with the specified name.
     * @param domain The domain name to register.
     */
    function registerDomain(string memory domain)
    external
    payable
    isDomainExist(domain)
    {
        if (!_isTopLevelDomain(domain))
            revert OnlyTopLevelDomainAllowed();

        if (msg.value < domainRegistrationFee)
            revert InsufficientPayment();

        domains[domain] = msg.sender;
        emit DomainRegistered(domain, msg.sender);
    }

    /**
     * @dev Retrieves the controller address of the specified domain.
     * @param domain The domain name to query.
     * @return The address of the controller of the domain.
     */
    function getDomainController(string memory domain) external view returns (address) {
        return domains[domain];
    }

    /**
    * @dev Retrieves the controller address of the specified domain.
    * @dev Checks if a domain is a top-level domain.
    * @param domain The domain name to check.
     */
    function _isTopLevelDomain(string memory domain)
    private
    pure
    returns (bool)
    {
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
    function withdrawFunds(address payable target) external onlyOwner {
        if (target == address(0x0))
            revert InvalidTargetAddress();

        (bool success,) = target.call{value : address(this).balance}("");

        if (!success)
            revert FailedWithdrawal();

        emit MoneyWithdrawn(address(this).balance, msg.sender);
    }
}
