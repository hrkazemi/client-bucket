# client-bucket
---

store file in browser cache


## Install

[![client-bucket](https://nodei.co/npm/client-bucket.png)](https://npmjs.org/package/client-bucket)

## Usage

```js
import ClientBucket, { Bucket } from 'client-bucket';

const myPDFBucket: Bucket = ClientBucket.getBucket('my-pdf-files');
const added: boolean = await myPDFBucket.putItem('my-unique-name', data);
```
