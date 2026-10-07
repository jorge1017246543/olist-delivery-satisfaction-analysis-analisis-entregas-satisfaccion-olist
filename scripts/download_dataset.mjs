import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const destination = resolve(process.argv[2] ?? 'data/raw/olist.zip');
const url = 'https://www.kaggle.com/api/v1/datasets/download/olistbr/brazilian-ecommerce';

await mkdir(dirname(destination), { recursive: true });
const response = await fetch(url, { redirect: 'follow' });
if (!response.ok || !response.body) {
  throw new Error(`Dataset download failed: HTTP ${response.status}`);
}

await pipeline(Readable.fromWeb(response.body), createWriteStream(destination));
console.log(`Downloaded Olist dataset to ${destination}`);
