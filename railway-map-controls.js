// railway-map-controls.js - 地図コントロール機能

const MapControls = {
    map: null,
    measureInteraction: null,
    measureLayer: null,
    isRotating: false,
    
    // 初期化
    init(map) {
        this.map = map;
        this.setupMeasureLayer();
        this.setupCoordinateDisplay();
        this.updateZoomButtons();
                
        // ステータスバー初期化（←ここに追加！）
        StatusBar.init(map);
        
        console.log('MapControls initialized');
    },
    
    // ズームイン
    zoomIn() {
        const view = this.map.getView();
        const currentZoom = view.getZoom();
        view.animate({
            zoom: currentZoom + 1,
            duration: 250
        });
    },
    
    // ズームアウト
    zoomOut() {
        const view = this.map.getView();
        const currentZoom = view.getZoom();
        view.animate({
            zoom: currentZoom - 1,
            duration: 250
        });
    },
    
    // 現在地取得
    getCurrentLocation() {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const coords = [position.coords.longitude, position.coords.latitude];
                    const webMercatorCoords = ol.proj.fromLonLat(coords);
                    
                    // 現在地にズーム
                    this.map.getView().animate({
                        center: webMercatorCoords,
                        zoom: 16,
                        duration: 1000
                    });
                    
                    // 現在地マーカー追加
                    this.addCurrentLocationMarker(webMercatorCoords);
                },
                (error) => {
                    alert('位置情報の取得に失敗しました: ' + error.message);
                }
            );
        } else {
            alert('お使いのブラウザは位置情報をサポートしていません');
        }
    },
    
    // 現在地マーカー追加
    addCurrentLocationMarker(coords) {
        // 既存の現在地レイヤーを削除
        this.map.getLayers().forEach(layer => {
            if (layer.get('name') === 'currentLocation') {
                this.map.removeLayer(layer);
            }
        });
        
        // 新しいマーカー作成
        const marker = new ol.Feature({
            geometry: new ol.geom.Point(coords)
        });
        
        const markerLayer = new ol.layer.Vector({
            name: 'currentLocation',
            source: new ol.source.Vector({
                features: [marker]
            }),
            style: new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 10,
                    fill: new ol.style.Fill({ color: '#4285F4' }),
                    stroke: new ol.style.Stroke({
                        color: 'white',
                        width: 3
                    })
                })
            })
        });
        
        this.map.addLayer(markerLayer);
    },
    
    // フルスクリーン切り替え
    toggleFullscreen() {
        const mapContainer = document.querySelector('.map-container');
        
        if (!document.fullscreenElement) {
            mapContainer.requestFullscreen().catch(err => {
                alert(`フルスクリーンにできませんでした: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    },
    
    // 計測レイヤーセットアップ
    setupMeasureLayer() {
        const source = new ol.source.Vector();
        this.measureLayer = new ol.layer.Vector({
            source: source,
            style: new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(42, 82, 152, 0.2)'
                }),
                stroke: new ol.style.Stroke({
                    color: '#2a5298',
                    width: 3,
                    lineDash: [10, 10]
                }),
                image: new ol.style.Circle({
                    radius: 7,
                    fill: new ol.style.Fill({
                        color: '#2a5298'
                    }),
                    stroke: new ol.style.Stroke({
                        color: 'white',
                        width: 2
                    })
                })
            })
        });
        this.map.addLayer(this.measureLayer);
    },
    
    // 計測モード切り替え
    toggleMeasurement() {
        if (this.measureInteraction) {
            // 計測モード終了
            this.map.removeInteraction(this.measureInteraction);
            this.measureInteraction = null;
            this.measureLayer.getSource().clear();
            document.getElementById('measurementResult').classList.remove('active');
            
            // ボタンの見た目を戻す
            const btn = document.querySelector('[onclick="toggleMeasurement()"]');
            if (btn) btn.style.background = '#f0f4f8';
        } else {
            // 計測モード開始
            this.startMeasurement();
            
            // ボタンの見た目を変更
            const btn = document.querySelector('[onclick="toggleMeasurement()"]');
            if (btn) btn.style.background = '#2a5298';
        }
    },
    
    // 計測開始
    startMeasurement() {
        const source = this.measureLayer.getSource();
        
        this.measureInteraction = new ol.interaction.Draw({
            source: source,
            type: 'LineString',
            style: new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 255, 0.2)'
                }),
                stroke: new ol.style.Stroke({
                    color: 'rgba(42, 82, 152, 0.8)',
                    lineDash: [10, 10],
                    width: 3
                }),
                image: new ol.style.Circle({
                    radius: 5,
                    stroke: new ol.style.Stroke({
                        color: 'rgba(42, 82, 152, 1)'
                    }),
                    fill: new ol.style.Fill({
                        color: 'rgba(255, 255, 255, 0.2)'
                    })
                })
            })
        });
        
        this.map.addInteraction(this.measureInteraction);
        
        // 描画中の距離表示
        this.measureInteraction.on('drawstart', (evt) => {
            const sketch = evt.feature;
            
            sketch.getGeometry().on('change', (evt) => {
                const geom = evt.target;
                const distance = ol.sphere.getLength(geom);
                const output = this.formatDistance(distance);
                
                document.getElementById('measurementText').textContent = `距離: ${output}`;
                document.getElementById('measurementResult').classList.add('active');
            });
        });
        
        // 描画完了
        this.measureInteraction.on('drawend', () => {
            setTimeout(() => {
                source.clear();
                document.getElementById('measurementResult').classList.remove('active');
            }, 3000);
        });
    },
    
    // 距離フォーマット
    formatDistance(distance) {
        if (distance > 1000) {
            return `${(distance / 1000).toFixed(2)} km`;
        } else {
            return `${distance.toFixed(0)} m`;
        }
    },
    
    // 新規登録開始
    startNewInspection() {
        alert('新規登録機能は開発中です！\n地図上をクリックして地点を選択できるようになります。');
        // TODO: 実装
    },
    
    // 画面キャプチャ
    captureScreen() {
        this.map.once('rendercomplete', () => {
            const mapCanvas = document.createElement('canvas');
            const size = this.map.getSize();
            mapCanvas.width = size[0];
            mapCanvas.height = size[1];
            const mapContext = mapCanvas.getContext('2d');
            
            Array.prototype.forEach.call(
                document.querySelectorAll('.ol-layer canvas'),
                (canvas) => {
                    if (canvas.width > 0) {
                        const opacity = canvas.parentNode.style.opacity;
                        mapContext.globalAlpha = opacity === '' ? 1 : Number(opacity);
                        const transform = canvas.style.transform;
                        const matrix = transform
                            .match(/^matrix\(([^\(]*)\)$/)[1]
                            .split(',')
                            .map(Number);
                        CanvasRenderingContext2D.prototype.setTransform.apply(
                            mapContext,
                            matrix
                        );
                        mapContext.drawImage(canvas, 0, 0);
                    }
                }
            );
            
            // ダウンロード
            mapCanvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `railway_map_${new Date().getTime()}.png`;
                link.click();
                URL.revokeObjectURL(url);
            });
        });
        this.map.renderSync();
    },
    
    // 座標表示セットアップ
    setupCoordinateDisplay() {
        // 座標表示用のコンテナを作成
        const coordContainer = document.createElement('div');
        coordContainer.id = 'coordinateDisplay';
        coordContainer.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(42, 82, 152, 0.9);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-family: monospace;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 1000;
        `;
        document.querySelector('.map-container').appendChild(coordContainer);
        
        // マウス移動時の座標表示
        this.map.on('pointermove', (evt) => {
            const coords = evt.coordinate;
            const lonLat = ol.proj.toLonLat(coords);
            
            // EPSG:6677に変換
            let jpCoords = null;
            try {
                jpCoords = ol.proj.transform(coords, 'EPSG:3857', 'EPSG:6677');
            } catch (e) {
                // 変換できない場合はそのまま
            }
            
            let displayText = `WGS84: ${lonLat[1].toFixed(6)}, ${lonLat[0].toFixed(6)}`;
            if (jpCoords) {
                displayText += ` | JGD2011: X=${jpCoords[0].toFixed(2)}, Y=${jpCoords[1].toFixed(2)}`;
            }
            
            coordContainer.textContent = displayText;
        });
    },
    
    // 地図回転機能
    toggleRotation() {
        if (!this.isRotating) {
            // 回転モード開始
            this.isRotating = true;
            
            // Alt + Shift + ドラッグで回転
            const rotateInteraction = new ol.interaction.DragRotate({
                condition: ol.events.condition.altKeyOnly
            });
            
            this.map.addInteraction(rotateInteraction);
            this.rotateInteraction = rotateInteraction;
            
            // 回転リセットボタン追加
            this.addRotationResetButton();
            
            alert('Altキーを押しながらドラッグで地図を回転できます');
        } else {
            // 回転モード終了
            this.isRotating = false;
            
            if (this.rotateInteraction) {
                this.map.removeInteraction(this.rotateInteraction);
            }
            
            // 回転をリセット
            this.map.getView().animate({
                rotation: 0,
                duration: 500
            });
        }
    },
    
    // 回転リセットボタン追加
    addRotationResetButton() {
        if (document.getElementById('rotationReset')) return;
        
        const button = document.createElement('button');
        button.id = 'rotationReset';
        button.className = 'control-btn';
        button.innerHTML = '🧭';
        button.style.cssText = 'margin-top: 20px;';
        button.onclick = () => {
            this.map.getView().animate({
                rotation: 0,
                duration: 500
            });
        };
        button.title = '北を上にリセット';
        
        document.querySelector('.map-controls').appendChild(button);
    },
    
    // ズームボタンの有効/無効を更新
    updateZoomButtons() {
        this.map.getView().on('change:resolution', () => {
            const view = this.map.getView();
            const zoom = view.getZoom();
            const maxZoom = view.getMaxZoom();
            const minZoom = view.getMinZoom();
            
            // ボタンの有効/無効を設定
            const zoomInBtn = document.querySelector('[onclick="zoomIn()"]');
            const zoomOutBtn = document.querySelector('[onclick="zoomOut()"]');
            
            if (zoomInBtn) {
                zoomInBtn.style.opacity = zoom >= maxZoom ? '0.5' : '1';
                zoomInBtn.style.cursor = zoom >= maxZoom ? 'not-allowed' : 'pointer';
            }
            
            if (zoomOutBtn) {
                zoomOutBtn.style.opacity = zoom <= minZoom ? '0.5' : '1';
                zoomOutBtn.style.cursor = zoom <= minZoom ? 'not-allowed' : 'pointer';
            }
        });
    }
};

// グローバル関数として公開
window.zoomIn = () => MapControls.zoomIn();
window.zoomOut = () => MapControls.zoomOut();
window.getCurrentLocation = () => MapControls.getCurrentLocation();
window.toggleFullscreen = () => MapControls.toggleFullscreen();
window.toggleMeasurement = () => MapControls.toggleMeasurement();
window.startNewInspection = () => MapControls.startNewInspection();
window.captureScreen = () => MapControls.captureScreen();
window.toggleRotation = () => MapControls.toggleRotation();

// グローバルに公開
window.MapControls = MapControls;

// ステータスバー関連の機能
const StatusBar = {
    init(map) {
        this.map = map;
        this.view = map.getView();
        
        // マウス移動で座標更新
        map.on('pointermove', (evt) => {
            const coords = ol.proj.toLonLat(evt.coordinate);
            const lat = coords[1].toFixed(4);
            const lon = coords[0].toFixed(4);
            document.getElementById('coordsDisplay').textContent = `N${lat}° E${lon}°`;
        });
        
        // ビューの変更を監視（resolution = ズーム、rotation = 回転）
        this.view.on('change:resolution', () => {
            this.updateZoomDisplay();
        });
        
        this.view.on('change:rotation', () => {
            this.updateRotationDisplay();
        });
        
        // 入力フィールドのイベント
        document.getElementById('zoomInput').addEventListener('change', (e) => {
            this.setZoomPercent(parseFloat(e.target.value));
        });
        
        document.getElementById('rotationInput').addEventListener('change', (e) => {
            this.setRotationDegree(parseFloat(e.target.value));
        });
        
        // 初期値設定
        this.updateZoomDisplay();
        this.updateRotationDisplay();
        
        // タッチパッド回転ジェスチャー対応
        this.initTouchpadRotation();
    },
    
    // ズーム表示更新
    updateZoomDisplay() {
        const zoom = this.view.getZoom();
        // ズームレベル12を100%として計算
        const percent = Math.round(Math.pow(2, zoom - 12) * 100);
        document.getElementById('zoomInput').value = percent;
    },
    
    // 回転表示更新
    updateRotationDisplay() {
        const rotation = this.view.getRotation();
        const degrees = Math.round(-rotation * 180 / Math.PI);
        document.getElementById('rotationInput').value = degrees;
    },
    
    // ズーム設定（パーセント）
    setZoomPercent(percent) {
        // 100% = ズームレベル12として計算
        const zoom = 12 + Math.log2(percent / 100);
        this.view.animate({
            zoom: zoom,
            duration: 250
        });
    },
    
    // 回転設定（度）
    setRotationDegree(degrees) {
        const rotation = -degrees * Math.PI / 180;
        this.view.animate({
            rotation: rotation,
            duration: 250
        });
    },
    
    // タッチパッド回転ジェスチャー
    initTouchpadRotation() {
        // DragRotateインタラクションを追加
        const dragRotate = new ol.interaction.DragRotate({
            condition: ol.events.condition.altKeyOnly
        });
        this.map.addInteraction(dragRotate);
        
        // タッチパッドの2本指回転ジェスチャー対応
        let initialRotation = null;
        let isRotating = false;
        
        this.map.getTargetElement().addEventListener('gesturestart', (e) => {
            e.preventDefault();
            initialRotation = this.view.getRotation();
            isRotating = true;
        });
        
        this.map.getTargetElement().addEventListener('gesturechange', (e) => {
            e.preventDefault();
            if (isRotating && initialRotation !== null) {
                const deltaRotation = e.rotation * Math.PI / 180;
                this.view.setRotation(initialRotation - deltaRotation);
            }
        });
        
        this.map.getTargetElement().addEventListener('gestureend', (e) => {
            e.preventDefault();
            isRotating = false;
            initialRotation = null;
        });
    }
};

// グローバル関数（HTMLから呼び出し用）
function adjustZoom(delta) {
    const input = document.getElementById('zoomInput');
    const current = parseFloat(input.value);
    const newValue = Math.max(10, Math.min(2000, current + delta));
    input.value = newValue;
    StatusBar.setZoomPercent(newValue);
}

function adjustRotation(delta) {
    const input = document.getElementById('rotationInput');
    const current = parseFloat(input.value);
    let newValue = current + delta;
    
    // -180〜180の範囲に正規化
    if (newValue > 180) newValue -= 360;
    if (newValue < -180) newValue += 360;
    
    input.value = newValue;
    StatusBar.setRotationDegree(newValue);
}

// 回転リセット関数
function resetRotation() {
    StatusBar.setRotationDegree(0);
    document.getElementById('rotationInput').value = 0;
}