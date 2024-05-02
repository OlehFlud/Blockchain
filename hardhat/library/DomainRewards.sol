// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import { console } from "hardhat/console.sol";

library DomainRewardLibrary {
  struct RewardData {
    mapping(address => uint256) rewards;
  }

  function addReward(RewardData storage data, address owner, uint256 reward) internal {
    data.rewards[owner] += reward;
  }

  function claimReward(RewardData storage data, address owner) internal returns (uint256) {
    uint256 reward = data.rewards[owner];
    data.rewards[owner] = 0;
    return reward;
  }

  function getAmountOfReward(RewardData storage data, address owner) internal view returns (uint256)  {
    uint256 reward = data.rewards[owner];
    return reward;
  }
}
