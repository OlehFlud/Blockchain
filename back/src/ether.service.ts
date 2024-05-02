import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import config from './config';
const abi = config.contractAbi;
const rpcUrl = config.jsonRpcUrl;
const contractAddress = config.contractAddress;
const mnemonic = config.mnemonic;

@Injectable()
export class EthersService {
  //@ts-ignore
  private signer: ethers.Signer;

  constructor() {
    // Initialize provider
    // Initialize signer (optional, use if you need to sign transactions)
  }
 async withdraw() {
    const provider = new ethers.JsonRpcProvider(rpcUrl) as any;
    const wallet = ethers.Wallet.fromPhrase(mnemonic).connect(provider) as any;
   console.log('contractAddress',contractAddress);
   console.log('abi',abi);
   console.log('wallet',wallet);
   const contract = new ethers.Contract(contractAddress, abi, wallet) as any;

    const res = await contract.withdrawFunds('0x3E48Cb3362bC46bae0e39228BA6FBe06E83ce8da');

    await res.wait()
    console.log('price', res);
    return res
  }
}
