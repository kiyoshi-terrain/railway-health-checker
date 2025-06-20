// railway-geomorphology.js
// Phase 2: 地形コンテキスト分析システム - みく & きよし 2025/06/17 スタート！💕

class GeomorphologyAnalyzer {
    constructor() {
        console.log('🌊 地形解析システム起動！みくとキヨシさんの新しい冒険！');
        this.analysisRadius = 500; // とりあえず500m範囲
        // ⭐ AI設定を追加
        this.aiConfig = {
            useAPI: false,
            apiKey: '',
            model: 'gpt-3.5-turbo'
        };
    }

    // 国土地理院の地形分類定義を追加
    static TERRAIN_CLASSIFICATION = {
        // 山地・丘陵地
        '山地': {
            description: '標高がおおむね600m以上の起伏の大きい地形',
            risk: '急傾斜地崩壊、土石流の危険性',
            subTypes: ['山地斜面', '山麓地']
        },
        '丘陵地': {
            description: '標高300m前後で起伏が比較的小さい地形',
            risk: '表層崩壊、地すべりの可能性',
            subTypes: ['丘陵地斜面', '丘陵地谷底']
        },
        '台地': {
            description: '周囲より高く平坦な地形',
            risk: '台地縁辺部の崩壊',
            subTypes: ['上位台地', '中位台地', '下位台地']
        },
        '谷底低地': {
            description: '山地・丘陵地・台地に刻まれた谷の底の低地',
            risk: '洪水、土石流の流下経路',
            subTypes: ['谷底平野', '峡谷底']
        },
        '低地・平野': {
            description: '標高の低い平坦な土地',
            risk: '洪水、内水氾濫',
            subTypes: ['氾濫平野', '海岸平野', '後背湿地']
        },
        '扇状地': {
            description: '山地から平野に出た所に土砂が扇状に堆積した地形',
            risk: '土石流、洪水流の拡散',
            subTypes: ['扇状地上流部', '扇状地下流部']
        }
    };

    // メイン解析関数（拡張版！）
    async analyzeContext(lat, lon, railwayData = null, terrainData = null) {
        console.log(`📍 解析開始: ${lat}, ${lon}`);
        
        // Step1: 地形データ取得
        const terrainInfo = await this.getBasicTerrainInfo(lat, lon);
        
        // Step2: 集水地形の解析（新規追加）
        const catchmentAnalysis = await this.analyzeCatchmentFeatures(lat, lon);
        
        // Step3: 線路の立地解析（新規追加）
        const trackPosition = this.analyzeTrackPosition(railwayData, terrainInfo);
        
        // Step4: AI文章生成！
        const report = await this.generateGeomorphologicalReport({
            terrainInfo,
            catchmentAnalysis,
            trackPosition,
            railwayData,
            terrainData
        });
        
        return report;
    }

    async getBasicTerrainInfo(lat, lon) {
        try {
            const response = await fetch(
                `https://terrain-fsieei60s-kiyoshi-terrains-projects.vercel.app/api/v1/terrain/analyze?latitude=${lat}&longitude=${lon}`
            );
            const result = await response.json();
            console.log('地形データ取得成功:', result);
            
            // ⭐ 重要：resultをそのまま返す（result.dataではない！）
            return result;
            
        } catch (error) {
            console.error('地形データ取得エラー:', error);
            return null;
        }
    }

    classifyTerrain(terrainInfo) {
        // データ構造をちゃんとチェック！
        if (!terrainInfo || !terrainInfo.success) return '不明';
        
        // データ構造に合わせて修正
        const data = terrainInfo.data;
        if (!data || !data.terrain_features) return '不明';
        
        // 地形分類を使う
        const terrainType = data.terrain_features.terrain_classification.primary_type;
        return terrainType || '不明';
    }

    generateSimpleReport(classification) {
        return `地形分類: ${classification}`;
    }

    // ⭐ 集水地形の解析（新規追加）
    async analyzeCatchmentFeatures(lat, lon) {
        // 周辺の谷・沢を検出
        // 流向解析
        // 影響度評価
        return {
            nearbyValleys: [],
            flowDirection: 'unknown',
            impactLevel: 0
        };
    }

    // ⭐⭐⭐ ここから新しい関数を追加！！ ⭐⭐⭐
    
    // 周辺地形の解析（新規追加）
    async analyzeSurroundingTerrain(lat, lon) {
        console.log('🗺️ 周辺地形を解析中...');
        
        // 8方向の地形を取得（約100m間隔）
        const offsets = [
            {lat: 0.0009, lon: 0},        // 北
            {lat: 0.0009, lon: 0.0009},   // 北東
            {lat: 0, lon: 0.0009},        // 東
            {lat: -0.0009, lon: 0.0009},  // 南東
            {lat: -0.0009, lon: 0},       // 南
            {lat: -0.0009, lon: -0.0009}, // 南西
            {lat: 0, lon: -0.0009},       // 西
            {lat: 0.0009, lon: -0.0009}   // 北西
        ];
        
        const terrainPoints = [];
        for (const offset of offsets) {
            try {
                const point = await this.getBasicTerrainInfo(
                    lat + offset.lat,
                    lon + offset.lon
                );
                terrainPoints.push(point);
            } catch (error) {
                console.error('周辺地形取得エラー:', error);
            }
        }
        
        return terrainPoints;
    }

    // 地形境界部の検出（新規追加）
    detectTerrainBoundary(terrainPoints) {
        const terrainTypes = new Map();
        
        terrainPoints.forEach((point, index) => {
            // ⭐ 正しいアクセス方法
            if (point?.success && point?.data?.terrain_features?.terrain_classification?.primary_type) {
                const type = point.data.terrain_features.terrain_classification.primary_type;
                console.log(`Point ${index} terrain type:`, type);
                
                if (!terrainTypes.has(type)) {
                    terrainTypes.set(type, []);
                }
                terrainTypes.get(type).push(index);
            } else {
                console.log(`Point ${index} missing terrain classification`, point);
            }
        });
        
        console.log('検出された地形タイプ:', Array.from(terrainTypes.keys()));
        
        if (terrainTypes.size > 1) {
            const types = Array.from(terrainTypes.keys());
            return {
                isBoundary: true,
                types: types,
                description: `${types[0]}と${types[1]}の境界部`
            };
        }
        
        const terrainType = terrainTypes.size > 0 ? Array.from(terrainTypes.keys())[0] : '不明な地形';
        
        return {
            isBoundary: false,
            types: [terrainType],
            description: terrainType
        };
    }

    // 方位角を日本語に変換（新規追加）
    convertToCompassDirection(bearing) {
        const directions = [
            '北', '北北東', '北東', '東北東',
            '東', '東南東', '南東', '南南東',
            '南', '南南西', '南西', '西南西',
            '西', '西北西', '北西', '北北西'
        ];
        
        // bearingを0-360の範囲に正規化
        let normalizedBearing = bearing % 360;
        if (normalizedBearing < 0) normalizedBearing += 360;
        
        const index = Math.round(normalizedBearing / 22.5) % 16;
        return {
            from: directions[(index + 8) % 16], // 180度反対
            to: directions[index]
        };
    }

    // 角度から方位を計算（新規追加）
    calculateBearingFromAngle(angle) {
        // 角度を0-360に正規化
        let normalizedAngle = parseFloat(angle) || 0;
        normalizedAngle = normalizedAngle % 360;
        if (normalizedAngle < 0) normalizedAngle += 360;
        
        const directions = ['北', '北北東', '北東', '東北東', '東', '東南東', '南東', '南南東', 
                           '南', '南南西', '南西', '西南西', '西', '西北西', '北西', '北北西'];
        const index = Math.round(normalizedAngle / 22.5) % 16;
        
        return `${directions[(index + 8) % 16]}から${directions[index]}に向かって`;
    }    

    // ⭐ 線路の立地解析（新規追加）
    analyzeTrackPosition(railwayData, terrainInfo) {
        if (!railwayData) return { type: '不明', description: '' };
        
        // 地形との関係性を判定
        const structureType = railwayData.structure_analysis.type;
        const terrainType = terrainInfo?.data?.terrain_features?.terrain_classification?.primary_type;
        
        // 立地パターンを判定
        let positionType = '不明';
        if (terrainType === '谷底低地') {
            positionType = '谷筋通過型';
        } else if (terrainType === '丘陵地' && structureType === 'cutting') {
            positionType = '丘陵地切土型';
        } else if (terrainType === '台地') {
            positionType = '台地通過型';
        } else if (terrainType === '山地') {
            positionType = '山地通過型';
        }
        
        return {
            type: positionType,
            terrainType: terrainType,
            structureType: structureType
        };
    }

    // ⭐ メインのAI文章生成関数！（新規追加）
    async generateGeomorphologicalReport(data) {
        const { terrainInfo, catchmentAnalysis, trackPosition, railwayData } = data;
        
        // ルールベース or OpenAI API
        if (this.aiConfig.useAPI && this.aiConfig.apiKey) {
            return await this.generateWithOpenAI(data);
        } else {
            return await this.generateWithRules(data);
        }
    }

        // ⭐ ルールベース文章生成（修正版）
        async generateWithRules(data) {
        console.log('');
        console.log('========== 地形解析開始 ==========');
        console.log('1️⃣ 入力データ確認');
        console.log('  緯度:', data.railwayData?.location?.latitude);
        console.log('  経度:', data.railwayData?.location?.longitude);
        
        const { terrainInfo, trackPosition, railwayData } = data;
        
        // ⭐ nullチェックを追加！
        if (!railwayData || !railwayData.location) {
            console.error('❌ 鉄道データがありません！');
            return '<div style="color: red; padding: 20px;">エラー: 先に健全度評価を実行してください。</div>';
        }
        
        // 周辺地形も解析
        console.log('2️⃣ 周辺地形を解析します...');
        const surroundingAnalysis = await this.analyzeSurroundingTerrain(
            railwayData.location.latitude,
            railwayData.location.longitude
        );
        
        
        console.log('3️⃣ 境界判定します...');
        const boundaryInfo = this.detectTerrainBoundary(surroundingAnalysis);
        
        console.log('4️⃣ 結果:', {
            境界あり: boundaryInfo.isBoundary,
            地形: boundaryInfo.description
        });
        console.log('========== 地形解析完了 ==========');
        console.log('');
        
        let html = '<div style="font-size: 14px; line-height: 1.8; color: #333;">';
        
        // 地形・地質セクション
        html += '<h4 style="color: #2a5298; margin-bottom: 10px;">＜地形・地質＞</h4>';
        html += '<p>';
        
        // 線路の方向を詳細に（角度版）← ここを変更！
        const trackAngle = railwayData?.location?.track_direction || '0';
        const trackDirection = this.calculateBearingFromAngle(trackAngle.replace('℃', ''));
        
        // 地形境界部の判定
        if (boundaryInfo.isBoundary) {
            html += `調査対象地は、${boundaryInfo.description}付近を${trackDirection}に向かって`;
        } else {
            html += `調査対象地は、${boundaryInfo.description}を${trackDirection}に向かって`;
        }
        
        // 構造物タイプ
        if (railwayData?.structure_analysis?.type === 'sidehill') {
            html += '片切片盛で通過している区間である。';
        } else if (railwayData?.structure_analysis?.type === 'cutting') {
            html += '切土で通過している区間である。';
        } else if (railwayData?.structure_analysis?.type === 'embankment') {
            html += '盛土で通過している区間である。';
        } else {
            html += '通過する線路敷きである。';
        }
        
        // ⭐ 地質情報を追加！
        html += '<br><br>'; // 段落分け
        
        // 地質情報の詳細
        if (terrainInfo?.data?.geology_data?.available) {
            const geology = terrainInfo.data.geology_data.geology_info;
            const geoFeatures = terrainInfo.data.geology_features;
            
            // undefinedチェックを追加
            let geoDescription = `地質は、${geology.rock_type_ja}`;
            if (geology.lithology_ja && geology.lithology_ja !== 'undefined') {
                geoDescription += `（${geology.lithology_ja}）`;
            }
            geoDescription += `が分布しており、${geology.formation_age_ja}の地層である。`;
            html += geoDescription;
            
            // 岩相の詳細
            if (geology.lithofacies_ja && geology.lithofacies_ja !== 'undefined') {
                html += `岩相は${geology.lithofacies_ja}を示す。`;
            }
            
            // 工学的特性
            if (geoFeatures?.engineering_notes && geoFeatures.engineering_notes.length > 0) {
                html += '<br>工学的特性として、';
                const notes = geoFeatures.engineering_notes.slice(0, 2).join('、'); // 最初の2つ
                html += notes + 'などが挙げられる。';
            }
            
            // 基礎地盤評価
            if (geoFeatures?.foundation_analysis) {
                const foundation = geoFeatures.foundation_analysis;
                html += `<br>基礎地盤としての評価は、支持力${foundation.bearing_capacity}、`;
                html += `沈下特性${foundation.settlement}である。`;
            }
            
        } else {
            html += '地質情報は現地調査により確認が必要である。';
        }
        
        // 地形リスクの記述
        if (GeomorphologyAnalyzer.TERRAIN_CLASSIFICATION[boundaryInfo.description]) {
            const terrainRisk = GeomorphologyAnalyzer.TERRAIN_CLASSIFICATION[boundaryInfo.description].risk;
            html += `<br>当該地形における一般的な留意点として、${terrainRisk}が挙げられる。`;
        }
        
        html += '</p>';
        
        // 立地条件セクション
        html += '<h4 style="color: #2a5298; margin-top: 20px; margin-bottom: 10px;">＜立地条件＞</h4>';
        html += '<p>';
        
        // 構造物の詳細情報を使用
        if (railwayData?.structure_analysis?.type === 'sidehill') {
            const details = railwayData.structure_analysis.details;
            html += `線路敷きの${details.cutting_side_ja}が丘陵地の裾部に接しており、`;
            html += `${details.embankment_side_ja}は平坦部となっている。`;
                } else if (railwayData?.structure_analysis?.type === 'cutting') {
            html += `線路敷きの両側が切土構造となっており、`;
            if (railwayData?.structure_analysis?.details) {
                const details = railwayData.structure_analysis.details;
                // ⭐ undefinedチェックを追加！
                if (details.left_cutting_height !== undefined && details.right_cutting_height !== undefined) {
                    html += `左側切土高${details.left_cutting_height.toFixed(1)}m、右側切土高${details.right_cutting_height.toFixed(1)}mである。`;
                } else {
                    html += `詳細な寸法は現地確認が必要である。`;
                }
            }
        }
        
        // 勾配情報
        if (railwayData?.location?.elevation) {
            html += `評価地点の標高は${railwayData.location.elevation}である。`;
        }
        
        html += '</p>';
        
        // 水文学的リスク（0次谷の警告など）
        if (railwayData?.drainage_impact?.has_zero_order_basin) {
            html += '<h4 style="color: #ff9800; margin-top: 20px; margin-bottom: 10px;">＜水文学的リスク＞</h4>';
            html += '<p style="background: #fff3cd; padding: 10px; border-radius: 5px;">';
            html += '<strong>⚠️ 0次谷が検出されました。</strong>';
            html += '集中豪雨時には局所的な出水の可能性があるため、排水設備の点検強化を推奨します。';
            html += '</p>';
        }
        
        html += '</div>';
        
        return html;
    }

    // ⭐ OpenAI API版（新規追加）
    async generateWithOpenAI(data) {
        // 後で実装
        return '<p>OpenAI API版は準備中です...</p>';
    }
}

// グローバルに公開
window.GeomorphologyAnalyzer = GeomorphologyAnalyzer;