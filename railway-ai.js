// railway-ai.js - AI診断機能

// ========================================
// APIキー設定機能
// ========================================
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

// ========================================
// 維持管理標準の判定ロジック
// ========================================
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

// ========================================
// AI診断を実行（維持管理標準準拠版）
// ========================================
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

// ========================================
// 診断履歴管理機能
// ========================================
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