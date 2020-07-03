# client-bucket
---

store file in browser cache

## Install

[![client-bucket](https://nodei.co/npm/client-bucket.png)](https://npmjs.org/package/client-bucket)

## Usage

### import

```js
import ClientBucket, { Bucket } from 'client-bucket';
```

### browser suport

```js
const isSuport: boolean = ClientBucket.isSuport;
```

### hasBucket

```js
const has: boolean = await ClientBucket.hasBucket('my-slider-images');
```

### getBucket

```js
const myPdfBucket: Bucket = ClientBucket.getBucket('my-pdf-files');
```

OR

```js
const myPdfBucket: Bucket = new Bucket('my-pdf-files');
```

### add item to bucket

```js
const data = new Uint8Array(1000);
const added: boolean = await myPdfBucket.putItem('my-unique-name', data);
```

### pick item from bucket

```js
const response: Response | undefined = await myPdfBucket.pickItem('my-unique-name');
if (response) {
    const data = new Uint8Array(await response.arrayBuffer());
}
```

### remove item from bucket
```js
const itemRemoved: boolean = await myPdfBucket.removeItem('my-unique-name');
```

### removeBucket

```js
const bucketRemoved: boolean = await ClientBucket.removeBucket('my-pdf-files');
```

OR

```js
const bucketRemoved: boolean = await myPdfBucket.clear();
```

### all buckets (name of buckets)

```js
const buckets: Array<string> = await ClientBucket.buckets();
```

### removeAllBucket

```js
const allRemoved: boolean = await ClientBucket.removeAllBucket();
```
