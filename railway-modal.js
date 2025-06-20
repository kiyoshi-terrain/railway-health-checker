// railway-modal.js - 統一モーダル管理システム

const ModalManager = {
    // モーダルのモード
    modes: {
        VIEW: 'view',
        EDIT: 'edit',
        CREATE: 'create'
    },
    
    currentMode: null,
    currentData: null,
    editingData: null,
    
    // 初期化
    init() {
        // ESCキーで閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen()) {
                this.close();
            }
        });
        
        // モーダル外クリックで閉じる
        const modal = document.getElementById('universalModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.close();
                }
            });
        }
        
        console.log('ModalManager initialized');
    },
    
    // モーダルが開いているか
    isOpen() {
        const modal = document.getElementById('universalModal');
        return modal && modal.style.display !== 'none';
    },
    
    // モーダルを開く
    open(mode, data = null) {
        this.currentMode = mode;
        this.currentData = data;
        
        const modal = document.getElementById('universalModal');
        if (!modal) return;
        
        switch(mode) {
            case this.modes.VIEW:
                this.showViewMode(data);
                break;
            case this.modes.EDIT:
                this.showEditMode(data);
                break;
        }
        
        modal.style.display = 'flex';
    },
    
    // 閉じる
    close() {
        const modal = document.getElementById('universalModal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.currentMode = null;
        this.currentData = null;
        this.editingData = null;
    },
    
    // 表示モード
    showViewMode(data) {
        this.setTitle(`${data.id} - 詳細情報`);
        this.setBody(this.createViewContent(data));
        this.setFooter([
            { text: '編集', class: 'btn-primary', onClick: () => this.switchToEdit() },
            { text: '削除', class: 'btn-danger', onClick: () => this.confirmDelete() },
            { text: '閉じる', class: 'btn-secondary', onClick: () => this.close() }
        ]);
    },
    
    // 編集モード
    showEditMode(data) {
        this.setTitle(`${data.id} - 編集`);
        this.setBody(this.createEditContent(data));
        this.setFooter([
            { text: '保存', class: 'btn-primary', onClick: () => this.saveChanges() },
            { text: 'キャンセル', class: 'btn-secondary', onClick: () => this.switchToView() }
        ]);
    },
    
    // タイトル設定
    setTitle(title) {
        const titleElement = document.getElementById('modalTitle');
        if (titleElement) titleElement.textContent = title;
    },
    
    // ボディ設定
    setBody(html) {
        const bodyElement = document.getElementById('modalBody');
        if (bodyElement) bodyElement.innerHTML = html;
    },
    
    // フッター設定
    setFooter(buttons) {
        const footerElement = document.getElementById('modalFooter');
        if (!footerElement) return;
        
        footerElement.innerHTML = buttons.map(btn => `
            <button class="btn ${btn.class}" id="${btn.id || ''}">
                ${btn.text}
            </button>
        `).join('');
        
        // イベントリスナー設定
        buttons.forEach((btn, index) => {
            const btnElement = footerElement.children[index];
            if (btnElement && btn.onClick) {
                btnElement.addEventListener('click', btn.onClick);
            }
        });
    },
    
    // 詳細表示コンテンツ
    createViewContent(data) {
        return `
            <div class="detail-content">
                <div class="detail-section">
                    <h4 style="margin-top: 0; color: #2a5298;">基本情報</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">分類:</span>
                            <span class="type-badge ${data.type.toLowerCase()}-type">
                                ${data.type} - ${this.getTypeName(data.type)}
                            </span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">構造物:</span>
                            <span>${this.getStructureTypeName(data.structureType)}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">キロ程:</span>
                            <span>${data.kilometer || '-'} km</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">健全度:</span>
                            <span class="grade-badge grade-${data.grade || 'none'}">
                                ${data.grade || '未評価'}
                            </span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">登録日:</span>
                            <span>${new Date(data.timestamp).toLocaleString()}</span>
                        </div>
                        ${data.coords ? `
                            <div class="info-item">
                                <span class="info-label">座標:</span>
                                <span style="font-family: monospace; font-size: 12px;">
                                    ${data.coords.lonLat ? 
                                        `N${data.coords.lonLat[1].toFixed(6)}° E${data.coords.lonLat[0].toFixed(6)}°` : 
                                        '座標データなし'
                                    }
                                </span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                ${data.history && data.history.length > 1 ? `
                    <div class="detail-section">
                        <h4 style="color: #2a5298;">健全度履歴</h4>
                        <div class="history-list">
                            ${data.history.sort((a, b) => b.year - a.year).map(h => `
                                <div class="history-item">
                                    <span class="history-year">${h.year}年:</span>
                                    <span class="grade-badge grade-${h.health || 'none'}">${h.health || '-'}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${data.remarks ? `
                    <div class="detail-section">
                        <h4 style="color: #2a5298;">備考</h4>
                        <div class="remarks-box">
                            ${data.remarks.replace(/\n/g, '<br>')}
                        </div>
                    </div>
                ` : ''}
                
                ${data.photos && data.photos.length > 0 ? `
                    <div class="detail-section">
                        <h4 style="color: #2a5298;">現場写真 (${data.photos.length}枚)</h4>
                        <div class="photo-gallery">
                            ${data.photos.map((photo, idx) => `
                                <img src="${photo.data}" 
                                     class="gallery-photo"
                                     onclick="ModalManager.showPhotoModal('${photo.data}')"
                                     title="クリックで拡大">
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    },
    
    // 編集フォームコンテンツ
    createEditContent(data) {
        // 編集用のデータをコピー（元データを汚染しない）
        this.editingData = JSON.parse(JSON.stringify(data));
        
        return `
            <div class="edit-form">
                <div class="edit-section">
                    <label>分類</label>
                    <div class="type-selector">
                        ${['D', 'I', 'P', 'O'].map(type => `
                            <button class="type-btn ${type.toLowerCase()}-type ${data.type === type ? 'selected' : ''}"
                                    data-type="${type}"
                                    onclick="ModalManager.selectType('${type}')">
                                <span class="icon">${type}</span>
                                <span class="name">${this.getTypeName(type)}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <div class="edit-section">
                    <label>構造物種別</label>
                    <select id="edit-structureType" class="form-select">
                        <option value="embankment" ${data.structureType === 'embankment' ? 'selected' : ''}>盛土</option>
                        <option value="cutting" ${data.structureType === 'cutting' ? 'selected' : ''}>切土</option>
                        <option value="natural" ${data.structureType === 'natural' ? 'selected' : ''}>自然斜面</option>
                    </select>
                </div>
                
                <div class="edit-section">
                    <label>キロ程</label>
                    <div class="input-with-unit">
                        <input type="number" id="edit-kilometer" value="${data.kilometer || ''}" 
                               step="0.001" class="form-input" placeholder="12.500">
                        <span class="unit">km</span>
                    </div>
                </div>
                
                <div class="edit-section">
                    <label>健全度評価</label>
                    <div class="grade-selector">
                        ${['S', 'C', 'B', 'A', 'AA'].map(grade => `
                            <button class="grade-btn ${data.grade === grade ? 'selected' : ''}"
                                    data-grade="${grade}"
                                    onclick="ModalManager.selectGrade('${grade}')">
                                ${grade}
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <div class="edit-section">
                    <label>現場写真</label>
                    <div class="photo-editor">
                        <div id="editPhotoList" class="photo-list">
                            ${data.photos && data.photos.length > 0 ? 
                                data.photos.map((photo, idx) => `
                                    <div class="photo-item" data-index="${idx}">
                                        <img src="${photo.data}">
                                        <button class="remove-photo" onclick="ModalManager.removePhoto(${idx})">×</button>
                                    </div>
                                `).join('') : ''
                            }
                        </div>
                        <input type="file" id="editPhotoInput" accept="image/*" multiple style="display: none;"
                               onchange="ModalManager.addPhotos(event)">
                        <button class="add-photo-btn" onclick="document.getElementById('editPhotoInput').click()">
                            +
                        </button>
                    </div>
                </div>
                
                <div class="edit-section">
                    <label>備考・詳細</label>
                    <textarea id="edit-remarks" class="form-textarea" rows="4" 
                              placeholder="状況の詳細、対策の必要性など...">${data.remarks || ''}</textarea>
                </div>
            </div>
        `;
    },
    
    // 編集から表示モードへ
    switchToView() {
        if (confirm('編集内容を破棄してもよろしいですか？')) {
            this.showViewMode(this.currentData);
        }
    },
    
    // 表示から編集モードへ
    switchToEdit() {
        this.showEditMode(this.currentData);
    },
    
    // 分類選択
    selectType(type) {
        // 既存の選択を解除
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        // 新しい選択
        event.target.closest('.type-btn').classList.add('selected');
        this.editingData.type = type;
    },
    
    // 健全度選択
    selectGrade(grade) {
        // 既存の選択を解除
        document.querySelectorAll('.grade-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        // 新しい選択
        event.target.classList.add('selected');
        this.editingData.grade = grade;
    },
    
    // 写真削除
    removePhoto(index) {
        if (confirm('この写真を削除してもよろしいですか？')) {
            this.editingData.photos.splice(index, 1);
            this.refreshPhotoList();
        }
    },
    
    // 写真追加
    addPhotos(event) {
        const files = event.target.files;
        
        for (let file of files) {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    if (!this.editingData.photos) {
                        this.editingData.photos = [];
                    }
                    
                    this.editingData.photos.push({
                        name: file.name,
                        data: e.target.result,
                        timestamp: new Date().toISOString()
                    });
                    
                    this.refreshPhotoList();
                };
                
                reader.readAsDataURL(file);
            }
        }
        
        // inputをリセット
        event.target.value = '';
    },
    
    // 写真リストを更新
    refreshPhotoList() {
        const photoList = document.getElementById('editPhotoList');
        if (!photoList) return;
        
        photoList.innerHTML = this.editingData.photos.map((photo, idx) => `
            <div class="photo-item" data-index="${idx}">
                <img src="${photo.data}">
                <button class="remove-photo" onclick="ModalManager.removePhoto(${idx})">×</button>
            </div>
        `).join('');
    },
    
    // 変更を保存
    async saveChanges() {
        // フォームから値を取得
        this.editingData.structureType = document.getElementById('edit-structureType').value;
        this.editingData.kilometer = document.getElementById('edit-kilometer').value;
        this.editingData.remarks = document.getElementById('edit-remarks').value;
        
        // 健全度履歴を更新
        const currentYear = new Date().getFullYear();
        if (this.editingData.grade !== this.currentData.grade) {
            if (!this.editingData.history) {
                this.editingData.history = [];
            }
            
            // 同じ年の履歴があれば更新、なければ追加
            const existingIndex = this.editingData.history.findIndex(h => h.year === currentYear);
            if (existingIndex >= 0) {
                this.editingData.history[existingIndex].health = this.editingData.grade;
            } else {
                this.editingData.history.push({
                    year: currentYear,
                    health: this.editingData.grade
                });
            }
        }
        
        try {
            // IndexedDBに保存
            await RegistrationManager.updateRegistration(this.editingData);
            
            alert('保存しました！');
            
            // 表示モードに戻る
            this.currentData = this.editingData;
            this.showViewMode(this.currentData);
            
            // リストとマーカーを更新
            RegistrationManager.updateSidebarList();
            RegistrationManager.loadAllMarkers();
            
        } catch (error) {
            console.error('保存エラー:', error);
            alert('保存に失敗しました');
        }
    },
    
    // 削除確認
    async confirmDelete() {
        if (confirm(`${this.currentData.id} を削除してもよろしいですか？\nこの操作は取り消せません。`)) {
            await RegistrationManager.deleteRegistration(this.currentData.id);
            this.close();
        }
    }
};

// 初期化
window.addEventListener('load', () => {
    ModalManager.init();
});

// ヘルパー関数をRegistrationManagerから参照できるようにする
ModalManager.getTypeName = function(type) {
    const names = {
        'D': '変状',
        'I': '不安定性',
        'P': '着眼点',
        'O': '観察記録'
    };
    return names[type] || '不明';
};

ModalManager.getStructureTypeName = function(type) {
    const names = {
        'embankment': '盛土',
        'cutting': '切土',
        'natural': '自然斜面'  
    };
    return names[type] || '-';
};

ModalManager.getGradeColor = function(grade) {
    const colors = {
        'S': '#28a745',
        'C': '#ffc107',
        'B': '#fd7e14',
        'A': '#dc3545',
        'AA': '#721c24'
    };
    return colors[grade] || '#6c757d';
};

// 写真拡大モーダル（ズーム機能付き）
ModalManager.showPhotoModal = function(imageSrc) {
    // 既存の拡大モーダルがあれば削除
    const existing = document.getElementById('photoZoomModal');
    if (existing) existing.remove();
    
    const modal = document.createElement('div');
    modal.id = 'photoZoomModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100001;
        cursor: zoom-out;
        animation: fadeIn 0.3s;
        overflow: hidden;
    `;
    
    // 画像コンテナ（ドラッグ用）
    const imgContainer = document.createElement('div');
    imgContainer.style.cssText = `
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
    `;
    
    const img = document.createElement('img');
    img.src = imageSrc;
    img.style.cssText = `
        max-width: 90%;
        max-height: 90%;
        object-fit: contain;
        box-shadow: 0 0 30px rgba(0,0,0,0.5);
        cursor: grab;
        transition: transform 0.3s ease;
        user-select: none;
    `;
    
    // ズーム情報表示
    const zoomInfo = document.createElement('div');
    zoomInfo.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        background: rgba(0,0,0,0.7);
        color: white;
        padding: 10px 15px;
        border-radius: 8px;
        font-family: monospace;
        font-size: 14px;
        user-select: none;
        pointer-events: none;
    `;
    
    // ズーム機能の変数
    let zoomLevel = 1;
    let isDragging = false;
    let startX = 0, startY = 0;
    let translateX = 0, translateY = 0;
    
    // ズーム情報更新
    const updateZoomInfo = () => {
        zoomInfo.textContent = `${Math.round(zoomLevel * 100)}%`;
        if (zoomLevel > 1) {
            img.style.cursor = 'grab';
        } else {
            img.style.cursor = 'zoom-in';
            translateX = 0;
            translateY = 0;
        }
        updateTransform();
    };
    
    // 変形適用
    const updateTransform = () => {
        img.style.transform = `scale(${zoomLevel}) translate(${translateX/zoomLevel}px, ${translateY/zoomLevel}px)`;
    };
    
    // ホイールでズーム
    modal.onwheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.1 : -0.1;
        const newZoom = Math.max(0.5, Math.min(5, zoomLevel + delta));
        
        if (newZoom !== zoomLevel) {
            zoomLevel = newZoom;
            updateZoomInfo();
        }
    };
    
    // ドラッグ機能（ズーム時のみ）
    img.onmousedown = (e) => {
        if (zoomLevel > 1) {
            isDragging = true;
            startX = e.clientX - translateX;
            startY = e.clientY - translateY;
            img.style.cursor = 'grabbing';
            e.preventDefault();
        }
    };
    
    window.addEventListener('mousemove', (e) => {
        if (isDragging) {
            translateX = e.clientX - startX;
            translateY = e.clientY - startY;
            updateTransform();
        }
    });
    
    window.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            img.style.cursor = zoomLevel > 1 ? 'grab' : 'zoom-in';
        }
    });
    
    // ダブルクリックでズームリセット
    img.ondblclick = (e) => {
        e.stopPropagation();
        if (zoomLevel === 1) {
            zoomLevel = 2;
        } else {
            zoomLevel = 1;
        }
        translateX = 0;
        translateY = 0;
        updateZoomInfo();
    };
    
    // クリックで閉じる（画像以外）
    modal.onclick = (e) => {
        if (e.target === modal || e.target === imgContainer) {
            modal.style.animation = 'fadeOut 0.3s';
            setTimeout(() => modal.remove(), 300);
        }
    };
    
    // ESCキーでも閉じる
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            modal.style.animation = 'fadeOut 0.3s';
            setTimeout(() => modal.remove(), 300);
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
    
    // 初期表示
    updateZoomInfo();
    
    imgContainer.appendChild(img);
    modal.appendChild(imgContainer);
    modal.appendChild(zoomInfo);
    document.body.appendChild(modal);
};

// グローバルに公開
window.ModalManager = ModalManager;