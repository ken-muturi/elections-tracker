import { S3 } from 'aws-sdk';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { rand } from './util';
import axios from 'axios';
import { handleReturnError } from "./error-handling";

export const createSignedUrlV2 = async (contentType: string, filename: string): Promise<string> => {
    const s3 = new S3({
        accessKeyId: process.env.NEXT_PUBLIC_S3_AWS_ACCESS_KEY,
        secretAccessKey: process.env.NEXT_PUBLIC_S3_AWS_SECRET_ACCESS_KEY,
        region: process.env.NEXT_PUBLIC_AWS_S3_REGION || 'us-east-1',
        signatureVersion: 'v4',
    });

    return s3.getSignedUrlPromise('putObject', {
        Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET,
        Key: filename,
        ContentType: contentType,
        Expires: 600,
        ACL: 'public-read',
    });
};

export const createSignedUrl = async (contentType: string, filename: string): Promise<string> => {
    const s3 = new S3Client({
        region: process.env.AWS_S3_REGION || 'us-east-1',
        credentials: {
            accessKeyId: process.env.NEXT_PUBLIC_S3_AWS_ACCESS_KEY!,
            secretAccessKey: process.env.NEXT_PUBLIC_S3_AWS_SECRET_ACCESS_KEY!,
        },
    });

    const command = new PutObjectCommand({
        Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET,
        Key: filename,
        ContentType: contentType,
    });
    return getSignedUrl(s3, command, { expiresIn: 60 });
};

export const uploadFile = async (file: File, version = "v3"): Promise<string> => {
    try {
        const filename = `${rand(10)}.${file.name.split('.').pop()!}`;
        const url = await(
            version === 'v3'
                ? createSignedUrl(file.type, filename)
                : createSignedUrlV2(file.type, filename)
        );
        console.log(url);
       await axios.put(url, file, {
         headers: {
           "Content-Type": file.type,
           // 'Content-Type': "multipart/form-data",
         },
       });
        const fileName = url.split('?')[0];
        return fileName.replace(process.env.NEXT_PUBLIC_AWS_S3_BUCKET_URL!, '');
    } catch (error) {
        console.error('Error uploading file:', error);
        const message = handleReturnError(error);
        throw Error(message)
        // return Promise.resolve(message);
    }
};
