
enum ERROR_MSG {
    BUCKET_ALREADY_EXIST = 'BUCKET_ALREADY_EXIST',
    NOT_SUPPORT = 'NOT_SUPPORT',
    BUCKET_NOT_EXIST = 'BUCKET_NOT_EXIST',
}

export class Bucket {
    private repository: CacheStorage = caches;
    constructor(private name: string) { }

    // async check(): Promise<boolean> {
    //     return await this.repository.has(name);
    // }
    private async open(): Promise<Cache> {
        return await this.repository.open(this.name);
    }
    /** 
     * @returns bucket items ids
     */
    async items(): Promise<Array<string>> {
        const col = await this.open();
        const keys = await col.keys();
        const list: string[] = keys.map(key => key.url.replace(window.location.origin + '/', ''));
        return list;
    }
    async clear(): Promise<boolean> {
        return await this.repository.delete(this.name);
    }
    async pickItem(itemId: string): Promise<Uint8Array | undefined> {
        const col = await this.open();
        const file = await col.match(itemId);
        return file ? new Uint8Array(await file.arrayBuffer()) : undefined;
    }
    async removeItem(itemId: string): Promise<boolean> {
        const col = await this.open();
        return await col.delete(itemId);
    }
    async putItem(itemId: string, data: Uint8Array): Promise<boolean> {
        const col = await this.open();
        await col.put(itemId, new Response(data));
        return true;
    }
}

export class ClientBucket {
    private static repository: CacheStorage = caches;
    /** check caches in window */
    static get isSuport(): boolean {
        return 'caches' in window;
    }

    static async hasBucket(name: string): Promise<boolean> {
        return await ClientBucket.repository.has(name);
    }

    static async createBucket(name: string): Promise<Bucket> {
        if (!ClientBucket.isSuport) throw new Error(ERROR_MSG.NOT_SUPPORT);
        if (await ClientBucket.hasBucket(name)) throw new Error(ERROR_MSG.BUCKET_ALREADY_EXIST);
        return new Bucket(name);
    }

    static async getBucket(name: string) {
        if (!ClientBucket.isSuport) throw new Error(ERROR_MSG.NOT_SUPPORT);
        if (!await ClientBucket.hasBucket(name)) throw new Error(ERROR_MSG.BUCKET_NOT_EXIST);
        return new Bucket(name);
    }

    static async removeBucket(name: string): Promise<boolean> {
        return await ClientBucket.repository.delete(name);
    }

    // TODO
    static renameBucket(name: string) {

    }
}
