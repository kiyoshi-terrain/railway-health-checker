// railway-layer-storage.js - IndexedDBを使ったレイヤー保存機能

const LayerStorage = {
    dbName: 'RailwayGeoTIFFDB',
    dbVersion: 1,
    storeName: 'geotiffLayers',
    db: null,
    
    // データベース初期化
    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('IndexedDB open error:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB initialized');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // オブジェクトストア作成
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    
                    // インデックス作成
                    store.createIndex('fileName', 'fileName', { unique: false });
                    store.createIndex('savedAt', 'savedAt', { unique: false });
                }
            };
        });
    },
    
    // GeoTIFFレイヤー保存
    async saveLayer(layerData, imageBlob) {
        if (!this.db) await this.initDB();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            // レイヤーデータとBlobを一緒に保存
            const dataToSave = {
                ...layerData,
                imageBlob: imageBlob,
                savedAt: new Date().toISOString(),
                fileSize: imageBlob.size,
                fileSizeMB: (imageBlob.size / 1024 / 1024).toFixed(2) + ' MB'
            };
            
            const request = store.add(dataToSave);
            
            request.onsuccess = () => {
                console.log('Layer saved successfully:', dataToSave.fileName);
                resolve(request.result);
            };
            
            request.onerror = () => {
                console.error('Save error:', request.error);
                reject(request.error);
            };
        });
    },
    
    // 保存済みレイヤー一覧取得
    async getAllLayers() {
        if (!this.db) await this.initDB();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();
            
            request.onsuccess = () => {
                // Blobを除いた情報だけ返す（一覧表示用）
                const layers = request.result.map(layer => ({
                    id: layer.id,
                    fileName: layer.fileName,
                    extent: layer.extent,
                    projection: layer.projection,
                    savedAt: layer.savedAt,
                    fileSizeMB: layer.fileSizeMB
                }));
                resolve(layers);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    },
    
    // 特定のレイヤー取得
    async getLayer(id) {
        if (!this.db) await this.initDB();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(id);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    },
    
    // レイヤー削除
    async deleteLayer(id) {
        if (!this.db) await this.initDB();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(id);
            
            request.onsuccess = () => {
                console.log('Layer deleted:', id);
                resolve();
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    },
    
    // 全レイヤー削除
    async clearAll() {
        if (!this.db) await this.initDB();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();
            
            request.onsuccess = () => {
                console.log('All layers cleared');
                resolve();
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    },
    
    // ストレージ使用量取得
    async getStorageInfo() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            return {
                usage: (estimate.usage / 1024 / 1024).toFixed(2),
                quota: (estimate.quota / 1024 / 1024).toFixed(2),
                percent: ((estimate.usage / estimate.quota) * 100).toFixed(2)
            };
        }
        return null;
    }
};

// GeoTIFFManagerに統合する関数
const GeoTIFFStorageExtension = {
    
    // 現在のレイヤーを保存
    async saveCurrentLayer() {
        if (!this.tiffLayer) {
            alert('保存するGeoTIFFレイヤーがありません');
            return;
        }
        
        try {
            // プログレス表示
            this.showProgress('レイヤーを保存中...');
            
            // CanvasからBlobを作成
            const canvas = this.currentCanvas; // handleFileで保存しておく
            if (!canvas) {
                throw new Error('画像データが見つかりません');
            }
            
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            
            // レイヤー情報
            const layerData = {
                fileName: this.currentFileName || 'GeoTIFF Layer',
                extent: this.tiffSource.getImageExtent(),
                projection: this.tiffSource.getProjection().getCode(),
                opacity: this.tiffLayer.getOpacity(),
                visible: this.tiffLayer.getVisible(),
                bbox: this.currentBbox
            };
            
            // IndexedDBに保存
            await LayerStorage.saveLayer(layerData, blob);
            
            // 成功表示
            this.showSuccess(`${layerData.fileName} を保存しました！`);
            
            // リスト更新
            await this.updateSavedLayersList();
            
        } catch (error) {
            console.error('保存エラー:', error);
            this.showError('保存に失敗しました: ' + error.message);
        }
    },
    
    // 保存済みレイヤー読み込み
    async loadSavedLayer(id) {
        try {
            this.showProgress('レイヤーを読み込み中...');
            
            // IndexedDBから取得
            const layerData = await LayerStorage.getLayer(id);
            if (!layerData) {
                throw new Error('レイヤーが見つかりません');
            }
            
            // BlobからURLを作成
            const url = URL.createObjectURL(layerData.imageBlob);
            
            // 既存レイヤー削除
            if (this.tiffLayer) {
                this.map.removeLayer(this.tiffLayer);
            }
            
            // レイヤー作成
            this.tiffSource = new ol.source.ImageStatic({
                url: url,
                imageExtent: layerData.extent,
                projection: layerData.projection
            });
            
            this.tiffLayer = new ol.layer.Image({
                source: this.tiffSource,
                opacity: layerData.opacity || 0.7,
                visible: layerData.visible !== false
            });
            
            this.map.getLayers().insertAt(1, this.tiffLayer);
            
            // ビューを調整
            this.map.getView().fit(layerData.extent, {
                padding: [50, 50, 50, 50],
                duration: 1000
            });
            
            // 現在の情報を更新
            this.currentFileName = layerData.fileName;
            this.currentBbox = layerData.bbox;
            
            // トグルをONに
            document.getElementById('tiffToggle').checked = true;
            
            this.showSuccess(`${layerData.fileName} を読み込みました！`);
            
        } catch (error) {
            console.error('読み込みエラー:', error);
            this.showError('読み込みに失敗しました: ' + error.message);
        }
    },
    
    // 保存済みレイヤーリスト更新
    async updateSavedLayersList() {
        try {
            const layers = await LayerStorage.getAllLayers();
            const listContainer = document.getElementById('savedLayersList');
            
            if (!listContainer) return;
            
            if (layers.length === 0) {
                listContainer.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">保存済みレイヤーはありません</p>';
                return;
            }
            
            // リスト作成
            listContainer.innerHTML = layers.map(layer => `
                <div style="display: flex; align-items: center; gap: 10px; padding: 10px; 
                           background: white; border-radius: 8px; margin-bottom: 8px;">
                    <div style="flex: 1;">
                        <p style="font-weight: 500; margin: 0;">${layer.fileName}</p>
                        <p style="font-size: 11px; color: #666; margin: 4px 0 0;">
                            ${new Date(layer.savedAt).toLocaleString('ja-JP')} - ${layer.fileSizeMB}
                        </p>
                    </div>
                    <button onclick="GeoTIFFManager.loadSavedLayer(${layer.id})" 
                            style="padding: 6px 12px; background: #2a5298; color: white; 
                                   border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">
                        読込
                    </button>
                    <button onclick="GeoTIFFManager.deleteSavedLayer(${layer.id})" 
                            style="padding: 6px 12px; background: #dc3545; color: white; 
                                   border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">
                        削除
                    </button>
                </div>
            `).join('');
            
            // ストレージ情報表示
            const storageInfo = await LayerStorage.getStorageInfo();
            if (storageInfo) {
                listContainer.innerHTML += `
                    <div style="margin-top: 10px; padding: 10px; background: #f8f9fa; 
                               border-radius: 8px; font-size: 11px; color: #666;">
                        ストレージ使用量: ${storageInfo.usage} MB / ${storageInfo.quota} MB (${storageInfo.percent}%)
                    </div>
                `;
            }
            
        } catch (error) {
            console.error('リスト更新エラー:', error);
        }
    },
    
    // レイヤー削除
    async deleteSavedLayer(id) {
        if (confirm('このレイヤーを削除してもよろしいですか？')) {
            try {
                await LayerStorage.deleteLayer(id);
                await this.updateSavedLayersList();
                this.showSuccess('レイヤーを削除しました');
            } catch (error) {
                console.error('削除エラー:', error);
                this.showError('削除に失敗しました: ' + error.message);
            }
        }
    }
};

// GeoTIFFManagerに機能を追加
Object.assign(window.GeoTIFFManager, GeoTIFFStorageExtension);

// 初期化時にDB準備とリスト更新
LayerStorage.initDB().then(() => {
    console.log('LayerStorage ready');
    if (window.GeoTIFFManager) {
        window.GeoTIFFManager.updateSavedLayersList();
    }
});

// グローバルに公開
window.LayerStorage = LayerStorage;