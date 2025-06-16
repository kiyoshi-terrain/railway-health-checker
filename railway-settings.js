// railway-settings.js
class RailwaySettings {
    constructor() {
        this.defaultColors = {
            'D': '#dc3545',  // 赤（変状）
            'I': '#fd7e14',  // オレンジ（不安定性）
            'P': '#0d6efd',  // 青（着眼点）
            'O': '#6c757d'   // グレー（観察記録）
        };
        
        this.colorPresets = {
            default: {
                name: '標準',
                colors: { ...this.defaultColors }
            },
            highContrast: {
                name: '高コントラスト',
                colors: {
                    'D': '#ff0000',
                    'I': '#ff6600',
                    'P': '#0066ff',
                    'O': '#333333'
                }
            },
            colorBlind: {
                name: '色覚サポート',
                colors: {
                    'D': '#cc79a7',
                    'I': '#d55e00',
                    'P': '#0072b2',
                    'O': '#999999'
                }
            },
            pastel: {
                name: 'パステル',
                colors: {
                    'D': '#ffb3ba',
                    'I': '#ffdfba',
                    'P': '#bae1ff',
                    'O': '#c9c9c9'
                }
            }
        };
        
        this.colors = this.loadColors();
        
        // DOMロード後にUI作成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.createSettingsUI());
        } else {
            this.createSettingsUI();
        }
    }

    loadColors() {
        const saved = localStorage.getItem('railwayColors');
        return saved ? JSON.parse(saved) : { ...this.defaultColors };
    }

    saveColors(colors) {
        this.colors = colors;
        localStorage.setItem('railwayColors', JSON.stringify(colors));
        
        // 全マーカー更新イベント
        window.dispatchEvent(new CustomEvent('colorsUpdated', { detail: colors }));
    }

    createSettingsUI() {
        // 設定モーダルHTML
        const modalHTML = `
        <div id="colorSettingsModal" class="modal" style="display: none;">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>🎨 分類カラー設定</h3>
                    <button class="close-btn" onclick="window.railwaySettings.closeModal()">&times;</button>
                </div>
                
                <div class="color-setting-grid">
                    <div class="color-item">
                        <label>D（変状）</label>
                        <div class="color-input-group">
                            <div class="color-preview" id="previewD" style="background: ${this.colors.D}"></div>
                            <input type="color" id="colorD" value="${this.colors.D}" 
                                   onchange="window.railwaySettings.updatePreview('D', this.value)">
                        </div>
                    </div>
                    
                    <div class="color-item">
                        <label>I（不安定性）</label>
                        <div class="color-input-group">
                            <div class="color-preview" id="previewI" style="background: ${this.colors.I}"></div>
                            <input type="color" id="colorI" value="${this.colors.I}"
                                   onchange="window.railwaySettings.updatePreview('I', this.value)">
                        </div>
                    </div>
                    
                    <div class="color-item">
                        <label>P（着眼点）</label>
                        <div class="color-input-group">
                            <div class="color-preview" id="previewP" style="background: ${this.colors.P}"></div>
                            <input type="color" id="colorP" value="${this.colors.P}"
                                   onchange="window.railwaySettings.updatePreview('P', this.value)">
                        </div>
                    </div>
                    
                    <div class="color-item">
                        <label>O（観察記録）</label>
                        <div class="color-input-group">
                            <div class="color-preview" id="previewO" style="background: ${this.colors.O}"></div>
                            <input type="color" id="colorO" value="${this.colors.O}"
                                   onchange="window.railwaySettings.updatePreview('O', this.value)">
                        </div>
                    </div>
                </div>
                
                <div class="preset-section">
                    <h4>プリセット配色</h4>
                    <div class="preset-buttons">
                        ${Object.entries(this.colorPresets).map(([key, preset]) => `
                            <button class="preset-btn" onclick="window.railwaySettings.applyPreset('${key}')">
                                ${preset.name}
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <div class="modal-buttons">
                    <button class="btn-primary" onclick="window.railwaySettings.saveSettings()">
                        保存
                    </button>
                    <button class="btn-secondary" onclick="window.railwaySettings.resetToDefault()">
                        初期値に戻す
                    </button>
                    <button onclick="window.railwaySettings.closeModal()">
                        キャンセル
                    </button>
                </div>
            </div>
        </div>`;
        
        // DOMに追加
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // ツールバーにボタン追加
        const mapControls = document.querySelector('.map-controls');
        if (mapControls) {
            const settingsBtn = document.createElement('button');
            settingsBtn.className = 'control-btn';
            settingsBtn.innerHTML = '🎨';
            settingsBtn.title = '分類カラー設定';
            settingsBtn.onclick = () => this.openModal();
            mapControls.appendChild(settingsBtn);
        } else {
            console.warn('地図コントロールが見つかりません');
        }
    }

    openModal() {
        const modal = document.getElementById('colorSettingsModal');
        modal.style.display = 'block';  // flexじゃなくてblock
        modal.style.position = 'fixed';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.zIndex = '999999';
        modal.style.width = 'auto';
        modal.style.height = 'auto';
        
        // 現在の色を反映
        Object.entries(this.colors).forEach(([type, color]) => {
            document.getElementById(`color${type}`).value = color;
            document.getElementById(`preview${type}`).style.background = color;
        });
    }

    closeModal() {
        document.getElementById('colorSettingsModal').style.display = 'none';
    }

    updatePreview(type, color) {
        document.getElementById(`preview${type}`).style.background = color;
    }

    applyPreset(presetKey) {
        const preset = this.colorPresets[presetKey];
        if (preset) {
            Object.entries(preset.colors).forEach(([type, color]) => {
                document.getElementById(`color${type}`).value = color;
                document.getElementById(`preview${type}`).style.background = color;
            });
        }
    }

    saveSettings() {
        const newColors = {
            'D': document.getElementById('colorD').value,
            'I': document.getElementById('colorI').value,
            'P': document.getElementById('colorP').value,
            'O': document.getElementById('colorO').value
        };
        
        this.saveColors(newColors);
        this.closeModal();
        
        // 成功メッセージ
        alert('カラー設定を保存しました！');
    }

    resetToDefault() {
        this.applyPreset('default');
    }
}

// 初期化
window.railwaySettings = new RailwaySettings();
console.log('✅ RailwaySettings loaded');