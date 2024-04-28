import { ethers, upgrades } from "hardhat";
import {DomainController__factory, DomainController} from "../typechain-types";
import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";

async function main() {
  let owner: SignerWithAddress;
  [owner] = await ethers.getSigners();

  const domainControllerContract = await ethers.getContractFactory("DomainController") as DomainController__factory;
  const contract = await upgrades.deployProxy(domainControllerContract, [owner.address, 1]) as DomainController;

  // add custom data
  await contract.registerDomain("com", {value: 1});
  await contract.registerDomain("ua", {value: 1});
  await contract.registerDomain("net", {value: 1});

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
