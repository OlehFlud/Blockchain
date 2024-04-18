import {ethers, upgrades} from "hardhat";
import {expect} from "chai";
import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";
import {DomainController__factory, DomainController} from "../typechain-types";

describe("DomainController", function () {
  const value = ethers.parseEther("1") as number;
  let domainController;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const DomainController = await ethers.getContractFactory("DomainController") as DomainController__factory;
    domainController = await upgrades.deployProxy(DomainController, [await owner.getAddress(), 1]) as DomainController;
  });

  describe("DomainRegistration", function () {
    it("should register a domain", async function () {
      await domainController.connect(owner).registerDomain("com", {value});
      const domain = await domainController.getDomainController("com");
      expect(domain).to.equal(await owner.getAddress());
    });

    it("should not allow registering an already registered domain", async function () {
      await domainController.connect(owner).registerDomain("com", {value});
      await expect(domainController.connect(owner).registerDomain("com", {value})).to.be.rejectedWith(
        "DomainIsAlreadyRegistered"
      );
    });

    it("should allow the owner to set the domain registration fee", async function () {
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
      expect(domain).to.equal(await owner.getAddress());
    });

    it("should register a subdomain", async function () {
      await domainController.connect(owner).registerSubdomain("flood", "com", {value});
      const subdomain = await domainController.getSubdomainController("flood", "com");
      expect(subdomain).to.equal(await owner.getAddress());
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
      await domainController.connect(addr1).registerDomain("ua", {value});
      const initialBalance = await ethers.provider.getBalance(await owner.getAddress());
      await domainController.connect(owner).withdrawFunds(addr2);
      const finalBalance = await ethers.provider.getBalance(await owner.getAddress());

      expect(finalBalance).lt(initialBalance)
    });
  });

  describe("Event", function () {
    it("should emit DomainRegistered event when a domain is registered", async function () {
      const domain = "com";
      const controller = owner.getAddress();
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
