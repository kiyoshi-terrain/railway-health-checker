// railway-registration.js - 新規地点登録機能

const RegistrationManager = {
    currentStep: 1,
    selectedCoords: null,
    mapClickListener: null,
    registrationLayer: null,
    formData: {
        coords: null,
        classification: null,
        structureType: null,
        kilometer: null,
        grade: null,
        photos: [],
        remarks: ''
    },
    
    // 初期化
    init(map) {
        this.map = map;
        this.setupRegistrationLayer();
        this.setupEventListeners();
        console.log('RegistrationManager initialized');
    },
    
    // 登録レイヤーの初期化
    setupRegistrationLayer() {
        // 登録地点表示用のレイヤー
        const source = new ol.source.Vector();
        this.registrationLayer = new ol.layer.Vector({
            source: source,
            style: new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 8,
                    fill: new ol.style.Fill({ color: '#ff0000' }),
                    stroke: new ol.style.Stroke({
                        color: 'white',
                        width: 3
                    })
                })
            }),
            zIndex: 100
        });
        this.map.addLayer(this.registrationLayer);
    },
    
    // イベントリスナー設定
    setupEventListeners() {
        // 分類ボタン
        document.querySelectorAll('.class-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.class-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.formData.classification = btn.dataset.type;
            });
        });
        
        // 健全度ボタン
        document.querySelectorAll('.grade-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.grade-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.formData.grade = btn.dataset.grade;
            });
        });
        
        // 写真アップロード
        const photoInput = document.getElementById('photoInput');
        if (photoInput) {
            photoInput.addEventListener('change', (e) => this.handlePhotoUpload(e));
        }
        
        // カメラ入力の追加
        const cameraInput = document.getElementById('cameraInput');
        if (cameraInput) {
            cameraInput.addEventListener('change', (e) => this.handlePhotoUpload(e));
        }
        
        // ドラッグ&ドロップの設定
        const dropZone = document.getElementById('dropZone');
        if (dropZone) {
            dropZone.addEventListener('click', () => {
                document.getElementById('photoInput').click();
            });
            
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('dragover');
            });
            
            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('dragover');
            });
            
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('dragover');
                this.handleDroppedFiles(e.dataTransfer.files);
            });
        }
    },
    
    // 新規登録開始
    start() {
        // パネルを表示
        document.getElementById('registrationPanel').style.display = 'flex';
        
        // 他のカードを非表示
        document.querySelectorAll('.data-card').forEach(card => {
            card.style.display = 'none';
        });
        
        // ステップ1に初期化
        this.currentStep = 1;
        this.showStep(1);
        
        // 地図クリックイベントを有効化
        this.enableMapClick();
    },
    
    // 登録終了
    close() {
        // パネルを非表示
        document.getElementById('registrationPanel').style.display = 'none';
        
        // カードを再表示
        document.querySelectorAll('.data-card').forEach(card => {
            card.style.display = 'block';
        });
        
        // 地図クリックイベントを無効化
        this.disableMapClick();
        
        // 一時マーカーをクリア
        this.registrationLayer.getSource().clear();
        
        // フォームリセット
        this.resetForm();
    },
    
    // 地図クリックを有効化
    enableMapClick() {
        this.mapClickListener = (evt) => {
            // 座標を取得
            const coords = evt.coordinate;
            const lonLat = ol.proj.toLonLat(coords);
            
            // 座標を保存
            this.selectedCoords = coords;
            this.formData.coords = {
                webMercator: coords,
                lonLat: lonLat,
                jgd2011: null
            };
            
            // JGD2011座標に変換
            try {
                const jgd = ol.proj.transform(coords, 'EPSG:3857', 'EPSG:6677');
                this.formData.coords.jgd2011 = jgd;
            } catch (e) {
                console.error('座標変換エラー:', e);
            }
            
            // 座標表示を更新
            const coordsText = `N${lonLat[1].toFixed(6)}° E${lonLat[0].toFixed(6)}°`;
            document.getElementById('selectedCoords').value = coordsText;
            
            // 地図上にマーカーを表示
            this.showTempMarker(coords);
            
            // 次のステップへ自動遷移
            setTimeout(() => this.nextStep(), 500);
        };
        
        this.map.on('click', this.mapClickListener);
        
        // カーソルを変更
        this.map.getTargetElement().style.cursor = 'crosshair';
    },
    
    // 地図クリックを無効化
    disableMapClick() {
        if (this.mapClickListener) {
            this.map.un('click', this.mapClickListener);
            this.mapClickListener = null;
        }
        
        // カーソルを戻す
        this.map.getTargetElement().style.cursor = '';
    },
    
    // 一時マーカー表示
    showTempMarker(coords) {
        // 既存のマーカーをクリア
        this.registrationLayer.getSource().clear();
        
        // 新しいマーカーを追加
        const marker = new ol.Feature({
            geometry: new ol.geom.Point(coords)
        });
        
        this.registrationLayer.getSource().addFeature(marker);
    },
    
    // ステップ表示切り替え
    showStep(step) {
        // すべてのステップを非表示
        document.querySelectorAll('.step-content').forEach(content => {
            content.style.display = 'none';
        });
        
        // 対象のステップを表示
        document.getElementById(`step${step}`).style.display = 'block';
        
        // ステップインジケーターを更新
        document.querySelectorAll('.step').forEach(s => {
            s.classList.remove('active');
            if (parseInt(s.dataset.step) === step) {
                s.classList.add('active');
            }
        });
        
        // ボタンの表示制御
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        if (step === 1) {
            prevBtn.style.display = 'none';
            nextBtn.textContent = '次へ';
        } else if (step === 3) {
            prevBtn.style.display = 'inline-block';
            nextBtn.textContent = '保存';
        } else {
            prevBtn.style.display = 'inline-block';
            nextBtn.textContent = '次へ';
        }
    },
    
    // 次のステップへ
    nextStep() {
        // バリデーション
        if (!this.validateStep(this.currentStep)) {
            return;
        }
        
        if (this.currentStep < 3) {
            this.currentStep++;
            this.showStep(this.currentStep);
            
            // ステップ2に入ったら地図クリックを無効化
            if (this.currentStep === 2) {
                this.disableMapClick();
            }
        } else {
            // 保存処理
            this.save();
        }
    },
    
    // 前のステップへ
    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.showStep(this.currentStep);
            
            // ステップ1に戻ったら地図クリックを有効化
            if (this.currentStep === 1) {
                this.enableMapClick();
            }
        }
    },
    
    // ステップのバリデーション
    validateStep(step) {
        switch (step) {
            case 1:
                if (!this.selectedCoords) {
                    alert('地図上をクリックして地点を選択してください');
                    return false;
                }
                break;
            case 2:
                if (!this.formData.classification) {
                    alert('分類を選択してください');
                    return false;
                }
                if (!document.getElementById('structureType').value) {
                    alert('構造物種別を選択してください');
                    return false;
                }
                // キロ程を保存
                this.formData.kilometer = document.getElementById('kilometer').value;
                this.formData.structureType = document.getElementById('structureType').value;
                break;
            case 3:
                // 備考を保存
                this.formData.remarks = document.getElementById('remarks').value;
                break;
        }
        return true;
    },
    
// 写真アップロード処理
    handlePhotoUpload(event) {
        const files = event.target.files;
        
        for (let file of files) {
            if (file.type.startsWith('image/')) {
                this.processImageFile(file);
            }
        }
        
        // inputをリセット（同じファイルを再選択できるように）
        event.target.value = '';
    },

    // ドロップされたファイルの処理
    handleDroppedFiles(files) {
        const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        
        if (validFiles.length === 0) {
            alert('画像ファイルのみアップロード可能です');
            return;
        }
        
        validFiles.forEach(file => {
            this.processImageFile(file);
        });
    },
    
    // 画像ファイルを処理（共通化）
    processImageFile(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            // プレビュー作成
            const preview = document.getElementById('photoPreview');
            const thumb = document.createElement('div');
            thumb.className = 'photo-thumb';
            
            const img = document.createElement('img');
            img.src = e.target.result;
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.innerHTML = '×';
            removeBtn.onclick = () => {
                thumb.remove();
                // formDataからも削除
                const index = this.formData.photos.findIndex(p => p.data === e.target.result);
                if (index > -1) {
                    this.formData.photos.splice(index, 1);
                }
            };
            
            thumb.appendChild(img);
            thumb.appendChild(removeBtn);
            preview.appendChild(thumb);
            
            // データに追加
            this.formData.photos.push({
                name: file.name,
                data: e.target.result,
                timestamp: new Date().toISOString()
            });
            
            console.log(`写真追加: ${file.name}`);
        };
        
        reader.readAsDataURL(file);
    },
    
    // 保存処理
    async save() {
        try {
            // 保存用データを作成
            const saveData = {
                id: await this.generateId(this.formData.classification),
                type: this.formData.classification,
                coords: this.formData.coords,
                structureType: this.formData.structureType,
                kilometer: this.formData.kilometer,
                grade: this.formData.grade,
                remarks: this.formData.remarks,
                photos: this.formData.photos,
                timestamp: new Date().toISOString(),
                history: [{
                    year: new Date().getFullYear(),
                    health: this.formData.grade || null
                }]
            };
            
            console.log('保存データ:', saveData);
            
            // IndexedDBに保存
            await this.saveToDatabase(saveData);
            
            // 地図にマーカー追加
            this.addMarkerToMap(saveData);
            
            alert(`登録完了！\nID: ${saveData.id}`);
            
            // 登録完了後の処理
            this.close();
            
        } catch (error) {
            console.error('保存エラー:', error);
            alert('保存に失敗しました');
        }
    },
    
    // フォームリセット
    resetForm() {
        this.currentStep = 1;
        this.selectedCoords = null;
        this.formData = {
            coords: null,
            classification: null,
            structureType: null,
            kilometer: null,
            grade: null,
            photos: [],
            remarks: ''
        };
        
        // UI要素のリセット
        document.getElementById('selectedCoords').value = '';
        document.getElementById('structureType').value = '';
        document.getElementById('kilometer').value = '';
        document.getElementById('remarks').value = '';
        document.getElementById('photoPreview').innerHTML = '';
        
        // 選択状態のクリア
        document.querySelectorAll('.class-btn, .grade-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
    }
};

// グローバル関数
function startNewInspection() {
    RegistrationManager.start();
}

function closeRegistration() {
    RegistrationManager.close();
}

function nextStep() {
    RegistrationManager.nextStep();
}

function previousStep() {
    RegistrationManager.previousStep();
}

// エクスポート
window.RegistrationManager = RegistrationManager;

// ==================== IndexedDB関連の機能 ====================

// IndexedDBの初期化
RegistrationManager.initDatabase = function() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('RailwayHealthDB', 1);
        
        request.onerror = () => {
            console.error('DB初期化エラー:', request.error);
            reject(request.error);
        };
        
        request.onsuccess = () => {
            console.log('DB接続成功！');
            resolve(request.result);
        };
        
        request.onupgradeneeded = (event) => {
            console.log('DB作成・アップグレード中...');
            const db = event.target.result;
            
            if (!db.objectStoreNames.contains('registrations')) {
                const store = db.createObjectStore('registrations', { keyPath: 'id' });
                store.createIndex('type', 'type', { unique: false });
                store.createIndex('timestamp', 'timestamp', { unique: false });
                console.log('registrationsストア作成完了！');
            }
        };
    });
};

// ID自動採番
RegistrationManager.generateId = async function(type) {
    try {
        const db = await this.initDatabase();
        const transaction = db.transaction(['registrations'], 'readonly');
        const store = transaction.objectStore('registrations');
        const index = store.index('type');
        
        return new Promise((resolve) => {
            const request = index.getAllKeys(IDBKeyRange.only(type));
            request.onsuccess = () => {
                const keys = request.result;
                const numbers = keys.map(id => parseInt(id.substring(1)));
                const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
                const newId = `${type}${String(nextNumber).padStart(2, '0')}`;
                console.log(`新しいID: ${newId}`);
                resolve(newId);
            };
        });
    } catch (error) {
        console.error('ID生成エラー:', error);
        return `${type}01`; // エラー時はデフォルト
    }
};

// データベースに保存
RegistrationManager.saveToDatabase = async function(data) {
    try {
        const db = await this.initDatabase();
        const transaction = db.transaction(['registrations'], 'readwrite');
        const store = transaction.objectStore('registrations');
        
        const request = store.add(data);
        
        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                console.log('保存成功！ID:', data.id);
                resolve(data.id);
            };
            
            request.onerror = () => {
                console.error('保存エラー:', request.error);
                reject(request.error);
            };
        });
    } catch (error) {
        console.error('DB保存エラー:', error);
        throw error;
    }
};

// 地図にマーカーを追加（進行バー付き）
RegistrationManager.addMarkerToMap = function(data) {
    const progressBar = new HealthProgressBar();
    const feature = new ol.Feature({
        geometry: new ol.geom.Point(data.coords.webMercator),
        ...data
    });
    
    // 進行バー付きスタイルを適用
    feature.setStyle(progressBar.createMarkerStyle(data));

    // クリックイベント用にIDを保存
    feature.set('registrationId', reg.id);

    window.registeredPointsLayer.getSource().addFeature(feature);
    
    // 専用レイヤーに追加
    if (!window.registeredPointsLayer) {
        window.registeredPointsLayer = new ol.layer.Vector({
            source: new ol.source.Vector(),
            zIndex: 200
        });
        this.map.addLayer(window.registeredPointsLayer);
    }
    
    window.registeredPointsLayer.getSource().addFeature(feature);
    
    // ★★★ マーカークリックイベントを設定 ★★★
        this.map.on('click', async (evt) => {
            // クリックした位置にあるフィーチャーを取得
            const feature = this.map.forEachFeatureAtPixel(evt.pixel, (feature) => {
                return feature;
            });
            
            // 登録地点のフィーチャーなら詳細表示
            if (feature && feature.get('registrationId')) {
                const id = feature.get('registrationId');
                await this.viewDetails(id);
                evt.stopPropagation(); // イベントの伝播を止める
            }
        });
        
        // マウスオーバーでカーソル変更
        this.map.on('pointermove', (evt) => {
            const hit = this.map.hasFeatureAtPixel(evt.pixel);
            this.map.getTargetElement().style.cursor = hit ? 'pointer' : '';
        });

    console.log('マーカー追加完了！', data.id);
};

// ==================== 登録データ一覧表示機能 ====================

// 登録済みデータを全て取得
RegistrationManager.getAllRegistrations = async function() {
    try {
        const db = await this.initDatabase();
        const transaction = db.transaction(['registrations'], 'readonly');
        const store = transaction.objectStore('registrations');
        
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => {
                console.log('登録データ取得:', request.result);
                resolve(request.result);
            };
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('データ取得エラー:', error);
        return [];
    }
};

// サイドバーのリストを更新
RegistrationManager.updateSidebarList = async function() {
    const registrations = await this.getAllRegistrations();
    const listContainer = document.getElementById('registrationsList');
    
    if (!listContainer) {
        console.warn('リストコンテナが見つかりません');
        return;
    }
    
    if (registrations.length === 0) {
        listContainer.innerHTML = `
            <p style="text-align: center; color: #999; padding: 20px;">
                登録データはありません
            </p>
        `;
        return;
    }
    
    // リストHTML生成
    const listHTML = registrations.map(reg => `
        <div class="registration-item" data-id="${reg.id}">
            <div class="reg-header">
                <span class="reg-id ${reg.type.toLowerCase()}-type">${reg.id}</span>
                <span class="reg-grade grade-${reg.grade || 'none'}">${reg.grade || '-'}</span>
            </div>
            <div class="reg-info">
                <div class="reg-location">${reg.kilometer ? reg.kilometer + 'km' : '位置情報なし'}</div>
                <div class="reg-date">${new Date(reg.timestamp).toLocaleDateString()}</div>
            </div>
            <div class="reg-actions">
                <button onclick="RegistrationManager.zoomToPoint('${reg.id}')" title="地図で表示">📍</button>
                <button onclick="RegistrationManager.editRegistration('${reg.id}')" title="編集">✏️</button>
                <button onclick="RegistrationManager.deleteRegistration('${reg.id}')" title="削除">🗑️</button>
            </div>
        </div>
    `).join('');
    
    listContainer.innerHTML = listHTML;
};

// 地図で該当地点にズーム
RegistrationManager.zoomToPoint = async function(id) {
    const registrations = await this.getAllRegistrations();
    const target = registrations.find(r => r.id === id);
    
    if (target && target.coords) {
        const view = this.map.getView();
        
        // スムーズにズーム＆移動
        view.animate({
            center: target.coords.webMercator,
            zoom: 18,
            duration: 1000
        });
        
        // マーカーを点滅させる（目立たせる）
        setTimeout(() => {
            // 該当マーカーを探す
            const layers = this.map.getLayers().getArray();
            layers.forEach(layer => {
                if (layer instanceof ol.layer.Vector) {
                    const features = layer.getSource().getFeatures();
                    features.forEach(feature => {
                        if (feature.get('id') === id) {
                            // 元のスタイルを保存
                            const originalStyle = feature.getStyle();
                            
                            // 点滅アニメーション（3回）
                            let count = 0;
                            const blink = setInterval(() => {
                                if (count >= 6) {
                                    clearInterval(blink);
                                    feature.setStyle(originalStyle);
                                    return;
                                }
                                
                                // 表示/非表示を切り替え
                                feature.setStyle(count % 2 === 0 ? null : originalStyle);
                                count++;
                            }, 300);
                        }
                    });
                }
            });
        }, 1000); // ズーム完了後に点滅開始
        
        console.log(`地点 ${id} にズーム！`);
    } else {
        alert('地点情報が見つかりません');
    }
};

// 保存済みの全マーカーを地図に表示
RegistrationManager.loadAllMarkers = async function() {
    try {
        const registrations = await this.getAllRegistrations();
        console.log(`${registrations.length}件のマーカーを読み込み中...`);
        
        // 専用レイヤーがなければ作成
        if (!window.registeredPointsLayer) {
            window.registeredPointsLayer = new ol.layer.Vector({
                source: new ol.source.Vector(),
                zIndex: 200
            });
            this.map.addLayer(window.registeredPointsLayer);
        } else {
            // 既存のマーカーをクリア
            window.registeredPointsLayer.getSource().clear();
        }
        
        // 各登録データにマーカーを追加
        const progressBar = new HealthProgressBar();
        registrations.forEach(reg => {
            if (reg.coords && reg.coords.webMercator) {
                const feature = new ol.Feature({
                    geometry: new ol.geom.Point(reg.coords.webMercator),
                    ...reg
                });
                
                // 進行バー付きスタイルを適用
                feature.setStyle(progressBar.createMarkerStyle(reg));

                // IDを明示的に設定
                feature.set('id', reg.id);
                
                window.registeredPointsLayer.getSource().addFeature(feature);
            }
        });
        
        console.log('全マーカー表示完了！');
    } catch (error) {
        console.error('マーカー読み込みエラー:', error);
    }
};

// ★★★ マーカークリックイベントを設定 ★★★
        this.map.on('click', async (evt) => {
            const feature = this.map.forEachFeatureAtPixel(evt.pixel, (feature) => {
                return feature;
            });
            
            if (feature && feature.get('id')) {
                const id = feature.get('id');
                await RegistrationManager.viewDetails(id);
            }
        });
        
        // マウスオーバーでカーソル変更
        this.map.on('pointermove', (evt) => {
            const hit = this.map.hasFeatureAtPixel(evt.pixel);
            this.map.getTargetElement().style.cursor = hit ? 'pointer' : '';
        });


// ==================== 削除・編集機能 ====================

// 登録データの削除
RegistrationManager.deleteRegistration = async function(id) {
    // 確認ダイアログ
    if (!confirm(`${id} を削除してもよろしいですか？\nこの操作は取り消せません。`)) {
        return;
    }
    
    try {
        // 1. IndexedDBから削除
        const db = await this.initDatabase();
        const transaction = db.transaction(['registrations'], 'readwrite');
        const store = transaction.objectStore('registrations');
        
        await store.delete(id);
        
        // 2. 地図からマーカーを削除
        if (window.registeredPointsLayer) {
            const source = window.registeredPointsLayer.getSource();
            const features = source.getFeatures();
            
            // 該当IDのfeatureを探して削除
            features.forEach(feature => {
                if (feature.get('id') === id) {
                    source.removeFeature(feature);
                }
            });
        }
        
        // 3. サイドバーリストを更新
        await this.updateSidebarList();
        
        console.log(`✅ ${id} を削除しました`);
        alert(`${id} を削除しました`);
        
    } catch (error) {
        console.error('削除エラー:', error);
        alert('削除に失敗しました');
    }
};

// 編集機能（モーダル経由）
RegistrationManager.editRegistration = function(id) {
    RegistrationManager.viewDetails(id);  // thisじゃなくてRegistrationManagerを直接使う！
};

// クリップボードから貼り付け（グローバル関数として）
RegistrationManager.pasteFromClipboard = async function() {
    try {
        const clipboardItems = await navigator.clipboard.read();
        
        for (const clipboardItem of clipboardItems) {
            for (const type of clipboardItem.types) {
                if (type.startsWith('image/')) {
                    const blob = await clipboardItem.getType(type);
                    const file = new File([blob], `clipboard_${Date.now()}.png`, { type });
                    this.processImageFile(file);
                }
            }
        }
    } catch (err) {
        // 権限がない場合やクリップボードが空の場合
        alert('クリップボードから画像を読み取れませんでした。\n画像をコピーしてから再度お試しください。');
        console.error('クリップボードエラー:', err);
    }
};

// データ更新機能
RegistrationManager.updateRegistration = async function(data) {
    try {
        const db = await this.initDatabase();
        const transaction = db.transaction(['registrations'], 'readwrite');
        const store = transaction.objectStore('registrations');
        
        const request = store.put(data);
        
        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                console.log('更新成功！ID:', data.id);
                resolve(data.id);
            };
            
            request.onerror = () => {
                console.error('更新エラー:', request.error);
                reject(request.error);
            };
        });
    } catch (error) {
        console.error('DB更新エラー:', error);
        throw error;
    }
};

// IDでデータ取得
RegistrationManager.getRegistrationById = async function(id) {
    try {
        const db = await this.initDatabase();
        const transaction = db.transaction(['registrations'], 'readonly');
        const store = transaction.objectStore('registrations');
        
        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => {
                resolve(request.result);
            };
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('データ取得エラー:', error);
        return null;
    }
};

// 詳細表示（統一関数）
RegistrationManager.viewDetails = async function(id) {
    const data = await this.getRegistrationById(id);
    if (data) {
        ModalManager.open(ModalManager.modes.VIEW, data);
    } else {
        alert('データが見つかりません');
    }
};