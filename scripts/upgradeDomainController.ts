import {ethers, upgrades} from "hardhat";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";

(async () => {
  let owner: SignerWithAddress;
  [owner] = await ethers.getSigners();
  const value = ethers.parseEther("1");

  const domainRewardLibrary = await ethers.deployContract("library/DomainRewards.sol:DomainRewardLibrary");

  const domainControllerContract = await ethers.getContractFactory("DomainController", {
    libraries: {
      DomainRewardLibrary: domainRewardLibrary
    }
  });

  const address = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
  const upgradedToDomainControllerContract = await upgrades.upgradeProxy(address, domainControllerContract, {unsafeAllowLinkedLibraries: true});
  console.log("domainControllerContract upgraded\n");

  console.log("address:", address);
  console.log("upgradedToContractV2 address:", await upgradedToDomainControllerContract.getAddress());

  const subdomen = 'test.com';

  await upgradedToDomainControllerContract.registerSubdomain(subdomen, "com", {value});
  const subdomain = await upgradedToDomainControllerContract.getSubdomainController(subdomen, "com");

  if (subdomain === owner.address) {
    console.log('Address of owner are correct! Upgrade is successful.')
  }

  if (await upgradedToDomainControllerContract.getAddress() === address) {
    console.log("\nAddresses are the same!")
  }
})();
