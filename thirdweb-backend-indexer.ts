import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { MintingRepository } from '../../database/repositories/pneo.repository';
import { BlockchainService } from './blockchain.service';
import { getRpcClient, eth_getLogs, eth_getTransactionReceipt, eth_getBlockByNumber } from 'thirdweb';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

@Injectable()
export class IndexerService {
  private readonly logger = new Logger(IndexerService.name);
  private readonly rpcClient: ReturnType<typeof getRpcClient>;
  private readonly centralServerWalletAddress: string;
  private lastIndexedBlock = 0;
  private contractPneoBlock = 0;

  constructor(
    private readonly configService: ConfigService,
    private readonly blockchainService: BlockchainService,
    private readonly mintingRepo: MintingRepository
  ) {
    // Inicializar RPC usando la chain de BlockchainService
    this.rpcClient = getRpcClient({ client: this.blockchainService['client'], chain: this.blockchainService['chain'] });
    this.centralServerWalletAddress = this.configService.get<string>('ADMIN_WALLET_ADDRESS')!.toLowerCase();
    this.contractPneoBlock = parseInt(this.configService.get<string>('PNEO_CONTRACT_BLOCK', '0'), 10);

  }

  private get contractAddress() {
    return this.blockchainService.getCurrentContractAddress().toLowerCase();
  }

  private async fetchTransferLogs(fromBlock: number, toBlock: number) {
    try {
      const response = await eth_getLogs(this.rpcClient, {
        address: this.contractAddress as `0x${string}`,
        fromBlock: BigInt(fromBlock),
        toBlock: BigInt(toBlock),
        topics: [TRANSFER_TOPIC],
      });
      return response as any[];
    } catch (error: any) {
      this.logger.error('Error obteniendo logs:', error.message);
      return [];
    }
  }


  @Interval(40000)
  async handleIndexing() {
    this.logger.log('Iniciando ciclo de indexación...');

    try {
      // 1️⃣ Obtener el último bloque indexado desde la DB
      const meta = await this.mintingRepo.getIndexerMetadata('last_indexed_block');
      let fromBlock: number;

      if (meta) {
        fromBlock = Number(meta.value) + 1;
      } else {
        // Si no hay metadata, se empieza desde el bloque de despliegue del contrato
        fromBlock = this.contractPneoBlock;
      }

      console.log('fromBlock', fromBlock);

      // 2️⃣ Obtener el último bloque de la blockchain
      const latestBlockRaw = await this.rpcClient({ method: 'eth_blockNumber' });
      let latestBlockHex: string | null = null;

      if (latestBlockRaw) {
        if (typeof latestBlockRaw === 'string') {
          latestBlockHex = latestBlockRaw;
        } else if (typeof latestBlockRaw === 'object' && 'result' in latestBlockRaw && typeof (latestBlockRaw as any).result === 'string') {
          latestBlockHex = (latestBlockRaw as any).result;
        }
      }

      if (!latestBlockHex) {
        this.logger.error('No se pudo obtener el último bloque de la blockchain.');
        return;
      }

      const latestBlock = parseInt(latestBlockHex, 16);

      if (fromBlock > latestBlock) {
        this.logger.log('No hay nuevos bloques para indexar.');
        return;
      }

      this.logger.log(`Indexando bloques desde ${fromBlock} hasta ${latestBlock}`);

      // Batching
      const BATCH_SIZE = 1000; // este es el maximo que permite el RPC de THIRDWEB
      for (let start = fromBlock; start <= latestBlock; start += BATCH_SIZE) {
        const end = Math.min(start + BATCH_SIZE - 1, latestBlock);
  
        this.logger.log(`Procesando batch de bloques ${start} a ${end}`);
        const logs = await this.fetchTransferLogs(start, end);
        await this.processLogs(logs);
  
        // Actualizar último bloque indexado después de cada batch
        await this.mintingRepo.setIndexerMetadata('last_indexed_block', end);
        this.lastIndexedBlock = end;
      }
  

      this.logger.log(`Indexación completada hasta bloque ${latestBlock}`);
    } catch (error: any) {
      this.logger.error('Error en el indexador:', error.message);
    }
  }

  private async processLogs(logs: any[]) {
    for (const log of logs) {
      try {
        const txHash = log.transactionHash;
        const fromAddress = `0x${log.topics[1].slice(26)}`.toLowerCase();
        const toAddress = `0x${log.topics[2].slice(26)}`.toLowerCase();
        const amount = Number(BigInt(log.data)) / 1e18;

        let type: 'Mint' | 'Burn' | 'Transfer' = 'Transfer';
        if (fromAddress === ZERO_ADDRESS) type = 'Mint';
        else if (toAddress === ZERO_ADDRESS) type = 'Burn';
        if (type === 'Transfer') continue;

        const receipt = await eth_getTransactionReceipt(this.rpcClient, { hash: txHash });
        const block = await eth_getBlockByNumber(this.rpcClient, { blockNumber: log.blockNumber });
        const callerAddress = receipt.from.toLowerCase();
        const timestampMs = Number(block.timestamp) * 1000;

        const { executionMethod, spvId } = await this.determineSPVAttribution(callerAddress, txHash);

        await this.mintingRepo.createTransaction({
          hash: txHash,
          blockNumber: Number(log.blockNumber),
          timestamp: timestampMs,
          type,
          amount,
          callerAddress,
          executionMethod: executionMethod as 'CENTRAL_SERVER' | 'SPV_INDIVIDUAL',
          spvIdFk: spvId ? spvId.toString() : null,
          fromAddress,
          toAddress,
        });
      } catch (e: any) {
        this.logger.error(`Error procesando log TX ${log.transactionHash}: ${e.message}`);
      }
    }
  }

  private async determineSPVAttribution(callerAddress: string, txHash: string) {
    const centralWallet = this.centralServerWalletAddress;
  
    if (callerAddress === centralWallet) {
      const request = await this.mintingRepo.findMintRequestByTxHash(txHash);
  
      return {
        executionMethod: 'CENTRAL_SERVER' as const,
        spvId: request ? Number(request.spvIdFk) : null, 
      };
    }
  
    const spv = await this.mintingRepo.getPrimarySPVByWalletAddress(callerAddress);
  
    return {
      executionMethod: 'SPV_INDIVIDUAL' as const,
      spvId: spv ? Number(spv.spvId) : null, 
    };
  }
}
