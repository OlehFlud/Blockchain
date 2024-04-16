// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "hardhat/console.sol";

/**
 * @title DomainController
 * @dev A simple domain registry contract that stores domain records associated with Ethereum addresses of the controllers.
 * Each controller can create multiple domains. Domains are reserved forever.
 */
contract DomainController is Initializable, OwnableUpgradeable {

    struct Domain {
        address owner;
    }

    /// @custom:storage-location erc7201:domainController.main
    struct DomainStorage {
        uint256 domainRegistrationFee;
        mapping(string => Domain) domains;
    }
    /** constants */
    uint8 private constant TOP_LEVEL_DOMAIN_MAX_LENGTH = 63;

    // keccak256(abi.encode(uint256(keccak256("domainController.main")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant DomainStorageLocation = 0x2850e3fc9c6856aeed0065311ef06e8ac9dfe4b55c18476acd9c4567ff43d000;

    /** errors */
    error OnlyOwnerAllowed();
    error InsufficientPayment();
    error OnlyTopLevelDomainAllowed();
    error FailedWithdrawal();
    error InvalidTargetAddress();
    error DomainIsAlreadyRegistered();
    error TooLongLength();

    /** events */
    event DomainRegistered(string domain, address indexed controller);
    event MoneyWithdrawn(uint256 amount, address indexed controller);

    /**
    * @dev Retrieves the domain storage struct.
    */
    function _getDomainStorage() private pure returns (DomainStorage storage $) {
        assembly {
            $.slot := DomainStorageLocation
        }
    }

    /**
    * @dev Initialize the contract.
     * @param _owner The initial owner of the contract.
     * @param _domainRegistrationFee The fee required to register a domain.
     */
    function initialize(address _owner, uint256 _domainRegistrationFee) public initializer {
        __Ownable_init(_owner);
        _getDomainStorage().domainRegistrationFee = _domainRegistrationFee;
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

        if (msg.value < _getDomainStorage().domainRegistrationFee)
            revert InsufficientPayment();

        _getDomainStorage().domains[domain].owner = msg.sender;
        emit DomainRegistered(domain, msg.sender);
    }

    /**
     * @dev Retrieves the controller address of the specified domain.
     * @param domain The domain name to query.
     * @return The address of the controller of the domain.
     */
    function getDomainController(string memory domain) external view returns (address) {
        return _getDomainStorage().domains[domain].owner;
    }

    /**
     * @return The domainRegistrationFee of the domain.
     */
    function getRegistrationFee() external view returns (uint256) {
        return _getDomainStorage().domainRegistrationFee;
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
