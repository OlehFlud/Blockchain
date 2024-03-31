import { ethers } from "hardhat";
import { Contract, ContractFactory } from "ethers";
import { expect } from "chai";

describe("DomainController", function () {
  let DomainController: ContractFactory;
  let domainController: Contract;
  let owner: string;
  let addr1: string;
  let addr2: string;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    DomainController = await ethers.getContractFactory("DomainController");
    domainController = await DomainController.deploy();
    await domainController.waitForDeployment();
  });

  it("should register a domain", async function () {
    await domainController.connect(addr1).registerDomain("com", { value: ethers.parseEther("1") });
    const domain = await domainController.domains("com");

    expect(domain.controller).to.equal(addr1.address);
  });

  it("should not allow registering a subdomain", async function () {
    await expect(domainController.connect(addr1).registerDomain("business.com", { value: ethers.parseEther("1") })).to.be.revertedWith("Domain" +
      " must" +
      " be a top-level domain");
  });

  it("should not allow registering an already registered domain", async function () {
    await domainController.connect(addr1).registerDomain("com", { value: ethers.parseEther("1") });
    await expect(domainController.connect(addr1).registerDomain("com", { value: ethers.parseEther("1") })).to.be.revertedWith("Domain already" +
      " registered");
  });

  it("should allow the owner to set the domain registration fee", async function () {
    await domainController.setDomainRegistrationFee(2);
    const fee = await domainController.domainRegistrationFee();

    expect(fee).to.equal(2);
  });

  it("should allow the owner to withdraw funds", async function () {
    await domainController.connect(addr1).registerDomain("com", { value: ethers.parseEther("1") });

    const initialBalance = await ethers.provider.getBalance(owner.address);
    await domainController.withdrawFunds();
    const finalBalance = await ethers.provider.getBalance(owner.address);

    expect(finalBalance).gt(initialBalance)
  });

  it('should register a domain and collect metrics', async () => {
    const domain = 'example';
    await domainController.connect(addr1).registerDomain(domain, { value: ethers.parseEther('1') });

    const registeredDomainsCountFilter = domainController.filters.DomainRegistered(null, null, null);
    const registeredDomainsCountLogs = await domainController.queryFilter(registeredDomainsCountFilter);
    const registeredDomainsCount = registeredDomainsCountLogs.length;
    expect(registeredDomainsCount).to.equal(1);

    const registeredDomainsFilter = domainController.filters.DomainRegistered(null, null, null);
    const registeredDomainsLogs = await domainController.queryFilter(registeredDomainsFilter);
    const registeredDomains = registeredDomainsLogs.map(log => log.args.domain);
    expect(registeredDomains).to.eql([domain]);
  });

  it('should retrieve the list of registered domains for a specific controller sorted by registration date from event', async () => {
    const domain = 'example';
    const domain2 = 'example1';

    // Register the domains
    await domainController.registerDomain(domain, { value: ethers.parseEther('1') });
    await domainController.registerDomain(domain2, { value: ethers.parseEther('1') });

    const controllerAddress = await owner.getAddress();
    const controllerDomainsLogs = await domainController.queryFilter(domainController.filters.DomainRegistered(null, controllerAddress, null));

    // Extract the registration dates from the event logs
    const registrationDates = controllerDomainsLogs.map(log => log.args.registrationDate);

    // Sort the registration dates
    // By default, sorting is by date, but we can write custom sorting
    controllerDomainsLogs.sort();

    // Get the domains in the order of registration
    const controllerDomains = registrationDates.map(date => {
      const log = controllerDomainsLogs.find(log => log.args.registrationDate === date);
      return log.args.domain;
    });

    expect(controllerDomains).to.eql([domain, domain2]);
  });

  it("should return the list of registered domains sorted by registration date", async function () {
    await domainController.connect(addr1).registerDomain("com", { value: ethers.parseEther("1") });
    await domainController.connect(addr1).registerDomain("org", { value: ethers.parseEther("1") });
    const domainNames = await domainController.getRegisteredDomains();
    expect(domainNames).to.deep.equal(["com", "org"]);
  });
});
