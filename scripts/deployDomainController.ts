import { ethers } from "hardhat";

async function main() {
  const domainControllerContract = await ethers.deployContract("DomainController");

  await domainControllerContract.waitForDeployment();

  console.log(
    `domainControllerContract deployed to ${domainControllerContract.target}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
