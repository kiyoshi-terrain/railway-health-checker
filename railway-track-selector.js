// railway-track-selector.js
// 線路3点選択機能 - みく作 💕

const TrackSelector = {
    mode: false,
    points: [],
    markers: [],
    clickListener: null,
    
    // モード開始
    start: function() {
        console.log('線路3点選択モード開始！');
        this.mode = true;
        this.points = [];
        this.clearMarkers();
        
        // 地図のカーソルを変更
        map.getTargetElement().style.cursor = 'crosshair';
        
        // 説明を表示
        this.showGuide();
        
        // クリックイベント登録
        this.clickListener = map.on('click', (evt) => this.handleClick(evt));
    },
    
    // ガイド表示
    showGuide: function() {
        // 既存のガイドがあれば削除
        const existingGuide = document.getElementById('track-guide');
        if (existingGuide) existingGuide.remove();
        
        const guide = document.createElement('div');
        guide.id = 'track-guide';
        guide.innerHTML = `
            <div style="position: absolute; top: 100px; left: 50%; transform: translateX(-50%); 
                        background: #2a5298; color: white; padding: 15px 30px; 
                        border-radius: 25px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); 
                        z-index: 1000; font-size: 16px; text-align: center;">
                <div style="margin-bottom: 10px;">🚂 線路上の3点をクリック</div>
                <div id="point-status" style="font-size: 14px; color: #ffe066;">
                    1点目（起点方）を選択してください
                </div>
                <button onclick="TrackSelector.cancel()" 
                        style="margin-top: 10px; background: #ff6b6b; color: white; 
                               border: none; padding: 5px 15px; border-radius: 15px; 
                               cursor: pointer; font-size: 12px;">
                    キャンセル
                </button>
            </div>
        `;
        document.body.appendChild(guide);
    },
    
    // 地図クリック処理
    handleClick: function(evt) {
        if (!this.mode) return;
        
        const coordinate = evt.coordinate;
        const lonLat = ol.proj.toLonLat(coordinate);
        
        // 点を追加
        this.points.push(lonLat);
        
        // マーカー追加
        this.addMarker(coordinate, this.points.length);
        
        // ステータス更新
        this.updateStatus();
        
        // 3点揃ったら
        if (this.points.length === 3) {
            setTimeout(() => this.complete(), 500); // 少し待ってから完了
        }
    },
    
    // マーカー追加
    addMarker: function(coordinate, number) {
        const marker = new ol.Feature({
            geometry: new ol.geom.Point(coordinate)
        });
        
        // マーカーのスタイル
        const markerStyle = new ol.style.Style({
            image: new ol.style.Circle({
                radius: 12,
                fill: new ol.style.Fill({
                    color: number === 2 ? '#ff6b6b' : '#4dabf7'
                }),
                stroke: new ol.style.Stroke({
                    color: 'white',
                    width: 3
                })
            }),
            text: new ol.style.Text({
                text: number.toString(),
                fill: new ol.style.Fill({color: 'white'}),
                font: 'bold 16px sans-serif'
            })
        });
        
        marker.setStyle(markerStyle);
        
        // ベクターソース作成
        const vectorSource = new ol.source.Vector({
            features: [marker]
        });
        
        // ベクターレイヤー作成
        const vectorLayer = new ol.layer.Vector({
            source: vectorSource,
            zIndex: 1000
        });
        
        map.addLayer(vectorLayer);
        this.markers.push(vectorLayer);
        
        // 線を引く
        if (this.points.length > 1) {
            this.drawLine();
        }
    },
    
    // 線を描画
    drawLine: function() {
        const coordinates = this.points.map(p => ol.proj.fromLonLat(p));
        
        const line = new ol.Feature({
            geometry: new ol.geom.LineString(coordinates)
        });
        
        const lineStyle = new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: '#2a5298',
                width: 3,
                lineDash: [10, 10]
            })
        });
        
        line.setStyle(lineStyle);
        
        const vectorSource = new ol.source.Vector({
            features: [line]
        });
        
        const vectorLayer = new ol.layer.Vector({
            source: vectorSource,
            zIndex: 999
        });
        
        map.addLayer(vectorLayer);
        this.markers.push(vectorLayer);
    },
    
    // ステータス更新
    updateStatus: function() {
        const status = document.getElementById('point-status');
        if (!status) return;
        
        if (this.points.length === 1) {
            status.textContent = '2点目（評価地点）を選択してください';
            status.style.color = '#ffd43b';
        } else if (this.points.length === 2) {
            status.textContent = '3点目（終点方）を選択してください';
            status.style.color = '#8ce99a';
        }
    },
    
    // 完了処理
    complete: function() {
        this.mode = false;
        map.getTargetElement().style.cursor = '';
        
        // クリックイベント解除
        if (this.clickListener) {
            ol.Observable.unByKey(this.clickListener);
        }
        
        // ガイド削除
        const guide = document.getElementById('track-guide');
        if (guide) guide.remove();
        
        // 座標を取得
        const [prev, current, next] = this.points;
        
        console.log('選択完了！', {
            前: prev,
            評価点: current,
            次: next
        });
        
        // 自動評価を起動
        const params = new URLSearchParams({
            lat1: prev[1].toFixed(6),
            lon1: prev[0].toFixed(6),
            lat2: current[1].toFixed(6),
            lon2: current[0].toFixed(6),
            lat3: next[1].toFixed(6),
            lon3: next[0].toFixed(6),
            returnResult: 'true'
        });

        // URLも確認
        console.log('送信URL:', `railway-health-checker.html?${params}`);        
        
        window.open(
            `railway-health-checker.html?${params}`, 
            'healthChecker', 
            'width=1400,height=900'
        );
                
        // 完了メッセージ追加
        setTimeout(() => {
            alert('評価画面が開きました！\n「🔍 健全度評価を実行」ボタンを押してください！');
        }, 1000);
        
        // マーカークリア（3秒後）
        setTimeout(() => this.clearMarkers(), 3000);
    },
    
    // キャンセル
    cancel: function() {
        this.mode = false;
        map.getTargetElement().style.cursor = '';
        
        // クリックイベント解除
        if (this.clickListener) {
            ol.Observable.unByKey(this.clickListener);
        }
        
        // ガイド削除
        const guide = document.getElementById('track-guide');
        if (guide) guide.remove();
        
        // マーカークリア
        this.clearMarkers();
        
        console.log('選択キャンセル');
    },
    
    // マーカークリア
    clearMarkers: function() {
        this.markers.forEach(layer => map.removeLayer(layer));
        this.markers = [];
        this.points = [];
    }
};

// グローバルに登録
window.TrackSelector = TrackSelector;

console.log('TrackSelector loaded! 🚂');