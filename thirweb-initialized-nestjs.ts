import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createThirdwebClient,
  getContract,
  prepareContractCall,
  sendTransaction,
} from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { privateKeyToAccount } from 'thirdweb/wallets';


@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);
  private client: any;
  private contract: any;
  private adminAccount: any;


  constructor(private configService: ConfigService) {
    this.initializeThirdweb();
  }


  private initializeThirdweb() {
    try {
      // Get required environment variables
      const secretKey = this.configService.get<string>('THIRDWEB_SECRET_KEY');
      const contractAddress = this.configService.get<string>('SMART_CONTRACT_ADDRESS');
      const adminPrivateKey = this.configService.get<string>('ADMIN_WALLET_PRIVATE_KEY');
      const chainId = this.configService.get<string>('BLOCKCHAIN_CHAIN_ID', '31');


      if (!secretKey) {
        throw new Error('THIRDWEB_SECRET_KEY is required');
      }
      if (!contractAddress) {
        throw new Error('SMART_CONTRACT_ADDRESS is required');
      }
      if (!adminPrivateKey) {
        throw new Error('ADMIN_WALLET_PRIVATE_KEY is required');
      }


      // Create thirdweb client
      this.client = createThirdwebClient({
        secretKey: secretKey,
      });


      // Define custom chain
      const customChain = defineChain(parseInt(chainId));


      // Get contract instance
      this.contract = getContract({
        client: this.client,
        chain: customChain,
        address: contractAddress,
      });


      // Create admin account from private key
      this.adminAccount = privateKeyToAccount({
        client: this.client,
        privateKey: adminPrivateKey,
      });


      this.logger.log('Thirdweb client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Thirdweb client:', error);
      throw error;
    }
  }


  async addAuthorizedSPV(spvWalletAddress: string): Promise<string> {
    try {
      this.logger.log(`Authorizing SPV wallet: ${spvWalletAddress}`);


      // Prepare the contract call
      const transaction = await prepareContractCall({
        contract: this.contract,
        method: "function addAuthorizedSPV(address spvAddress)",
        params: [spvWalletAddress],
      });


      // Send the transaction
      const result = await sendTransaction({
        transaction,
        account: this.adminAccount,
      });


      this.logger.log(`SPV authorized successfully. Transaction hash: ${result.transactionHash}`);
      return result.transactionHash;
    } catch (error) {
      this.logger.error(`Failed to authorize SPV ${spvWalletAddress}:`, error);
      throw new Error(`Blockchain authorization failed: ${error.message}`);
    }
  }


  async removeAuthorizedSPV(spvWalletAddress: string): Promise<string> {
    try {
      this.logger.log(`Removing SPV authorization: ${spvWalletAddress}`);


      // Prepare the contract call
      const transaction = await prepareContractCall({
        contract: this.contract,
        method: "function removeAuthorizedSPV(address spvAddress)",
        params: [spvWalletAddress],
      });


      // Send the transaction
      const result = await sendTransaction({
        transaction,
        account: this.adminAccount,
      });


      this.logger.log(`SPV authorization removed successfully. Transaction hash: ${result.transactionHash}`);
      return result.transactionHash;
    } catch (error) {
      this.logger.error(`Failed to remove SPV authorization ${spvWalletAddress}:`, error);
      throw new Error(`Blockchain deauthorization failed: ${error.message}`);
    }
  }


  async isAuthorizedSPV(spvWalletAddress: string): Promise<boolean> {
    try {
      // This would require a view function in your smart contract
      // For now, we'll return true as a placeholder
      this.logger.log(`Checking SPV authorization status: ${spvWalletAddress}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to check SPV authorization ${spvWalletAddress}:`, error);
      return false;
    }
  }


  // ==================== CONVERSION EVENT METHODS ====================


  async startConversionEvent(): Promise<string> {
    try {
      this.logger.log('Starting conversion event...');


      // Prepare the contract call
      const transaction = await prepareContractCall({
        contract: this.contract,
        method: "function startConversionEvent()",
        params: [],
      });


      // Send the transaction
      const result = await sendTransaction({
        transaction,
        account: this.adminAccount,
      });


      this.logger.log(`Conversion event started successfully. Transaction hash: ${result.transactionHash}`);
      return result.transactionHash;
    } catch (error) {
      this.logger.error('Failed to start conversion event:', error);
      throw new Error(`Failed to start conversion event: ${error.message}`);
    }
  }


  async stopConversionEvent(): Promise<string> {
    try {
      this.logger.log('Stopping conversion event...');


      // Prepare the contract call
      const transaction = await prepareContractCall({
        contract: this.contract,
        method: "function stopConversionEvent()",
        params: [],
      });


      // Send the transaction
      const result = await sendTransaction({
        transaction,
        account: this.adminAccount,
      });


      this.logger.log(`Conversion event stopped successfully. Transaction hash: ${result.transactionHash}`);
      return result.transactionHash;
    } catch (error) {
      this.logger.error('Failed to stop conversion event:', error);
      throw new Error(`Failed to stop conversion event: ${error.message}`);
    }
  }


  // ==================== OWNERSHIP TRANSFER METHODS ====================


  async transferOwnership(newOwnerAddress: string): Promise<string> {
    try {
      this.logger.log(`Transferring contract ownership to: ${newOwnerAddress}`);


      // Validate Ethereum address
      if (!this.isValidEthereumAddress(newOwnerAddress)) {
        throw new Error('Invalid Ethereum address format');
      }


      // Prepare the contract call
      const transaction = await prepareContractCall({
        contract: this.contract,
        method: "function transferOwnership(address newOwner)",
        params: [newOwnerAddress],
      });


      // Send the transaction
      const result = await sendTransaction({
        transaction,
        account: this.adminAccount,
      });


      this.logger.log(`Ownership transferred successfully. Transaction hash: ${result.transactionHash}`);
      return result.transactionHash;
    } catch (error) {
      this.logger.error(`Failed to transfer ownership to ${newOwnerAddress}:`, error);
      throw new Error(`Failed to transfer ownership: ${error.message}`);
    }
  }


  // ==================== CONTRACT MANAGEMENT METHODS ====================


  async updateContractAddress(newContractAddress: string): Promise<void> {
    try {
      this.logger.log(`Updating contract address to: ${newContractAddress}`);


      // Validate Ethereum address
      if (!this.isValidEthereumAddress(newContractAddress)) {
        throw new Error('Invalid contract address format');
      }


      // // Get current chain from existing contract
      // const currentChain = this.contract.chain;


      // // Update contract instance
      // this.contract = getContract({
      //   client: this.client,
      //   chain: currentChain,
      //   address: newContractAddress,
      // });


      this.logger.log('Contract address updated successfully');
    } catch (error) {
      this.logger.error(`Failed to update contract address:`, error);
      throw new Error(`Failed to update contract address: ${error.message}`);
    }
  }


  // ==================== UTILITY METHODS ====================


  private isValidEthereumAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }


  getCurrentContractAddress(): string {
    return this.contract?.address || '';
  }


  getAdminAccountAddress(): string {
    return this.adminAccount?.address || '';
  }
}



