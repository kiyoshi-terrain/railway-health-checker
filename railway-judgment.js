// railway-judgment.js - 健全度判定機能

// ========================================
// 健全度計算
// ========================================
function calculateGrade(progress, impact) {
    // 基本判定マトリクス
    const gradeMatrix = {
        '無': { '無': 'S', '小': 'C', '中': 'B', '大': 'A' },
        '有': { '無': 'C', '小': 'B', '中': 'A', '大': 'AA' },
        '新規': { '無': 'C', '小': 'B', '中': 'A', '大': 'AA' }
    };
    
    return gradeMatrix[progress]?.[impact] || 'B';
}

// ========================================
// 個別の行で自動判定を更新
// ========================================
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

// ========================================
// 自動判定（全体）
// ========================================
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