import { ethers } from "ethers";
import contractArtifact from "/Users/oleg/WebstormProjects/Blockchain/artifacts/contracts/DomainController.sol/DomainController.json";

const provider = new ethers.BrowserProvider(window.ethereum);

// const endpoint = "http://127.0.0.1:8545/";

// const provider = new ethers.getDefaultProvider(5) // 5 is goerli
// const provider = new ethers.JsonRpcProvider(endpoint);

// Wallet instance (assuming MetaMask is installed and unlocked)
const signer = provider.getSigner();
const address = "0x90945a0dE47cE29d419A6CBD9872eEc223455e63";

export const bind = async (address) => {
  return new ethers.Contract(address, contractArtifact.abi, provider);
};

export const createDomain = async (name, paymentMethod) => {
  console.log('paymentMethod',paymentMethod);


  if (paymentMethod === 'ETH') {
    const signer = await provider.getSigner();
    const Contract = await bind(address);
    const price = await Contract.connect(signer).getPriceFee()

    const amountToSet = 2 / +ethers.formatUnits(price,8);
    console.log('amountToSet',amountToSet);

    const factor = 1e6; // 10^5, так як ми хочемо округлити до 5 знаків після коми
    const amountToSend = Math.ceil(amountToSet * factor) / factor;
    const tx = await Contract.connect(signer).registerDomain(name, {
      value: ethers.parseEther(`${amountToSend}`),
    });

    Contract.on('ConversionRateUpdated', (conversionRate) => {
      console.log('Conversion rate:', conversionRate);
    });

    await tx.wait();
    console.log(`Created domain with name: ${name} Tx hash: ${tx.hash}`);
  } else if (paymentMethod === 'USDC') {
    try {
      const signer = await provider.getSigner();
      const Contract = await bind(address);

      const usdtContractAddress = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'; // Адреса контракту USDT
      const usdtContract = new ethers.Contract(usdtContractAddress, ['function transfer(address,uint256)'], signer);


      await usdtContract.transfer(address, ethers.parseUnits("2", 6));
      const tx = await Contract.connect(signer).registerDomain(name,{
        value: ethers.parseUnits("2", 6),
      });
      Contract.on('ConversionRateUpdated', (conversionRate) => {
        console.log('Conversion rate:', conversionRate);
      });
      await tx.wait();
      console.log(`Created domain with name: ${name} Tx hash: ${tx.hash}`);
    } catch (error) {
      console.error('Error registering domain:', error);
    }
  }
};

export async function getDomainController(name) {
  try {
    const Contract = await bind(address);

    const res = await Contract.getDomainController(name);
    this.controller = res;
    return res;
  } catch (e) {
    console.log("e", e);
  }
};


export async function getBalance() {
  try {
    console.log('click');
    const Contract = await bind(address);
    const signer = await provider.getSigner();
    console.log('Contract',Contract.address);

    const res = await Contract.connect(signer).walletBalance();

    this.balance = ethers.formatEther(res);
    return res;
    // const Contract = await bind(address);
    // const signer = await provider.getSigner();
    //
    // const res = await Contract.connect(signer).getPriceFee();
    //
    // this.balance = ethers.formatUnits(res,6);

  } catch (e) {
    console.log("e", e);
  }
};

export async function getPriceFee() {
  try {
    console.log('click');
    const Contract = await bind(address);
    const signer = await provider.getSigner();

    const res = await Contract.connect(signer).getPriceFee();

    const price = res.wait();
    return price
// Wait for transaction to be mined
    console.log('getPriceFee',price);
  } catch (e) {
    console.log("e", e);
  }
};


export async function metrics() {
  try {
    const Contract = await bind(address);
    const signer = await provider.getSigner();

    const filter = Contract.filters.DomainRegistered(null, signer);
    const logs = await Contract.queryFilter(filter);
    return logs
  } catch (e) {
    console.log("e", e);
  }
};


