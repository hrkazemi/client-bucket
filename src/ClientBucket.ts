import Bucket from "./Bucket";

export enum ERROR_MSG {
    // BUCKET_ALREADY_EXIST = 'BUCKET_ALREADY_EXIST',
    NOT_SUPPORT = 'NOT_SUPPORT',
    // BUCKET_NOT_EXIST = 'BUCKET_NOT_EXIST',
}

export default class ClientBucket {

    private static repository: CacheStorage = caches;

    /** all buckets names have the prefix. */
    static bucketNamePrefix = 'ClientBucket_';

    /** real bucket name */
    private static bucketName(name: string): string {
        return ClientBucket.bucketNamePrefix + name;
    }

    /** 
     * check caches in window
     * check if browser support cache
     */
    static get isSuport(): boolean {
        return 'caches' in window;
    }

    /** 
     * check if bucket with the given name exist
     * @param name bucket name
     * @returns Promise<boolean> true if exist, false if not exist.
     */
    static async hasBucket(name: string): Promise<boolean> {
        if (!ClientBucket.isSuport) throw new Error(ERROR_MSG.NOT_SUPPORT);
        return await ClientBucket.repository.has(ClientBucket.bucketName(name));
    }

    // static async createBucket(name: string): Promise<Bucket> {
    //     if (!ClientBucket.isSuport) throw new Error(ERROR_MSG.NOT_SUPPORT);
    //     if (await ClientBucket.hasBucket(ClientBucket.bucketName(name)))
    //         throw new Error(ERROR_MSG.BUCKET_ALREADY_EXIST);
    //     return new Bucket(ClientBucket.bucketName(name));
    // }

    // async
    /**
     * @param name name of bucket you want to create or get
     * @returns new Bucket with the given name.
     */
    static getBucket(name: string): Bucket {
        if (!ClientBucket.isSuport) throw new Error(ERROR_MSG.NOT_SUPPORT);
        // if (!await ClientBucket.hasBucket(ClientBucket.bucketName(name)))
        //     throw new Error(ERROR_MSG.BUCKET_NOT_EXIST);
        // return new Bucket(ClientBucket.bucketName(name));
        return new Bucket(name);
    }

    /** remove bucket */
    static async removeBucket(name: string): Promise<boolean> {
        if (!ClientBucket.isSuport) throw new Error(ERROR_MSG.NOT_SUPPORT);
        return await ClientBucket.repository.delete(ClientBucket.bucketName(name));
    }

    private static async bucketsRealNames(): Promise<Array<string>> {
        if (!ClientBucket.isSuport) throw new Error(ERROR_MSG.NOT_SUPPORT);
        const keys = await ClientBucket.repository.keys();
        const brn = keys.filter(k => k.includes(ClientBucket.bucketNamePrefix));
        return brn;
    }

    /** 
     * available buckets names
     * @returns name of buclets
     */
    static async buckets(): Promise<Array<string>> {
        const brn = await ClientBucket.bucketsRealNames();
        const list: string[] = brn.map(name => name.replace(ClientBucket.bucketNamePrefix, ''));
        return list;
    }

    /** remove all buckets */
    static async removeAllBucket(name: string): Promise<boolean> {
        if (!ClientBucket.isSuport) throw new Error(ERROR_MSG.NOT_SUPPORT);
        const brn = await ClientBucket.bucketsRealNames();
        for (let i = 0; i < brn.length; i++) {
            await ClientBucket.repository.delete(name);
        }
        return true;
    }

    // static renameBucket(name: string) { }
}
