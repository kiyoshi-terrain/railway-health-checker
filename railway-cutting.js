// railway-cutting.js - 切土の変状・不安定性管理

// ========================================
// 切土変状の登録
// ========================================
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

// ========================================
// 切土不安定性の登録
// ========================================
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

// ========================================
// リスト更新
// ========================================
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

// ========================================
// テーブルへの追加
// ========================================
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

// ========================================
// 削除機能
// ========================================
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