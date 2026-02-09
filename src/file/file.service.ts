import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { File } from './entities/file.entity';
import { Repository } from 'typeorm';
import path = require('path');
import fs = require('fs');
import { S3, GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FileService {
  private readonly Bucket: string;
  private readonly region: string;
  private readonly secretAccessKey: string;
  private readonly accessKeyId: string;
  private readonly s3: S3;

  constructor(
    @InjectRepository(File)
    private readonly repo: Repository<File>,
    private readonly configService: ConfigService,
  ) {
    this.Bucket = this.configService.get<string>('S3_BUCKET') ?? '';
    this.region = this.configService.get<string>('S3_REGION') ?? 'us-east-1';
    this.secretAccessKey =
      this.configService.get<string>('S3_SECRET_ACCES_KEY') ?? '';
    this.accessKeyId = this.configService.get<string>('S3_ACCES_KEY_ID') ?? '';

    // Only create S3 client if credentials are provided
    if (this.accessKeyId && this.secretAccessKey) {
      this.s3 = new S3({
        region: this.region,
        credentials: {
          accessKeyId: this.accessKeyId,
          secretAccessKey: this.secretAccessKey,
        },
      });
    } else {
      // Create a dummy S3 client for type compatibility
      this.s3 = new S3({ region: this.region });
    }
  }

  async save(upload: Express.Multer.File): Promise<File> {
    const response = await this.upload(upload);
    fs.unlink(upload.path, (err) => {
      if (err) console.log('err', err);
    });
    const file = new File();
    file.name = response.key;
    file.path = `${process.env.API_HOST}/file/download/${response.key}`;
    file.extension = upload.mimetype;
    return await this.repo.save(file);
  }

  findAll(): Promise<File[]> {
    return this.repo.find();
  }

  findOne(id: string): Promise<File> {
    return this.repo.findOneOrFail({
      where: { id },
    });
  }

  async remove(id: string) {
    const file = await this.findOne(id);
    await this.delete(file.name);
    return this.repo.delete(id);
  }

  async upload(file: Express.Multer.File) {
    const fileStream = fs.createReadStream(file.path);

    const response = await new Upload({
      client: this.s3,
      params: {
        Bucket: this.Bucket,
        Key: `${new Date().getTime()}_${file.originalname}`,
        Body: fileStream,
      },
    }).done();

    const command = new GetObjectCommand({
      Key: (<any>response).Key,
      Bucket: this.Bucket,
    });

    return {
      key: (<any>response).Key,
      url: await getSignedUrl(this.s3, command),
    };
  }

  async download(fileKey: string) {
    const downloadParams = {
      Key: fileKey,
      Bucket: this.Bucket,
    };

    const response = await this.s3.getObject(downloadParams);
    return response;
  }

  delete(fileKey: string) {
    const params = {
      Key: fileKey,
      Bucket: this.Bucket,
    };

    return this.s3.deleteObject(params);
  }

  static destination() {
    return path.join(__dirname, '../../images');
  }
}
