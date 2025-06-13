// railway-embankment.js - 盛土の変状・不安定性管理

// ========================================
// 盛土変状の登録
// ========================================
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
    
    // フォームリセット
    document.getElementById('defectType').value = '';
    document.getElementById('defectKm').value = '';
    document.getElementById('defectM').value = '';
    document.getElementById('defectDetail').value = '';
    tempDefectPhotos = [];
    document.getElementById('defectPhotoPreview').innerHTML = '';
    
    alert('変状を登録しました！');
}

// ========================================
// 盛土不安定性の登録
// ========================================
function registerInstability() {
    const type = document.getElementById('instabilityType').value;
    if (!type) {
        alert('不安定要因の種類を選択してください');
        return;
    }
    
    const instability = {
        id: Date.now(),
        type: type,
        location: document.getElementById('instabilityLocation').value,
        detail: document.getElementById('instabilityDetail').value,
        photos: [...tempInstabilityPhotos]
    };
    
    registeredInstabilities.push(instability);
    updateInstabilityList();
    addInstabilityToTable(instability);
    closeModal('instabilityModal');
    
    // フォームリセット
    document.getElementById('instabilityType').value = '';
    document.getElementById('instabilityLocation').value = '';
    document.getElementById('instabilityDetail').value = '';
    tempInstabilityPhotos = [];
    document.getElementById('instabilityPhotoPreview').innerHTML = '';
    
    alert('不安定性を登録しました！');
}

// ========================================
// リスト更新
// ========================================
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

function updateInstabilityList() {
    const instabilityItems = document.getElementById('instabilityItems');
    if (!instabilityItems) return;
    
    instabilityItems.innerHTML = registeredInstabilities.length === 0 
        ? '<p style="text-align: center; color: #999;">まだ不安定性が登録されていません</p>'
        : registeredInstabilities.map(i => `
            <div class="instability-item">
                <div>
                    <div class="type">${i.type}</div>
                    <div class="item-location">${i.location}</div>
                    ${i.detail ? `<div style="color:#666;font-size:0.9em;margin-top:5px;">${i.detail}</div>` : ''}
                    ${i.photos.length > 0 ? `<div style="color:#FF9800;font-size:0.9em;margin-top:5px;">📸 写真${i.photos.length}枚</div>` : ''}
                </div>
                <button class="remove-item" onclick="removeInstability(${i.id})">削除</button>
            </div>
        `).join('');
}

// ========================================
// テーブルへの追加
// ========================================
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
        <td class="grade-2024"><input type="text" maxlength="2" style="text-align:center;">
            <span class="auto-grade" style="color:#666;font-size:0.8em;"></span></td>
    `;
    
    const defectCategory = tableBody.querySelector('.defect-category');
    defectCategory.parentNode.insertBefore(newRow, defectCategory.nextSibling);
}

function addInstabilityToTable(instability) {
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

// ========================================
// 削除機能
// ========================================
function removeDefect(defectId) {
    if (confirm('この変状を削除しますか？')) {
        registeredDefects = registeredDefects.filter(d => d.id !== defectId);
        updateDefectList();
    }
}

function removeInstability(instabilityId) {
    if (confirm('この不安定性を削除しますか？')) {
        registeredInstabilities = registeredInstabilities.filter(i => i.id !== instabilityId);
        updateInstabilityList();
    }
}