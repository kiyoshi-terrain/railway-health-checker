// railway-location.js - 位置情報と地形解析機能

// ========================================
// キロ程表示の自動変換機能
// ========================================
function updateKmDisplay(type) {
    const input = document.getElementById(`km${type}Input`);
    const display = document.getElementById(`km${type}Display`);
    const value = input.value;
    
    if (value) {
        const num = parseInt(value);
        const km = Math.floor(num / 1000);
        const m = num % 1000;
        display.textContent = `${km}k${m}m`;
        display.style.color = '#2a5298';
    } else {
        display.textContent = '0k0m';
        display.style.color = '#999';
    }
}

// ========================================
// GPS位置情報取得
// ========================================
function getCurrentLocation() {
    if (!navigator.geolocation) {
        alert('このブラウザは位置情報に対応していません');
        return;
    }
    
    // ローディング表示
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = '📍 取得中...';
    button.disabled = true;
    
    navigator.geolocation.getCurrentPosition(
        // 成功時
        function(position) {
            document.getElementById('latitude').value = position.coords.latitude.toFixed(6);
            document.getElementById('longitude').value = position.coords.longitude.toFixed(6);
            
            button.textContent = originalText;
            button.disabled = false;
            
            // 成功メッセージ
            const accuracy = Math.round(position.coords.accuracy);
            alert(`現在地を取得しました！\n精度: 約${accuracy}m`);
        },
        // エラー時
        function(error) {
            button.textContent = originalText;
            button.disabled = false;
            
            let message = '';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    message = "位置情報の使用が拒否されました。\n設定から位置情報の使用を許可してください。";
                    break;
                case error.POSITION_UNAVAILABLE:
                    message = "位置情報が取得できません。\nGPSが有効か確認してください。";
                    break;
                case error.TIMEOUT:
                    message = "位置情報の取得がタイムアウトしました。\n再度お試しください。";
                    break;
                default:
                    message = "位置情報の取得に失敗しました。";
            }
            alert(message);
        },
        // オプション
        {
            enableHighAccuracy: true,  // 高精度モード
            timeout: 10000,           // 10秒でタイムアウト
            maximumAge: 0             // キャッシュを使わない
        }
    );
}

// ========================================
// 写真のEXIFデータから位置情報を取得
// ========================================
function extractGPSFromPhoto(file) {
    // TODO: EXIF読み取り実装
    // 現在は仮実装
    console.log('写真からGPS情報を抽出予定:', file.name);
}

// 写真の位置情報をチェック（簡易版）
function checkPhotoLocation(file) {
    // スマホで撮影した写真の場合、位置情報を含む可能性がある
    // 実際の実装にはexif-jsなどのライブラリが必要
    console.log('写真の位置情報をチェック中...', file.name);
    
    // デモ用：ランダムに位置情報があるとする
    if (Math.random() > 0.5) {
        const demoLat = 35.6762 + (Math.random() - 0.5) * 0.01;
        const demoLon = 139.6503 + (Math.random() - 0.5) * 0.01;
        
        if (confirm(`写真から位置情報が検出されました。\n緯度: ${demoLat.toFixed(6)}\n経度: ${demoLon.toFixed(6)}\n\nこの位置情報を使用しますか？`)) {
            document.getElementById('latitude').value = demoLat.toFixed(6);
            document.getElementById('longitude').value = demoLon.toFixed(6);
        }
    }
}

// ========================================
// 地形地質概況の自動生成（CORS対応版）
// ========================================
async function generateGeologicalSummary() {
    const lat = document.getElementById('latitude').value;
    const lon = document.getElementById('longitude').value;
    
    // デバッグ用ログ
    console.log('緯度:', lat, '経度:', lon);
    
    // 緯度・経度の入力チェック
    if (!lat || !lon) {
        alert('緯度・経度を入力してください。両方の値が必要です。');
        return;
    }
    
    // ローディング表示
    document.getElementById('loadingOverlay').style.display = 'flex';
    
    try {
        const API_BASE = 'https://terrain-eapqpr0vw-kiyoshi-terrains-projects.vercel.app';
        const url = `${API_BASE}/api/v1/terrain/analyze?latitude=${lat}&longitude=${lon}`;
        
        // デバッグ用：リクエストURLを表示
        console.log('API Request URL:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // APIキーが必要な場合はここに追加
                // 'Authorization': 'Bearer YOUR_API_KEY'
            },
            mode: 'cors' // CORS モードを明示的に指定
        });
        
        // レスポンスステータスをログ出力
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // レスポンスデータをログ出力
        console.log('Response data:', data);
        
        if (data.success) {
            const terrainData = data.data;
            
            // 構造物情報の取得
            const structureType = document.getElementById('structureType').value;
            const structureTypeText = structureType === 'embankment' ? '盛土' : 
                                    structureType === 'cutting' ? '切土' : 
                                    structureType === 'natural' ? '自然斜面' : '土構造物';
            
            const location = document.getElementById('location').options[document.getElementById('location').selectedIndex]?.text || '';
            
            // 地質情報の整理
            let geologicalInfo = '不明';
            if (terrainData.geology_data && terrainData.geology_data.available) {
                const geo = terrainData.geology_data.geology_info;
                geologicalInfo = `${geo.rock_type_ja}（${geo.formation_age_ja}）`;
            }
            
            // テンプレートに当てはめて生成
            const summary = `＜地形・地質＞
調査対象地は、${terrainData.terrain_features.terrain_classification.primary_type}と${
                terrainData.terrain_features.terrain_classification.terrain_complexity === '単純' ? '平坦地' : 
                terrainData.terrain_features.terrain_classification.terrain_complexity === 'やや複雑' ? '起伏のある地形' : 
                '複雑な地形'
            }の境界部付近を通過する区間である。
地質は、${geologicalInfo}が分布している。
標高は約${Math.round(terrainData.elevation_data.center_elevation)}mである。

＜立地条件＞
線路敷きの${location}が${structureTypeText}となっている。
${terrainData.terrain_features.disaster_risk.flood_risk === '高' ? '低地のため洪水リスクに注意が必要である。' : ''}
${terrainData.terrain_features.disaster_risk.landslide_risk === '中' || terrainData.terrain_features.disaster_risk.landslide_risk === '高' ? '斜面崩壊のリスクがある地形である。' : ''}

＜概況＞
当該箇所は、${location}の${structureTypeText}のり面が対象である。
${getCheckedDefectsSummary()}
${getCheckedInstabilitySummary()}`;
            
            // textareaに結果を表示（.valueを使用）
            const geologicalSection = document.getElementById('geologicalSummary');
            if (geologicalSection) {
                geologicalSection.value = summary;
            }
        } else {
            alert(`地形データの取得に失敗しました: ${data.error || '不明なエラー'}`);
        }
    } catch (error) {
        // 詳細なエラー情報を表示
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            url: `${API_BASE}/api/v1/terrain/analyze?latitude=${lat}&longitude=${lon}`
        });
        
        alert(`エラーが発生しました:\n${error.message}\n\nURL: ${API_BASE}/api/v1/terrain/analyze?latitude=${lat}&longitude=${lon}\n\n詳細はコンソールを確認してください。`);
    } finally {
        document.getElementById('loadingOverlay').style.display = 'none';
    }
}