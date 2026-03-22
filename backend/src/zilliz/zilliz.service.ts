import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { MilvusClient, DataType } from '@zilliz/milvus2-sdk-node';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ZillizService implements OnModuleInit{
    private readonly logger = new Logger(ZillizService.name);
    private client: MilvusClient;
    private collectionName: string;
    private vectorDim:number;

    constructor(private configService: ConfigService) {
    // 从 env 读取 Zilliz 配置
    this.collectionName = this.configService.get('MILVUS_COLLECTION') || 'novel_vectors_dev';
    this.vectorDim = Number(this.configService.get('VECTOR_DIM')) || 384;

    // 初始化 Zilliz 客户端（云端，无需本地 Docker）
    this.client = new MilvusClient({
      address: this.configService.get('MILVUS_ENDPOINT') as string,
      token:this.configService.get('MILVUS_TOKEN')
    });
  }

  async onModuleInit() {
      try{
        // 检查集合是否存在，不存在则创建
        const exists = await this.client.hasCollection({collection_name:this.collectionName});
        if(!exists.value){
            await this.client.createCollection({
                collection_name: this.collectionName,
                fields: [
                    { name: 'id', data_type: DataType.Int64, is_primary_key: true, autoID:true },
                    { name: 'vector', data_type: DataType.FloatVector, dim: this.vectorDim },
                    { name: 'text', data_type: DataType.VarChar, max_length: 1000 },
                    { name: 'novel_id', data_type: DataType.VarChar, max_length: 64 },
                ],
            });
            // 创建索引
            await this.client.createIndex({
            collection_name: this.collectionName,
            field_name: 'vector',
            index_type: 'IVF_FLAT',
            metric_type: 'COSINE',
            params: { nlist: 1024 },
            });
        }
        await this.client.loadCollection({collection_name:this.collectionName});
        this.logger.log('Zilliz Cloud 初始化成功');
      }catch(err){
        this.logger.error(`Zilliz 初始化失败: ${err.message}`);
        throw err;
      }
  }

  // 插入向量（小说文本分段 + 向量）
  async insertVectors(vectors: number[][], texts: string[], novelId: string) {
    const rows = vectors.map((v, i) => ({ vector: v, text: texts[i], novel_id: novelId }));
    const res = await this.client.insert({ collection_name: this.collectionName, data: rows });
    if (res.status && res.status.error_code !== 'Success') {
    throw new Error(`Zilliz 插入失败: ${res.status.reason}`);
  }
    return res;
  }

  // 检索相似向量
  async searchSimilarVectors(queryVector: number[], novelId: string, topK = 3) {
    const res = await this.client.search({
      collection_name: this.collectionName,
      vectors: [queryVector],
      anns_field: 'vector',
      limit: topK,
      metric_type: 'COSINE',
      params: { nprobe: 10 },
      filter: `novel_id == "${novelId}"`,
      output_fields: ['text'],
    });
    if (res.status && res.status.error_code !== 'Success') {
    throw new Error(`Zilliz 检索失败: ${res.status.reason}`);
  }
    return res.results[0].map((item: any) => item.entity.text);
  }

  async deleteVectorsByNovelId(novelId:string){
    await this.client.delete({collection_name:this.collectionName,filter:`novel_id == "${novelId}"`});
  }

  // 检查是否已存在该小说的向量
  async hasNovelVectors(novelId: string) {
    const res = await this.client.query({
      collection_name: this.collectionName,
      filter: `novel_id == "${novelId}"`,
      limit: 1,
      output_fields: ['id'],
    });
    return res.status.error_code === 'Success' && res.data && res.data.length > 0;
  }
    
}