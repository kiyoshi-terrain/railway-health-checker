// railway-progress-bar.js
class HealthProgressBar {
    constructor() {
        this.healthColors = {
            'S': '#28a745',
            'C': '#17a2b8',
            'B': '#ffc107',
            'A': '#fd7e14',
            'AA': '#dc3545'
        };
    }

    /**
     * 進行バー付きマーカーのスタイルを生成
     * @param {Object} feature - 地物情報
     * @param {Array} feature.history - 健全度履歴 [{year: 2022, health: 'C'}, ...]
     * @param {string} feature.type - 分類（D/I/P/O）
     * @param {string} feature.id - ID（D01等）
     * @returns {ol.style.Style} OpenLayersスタイル
     */
    createMarkerStyle(feature) {
        const { history = [], type, id } = feature;
        const currentYear = new Date().getFullYear();
        
        // 分類色（カスタマイズ可能）
        const typeColors = window.railwaySettings?.colors || {
            'D': '#dc3545',
            'I': '#fd7e14',
            'P': '#0d6efd',
            'O': '#6c757d'
        };

        // Canvas要素でカスタムアイコン生成
        const canvas = document.createElement('canvas');
        const size = 100;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // メインマーカー（円）
        ctx.beginPath();
        ctx.arc(size/2, size/2 - 15, 22, 0, 2 * Math.PI);
        ctx.fillStyle = typeColors[type];
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();

        // ID表示
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(id, size/2, size/2 - 15);

        // 進行バー描画
        if (history.length > 0) {
            const barY = size/2 + 15;
            const barHeight = 10;
            const totalWidth = 60;
            const startX = (size - totalWidth) / 2;
            
            // 表示年数（最大5年、最小1年）
            const displayYears = Math.min(history.length, 5);
            const barWidth = totalWidth / displayYears;

            // 最新の健全度から逆順に表示
            const sortedHistory = [...history].sort((a, b) => b.year - a.year).slice(0, displayYears);
            sortedHistory.reverse().forEach((record, index) => {
                const x = startX + (index * barWidth);
                const isLatest = record.year === currentYear;
                
                // バー描画
                ctx.fillStyle = this.healthColors[record.health];
                ctx.fillRect(x, barY, barWidth - 1, barHeight);
                
                // 最新年度は点滅効果（後でCSSで制御）
                if (isLatest) {
                    ctx.strokeStyle = 'white';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x, barY, barWidth - 1, barHeight);
                }
            });

            // 傾向矢印の描画
            if (history.length >= 2) {
                const trend = this.calculateTrend(sortedHistory);
                if (trend !== 'stable') {
                    const arrowX = startX + totalWidth + 5;
                    const arrowY = barY + barHeight/2;
                    
                    ctx.fillStyle = trend === 'worse' ? '#dc3545' : '#28a745';
                    ctx.beginPath();
                    if (trend === 'worse') {
                        ctx.moveTo(arrowX, arrowY - 3);
                        ctx.lineTo(arrowX + 5, arrowY - 3);
                        ctx.lineTo(arrowX + 2.5, arrowY + 2);
                    } else {
                        ctx.moveTo(arrowX, arrowY + 3);
                        ctx.lineTo(arrowX + 5, arrowY + 3);
                        ctx.lineTo(arrowX + 2.5, arrowY - 2);
                    }
                    ctx.closePath();
                    ctx.fill();
                }
            }
        } else {
            // 履歴なしの場合は現在の健全度のみ表示
            const barY = size/2 + 15;
            const barWidth = 40;
            const startX = (size - barWidth) / 2;
            
            ctx.fillStyle = this.healthColors[feature.health] || '#6c757d';
            ctx.fillRect(startX, barY, barWidth, 10);
        }

        // OpenLayersスタイルとして返す
        return new ol.style.Style({
            image: new ol.style.Icon({
                img: canvas,
                imgSize: [size, size],
                scale: 0.8
            })
        });
    }

    /**
     * 健全度の傾向を計算
     */
    calculateTrend(sortedHistory) {
        if (sortedHistory.length < 2) return 'stable';
        
        const healthOrder = { 'S': 0, 'C': 1, 'B': 2, 'A': 3, 'AA': 4 };
        const recent = sortedHistory[sortedHistory.length - 1];
        const previous = sortedHistory[sortedHistory.length - 2];
        
        const recentScore = healthOrder[recent.health];
        const previousScore = healthOrder[previous.health];
        
        if (recentScore > previousScore) return 'worse';
        if (recentScore < previousScore) return 'better';
        return 'stable';
    }

    /**
     * 対策実施マーク付きスタイル
     */
    createInterventionStyle(feature, interventionYear) {
        // 基本スタイルを取得
        const baseStyle = this.createMarkerStyle(feature);
        
        // TODO: 対策実施マークを追加
        // Canvas描画に介入マークを追加する処理
        
        return baseStyle;
    }
}

// グローバルに登録
window.HealthProgressBar = HealthProgressBar;
console.log('✅ HealthProgressBar loaded');