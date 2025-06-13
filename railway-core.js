// railway-core.js - 鉄道土構造物健全度評価システム v2
// 基本機能とグローバル変数管理

// ========================================
// グローバル変数
// ========================================
let rowCounter = 0;
let uploadedPhotos = [];

// 盛土用
let registeredDefects = [];
let registeredInstabilities = [];
let tempDefectPhotos = [];
let tempInstabilityPhotos = [];

// 切土用
let registeredCuttingDefects = [];
let registeredCuttingInstabilities = [];
let tempCuttingDefectPhotos = [];
let tempCuttingInstabilityPhotos = [];

// ========================================
// 基本UI制御
// ========================================

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

// ========================================
// モーダル制御（共通）
// ========================================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        // モーダル別の初期化処理
        if (modalId === 'defectModal') {
            tempDefectPhotos = [];
            document.getElementById('defectPhotoPreview').innerHTML = '';
        } else if (modalId === 'cuttingDefectModal') {
            tempCuttingDefectPhotos = [];
            document.getElementById('cuttingDefectPhotoPreview').innerHTML = '';
        } else if (modalId === 'instabilityModal') {
            tempInstabilityPhotos = [];
            document.getElementById('instabilityPhotoPreview').innerHTML = '';
        } else if (modalId === 'cuttingInstabilityModal') {
            tempCuttingInstabilityPhotos = [];
            document.getElementById('cuttingInstabilityPhotoPreview').innerHTML = '';
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        // フォームリセット処理は各機能ファイルで実装
    }
}

// ========================================
// チェックリスト更新（構造物種別による切り替え）
// ========================================
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

// ========================================
// 初期化処理
// ========================================
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
    
    // その他の型選択
    const disasterType = document.getElementById('disasterType');
    if (disasterType) {
        disasterType.addEventListener('change', function() {
            document.getElementById('disasterTypeOther').style.display = 
                this.value === 'その他' ? 'block' : 'none';
        });
    }
    
    // AI診断履歴の復元（railway-ai.jsから呼び出される）
    if (typeof loadHistoryFromStorage === 'function') {
        loadHistoryFromStorage();
    }
});

// ========================================
// ユーティリティ関数
// ========================================

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