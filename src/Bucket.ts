import ClientBucket from "./ClientBucket";

export default class Bucket {

    private repository: CacheStorage = caches;
    private realName: string;

    constructor(name: string) {
        this.realName = ClientBucket.bucketNamePrefix + name;
    }

    // async check(): Promise<boolean> {
    //     return await this.repository.has(name);
    // }

    /** bucket name */
    get name() {
        return this.realName.replace(ClientBucket.bucketNamePrefix, '');
    }

    private async open(): Promise<Cache> {
        return await this.repository.open(this.realName);
    }
    /** 
     * @returns bucket items unique ids
     */
    async items(): Promise<Array<string>> {
        const col = await this.open();
        const keys = await col.keys();
        const list: string[] = keys.map(key => key.url.replace(window.location.origin + '/', ''));
        return list;
    }
    /** clear bucket */
    async clear(): Promise<boolean> {
        return await this.repository.delete(this.realName);
    }
    /**
     * will return item response if exist.
     * @param itemId item's id
     */
    async pickItem(itemId: string): Promise<Response | undefined> {
        const col = await this.open();
        const response = await col.match(itemId);
        // return file ? new Uint8Array(await file.arrayBuffer()) : undefined;
        return response;
    }
    /**
     * will remove item with the given id.
     */
    async removeItem(itemId: string): Promise<boolean> {
        const col = await this.open();
        return await col.delete(itemId);
    }
    /**
     * will create or replace given data with this itemId.
     * @param itemId item unique id
     * @param data item data to store
     */
    async putItem(itemId: string, data: BodyInit): Promise<boolean> { // Uint8Array
        const col = await this.open();
        await col.put(itemId, new Response(data));
        return true;
    }
}