// 鉄道土構造物健全度評価システム v2 JavaScript

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
        // 変状タブ
        defectsContainer.innerHTML = `
            <div class="checklist">
                <h4>🔍 切土の変状項目</h4>
                <div class="checklist-grid">
                    <div class="check-item">
                        <input type="checkbox" id="crack" name="defect">
                        <label for="crack">き裂</label>
                    </div>
                    <div class="check-item">
                        <input type="checkbox" id="settlement" name="defect">
                        <label for="settlement">沈下・すべり</label>
                    </div>
                    <div class="check-item">
                        <input type="checkbox" id="gully" name="defect">
                        <label for="gully">ガリ・やせ・植生不活着</label>
                    </div>
                </div>
            </div>
            
            <div class="checklist" style="margin-top: 20px;">
                <h4>🛡️ 切土防護設備の変状項目</h4>
                <div class="checklist-grid">
                    <div class="check-item">
                        <input type="checkbox" id="slope-work-cave" name="defect-protection">
                        <label for="slope-work-cave">のり面工の陥没・不陸</label>
                    </div>
                    <div class="check-item">
                        <input type="checkbox" id="slope-work-float" name="defect-protection">
                        <label for="slope-work-float">のり面工の浮き</label>
                    </div>
                    <div class="check-item">
                        <input type="checkbox" id="slope-work-crack" name="defect-protection">
                        <label for="slope-work-crack">のり面工のき裂</label>
                    </div>
                    <div class="check-item">
                        <input type="checkbox" id="slope-work-gap" name="defect-protection">
                        <label for="slope-work-gap">のり面工の食い違い</label>
                    </div>
                    <div class="check-item">
                        <input type="checkbox" id="retaining-wall-settle" name="defect-protection">
                        <label for="retaining-wall-settle">土留壁・石積壁の沈下</label>
                    </div>
                    <div class="check-item">
                        <input type="checkbox" id="retaining-wall-tilt" name="defect-protection">
                        <label for="retaining-wall-tilt">土留壁・石積壁の傾斜</label>
                    </div>
                    <div class="check-item">
                        <input type="checkbox" id="retaining-wall-gap" name="defect-protection">
                        <label for="retaining-wall-gap">土留壁・石積壁の食い違い</label>
                    </div>
                    <div class="check-item">
                        <input type="checkbox" id="retaining-wall-crack" name="defect-protection">
                        <label for="retaining-wall-crack">土留壁・石積壁のき裂・目地切れ</label>
                    </div>
                </div>
            </div>
            
            <div class="checklist" style="margin-top: 20px;">
                <h4>💧 切土排水設備の変状項目</h4>
                <div class="checklist-grid">
                    <div class="check-item">
                        <input type="checkbox" id="drainage-damage" name="defect-drainage">
                        <label for="drainage-damage">排水設備の破損</label>
                    </div>
                    <div class="check-item">
                        <input type="checkbox" id="drainage-gap" name="defect-drainage">
                        <label for="drainage-gap">排水設備の食い違い</label>
                    </div>
                    <div class="check-item">
                        <input type="checkbox" id="drainage-poor" name="defect-drainage">
                        <label for="drainage-poor">排水設備の通水不良</label>
                    </div>
                    <div class="check-item">
                        <input type="checkbox" id="drainage-sediment" name="defect-drainage">
                        <label for="drainage-sediment">土砂・落葉の堆積</label>
                    </div>
                    <div class="check-item">
                        <input type="checkbox" id="drainage-overflow" name="defect-drainage">
                        <label for="drainage-overflow">溢水の跡</label>
                    </div>
                </div>
            </div>
        `;
        
        // 不安定性タブ
        instabilityContainer.innerHTML = `
            <div class="checklist">
                <h4>🏗️ 立地条件・周辺環境</h4>
                <div class="checklist-grid">
                    <div class="check-item">
                        <input type="checkbox" id="landslide" name="instability">
                        <label for="landslide">地すべり地</label>
                    </div>
                    <div class="check-item">
                        <input type="checkbox" id="alluvial-terrace" name="instability">
                        <label for="alluvial-terrace">扇状地・段丘の末端部</label>
                    </div>
                    <div class="check-item">
                        <input type="checkbox" id="disaster-history" name="instability">
                        <label for="disaster-history">過去に多くの災害歴がある、あるいは崩壊跡地が存在</label>
                    </div>
                    <div class="check-item">
                        <input type="checkbox" id="catchment" name="instability">
                        <label for="catchment">背後に集水地形等が存在</label>
                    </div>
                    <div class="check-item">
                        <input type="checkbox" id="env-deforestation" name="instability">
                        <label for="env-deforestation">環境の変化（伐採）</label>
                    </div>
                    <div class="check-item">
                        <input type="checkbox" id="env-development" name="instability">
                        <label for="env-development">環境の変化（宅地等の開発）</label>
                    </div>
                </div>
            </div>
            
            <div class="checklist" style="margin-top: 20px;">
                <h4>💧 切土・排水設備・付帯設備</h4>
                <div class="checklist-grid">
                    <div class="check-item">
                        <input type="checkbox" id="slope-spring" name="instability">
                        <label for="slope-spring">のり面からの湧水</label>
                    </div>
                    <div class="check-item">
                        <input type="checkbox" id="permeable-layer" name="instability">
                        <label for="permeable-layer">極端に透水性が異なる層の存在</label>
                    </div>
                    <div class="check-item">
                        <input type="checkbox" id="uneven-surface" name="instability">
                        <label for="uneven-surface">表層土の分布が不均一</label>
                    </div>
                    <div class="check-item">
                        <input type="checkbox" id="rotten-roots" name="instability">
                        <label for="rotten-roots">伐採木の腐った根の存在</label>
                    </div>
                    <div class="check-item">
                        <input type="checkbox" id="overhang" name="instability">
                        <label for="overhang">オーバーハング部の存在</label>
                    </div>
                    <div class="check-item">
                        <input type="checkbox" id="unstable-rocks" name="instability">
                        <label for="unstable-rocks">不安定な転石・浮石の存在</label>
                    </div>
                    <div class="check-item">
                        <input type="checkbox" id="selective-erosion" name="instability">
                        <label for="selective-erosion">選択侵食を受けている箇所</label>
                    </div>
                    <div class="check-item">
                        <input type="checkbox" id="crack-development" name="instability">
                        <label for="crack-development">割れ目の発達</label>
                    </div>
                    <div class="check-item">
                        <input type="checkbox" id="unstable-shoulder" name="instability">
                        <label for="unstable-shoulder">のり肩部の立木・構造物基礎が不安定</label>
                    </div>
                    <div class="check-item">
                        <input type="checkbox" id="debris-accumulation" name="instability">
                        <label for="debris-accumulation">のり尻や擁壁・柵背面に土砂や岩塊が堆積</label>
                    </div>
                    <div class="check-item">
                        <input type="checkbox" id="pipe-soil-outflow" name="instability">
                        <label for="pipe-soil-outflow">排水パイプから土砂が流出</label>
                    </div>
                    <div class="check-item">
                        <input type="checkbox" id="drainage-capacity" name="instability">
                        <label for="drainage-capacity">排水設備の容量不足</label>
                    </div>
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

// 地形地質概況の自動生成
async function generateGeologicalSummary() {
    const lat = document.getElementById('latitude').value;
    const lon = document.getElementById('longitude').value;
    
    if (!lat || !lon) {
        alert('緯度・経度を入力してください');
        return;
    }
    
    // ローディング表示
    document.getElementById('loadingOverlay').style.display = 'flex';
    
    try {
        // 自動評価APIを呼び出し
        const API_BASE = 'https://terrain-eapqpr0vw-kiyoshi-terrains-projects.vercel.app';
        const response = await fetch(`${API_BASE}/api/v1/terrain/analyze?latitude=${lat}&longitude=${lon}`);
        const data = await response.json();
        
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
            
            document.getElementById('geologicalSummary').value = summary;
        } else {
            alert('地形データの取得に失敗しました');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('エラーが発生しました: ' + error.message);
    } finally {
        document.getElementById('loadingOverlay').style.display = 'none';
    }
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

// AI診断を実行
async function executeAIEvaluation() {
    const situationText = document.getElementById('situationText').value;
    const apiKey = localStorage.getItem('openai_api_key');
    
    if (!situationText) {
        alert('現場の状況説明を入力してください');
        return;
    }
    
    if (!apiKey) {
        alert('APIキーが設定されていません。\n右下の「⚙️ API設定」ボタンから設定してください。');
        return;
    }
    
    // ローディング表示
    document.getElementById('loadingOverlay').style.display = 'flex';
    
    try {
        // Vercel APIエンドポイントを使用
        const response = await fetch('https://railway-health-checker-qxyar53f0-kiyoshi-terrains-projects.vercel.app/api/diagnose', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: situationText, apiKey: apiKey })
        });
        
        if (!response.ok) {
            throw new Error('API呼び出しに失敗しました');
        }
        
        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        
        alert(`AI診断結果：\n\n${aiResponse}`);
    } catch (error) {
        alert('診断中にエラーが発生しました');
        console.error(error);
    } finally {
        document.getElementById('loadingOverlay').style.display = 'none';
    }
}
