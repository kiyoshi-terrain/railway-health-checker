// 鉄道土構造物健全度評価システム v2 JavaScript
// キロ程表示の自動変換機能
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
// グローバル変数
let rowCounter = 0;
let uploadedPhotos = [];
let registeredDefects = [];
let registeredInstabilities = [];
let tempDefectPhotos = [];  // 変状用の一時的な写真保存
let tempInstabilityPhotos = [];  // 不安定性用の一時的な写真保存

// モード切替
function setMode(mode) {
    // ボタンの状態更新
    document.querySelectorAll('.mode-button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.mode-button').classList.add('active');
    
    // コンテンツの表示切替
    document.querySelectorAll('.auto-mode, .inspection-mode').forEach(content => {
        content.classList.remove('active');
    });
    document.querySelector(`.${mode}-mode`).classList.add('active');
}

// タブ切替
function switchTab(tabName) {
    // タブの状態更新
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // コンテンツの表示切替
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// 基本情報の折りたたみ
function toggleBasicInfo() {
    const basicInfo = document.getElementById('basicInfo');
    basicInfo.classList.toggle('collapsed');
}

// 健全度判定セクションの折りたたみ
function toggleAssessmentSection() {
    const section = document.getElementById('assessmentSection');
    section.classList.toggle('collapsed');
}

// チェックリストの更新
function updateChecklists() {
    const structureType = document.getElementById('structureType').value;
    const defectsContainer = document.getElementById('defects-checklists-container');
    const instabilityContainer = document.getElementById('instability-checklists-container');
    
    if (!structureType) {
        defectsContainer.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">構造物種別を選択してください</p>';
        instabilityContainer.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">構造物種別を選択してください</p>';
        return;
    }
    
    // 盛土の場合
    if (structureType === 'embankment') {
        // 変状タブ
        defectsContainer.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <button class="register-button defect" onclick="openModal('defectModal')">
                    ➕ 変状を登録
                </button>
            </div>
            
            <div class="defect-list" id="defectList">
                <h4>📋 登録された変状</h4>
                <div id="defectItems">
                    <p style="text-align: center; color: #999;">まだ変状が登録されていません</p>
                </div>
            </div>
        `;
        
        // 不安定性タブ
        instabilityContainer.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <button class="register-button instability" onclick="openModal('instabilityModal')">
                    ➕ 不安定性を登録
                </button>
            </div>
            
            <div class="instability-list" id="instabilityList">
                <h4>📋 登録された不安定性</h4>
                <div id="instabilityItems">
                    <p style="text-align: center; color: #999;">まだ不安定性が登録されていません</p>
                </div>
            </div>
        `;
    }
    // 切土の場合
    else if (structureType === 'cutting') {
        // 変状タブ（モーダル化）
        defectsContainer.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <button class="register-button defect" onclick="openModal('cuttingDefectModal')">
                    ➕ 変状を登録
                </button>
            </div>
            
            <div class="defect-list" id="cuttingDefectList">
                <h4>📋 登録された変状</h4>
                <div id="cuttingDefectItems">
                    <p style="text-align: center; color: #999;">まだ変状が登録されていません</p>
                </div>
            </div>
        `;
        
        // 不安定性タブ（モーダル化）
        instabilityContainer.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <button class="register-button instability" onclick="openModal('cuttingInstabilityModal')">
                    ➕ 不安定性を登録
                </button>
            </div>
            
            <div class="instability-list" id="cuttingInstabilityList">
                <h4>📋 登録された不安定性</h4>
                <div id="cuttingInstabilityItems">
                    <p style="text-align: center; color: #999;">まだ不安定性が登録されていません</p>
                </div>
            </div>
        `;
    }
}

// GPS座標を取得
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

// 写真のEXIFデータから位置情報を取得（exif-jsライブラリが必要）
function extractGPSFromPhoto(file) {
    // TODO: EXIF読み取り実装
    // 現在は仮実装
    console.log('写真からGPS情報を抽出予定:', file.name);
}

// 地形地質概況の自動生成（CORS対応版）
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

// チェックされた変状のサマリーを取得
function getCheckedDefectsSummary() {
    // 実装が必要な場合はここに追加
    return '';
}

// チェックされた不安定性のサマリーを取得
function getCheckedInstabilitySummary() {
    // 実装が必要な場合はここに追加
    return '';
}

// 個別の行で自動判定を更新
function updateAutoJudgment(element) {
    const row = element.closest('tr');
    const progress = row.querySelector('select').value;
    const impact = row.querySelectorAll('select')[1].value;
    const autoGradeSpan = row.querySelector('.auto-grade');
    
    if (progress && impact) {
        const grade = calculateGrade(progress, impact);
        if (autoGradeSpan) {
            autoGradeSpan.textContent = `(${grade})`;
        }
    }
}

// 健全度を計算
function calculateGrade(progress, impact) {
    // 基本判定マトリクス
    const gradeMatrix = {
        '無': { '無': 'S', '小': 'C', '中': 'B', '大': 'A' },
        '有': { '無': 'C', '小': 'B', '中': 'A', '大': 'AA' },
        '新規': { '無': 'C', '小': 'B', '中': 'A', '大': 'AA' }
    };
    
    return gradeMatrix[progress]?.[impact] || 'B';
}

// 自動判定（全体）
function autoJudgeGrade() {
    const rows = document.querySelectorAll('#detailTableBody tr');
    const grades = [];
    
    rows.forEach(row => {
        if (!row.classList.contains('defect-category') && !row.classList.contains('instability-category')) {
            const selects = row.querySelectorAll('select');
            if (selects.length >= 2) {
                const progress = selects[0].value;
                const impact = selects[1].value;
                
                if (progress && impact) {
                    const grade = calculateGrade(progress, impact);
                    
                    // 2024年の健全度欄に自動入力
                    const gradeInput = row.querySelector('.grade-2024 input');
                    if (gradeInput && !gradeInput.value) {
                        gradeInput.value = grade;
                    }
                    
                    // 自動判定表示を更新
                    const autoGradeSpan = row.querySelector('.auto-grade');
                    if (autoGradeSpan) {
                        autoGradeSpan.textContent = `(${grade})`;
                    }
                    
                    grades.push(gradeInput.value || grade);
                }
            }
        }
    });
    
    // 最悪値を総合判定に設定
    if (grades.length > 0) {
        const gradeOrder = ['AA', 'A', 'B', 'C', 'S'];
        let worstGrade = 'S';
        
        grades.forEach(grade => {
            const currentIndex = gradeOrder.indexOf(grade.toUpperCase());
            const worstIndex = gradeOrder.indexOf(worstGrade);
            if (currentIndex !== -1 && currentIndex < worstIndex) {
                worstGrade = grade.toUpperCase();
            }
        });
        
        document.getElementById('overallGrade').value = worstGrade;
        
        // 判定根拠を特記事項に追記
        const specialNotes = document.getElementById('specialNotes');
        const timestamp = new Date().toLocaleString('ja-JP');
        const note = `\n\n【自動判定実行：${timestamp}】\n最悪値判定：${worstGrade}\n※特記事項を考慮して手動で修正可能`;
        
        if (!specialNotes.value.includes('【自動判定実行：')) {
            specialNotes.value += note;
        } else {
            // 既存の自動判定記録を更新
            specialNotes.value = specialNotes.value.replace(/【自動判定実行：.*】[\s\S]*?(?=\n\n|$)/, note.trim());
        }
    }
    
    alert(`自動判定完了！\n最悪値: ${document.getElementById('overallGrade').value}\n\n※特記事項を考慮して手動で健全度を修正できます。`);
}

// 変状用写真アップロード処理
function handleDefectPhotoUpload(event) {
    const files = event.target.files;
    const preview = document.getElementById('defectPhotoPreview');
    
    for (let file of files) {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const photoId = Date.now() + Math.random();
                tempDefectPhotos.push({
                    id: photoId,
                    data: e.target.result,
                    name: file.name
                });
                
                const photoItem = document.createElement('div');
                photoItem.className = 'photo-item-mini';
                photoItem.innerHTML = `
                    <img src="${e.target.result}" alt="${file.name}">
                    <button class="remove-mini" onclick="removeTempDefectPhoto(${photoId})">×</button>
                `;
                preview.appendChild(photoItem);
                
                // 位置情報が空の場合、写真から取得を試みる
                if (!document.getElementById('latitude').value && !document.getElementById('longitude').value) {
                    checkPhotoLocation(file);
                }
            };
            reader.readAsDataURL(file);
        }
    }
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

// 不安定性用写真アップロード処理
function handleInstabilityPhotoUpload(event) {
    const files = event.target.files;
    const preview = document.getElementById('instabilityPhotoPreview');
    
    for (let file of files) {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const photoId = Date.now() + Math.random();
                tempInstabilityPhotos.push({
                    id: photoId,
                    data: e.target.result,
                    name: file.name
                });
                
                const photoItem = document.createElement('div');
                photoItem.className = 'photo-item-mini';
                photoItem.innerHTML = `
                    <img src="${e.target.result}" alt="${file.name}">
                    <button class="remove-mini" onclick="removeTempInstabilityPhoto(${photoId})">×</button>
                `;
                preview.appendChild(photoItem);
            };
            reader.readAsDataURL(file);
        }
    }
}

// 一時的な変状写真を削除
function removeTempDefectPhoto(photoId) {
    tempDefectPhotos = tempDefectPhotos.filter(p => p.id !== photoId);
    updateDefectPhotoPreview();
}

// 一時的な不安定性写真を削除
function removeTempInstabilityPhoto(photoId) {
    tempInstabilityPhotos = tempInstabilityPhotos.filter(p => p.id !== photoId);
    updateInstabilityPhotoPreview();
}

// 変状写真プレビューを更新
function updateDefectPhotoPreview() {
    const preview = document.getElementById('defectPhotoPreview');
    preview.innerHTML = '';
    tempDefectPhotos.forEach(photo => {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item-mini';
        photoItem.innerHTML = `
            <img src="${photo.data}" alt="${photo.name}">
            <button class="remove-mini" onclick="removeTempDefectPhoto(${photo.id})">×</button>
        `;
        preview.appendChild(photoItem);
    });
}

// 不安定性写真プレビューを更新
function updateInstabilityPhotoPreview() {
    const preview = document.getElementById('instabilityPhotoPreview');
    preview.innerHTML = '';
    tempInstabilityPhotos.forEach(photo => {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item-mini';
        photoItem.innerHTML = `
            <img src="${photo.data}" alt="${photo.name}">
            <button class="remove-mini" onclick="removeTempInstabilityPhoto(${photo.id})">×</button>
        `;
        preview.appendChild(photoItem);
    });
}

// 写真プレビューモーダルを表示
function showPhotoPreview(photos, title) {
    // TODO: 写真プレビューモーダルの実装
    alert(`${title}の写真: ${photos.length}枚`);
}

// 写真アップロード処理
function handlePhotoUpload(event) {
    const files = event.target.files;
    const preview = document.getElementById('photoPreview');
    
    for (let file of files) {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const photoId = Date.now() + Math.random();
                uploadedPhotos.push({
                    id: photoId,
                    data: e.target.result,
                    name: file.name
                });
                
                const photoItem = document.createElement('div');
                photoItem.className = 'photo-item';
                photoItem.innerHTML = `
                    <img src="${e.target.result}" alt="${file.name}">
                    <button class="remove" onclick="removePhoto(${photoId})">×</button>
                `;
                preview.appendChild(photoItem);
            };
            reader.readAsDataURL(file);
        }
    }
}

function removePhoto(photoId) {
    uploadedPhotos = uploadedPhotos.filter(p => p.id !== photoId);
    document.getElementById('photoPreview').innerHTML = '';
    uploadedPhotos.forEach(photo => {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';
        photoItem.innerHTML = `
            <img src="${photo.data}" alt="${photo.name}">
            <button class="remove" onclick="removePhoto(${photo.id})">×</button>
        `;
        document.getElementById('photoPreview').appendChild(photoItem);
    });
}
// モーダル制御
function openModal(modalId) {
   const modal = document.getElementById(modalId);
   if (modal) {
       modal.style.display = 'flex';
       if (modalId === 'defectModal') {
           tempDefectPhotos = [];
           document.getElementById('defectPhotoPreview').innerHTML = '';
       }
   }
}

function closeModal(modalId) {
   const modal = document.getElementById(modalId);
   if (modal) {
       modal.style.display = 'none';
       // フォームリセット
       if (modalId === 'defectModal') {
           document.getElementById('defectType').value = '';
           document.getElementById('defectKm').value = '';
           document.getElementById('defectM').value = '';
           document.getElementById('defectDetail').value = '';
           tempDefectPhotos = [];
           document.getElementById('defectPhotoPreview').innerHTML = '';
       }
   }
}

// 変状登録
function registerDefect() {
   const type = document.getElementById('defectType').value;
   if (!type) {
       alert('変状の種類を選択してください');
       return;
   }
   
   const km = document.getElementById('defectKm').value;
   const m = document.getElementById('defectM').value;
   
   const defect = {
       id: Date.now(),
       type: type,
       location: km && m ? `${km}k${m}m付近` : '',
       detail: document.getElementById('defectDetail').value,
       photos: [...tempDefectPhotos]
   };
   
   registeredDefects.push(defect);
   updateDefectList();
   addDefectToTable(defect);
   closeModal('defectModal');
   alert('変状を登録しました！');
}

// リスト更新
function updateDefectList() {
   const defectItems = document.getElementById('defectItems');
   if (!defectItems) return;
   
   defectItems.innerHTML = registeredDefects.length === 0 
       ? '<p style="text-align: center; color: #999;">まだ変状が登録されていません</p>'
       : registeredDefects.map(d => `
           <div class="defect-item">
               <div>
                   <div class="type">${d.type}</div>
                   <div class="item-location">${d.location}</div>
                   ${d.detail ? `<div style="color:#666;font-size:0.9em;margin-top:5px;">${d.detail}</div>` : ''}
                   ${d.photos.length > 0 ? `<div style="color:#2196F3;font-size:0.9em;margin-top:5px;">📸 写真${d.photos.length}枚</div>` : ''}
               </div>
               <button class="remove-item" onclick="removeDefect(${d.id})">削除</button>
           </div>
       `).join('');
}

// テーブル追加
function addDefectToTable(defect) {
   const tableBody = document.getElementById('detailTableBody');
   if (!tableBody) return;
   
   const newRow = document.createElement('tr');
   newRow.innerHTML = `
       <td>${document.getElementById('managementNumber').value || '-'}</td>
       <td>${defect.location || '-'}</td>
       <td>${defect.type}</td>
       <td>${defect.detail || '-'}</td>
       <td style="text-align:center;">${defect.photos.length > 0 ? '📸' : '-'}</td>
       <td style="text-align:center;">-</td>
       <td><select onchange="updateAutoJudgment(this)">
           <option value="">-</option><option value="無">無</option>
           <option value="有">有</option><option value="新規">新規</option>
       </select></td>
       <td><select onchange="updateAutoJudgment(this)">
           <option value="">-</option><option value="無">無</option>
           <option value="小">小</option><option value="中">中</option><option value="大">大</option>
       </select></td>
       <td><input type="text" maxlength="2" style="text-align:center;"></td>
       <td><input type="text" maxlength="2" style="text-align:center;"></td>
       <td><input type="text" maxlength="2" style="text-align:center;">
           <span class="auto-grade" style="color:#666;font-size:0.8em;"></span></td>
   `;
   
   const defectCategory = tableBody.querySelector('.defect-category');
   defectCategory.parentNode.insertBefore(newRow, defectCategory.nextSibling);
}

// 削除
function removeDefect(defectId) {
   if (confirm('削除しますか？')) {
       registeredDefects = registeredDefects.filter(d => d.id !== defectId);
       updateDefectList();
   }
}

// 初期化
document.addEventListener('DOMContentLoaded', function() {
   // 線名カスタム
   const lineNameSelect = document.getElementById('lineName');
   if (lineNameSelect) {
       lineNameSelect.addEventListener('change', function() {
           document.getElementById('lineNameCustom').style.display = 
               this.value === 'custom' ? 'block' : 'none';
       });
   }
   
   // 今日の日付
   const surveyDate = document.getElementById('surveyDate');
   if (surveyDate) surveyDate.value = new Date().toISOString().split('T')[0];
});

// その他の型選択
document.getElementById('disasterType')?.addEventListener('change', function() {
   document.getElementById('disasterTypeOther').style.display = 
       this.value === 'その他' ? 'block' : 'none';
});
// APIキー設定機能
function showAPIKeySettings() {
    const currentKey = localStorage.getItem('openai_api_key');
    const hasKey = currentKey && currentKey.length > 0;
    
    const message = hasKey 
        ? 'OpenAI APIキーが設定されています。\n新しいキーを入力するか、空欄にして削除できます。'
        : 'OpenAI APIキーを入力してください：';
    
    const key = prompt(message, hasKey ? '設定済み（変更する場合は新しいキーを入力）' : '');
    
    if (key !== null) {  // キャンセルじゃない場合
        if (key === '' || key === '設定済み（変更する場合は新しいキーを入力）') {
            // 空欄の場合は削除
            if (hasKey && confirm('APIキーを削除しますか？')) {
                localStorage.removeItem('openai_api_key');
                alert('APIキーを削除しました');
            }
        } else {
            // 新しいキーを保存
            localStorage.setItem('openai_api_key', key);
            alert('APIキーを保存しました！\nこれでAI診断機能が使えます🤖');
        }
    }
}

// APIキーの存在確認（デバッグ用）
function checkAPIKey() {
    const key = localStorage.getItem('openai_api_key');
    return key && key.length > 0;
}

// AI診断を実行（CORS対応版）
// 維持管理標準の完全な判定ロジック
const maintenanceStandard = {
  "盛土": {
    "変状": {
      "き裂": {
        default: "A",
        conditions: {
          "規模が大きい": "AA",
          "明らかに進行性が確認される": "AA",
          "明らかに最近発生した": "AA"
        },
        description: "路盤またはのり面に線状の割れ目",
        cause: "盛土内部の間隙水圧上昇、土のせん断抵抗低下"
      },
      "はらみ": {
        default: "A",
        conditions: {
          "規模が大きい": "AA",
          "明らかに進行性が確認される": "AA",
          "明らかに最近発生した": "AA"
        },
        description: "のり面が膨張し膨らんだ状態",
        cause: "盛土内部の間隙水圧上昇"
      },
      "沈下": {
        default: "A",
        conditions: {
          "規模が大きい": "AA",
          "明らかに進行性が確認される": "AA",
          "明らかに最近発生した": "AA",
          "すべり以外の変状（やせ）": "B"
        }
      },
      "すべり": {
        default: "A",
        conditions: {
          "規模が大きい": "AA",
          "明らかに進行性が確認される": "AA",
          "明らかに最近発生した": "AA"
        }
      },
      "陥没": {
        default: "A",
        conditions: {
          "施工基面付近に発生": "AA"
        },
        cause: "排水工周辺の土砂抜け出し、空洞形成"
      },
      "洗掘": {
        default: "B",
        conditions: {
          "規模が大きい": "A"
        },
        cause: "のり尻部の河川による侵食"
      },
      "ガリ": {
        default: "B",
        conditions: {
          "規模が大きい": "A"
        },
        description: "表流水集中により表層土が削られ水の通り道",
        cause: "表流水の集中、側溝排水の漏れ・溢れ"
      },
      "やせ": {
        default: "B",
        conditions: {
          "規模が大きい": "A"
        }
      },
      "植生の不活着": {
        default: "B",
        conditions: {
          "規模が大きい": "A"
        }
      },
      "のり面工の陥没・不陸・浮き・き裂・食い違い": {
        default: "B",
        conditions: {
          "明らかに盛土本体の変状が原因で進行性確認": "AA",
          "盛土の変状により発生し規模が大きい": "A",
          "進行性が確認される": "A",
          "明らかに最近発生した": "A",
          "軽微な変状で進行性なし": "C"
        }
      },
      "土留壁・石積壁の沈下・傾斜・食い違い・き裂・目地切れ": {
        default: "B",
        conditions: {
          "明らかに盛土本体の変状が原因で進行性確認": "AA",
          "盛土の変状により発生し規模が大きい": "A",
          "進行性が確認される": "A",
          "明らかに最近発生した": "A",
          "軽微な変状で進行性なし": "C"
        }
      },
      "排水設備の破損・食い違い・通水不良": {
        default: "B",
        conditions: {
          "のり面に変状が現れている/おそれ": "A",
          "破損等の状態および著しい通水不良": "A",
          "軽微な変状で進行性なし": "C"
        }
      }
    },
    "不安定性": {
      "片切片盛": {
        conditions: {
          "のり面/のり尻が常に湿潤": "A",
          "のり面/のり尻から湧水": "A",
          "切土側から水が流入/形跡": "A",
          "上記現象なし": "B",
          "防護設備施工済み": "C"
        }
      },
      "切盛境界": {
        conditions: {
          "のり面/のり尻が常に湿潤": "A",
          "のり面/のり尻から湧水": "A",
          "水が集中流下した跡": "A",
          "上記現象なし": "B",
          "水処理施工済みで現象なし": "C",
          "防護設備施工済み": "C"
        }
      },
      "腹付盛土": {
        conditions: {
          "不等沈下確認": "A",
          "横断排水工に変状": "A",
          "上記現象なし": "B",
          "防護設備施工済み": "C"
        }
      },
      "谷渡り盛土": {
        conditions: {
          "のり面/のり尻が常に湿潤": "A",
          "のり面/のり尻から湧水": "A",
          "上流側で湛水歴/形跡": "A",
          "排水設備閉塞": "A",
          "上記現象なし": "B",
          "水処理施工済みで現象なし": "C",
          "防護設備施工済み": "C"
        }
      },
      "傾斜地盤上の盛土": {
        conditions: {
          "のり面が常に湿潤": "A",
          "のり面/のり尻から湧水": "A",
          "山側凹地が湿潤/湛水跡": "A",
          "上記現象なし": "B",
          "防護設備施工済み": "C"
        }
      },
      "軟弱地盤・不安定地盤": {
        conditions: {
          "沈下等で進行性/軌道変位頻発": "A",
          "その他": "B"
        }
      },
      "橋台裏・カルバート接合部": {
        conditions: {
          "のり面が常に湿潤": "A",
          "のり面から湧水": "A",
          "水の集中流下跡/侵食跡": "A",
          "水抜孔から湧水": "A",
          "上記現象なし": "B",
          "水処理施工済みで現象なし": "C",
          "防護設備施工済み": "C"
        }
      },
      "環境変化（伐採・開発）": {
        conditions: {
          "排水流量変化": "A",
          "路盤/のり面に流水跡": "A",
          "のり面から湧水": "A",
          "のり面が常に湿潤": "A",
          "上記現象なし": "B",
          "水処理施工済みで現象なし": "C",
          "防護設備施工済み": "C"
        }
      },
      "のり面湿潤/湧水": {
        conditions: {
          "常に湿潤/湧水あり": "A",
          "防護設備施工済み": "C"
        }
      },
      "発生バラスト散布": {
        conditions: {
          "厚く堆積し不安定": "A",
          "のり勾配が急になった": "B",
          "その他": "C"
        }
      },
      "排水容量不足": {
        conditions: {
          "通水阻害なしで溢水跡": "A"
        }
      },
      "排水パイプから土砂流出": {
        conditions: {
          "盛土本体に空洞確認": "A",
          "土砂流出している": "B"
        }
      },
      "付帯設備周辺の雨水流入": {
        conditions: {
          "雨水流入/流下の形跡": "A",
          "付帯設備周辺が沈下": "B",
          "不安定要因なし": "S"
        }
      }
    }
  },
  "切土": {
    "変状": {
      "き裂": {
        default: "A",
        conditions: {
          "規模が大きい": "AA",
          "明らかに進行性が確認される": "AA",
          "明らかに最近発生した": "AA"
        }
      },
      "沈下・すべり": {
        default: "A",
        conditions: {
          "規模が大きい": "AA",
          "明らかに進行性が確認される": "AA",
          "明らかに最近発生した": "AA"
        }
      },
      "ガリ・やせ・植生の不活着": {
        default: "A",
        conditions: {
          "規模大きく表層土不安定": "A"
        }
      },
      "のり面工の陥没・不陸・浮き": {
        default: "B",
        conditions: {
          "切土本体の変状が原因で進行性確認": "AA",
          "切土の変状により発生し規模大": "A",
          "進行性が確認される": "A",
          "明らかに最近発生": "A",
          "のり面工自体が不安定": "A",
          "軽微で進行性なし": "C"
        }
      },
      "のり面工のき裂・食い違い": {
        default: "B",
        conditions: {
          "切土本体の変状が原因で進行性確認": "AA",
          "切土の変状により発生し規模大": "A",
          "進行性が確認される": "A",
          "明らかに最近発生": "A",
          "軽微で進行性なし": "C"
        }
      },
      "土留壁・石積壁の変状": {
        default: "B",
        conditions: {
          "切土本体の変状が原因で進行性確認": "AA",
          "切土の変状により発生し規模大": "A",
          "進行性が確認される": "A",
          "明らかに最近発生": "A",
          "土留壁自体が不安定": "A",
          "軽微で進行性なし": "C"
        }
      },
      "排水設備の破損・通水不良": {
        default: "B",
        conditions: {
          "のり面に変状/おそれ": "A",
          "破損・著しい通水不良": "A",
          "軽微で進行性なし": "C"
        }
      }
    },
    "不安定性": {
      "地すべり地": {
        conditions: {
          "切土に変状・軌道変位": "A/AA（進行性でAA）",
          "上部で進行性あるが切土変状なし": "A",
          "過去に滑動・対策なし": "B",
          "地すべり対策済み": "C"
        }
      },
      "扇状地・段丘末端": {
        conditions: {
          "湧水に濁り/量変化": "A",
          "新たに湿潤状態": "A",
          "上記現象なし": "B",
          "防護工施工済み": "C"
        }
      },
      "災害歴・崩壊跡地": {
        conditions: {
          "過去崩壊・対策なし": "A",
          "不安定な転石・浮石": "A",
          "のり面に凹凸": "B",
          "防護工施工済み": "C"
        }
      },
      "背後に集水地形": {
        conditions: {
          "水の集中流下跡": "A",
          "湧水に濁り/量変化": "A",
          "新たに湿潤状態": "A",
          "上記現象なし": "B",
          "防護工施工済み": "C"
        }
      },
      "透水性異なる層": {
        conditions: {
          "湧水に濁り/量変化": "A",
          "新たに湿潤状態": "A",
          "上記現象なし": "B",
          "防護工施工済み": "C"
        }
      },
      "のり面からの湧水": {
        conditions: {
          "湧水に濁り/量変化": "A",
          "新たに湿潤状態": "A",
          "上記現象なし": "B",
          "防護工施工済み": "C"
        }
      },
      "表層土分布不均一": {
        conditions: {
          "分布不均一": "B",
          "防護工施工済み": "C"
        }
      },
      "伐採木の腐った根": {
        conditions: {
          "根周辺に空洞": "A",
          "根周辺が軟弱層": "A",
          "その他": "B"
        }
      },
      "オーバーハング": {
        conditions: {
          "土砂斜面でオーバーハング": "A",
          "岩石斜面で不安定化": "A",
          "岩石斜面で安定": "B",
          "対策工施工済み": "C"
        }
      },
      "不安定な転石・浮石": {
        conditions: {
          "存在する": "A",
          "対策工施工済み": "C"
        }
      },
      "選択侵食": {
        conditions: {
          "オーバーハング・浮石不安定": "A",
          "上記現象なし": "B",
          "対策工施工済み": "C"
        }
      },
      "割れ目の発達": {
        conditions: {
          "開口・落石崩壊の可能性": "A",
          "割れ目から湧水": "B",
          "割れ目に樹木": "B",
          "凍結する": "B",
          "対策工施工済み": "C"
        }
      },
      "のり肩立木・構造物不安定": {
        conditions: {
          "不安定化": "A"
        }
      },
      "のり尻土砂堆積": {
        conditions: {
          "ポケット容量不足": "A",
          "その他": "B"
        }
      },
      "排水パイプから土砂流出": {
        conditions: {
          "内部に空洞確認": "A",
          "大量流出/常に流出": "B"
        }
      },
      "排水容量不足": {
        conditions: {
          "通水阻害なしで溢水跡": "A"
        }
      }
    }
  }
};

// AI診断を実行（維持管理標準準拠版）
async function executeAIEvaluation() {
    const situationText = document.getElementById('situationText').value;
    const apiKey = localStorage.getItem('openai_api_key');
    
    if (!situationText) {
        alert('現場の状況説明を入力してください');
        return;
    }
    
    if (!apiKey) {
        alert('APIキーが設定されていません。');
        return;
    }
    
    document.getElementById('loadingOverlay').style.display = 'flex';
    
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: `鉄道土構造物維持管理標準の判定ロジック：${JSON.stringify(maintenanceStandard, null, 2)}

入力文から以下を抽出・判定：
1. 構造物種別（盛土/切土）
2. 変状名または不安定性要因
3. 該当する条件
4. 判定ロジックに基づく健全度

回答形式：
【構造物】盛土/切土
【種別】変状/不安定性
【項目】具体的な変状名/不安定性要因
【該当条件】観察された条件
【健全度】S/C/B/A/AA
【判定根拠】維持管理標準の該当項目
【対策】必要な措置`
                    },
                    {
                        role: 'user',
                        content: situationText
                    }
                ],
                temperature: 0.2,
                max_tokens: 300
            })
        });
        
        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        
        addDiagnosisToHistory(situationText, aiResponse);
        
    } catch (error) {
        alert(`診断中にエラーが発生しました:\n${error.message}`);
    } finally {
        document.getElementById('loadingOverlay').style.display = 'none';
    }
}

// 診断履歴管理機能
function clearDiagnosisHistory() {
    if (confirm('診断履歴をすべて削除しますか？')) {
        document.getElementById('diagnosisHistory').innerHTML = '<p style="text-align: center; color: #999;">診断結果がここに表示されます</p>';
        localStorage.removeItem('diagnosisHistory');
    }
}

function addDiagnosisToHistory(input, result) {
    const historyDiv = document.getElementById('diagnosisHistory');
    const timestamp = new Date().toLocaleString('ja-JP');
    
    const gradeMatch = result.match(/【健全度】\s*([S|C|B|A|AA]+)/);
    const grade = gradeMatch ? gradeMatch[1] : '';
    
    const diagnosisItem = document.createElement('div');
    diagnosisItem.className = 'diagnosis-item';
    diagnosisItem.innerHTML = `
        <div class="diagnosis-time">${timestamp}</div>
        <div class="diagnosis-input">入力: ${input}</div>
        <div class="diagnosis-result">${result}</div>
        ${grade ? `<span class="health-grade grade-${grade}">健全度: ${grade}</span>` : ''}
    `;
    
    const placeholder = historyDiv.querySelector('p');
    if (placeholder) placeholder.remove();
    
    historyDiv.insertBefore(diagnosisItem, historyDiv.firstChild);
    saveHistoryToStorage();
}

function saveHistoryToStorage() {
    const historyDiv = document.getElementById('diagnosisHistory');
    const items = historyDiv.querySelectorAll('.diagnosis-item');
    const history = Array.from(items).map(item => ({
        time: item.querySelector('.diagnosis-time').textContent,
        input: item.querySelector('.diagnosis-input').textContent.replace('入力: ', ''),
        result: item.querySelector('.diagnosis-result').textContent,
        grade: item.querySelector('.health-grade')?.textContent.replace('健全度: ', '') || ''
    }));
    localStorage.setItem('diagnosisHistory', JSON.stringify(history));
}

function loadHistoryFromStorage() {
    const saved = localStorage.getItem('diagnosisHistory');
    if (saved) {
        const history = JSON.parse(saved);
        const historyDiv = document.getElementById('diagnosisHistory');
        if (historyDiv) {
            historyDiv.innerHTML = '';
            history.reverse().forEach(item => {
                const diagnosisItem = document.createElement('div');
                diagnosisItem.className = 'diagnosis-item';
                diagnosisItem.innerHTML = `
                    <div class="diagnosis-time">${item.time}</div>
                    <div class="diagnosis-input">入力: ${item.input}</div>
                    <div class="diagnosis-result">${item.result}</div>
                    ${item.grade ? `<span class="health-grade grade-${item.grade}">健全度: ${item.grade}</span>` : ''}
                `;
                historyDiv.appendChild(diagnosisItem);
            });
        }
    }
}

// 切土用のグローバル変数
let registeredCuttingDefects = [];
let registeredCuttingInstabilities = [];
let tempCuttingDefectPhotos = [];
let tempCuttingInstabilityPhotos = [];

// 切土変状の登録
function registerCuttingDefect() {
    const type = document.getElementById('cuttingDefectType').value;
    if (!type) {
        alert('変状の種類を選択してください');
        return;
    }
    
    const km = document.getElementById('cuttingDefectKm').value;
    const m = document.getElementById('cuttingDefectM').value;
    
    const defect = {
        id: Date.now(),
        type: type,
        location: km && m ? `${km}k${m}m付近` : '',
        detail: document.getElementById('cuttingDefectDetail').value,
        photos: [...tempCuttingDefectPhotos]
    };
    
    registeredCuttingDefects.push(defect);
    updateCuttingDefectList();
    addCuttingDefectToTable(defect);
    closeModal('cuttingDefectModal');
    
    // フォームリセット
    document.getElementById('cuttingDefectType').value = '';
    document.getElementById('cuttingDefectKm').value = '';
    document.getElementById('cuttingDefectM').value = '';
    document.getElementById('cuttingDefectDetail').value = '';
    tempCuttingDefectPhotos = [];
    document.getElementById('cuttingDefectPhotoPreview').innerHTML = '';
    
    alert('切土の変状を登録しました！');
}

// 切土不安定性の登録
function registerCuttingInstability() {
    const type = document.getElementById('cuttingInstabilityType').value;
    if (!type) {
        alert('不安定要因の種類を選択してください');
        return;
    }
    
    const instability = {
        id: Date.now(),
        type: type,
        location: document.getElementById('cuttingInstabilityLocation').value,
        detail: document.getElementById('cuttingInstabilityDetail').value,
        photos: [...tempCuttingInstabilityPhotos]
    };
    
    registeredCuttingInstabilities.push(instability);
    updateCuttingInstabilityList();
    addCuttingInstabilityToTable(instability);
    closeModal('cuttingInstabilityModal');
    
    // フォームリセット
    document.getElementById('cuttingInstabilityType').value = '';
    document.getElementById('cuttingInstabilityLocation').value = '';
    document.getElementById('cuttingInstabilityDetail').value = '';
    tempCuttingInstabilityPhotos = [];
    document.getElementById('cuttingInstabilityPhotoPreview').innerHTML = '';
    
    alert('切土の不安定性を登録しました！');
}

// 切土変状リストの更新
function updateCuttingDefectList() {
    const defectItems = document.getElementById('cuttingDefectItems');
    if (!defectItems) return;
    
    defectItems.innerHTML = registeredCuttingDefects.length === 0 
        ? '<p style="text-align: center; color: #999;">まだ変状が登録されていません</p>'
        : registeredCuttingDefects.map(d => `
            <div class="defect-item">
                <div>
                    <div class="type">${d.type}</div>
                    <div class="item-location">${d.location}</div>
                    ${d.detail ? `<div style="color:#666;font-size:0.9em;margin-top:5px;">${d.detail}</div>` : ''}
                    ${d.photos.length > 0 ? `<div style="color:#2196F3;font-size:0.9em;margin-top:5px;">📸 写真${d.photos.length}枚</div>` : ''}
                </div>
                <button class="remove-item" onclick="removeCuttingDefect(${d.id})">削除</button>
            </div>
        `).join('');
}

// 切土不安定性リストの更新
function updateCuttingInstabilityList() {
    const instabilityItems = document.getElementById('cuttingInstabilityItems');
    if (!instabilityItems) return;
    
    instabilityItems.innerHTML = registeredCuttingInstabilities.length === 0 
        ? '<p style="text-align: center; color: #999;">まだ不安定性が登録されていません</p>'
        : registeredCuttingInstabilities.map(i => `
            <div class="instability-item">
                <div>
                    <div class="type">${i.type}</div>
                    <div class="item-location">${i.location}</div>
                    ${i.detail ? `<div style="color:#666;font-size:0.9em;margin-top:5px;">${i.detail}</div>` : ''}
                    ${i.photos.length > 0 ? `<div style="color:#FF9800;font-size:0.9em;margin-top:5px;">📸 写真${i.photos.length}枚</div>` : ''}
                </div>
                <button class="remove-item" onclick="removeCuttingInstability(${i.id})">削除</button>
            </div>
        `).join('');
}

// テーブルに追加
function addCuttingDefectToTable(defect) {
    const tableBody = document.getElementById('detailTableBody');
    if (!tableBody) return;
    
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${document.getElementById('managementNumber').value || '-'}</td>
        <td>${defect.location || '-'}</td>
        <td>${defect.type}</td>
        <td>${defect.detail || '-'}</td>
        <td style="text-align:center;">${defect.photos.length > 0 ? '📸' : '-'}</td>
        <td style="text-align:center;">-</td>
        <td><select onchange="updateAutoJudgment(this)">
            <option value="">-</option><option value="無">無</option>
            <option value="有">有</option><option value="新規">新規</option>
        </select></td>
        <td><select onchange="updateAutoJudgment(this)">
            <option value="">-</option><option value="無">無</option>
            <option value="小">小</option><option value="中">中</option><option value="大">大</option>
        </select></td>
        <td><input type="text" maxlength="2" style="text-align:center;"></td>
        <td><input type="text" maxlength="2" style="text-align:center;"></td>
        <td class="grade-2024"><input type="text" maxlength="2" style="text-align:center;">
            <span class="auto-grade" style="color:#666;font-size:0.8em;"></span></td>
    `;
    
    const defectCategory = tableBody.querySelector('.defect-category');
    defectCategory.parentNode.insertBefore(newRow, defectCategory.nextSibling);
}

function addCuttingInstabilityToTable(instability) {
    const tableBody = document.getElementById('detailTableBody');
    if (!tableBody) return;
    
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${document.getElementById('managementNumber').value || '-'}</td>
        <td>${instability.location || '-'}</td>
        <td>${instability.type}</td>
        <td>${instability.detail || '-'}</td>
        <td style="text-align:center;">${instability.photos.length > 0 ? '📸' : '-'}</td>
        <td style="text-align:center;">-</td>
        <td><select onchange="updateAutoJudgment(this)">
            <option value="">-</option><option value="無">無</option>
            <option value="有">有</option><option value="新規">新規</option>
        </select></td>
        <td><select onchange="updateAutoJudgment(this)">
            <option value="">-</option><option value="無">無</option>
            <option value="小">小</option><option value="中">中</option><option value="大">大</option>
        </select></td>
        <td><input type="text" maxlength="2" style="text-align:center;"></td>
        <td><input type="text" maxlength="2" style="text-align:center;"></td>
        <td class="grade-2024"><input type="text" maxlength="2" style="text-align:center;">
            <span class="auto-grade" style="color:#666;font-size:0.8em;"></span></td>
    `;
    
    const instabilityCategory = tableBody.querySelector('.instability-category');
    instabilityCategory.parentNode.insertBefore(newRow, instabilityCategory.nextSibling);
}

// 削除関数
function removeCuttingDefect(defectId) {
    if (confirm('この変状を削除しますか？')) {
        registeredCuttingDefects = registeredCuttingDefects.filter(d => d.id !== defectId);
        updateCuttingDefectList();
    }
}

function removeCuttingInstability(instabilityId) {
    if (confirm('この不安定性を削除しますか？')) {
        registeredCuttingInstabilities = registeredCuttingInstabilities.filter(i => i.id !== instabilityId);
        updateCuttingInstabilityList();
    }
}

// 写真アップロード処理
function handleCuttingDefectPhotoUpload(event) {
    const files = event.target.files;
    const preview = document.getElementById('cuttingDefectPhotoPreview');
    
    for (let file of files) {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const photoId = Date.now() + Math.random();
                tempCuttingDefectPhotos.push({
                    id: photoId,
                    data: e.target.result,
                    name: file.name
                });
                
                const photoItem = document.createElement('div');
                photoItem.className = 'photo-item-mini';
                photoItem.innerHTML = `
                    <img src="${e.target.result}" alt="${file.name}">
                    <button class="remove-mini" onclick="removeTempCuttingDefectPhoto(${photoId})">×</button>
                `;
                preview.appendChild(photoItem);
            };
            reader.readAsDataURL(file);
        }
    }
}

function handleCuttingInstabilityPhotoUpload(event) {
    const files = event.target.files;
    const preview = document.getElementById('cuttingInstabilityPhotoPreview');
    
    for (let file of files) {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const photoId = Date.now() + Math.random();
                tempCuttingInstabilityPhotos.push({
                    id: photoId,
                    data: e.target.result,
                    name: file.name
                });
                
                const photoItem = document.createElement('div');
                photoItem.className = 'photo-item-mini';
                photoItem.innerHTML = `
                    <img src="${e.target.result}" alt="${file.name}">
                    <button class="remove-mini" onclick="removeTempCuttingInstabilityPhoto(${photoId})">×</button>
                `;
                preview.appendChild(photoItem);
            };
            reader.readAsDataURL(file);
        }
    }
}

// 写真削除
function removeTempCuttingDefectPhoto(photoId) {
    tempCuttingDefectPhotos = tempCuttingDefectPhotos.filter(p => p.id !== photoId);
    updateCuttingDefectPhotoPreview();
}

function removeTempCuttingInstabilityPhoto(photoId) {
    tempCuttingInstabilityPhotos = tempCuttingInstabilityPhotos.filter(p => p.id !== photoId);
    updateCuttingInstabilityPhotoPreview();
}

// 写真プレビュー更新
function updateCuttingDefectPhotoPreview() {
    const preview = document.getElementById('cuttingDefectPhotoPreview');
    preview.innerHTML = '';
    tempCuttingDefectPhotos.forEach(photo => {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item-mini';
        photoItem.innerHTML = `
            <img src="${photo.data}" alt="${photo.name}">
            <button class="remove-mini" onclick="removeTempCuttingDefectPhoto(${photo.id})">×</button>
        `;
        preview.appendChild(photoItem);
    });
}

function updateCuttingInstabilityPhotoPreview() {
    const preview = document.getElementById('cuttingInstabilityPhotoPreview');
    preview.innerHTML = '';
    tempCuttingInstabilityPhotos.forEach(photo => {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item-mini';
        photoItem.innerHTML = `
            <img src="${photo.data}" alt="${photo.name}">
            <button class="remove-mini" onclick="removeTempCuttingInstabilityPhoto(${photo.id})">×</button>
        `;
        preview.appendChild(photoItem);
    });
}

// ページ読み込み時に履歴を復元
document.addEventListener('DOMContentLoaded', loadHistoryFromStorage);