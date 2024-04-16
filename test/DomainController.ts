import {ethers, upgrades} from "hardhat";
import {Contract, ContractFactory} from "ethers";
import {expect} from "chai";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";

describe("DomainController", function () {
  const value = ethers.parseEther("1");
  let DomainController: ContractFactory;
  let domainController: Contract;
  let owner: SignerWithAddress;
  let addr1: string;
  let addr2: string;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const domainRewardLibrary = await ethers.deployContract("library/DomainRewards.sol:DomainRewardLibrary");

    DomainController = await ethers.getContractFactory("DomainController", {
      libraries: {
        DomainRewardLibrary: domainRewardLibrary
      }
    });
    domainController = await upgrades.deployProxy(DomainController, [owner.address, 1], {unsafeAllowLinkedLibraries: true});
  });

  describe("DomainRegistration", function () {
    it("should register a domain", async function () {
      await domainController.connect(owner).registerDomain("com", {value});
      const domain = await domainController.getDomainController("com");
      expect(domain).to.equal(owner.address);
    });

    it("should not allow registering an already registered domain", async function () {
      await domainController.connect(owner).registerDomain("com", {value});
      await expect(domainController.connect(owner).registerDomain("com", {value})).to.be.rejectedWith(
        "DomainIsAlreadyRegistered"
      );
    });

    it("should allow the owner to set the domain registration fee", async function () {
      // console.log('owner.address',owner.address);
      await domainController.connect(owner).setDomainRegistrationFee(2);

// Access the domainRegistrationFee from the DomainStorage struct
      const fee = await domainController.connect(owner).getRegistrationFee();

      expect(fee).to.equal(2);
    });
  })

  describe("SubdomainRegistration", function () {
    beforeEach(async function () {
      await domainController.connect(owner).registerDomain("com", {value});
      const domain = await domainController.getDomainController("com");
      expect(domain).to.equal(owner.address);
    });

    it("should register a subdomain", async function () {
      await domainController.connect(owner).registerSubdomain("flood", "com", {value});
      const subdomain = await domainController.getSubdomainController("flood", "com");
      expect(subdomain).to.equal(owner.address);
    });

    it("should not allow registering an already registered subdomain", async function () {
      await domainController.connect(owner).registerSubdomain("flood", "com", {value});
      await expect(domainController.connect(owner).registerSubdomain("flood", "com", {value})).to.be.rejectedWith(
        "DomainIsAlreadyRegistered"
      );
    });
  })

  describe("WithdrawalFunds", function () {
    it("should allow the owner to withdraw funds", async function () {
      await domainController.connect(addr1).registerDomain("com", {value});
      const initialBalance = await ethers.provider.getBalance(owner.address);
      await domainController.withdrawFunds(addr1);
      const finalBalance = await ethers.provider.getBalance(owner.address);

      expect(finalBalance).lt(initialBalance)
    });
  });

  describe("Event", function () {
    it("should emit DomainRegistered event when a domain is registered", async function () {
      const domain = "com";
      const controller = owner.address;
      await expect(domainController.connect(owner).registerDomain(domain, {value}))
        .to.emit(domainController, "DomainRegistered")
        .withArgs(domain, controller);
    });
  })

  describe("Metrics", function () {
    it("should get a count and list of all registered domain", async () => {
      await domainController.connect(addr1).registerDomain("com", {value});
      await domainController.connect(addr1).registerDomain("ua", {value});
      await domainController.connect(addr2).registerDomain("net", {value});

      const filter = domainController.filters.DomainRegistered(null, null);
      const logs = await domainController.queryFilter(filter);

      console.log("Count of registered domains: ", logs.length)

      logs.map((log) => {
        console.log("Domain: ", log.args);
      });

      expect(logs.length).to.equal(3);
    });

    it("should get a list of all registered domain by for a specific controller", async () => {
      await domainController.connect(addr1).registerDomain("com", {value});
      await domainController.connect(addr1).registerDomain("ua", {value});
      await domainController.connect(addr2).registerDomain("net", {value});
      await domainController.connect(addr2).registerDomain("cc", {value});
      await domainController.connect(addr2).registerDomain("org", {value});

      const filter = domainController.filters.DomainRegistered(null, addr2);
      const logs = await domainController.queryFilter(filter);

      logs.map((log) => {
        console.log("Domain: ", log.args);
      });
      expect(logs.length).to.equal(3);
    });
  })
});
