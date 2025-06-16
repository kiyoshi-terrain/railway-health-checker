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
        const preview = document.getElementById('photoPreview');
        
        for (let file of files) {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    // サムネイル作成
                    const thumb = document.createElement('div');
                    thumb.className = 'photo-thumb';
                    
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    thumb.appendChild(img);
                    
                    preview.appendChild(thumb);
                    
                    // データに追加
                    this.formData.photos.push({
                        name: file.name,
                        data: e.target.result
                    });
                };
                
                reader.readAsDataURL(file);
            }
        }
    },
    
    // 保存処理
    async save() {
        console.log('保存データ:', this.formData);
        
        // TODO: IndexedDBに保存
        // TODO: サーバーに送信
        
        alert('登録が完了しました！');
        
        // 登録完了後の処理
        this.close();
        
        // 最近の登録を更新
        // TODO: 実装
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