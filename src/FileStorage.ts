import { Utility } from "../../asset/script/utility";
import { AppDB } from "../db";
import { IDM } from "../../component/other/download-manager/IDM";
import { CmpUtility } from "../../component/_base/CmpUtility";

export enum FILE_STORAGE_KEY {
    FILE_BOOK_MAIN = 'FILE_BOOK_MAIN',
    FILE_BOOK_MAIN_PARTIAL = 'FILE_BOOK_MAIN_PARTIAL',
    FILE_BOOK_SAMPLE = 'FILE_BOOK_SAMPLE',
    FILE_BOOK_SAMPLE_PARTIAL = 'FILE_BOOK_SAMPLE_PARTIAL',
}

export class FileStorage {
    private static storage: CacheStorage;
    private static readonly partialDownloadSegment = Utility.partialDownloadSegment;

    static async init() {
        if ('caches' in window) {
            FileStorage.storage = caches;
            // const cas = await FileStorage.storage.has(FILE_STORAGE_KEY.FILE_BOOK_MAIN);
        }
    }

    static get isSuport(): boolean {
        return !!FileStorage.storage;
    }

    // save file byId partial --> col, id, data
    //  at the end concat all and save to orig col
    //  call remove file byId partial

    // get file byId --> col, id
    // remove file byId
    // remove file byId partial

    // clear all partial (use if downloadList is empty)
    // clear all book main file (maybe we need it on og out)

    private static async getCollection(collectionName: FILE_STORAGE_KEY): Promise<Cache> {
        return await FileStorage.storage.open(collectionName);
    }

    static async fileById(collectionName: FILE_STORAGE_KEY, fileId: string): Promise<Uint8Array | undefined> {
        if (!FileStorage.isSuport) return;
        // debugger;
        try {
            const col = await FileStorage.getCollection(collectionName);
            const file = await col.match(fileId);
            return file ? new Uint8Array(await file.arrayBuffer()) : undefined;
        } catch (e) {
            console.error('FileStorage.fileById', fileId, e);
        }
    }

    private static async saveFileById(collectionName: FILE_STORAGE_KEY, fileId: string, data: Uint8Array): Promise<boolean> {
        if (!FileStorage.isSuport) return false;
        // if (collectionName.includes('_PARTIAL')) return false;
        if (collectionName.includes('_PARTIAL')) { throw Error(`${collectionName} it's partial`); }

        let saved = false;
        try {
            const col = await FileStorage.getCollection(collectionName);
            await col.put(fileId, new Response(data));
            saved = true;
            // if (!collectionName.includes('_PARTIAL')) {
            const fileMetadata = {
                collectionName,
                id: fileId,
                size: data.length,
                creation_date: Utility.currentTime,
                name: ''
            };
            AppDB.fileMetaData.put(fileMetadata);
            IDM.onFileAdded(fileMetadata, true);
            // }
        } catch (e) {
            console.error('FileStorage.saveFileById', fileId, e);
        }
        return saved;
    }

    static async saveFileByIdPartial(collectionName: FILE_STORAGE_KEY, fileId: string, data: Uint8Array): Promise<boolean> {
        if (!FileStorage.isSuport) return false;
        if (!collectionName.includes('_PARTIAL')) return false;
        // debugger;
        const col = await FileStorage.getCollection(collectionName);
        const keys = await col.keys();
        let count = 0;
        keys.forEach(key => { if (key.url.includes(fileId)) count++; });

        let saved = false;
        try {
            await col.put(`${fileId}_${count}`, new Response(data));
            saved = true;
        } catch (e) {
            console.error('FileStorage.saveFileByIdPartial', fileId, e);
        }
        return saved;
    }

    static async fileByIdPartialLength(collectionName: FILE_STORAGE_KEY, fileId: string): Promise<number> {
        if (!FileStorage.isSuport) return 0;
        if (!collectionName.includes('_PARTIAL')) { throw Error(`${collectionName} it's not partial`); }
        // debugger;
        const col = await FileStorage.getCollection(collectionName);
        const keys = await col.keys();
        let count = 0;
        keys.forEach(key => { if (key.url.includes(fileId)) count++; });
        let file_length = 0;
        if (count > 0) {
            file_length = (count - 1) * FileStorage.partialDownloadSegment;
            try {
                const file = await col.match(`${fileId}_${count - 1}`);
                if (file) {
                    const arr_b = await file.arrayBuffer();
                    file_length = file_length + arr_b.byteLength;
                }
            } catch (e) {
                console.error('FileStorage.fileByIdPartialLength', fileId, e);
            }
        }
        return file_length;
    }

    static async saveFileByIdConcatPartial(collectionName: FILE_STORAGE_KEY, fileId: string): Promise<boolean> {
        if (!FileStorage.isSuport) return false;
        if (!collectionName.includes('_PARTIAL')) { throw Error(`${collectionName} it's not partial`); }
        // debugger;
        console.log('saveFileByIdConcatPartial concating...');
        const col = await FileStorage.getCollection(collectionName);
        const keys = await col.keys();
        const list: string[] = [];
        keys.forEach(key => {
            if (key.url.includes(fileId)) list.push(key.url.replace(window.location.origin + '/', ''));
        });

        const file_length = await FileStorage.fileByIdPartialLength(collectionName, fileId);
        const total = new Uint8Array(file_length);
        let arr_filled_length = 0;
        let error_occuured = false;
        console.time('partial_download_100%_createTotalArr');
        for (let i = 0; i < list.length; i++) {
            const file = await col.match(`${fileId}_${i}`).catch(e => {
                console.error('file byId not exist', fileId);
            });
            if (file) {
                const arr_u = new Uint8Array(await file.arrayBuffer());
                // const arr_u_length = arr_u.byteLength;
                /* for (let j = 0; j < arr_u_length; j++) {
                    total[arr_filled_length + j] = arr_u[j];
                }
                arr_filled_length = arr_filled_length + arr_u.byteLength; */

                try {
                    total.set(arr_u, arr_filled_length);
                } catch (e) {
                    console.error('error_occuured while concat all partial files, set value', e);
                    if (e && e.message === "Source is too large") {
                        error_occuured = true;
                        await FileStorage.removeFileByIdPartial(collectionName, fileId);
                        break;
                    }
                }
                arr_filled_length = arr_filled_length + arr_u.byteLength;
            } else {
                console.warn('error_occuured while concat all partial files', fileId, i);
                error_occuured = true;
                break;
            }
        }
        console.timeEnd('partial_download_100%_createTotalArr');
        if (error_occuured) {
            console.warn('error_occuured while concat all partial files');
            return false;
        }

        let saved = await FileStorage.saveFileById(collectionName.replace('_PARTIAL', '') as FILE_STORAGE_KEY, fileId, total);
        if (saved) {
            console.time('partial_download_100%_removeFileByIdPartial');
            let r_p = await FileStorage.removeFileByIdPartial(collectionName, fileId);
            console.timeEnd('partial_download_100%_removeFileByIdPartial');
            return r_p;
        } else {
            console.warn('on save total file error occured.');
            return false;
        }
    }

    static async removeFileById(collectionName: FILE_STORAGE_KEY, fileId: string): Promise<boolean> {
        if (!FileStorage.isSuport) return false;
        if (collectionName.includes('_PARTIAL')) { throw Error(`${collectionName} it's partial`); }

        const col = await FileStorage.getCollection(collectionName);

        const isDeleted = await col.delete(fileId);
        if (isDeleted) {
            AppDB.fileMetaData.delete(fileId);
            IDM.onFileRemoved(fileId);
            AppDB.etag.delete(fileId);
        }

        return isDeleted;
    }

    static async removeFileByIdPartial(collectionName: FILE_STORAGE_KEY, fileId: string): Promise<boolean> {
        // debugger;
        if (!FileStorage.isSuport) return false;
        if (!collectionName.includes('_PARTIAL')) { throw Error(`${collectionName} it's not partial`); }
        // debugger;

        const col = await FileStorage.getCollection(collectionName);

        const keys = await col.keys();
        const list: string[] = [];
        keys.forEach(key => {
            if (key.url.includes(fileId)) list.push(key.url.replace(window.location.origin + '/', ''));
        });

        let deleted = true;
        for (let i = 0; i < list.length; i++) {
            const d = await col.delete(list[i]);
            deleted = deleted && d;
        }

        return deleted;
    }

    static async clearCollection(collectionName: FILE_STORAGE_KEY): Promise<boolean> {
        if (!FileStorage.isSuport) return false;
        let isDeleted = false;
        try {
            const col = await FileStorage.getCollection(collectionName);
            const keys = await col.keys();
            const list: string[] = keys.map(key => key.url.replace(window.location.origin + '/', ''));
            // keys.forEach(key => {
            //     list.push(key.url.replace(window.location.origin + '/', ''));
            // });
            isDeleted = await FileStorage.storage.delete(collectionName)
            if (isDeleted && !collectionName.includes('_PARTIAL')) {
                AppDB.fileMetaData.bulkDelete(list);
                AppDB.etag.bulkDelete(list);
                list.forEach(fileId => IDM.onFileRemoved(fileId));
                if (list.length) CmpUtility.refreshView();
            }
        } catch (e) {
            console.error('FileStorage.clearCollection', collectionName, e);
        }

        return isDeleted;
    }

    // workbox
    static async clearWorkbox(): Promise<boolean> {
        const keys = await FileStorage.storage.keys();
        let found = undefined;
        for (let i = 0; i < keys.length; i++) {
            if (keys[i].includes('workbox')) { found = keys[i]; break; }
        }
        let isDeleted = false;
        if (found) {
            try {
                isDeleted = await FileStorage.storage.delete(found);
            } catch (e) {
                console.error('FileStorage.clearWorkbox', e)
            }
        }
        return isDeleted;
    }

}
