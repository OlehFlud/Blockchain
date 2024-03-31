// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title DomainController
 * @dev A simple domain registry contract that stores domain records associated with Ethereum addresses of the controllers.
 * Each controller can create multiple domains. Domains are reserved forever.
 */
contract DomainController {
    address public owner;
    uint256 public domainRegistrationFee;

    struct Domain {
        address controller;
        uint256 registrationDate;
    }

    mapping(string => Domain) public domains;
    string[] public registeredDomains;
    mapping(address => string[]) public controllerDomains;

    event DomainRegistered(string domain, address indexed controller, uint256 registrationDate);

    /**
     * @dev Constructor sets the contract owner and the initial domain registration fee.
     */
    constructor() {
        owner = msg.sender;
        domainRegistrationFee = 1 ether; // Fixed domain registration fee
    }

    /**
     * @dev Modifier to check if the caller is the contract owner.
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner can call this function");
        _;
    }

    /**
     * @dev Allows the contract owner to set the domain registration fee.
     * @param newFee The new domain registration fee.
     */
    function setDomainRegistrationFee(uint256 newFee) public onlyOwner {
        domainRegistrationFee = newFee;
    }

    /**
     * @dev Registers a top-level domain with the specified name.
     * @param domain The domain name to register.
     */
    function registerDomain(string memory domain) public payable {
        require(msg.value >= domainRegistrationFee, "Insufficient payment");
        require(isTopLevelDomain(domain), "Domain must be a top-level domain");
        for (uint i = 0; i < registeredDomains.length; i++) {
            require(keccak256(abi.encodePacked(registeredDomains[i])) != keccak256(abi.encodePacked(domain)), "Domain already registered");
        }

        domains[domain] = Domain(msg.sender, block.timestamp);
        registeredDomains.push(domain);
        controllerDomains[msg.sender].push(domain);

        emit DomainRegistered(domain, msg.sender, block.timestamp);
    }

    /**
     * @dev Checks if a domain is a top-level domain.
     * @param domain The domain name to check.
     */
    function isTopLevelDomain(string memory domain) private pure returns (bool) {
        bytes memory domainBytes = bytes(domain);
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
    function withdrawFunds() public onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    /**
     * @dev Returns the total number of registered domains.
     */
    function getRegisteredDomainsCount() public view returns (uint256) {
        return registeredDomains.length;
    }

    /**
     * @dev Returns the list of registered domains.
     */
    function getRegisteredDomains() public view returns (string[] memory) {
        return registeredDomains;
    }

    /**
     * @dev Returns the list of domains registered by the specified controller sorted by registration date.
     * @param controller The address of the controller.
     */
    function getControllerDomains(address controller) public view returns (string[] memory) {
        return controllerDomains[controller];
    }
}
