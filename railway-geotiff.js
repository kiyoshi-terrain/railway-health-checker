// railway-geotiff.js - GeoTIFF処理とOpenLayers統合モジュール

const GeoTIFFManager = {
    map: null,
    tiffLayer: null,
    tiffSource: null,
    
    // 初期化
    init(map) {
        this.map = map;
        this.setupEventHandlers();
        console.log('GeoTIFFManager initialized');
    },
    
    // イベントハンドラー設定
    setupEventHandlers() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        
        // クリックでファイル選択
        uploadArea.addEventListener('click', () => fileInput.click());
        
        // ファイル選択時
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFile(e.target.files[0]);
            }
        });
        
        // ドラッグオーバー
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        // ドラッグリーブ
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        // ドロップ
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0 && this.isGeoTIFF(files[0])) {
                this.handleFile(files[0]);
            }
        });
        
        // レイヤートグル
        const tiffToggle = document.getElementById('tiffToggle');
        tiffToggle.addEventListener('change', (e) => {
            if (this.tiffLayer) {
                this.tiffLayer.setVisible(e.target.checked);
            }
        });
        
        // 透明度調整
        const opacitySlider = document.querySelector('input[type="range"]');
        opacitySlider.addEventListener('input', (e) => {
            if (this.tiffLayer) {
                this.tiffLayer.setOpacity(e.target.value / 100);
            }
        });
    },
    
    // GeoTIFFファイルかチェック
    isGeoTIFF(file) {
        const validTypes = ['image/tiff', 'image/tif'];
        const validExtensions = ['.tif', '.tiff'];
        
        const hasValidType = validTypes.includes(file.type);
        const hasValidExtension = validExtensions.some(ext => 
            file.name.toLowerCase().endsWith(ext)
        );
        
        return hasValidType || hasValidExtension;
    },
    
    // ファイル処理
    async handleFile(file) {
        console.log(`Processing GeoTIFF: ${file.name}`);
            
    // ファイル名を保存
    this.currentFileName = file.name;
    
        try {
            // プログレス表示
            this.showProgress('GeoTIFFを読み込み中...');
            
            // ファイル読み込み
            const arrayBuffer = await file.arrayBuffer();
            const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
            const image = await tiff.getImage();
            
            // メタデータ取得
            const width = image.getWidth();
            const height = image.getHeight();
            const bbox = image.getBoundingBox();
            const projection = this.detectProjection(image);
            
            console.log('GeoTIFF Info:', {
                width,
                height,
                bbox,
                projection
            });
            
            // 画像データ取得
            const rasters = await image.readRasters();
            
            // Canvas作成
            const canvas = this.createCanvas(width, height);
            const ctx = canvas.getContext('2d');
            
            // RGBかグレースケールか判定
            if (rasters.length >= 3) {
                // RGB画像
                this.renderRGB(ctx, rasters, width, height);
            } else {
                // グレースケール
                this.renderGrayscale(ctx, rasters[0], width, height);
            }
            
            // OpenLayersレイヤー作成
            this.addToMap(canvas, bbox, projection);
            
            // 成功メッセージ
            this.showSuccess(`${file.name} を正常に読み込みました`);
            
        } catch (error) {
            console.error('GeoTIFF processing error:', error);
            this.showError('GeoTIFFの読み込みに失敗しました: ' + error.message);
        }
    },
    
    // 投影法検出
    detectProjection(image) {
        try {
            const geoKeys = image.getGeoKeys();
            console.log('GeoKeys found:', geoKeys);
            const projCode = geoKeys.ProjectedCSTypeGeoKey || 
                           geoKeys.GeographicTypeGeoKey;
            console.log('ProjCode:', projCode);
            
            if (projCode) {
                // 日本でよく使われるEPSGコード
                const jpProjections = {
                    6668: 'EPSG:6668', // JGD2011
                    6669: 'EPSG:6669', // JGD2011 / Japan Plane Rectangular CS I
                    6670: 'EPSG:6670', // JGD2011 / Japan Plane Rectangular CS II
                    6671: 'EPSG:6671', // JGD2011 / Japan Plane Rectangular CS III
                    6672: 'EPSG:6672', // JGD2011 / Japan Plane Rectangular CS IV
                    6673: 'EPSG:6673', // JGD2011 / Japan Plane Rectangular CS V
                    6674: 'EPSG:6674', // JGD2011 / Japan Plane Rectangular CS VI
                    6675: 'EPSG:6675', // JGD2011 / Japan Plane Rectangular CS VII
                    6676: 'EPSG:6676', // JGD2011 / Japan Plane Rectangular CS VIII
                    6677: 'EPSG:6677', // JGD2011 / Japan Plane Rectangular CS IX
                    4326: 'EPSG:4326', // WGS84
                    3857: 'EPSG:3857'  // Web Mercator
                };
                
                if (jpProjections[projCode]) {
                    console.log(`Detected projection: ${jpProjections[projCode]}`);
                    return jpProjections[projCode];
                }
            }
        } catch (e) {
            console.warn('Could not detect projection:', e);
        }
        
        // デフォルトはWGS84
        return 'EPSG:6677';
    },
    
    // Canvas作成
    createCanvas(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
            
    // この行を追加！
    this.currentCanvas = canvas;
    
        return canvas;
    },
    
    // RGB画像レンダリング
    renderRGB(ctx, rasters, width, height) {
        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;
        
        const [r, g, b] = rasters;
        const hasAlpha = rasters.length >= 4;
        const alpha = hasAlpha ? rasters[3] : null;
        
        for (let i = 0; i < width * height; i++) {
            const idx = i * 4;
            
            // 正規化（8bitに変換）
            data[idx] = this.normalize(r[i]);
            data[idx + 1] = this.normalize(g[i]);
            data[idx + 2] = this.normalize(b[i]);
            data[idx + 3] = hasAlpha ? this.normalize(alpha[i]) : 255;
        }
        
        ctx.putImageData(imageData, 0, 0);
    },
    
    // グレースケール画像レンダリング
    renderGrayscale(ctx, raster, width, height) {
        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;
        
        // 最小値・最大値取得
        let min = Infinity, max = -Infinity;
        for (let i = 0; i < raster.length; i++) {
            if (raster[i] < min) min = raster[i];
            if (raster[i] > max) max = raster[i];
        }
        
        // レンダリング
        for (let i = 0; i < width * height; i++) {
            const idx = i * 4;
            const value = this.normalizeRange(raster[i], min, max);
            
            data[idx] = value;
            data[idx + 1] = value;
            data[idx + 2] = value;
            data[idx + 3] = 255;
        }
        
        ctx.putImageData(imageData, 0, 0);
    },
    
    // 値の正規化（0-255）
    normalize(value) {
        return Math.max(0, Math.min(255, Math.round(value)));
    },
    
    // 範囲正規化
    normalizeRange(value, min, max) {
        if (max === min) return 128;
        return Math.round(((value - min) / (max - min)) * 255);
    },
    
    // 地図に追加
    addToMap(canvas, bbox, projection) {
        // 既存レイヤー削除
        if (this.tiffLayer) {
            this.map.removeLayer(this.tiffLayer);
        }
        
        // 座標変換
        const extent = ol.proj.transformExtent(
            bbox,
            ol.proj.get(projection),
            this.map.getView().getProjection()
        );
        
        // ImageStaticソース作成
        this.tiffSource = new ol.source.ImageStatic({
            url: canvas.toDataURL(),
            imageExtent: extent,
            projection: this.map.getView().getProjection()
        });
        
        // レイヤー作成
        this.tiffLayer = new ol.layer.Image({
            source: this.tiffSource,
            opacity: 0.7,
            zIndex: 10
        });
        
        // ベースマップのzIndexを設定
        this.map.getLayers().forEach((layer, index) => {
            if (index === 0) {
                layer.setZIndex(0);  // 国土地理院タイルは一番下
            }
        });
                
        // 地図に追加
        this.map.addLayer(this.tiffLayer);
        
        // 初期表示は広域で
        const currentZoom = this.map.getView().getZoom();
        
        // まず広域表示でタイルを読み込ませる
        this.map.getView().setZoom(Math.min(currentZoom, 12));
        
        // タイルが読み込まれてからフィット
        setTimeout(() => {
            // ビューを画像範囲にフィット
            this.map.getView().fit(extent, {
                padding: [50, 50, 50, 50],
                duration: 1000
            });
        }, 500);  // タイル読み込みを待つ
        
        // さらに遅延して最終調整
        setTimeout(() => {
            // 全レイヤーを再描画
            this.map.getAllLayers().forEach(layer => {
                if (layer.getSource() && layer.getSource().refresh) {
                    layer.getSource().refresh();
                }
            });
            this.map.renderSync();
        }, 2000);
                
        // レイヤートグルをONに
        document.getElementById('tiffToggle').checked = true;
        
        // 地図を強制的に再描画（これを追加！）
        setTimeout(() => {
            this.map.updateSize();
            this.map.renderSync();
        }, 100);        
    },
    


    // プログレス表示
    showProgress(message) {
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 24px; animation: spin 2s linear infinite;">⏳</div>
                <p style="font-weight: 600; margin: 10px 0 5px;">${message}</p>
                <div style="width: 200px; height: 4px; background: #e0e0e0; border-radius: 2px; margin: 0 auto;">
                    <div style="width: 50%; height: 100%; background: #2a5298; border-radius: 2px; animation: progress 2s ease-in-out infinite;"></div>
                </div>
            </div>
        `;
    },
    
    // 成功メッセージ
    showSuccess(message) {
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 32px; color: #4caf50;">✅</div>
                <p style="font-weight: 600; margin: 10px 0 5px; color: #4caf50;">${message}</p>
                <button onclick="GeoTIFFManager.resetUploadArea()" style="margin-top: 10px; padding: 8px 16px; background: #2a5298; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    別のファイルを選択
                </button>
            </div>
        `;
    },
    
    // エラーメッセージ
    showError(message) {
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 32px; color: #f44336;">❌</div>
                <p style="font-weight: 600; margin: 10px 0 5px; color: #f44336;">${message}</p>
                <button onclick="GeoTIFFManager.resetUploadArea()" style="margin-top: 10px; padding: 8px 16px; background: #2a5298; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    再試行
                </button>
            </div>
        `;
    },
    
    // アップロードエリアリセット
    resetUploadArea() {
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.innerHTML = `
            <p style="font-size: 24px; margin-bottom: 10px;">📂</p>
            <p style="font-weight: 600; margin-bottom: 5px;">GeoTIFFをアップロード</p>
            <p style="font-size: 12px; color: #666;">ドラッグ&ドロップまたはクリック</p>
            <input type="file" id="fileInput" accept=".tif,.tiff" style="display: none;">
        `;
        this.setupEventHandlers();
    }
};

// グローバルに公開
window.GeoTIFFManager = GeoTIFFManager;