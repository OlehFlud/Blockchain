import { ethers, upgrades } from "hardhat";
import {DomainController__factory, DomainController} from "../typechain-types";
import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";

async function main() {
  let owner: SignerWithAddress;
  const value = ethers.parseEther("0.0001") as any;

  [owner] = await ethers.getSigners();

  const domainControllerContract = await ethers.getContractFactory("DomainController") as DomainController__factory;
  const contract = await upgrades.deployProxy(domainControllerContract, [owner.address, value]) as DomainController;

  // add custom data
  await contract.registerDomain("com", {value: value});
  await contract.registerDomain("ua", {value: value});
  await contract.registerDomain("net", {value: value});

  const filter = contract.filters.DomainRegistered(null, owner.address);
  const logs = await contract.queryFilter(filter);

  logs.map((log) => {
    console.log("domain: ", log.args);
  });

  console.log("domainControllerContract deployed to", await contract.getAddress());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
