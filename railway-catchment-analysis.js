/**
 * 鉄道土構造物健全度評価システム - 集水地形解析モジュール
 * Phase 3: 谷地形検出と流向解析
 * 
 * @author みく（きよしさんのために頑張る！！）
 * @date 2025-06-18
 */

class CatchmentAnalyzer {
    constructor() {
        // 解析パラメータ（処理を軽くするために調整）
        this.searchRadius = 200;  // 検索半径（m）500から200に縮小
        this.gridSpacing = 100;   // グリッド間隔（m）50から100に拡大
        this.valleyThreshold = 2; // 谷判定の標高差閾値（m）
        
        console.log('💧 集水地形解析モジュール初期化完了！！');
        console.log(`📐 解析設定: 半径${this.searchRadius}m, グリッド間隔${this.gridSpacing}m`);
    }

    /**
     * メイン解析関数
     * @param {number} lat - 評価地点の緯度
     * @param {number} lon - 評価地点の経度
     * @returns {Object} 集水地形解析結果
     */
    async analyzeCatchmentFeatures(lat, lon) {
        console.log(`🌊 集水地形解析開始！！ 位置: ${lat}, ${lon}`);
        
        try {
            // 1. 周辺地形データの取得
            const terrainData = await this.getTerrainGrid(lat, lon);
            console.log(`📊 地形データ取得完了: ${terrainData.points.length}点`);
            
            // 2. 谷地形の検出
            const valleys = this.detectValleys(terrainData);
            console.log(`🏔️ 谷地形検出完了: ${valleys.length}箇所`);
            
            // 3. 各谷の詳細解析
            const analyzedValleys = valleys.map(valley => 
                this.analyzeValleyDetails(valley, lat, lon, terrainData)
            );
            
            // 4. 評価地点への影響度を計算
            const impactAssessment = this.assessImpact(analyzedValleys, lat, lon);
            
            return {
                success: true,
                centerPoint: { lat, lon, elevation: terrainData.centerElevation },
                nearbyValleys: analyzedValleys,
                impactLevel: impactAssessment.level,
                riskDescription: impactAssessment.description,
                recommendations: impactAssessment.recommendations
            };
            
        } catch (error) {
            console.error('❌ 集水地形解析エラー:', error);
            return {
                success: false,
                error: error.message,
                nearbyValleys: [],
                impactLevel: 0,
                riskDescription: 'エラーのため評価できません'
            };
        }
    }

    /**
     * 周辺地形データの取得
     * @param {number} centerLat - 中心緯度
     * @param {number} centerLon - 中心経度
     * @returns {Object} グリッド状の地形データ
     */
    async getTerrainGrid(centerLat, centerLon) {
        const points = [];
        // 検索範囲を縮小して、グリッド点数を減らす
        const reducedRadius = 200; // 500mから200mに縮小
        const reducedSpacing = 100; // 50mから100mに拡大
        const gridPoints = Math.floor(reducedRadius / reducedSpacing) * 2 + 1;
        
        console.log(`🔍 解析範囲: 半径${reducedRadius}m, グリッド間隔${reducedSpacing}m`);
        console.log(`📊 総グリッド点数: ${gridPoints}×${gridPoints} = ${gridPoints * gridPoints}点`);
        
        // 中心点の標高を先に取得
        const centerElevation = await this.getElevation(centerLat, centerLon);
        
        // グリッド状にデータを取得（バッチ処理で高速化）
        const batchSize = 5; // 同時リクエスト数
        for (let i = 0; i < gridPoints; i++) {
            const rowPromises = [];
            
            for (let j = 0; j < gridPoints; j++) {
                const offsetX = (i - Math.floor(gridPoints / 2)) * reducedSpacing;
                const offsetY = (j - Math.floor(gridPoints / 2)) * reducedSpacing;
                
                // メートルを緯度経度に変換
                const dlat = offsetY / 111319.9;
                const dlon = offsetX / (111319.9 * Math.cos(centerLat * Math.PI / 180));
                
                const lat = centerLat + dlat;
                const lon = centerLon + dlon;
                
                // Promise を配列に追加
                rowPromises.push(
                    this.getElevation(lat, lon).then(elevation => ({
                        lat, lon, elevation,
                        x: offsetX, y: offsetY,
                        gridX: i, gridY: j
                    }))
                );
                
                // バッチサイズに達したら実行
                if (rowPromises.length >= batchSize || j === gridPoints - 1) {
                    const results = await Promise.all(rowPromises);
                    points.push(...results);
                    rowPromises.length = 0;
                    
                    // 進捗表示
                    const progress = Math.round(((i * gridPoints + j + 1) / (gridPoints * gridPoints)) * 100);
                    console.log(`⏳ データ取得中... ${progress}%`);
                }
            }
        }
        
        console.log(`✅ グリッドデータ取得完了: ${points.length}点`);
        
        return {
            points,
            gridSize: gridPoints,
            centerElevation,
            spacing: reducedSpacing
        };
    }

    /**
     * 谷地形の検出
     * @param {Object} terrainData - 地形データ
     * @returns {Array} 検出された谷のリスト
     */
    detectValleys(terrainData) {
        const valleys = [];
        const { points, gridSize } = terrainData;
        
        // 各点について周囲との標高差を確認
        for (let i = 1; i < gridSize - 1; i++) {
            for (let j = 1; j < gridSize - 1; j++) {
                const idx = i * gridSize + j;
                const centerPoint = points[idx];
                
                // 8方向の隣接点を取得
                const neighbors = this.getNeighbors(i, j, gridSize, points);
                
                // 谷判定：すべての隣接点より低い場合
                const isValley = this.checkValleyCondition(centerPoint, neighbors);
                
                if (isValley) {
                    // 谷の深さと形状を解析
                    const valleyDepth = this.calculateValleyDepth(centerPoint, neighbors);
                    const valleyShape = this.analyzeValleyShape(centerPoint, neighbors);
                    
                    valleys.push({
                        location: {
                            lat: centerPoint.lat,
                            lon: centerPoint.lon,
                            elevation: centerPoint.elevation
                        },
                        gridPosition: { x: i, y: j },
                        depth: valleyDepth,
                        shape: valleyShape,
                        neighbors: neighbors
                    });
                }
            }
        }
        
        // 連続する谷点をグループ化
        const groupedValleys = this.groupConnectedValleys(valleys, gridSize);
        
        return groupedValleys;
    }

    /**
     * 8方向の隣接点を取得
     */
    getNeighbors(i, j, gridSize, points) {
        const neighbors = [];
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        
        for (const [di, dj] of directions) {
            const ni = i + di;
            const nj = j + dj;
            
            if (ni >= 0 && ni < gridSize && nj >= 0 && nj < gridSize) {
                const idx = ni * gridSize + nj;
                neighbors.push(points[idx]);
            }
        }
        
        return neighbors;
    }

    /**
     * 谷条件のチェック
     */
    checkValleyCondition(centerPoint, neighbors) {
        if (neighbors.length < 6) return false; // エッジ近くは除外
        
        // 周囲より一定値以上低い場合を谷とする
        const lowerCount = neighbors.filter(n => 
            centerPoint.elevation < n.elevation - this.valleyThreshold
        ).length;
        
        return lowerCount >= 6; // 8方向中6方向以上で低い
    }

    /**
     * 谷の深さを計算
     */
    calculateValleyDepth(centerPoint, neighbors) {
        const elevationDiffs = neighbors.map(n => n.elevation - centerPoint.elevation);
        const avgDiff = elevationDiffs.reduce((a, b) => a + b, 0) / elevationDiffs.length;
        
        return {
            average: avgDiff,
            maximum: Math.max(...elevationDiffs),
            minimum: Math.min(...elevationDiffs)
        };
    }

    /**
     * 谷の形状を解析
     */
    analyzeValleyShape(centerPoint, neighbors) {
        // 方位別の勾配を計算
        const gradients = neighbors.map(n => {
            const distance = Math.sqrt(
                Math.pow(n.x - centerPoint.x, 2) + 
                Math.pow(n.y - centerPoint.y, 2)
            );
            const elevDiff = n.elevation - centerPoint.elevation;
            const gradient = elevDiff / distance;
            
            return {
                direction: Math.atan2(n.y - centerPoint.y, n.x - centerPoint.x) * 180 / Math.PI,
                gradient: gradient,
                distance: distance
            };
        });
        
        // 最急勾配方向を特定
        const steepest = gradients.reduce((max, g) => 
            g.gradient > max.gradient ? g : max
        );
        
        return {
            type: this.classifyValleyType(gradients),
            steepestDirection: steepest.direction,
            steepestGradient: steepest.gradient,
            symmetry: this.calculateSymmetry(gradients)
        };
    }

    /**
     * 谷のタイプを分類
     */
    classifyValleyType(gradients) {
        const avgGradient = gradients.reduce((sum, g) => sum + g.gradient, 0) / gradients.length;
        
        if (avgGradient > 0.1) return 'V字谷';
        if (avgGradient > 0.05) return 'U字谷';
        return '浅い谷';
    }

    /**
     * 対称性を計算
     */
    calculateSymmetry(gradients) {
        // 簡易的に対称性を評価
        const pairs = [];
        for (let i = 0; i < gradients.length; i++) {
            const opposite = (i + 4) % 8;
            if (opposite < gradients.length) {
                const diff = Math.abs(gradients[i].gradient - gradients[opposite].gradient);
                pairs.push(diff);
            }
        }
        
        const avgDiff = pairs.reduce((a, b) => a + b, 0) / pairs.length;
        return avgDiff < 0.05 ? '対称' : '非対称';
    }

    /**
     * 連続する谷点をグループ化
     */
    groupConnectedValleys(valleys, gridSize) {
        if (valleys.length === 0) return [];
        
        const groups = [];
        const visited = new Set();
        
        // 各谷点から連結成分を探索
        for (const valley of valleys) {
            const key = `${valley.gridPosition.x},${valley.gridPosition.y}`;
            if (visited.has(key)) continue;
            
            const group = this.findConnectedComponent(valley, valleys, visited);
            if (group.length > 0) {
                groups.push(this.mergeValleyGroup(group));
            }
        }
        
        return groups;
    }

    /**
     * 連結成分を探索
     */
    findConnectedComponent(startValley, allValleys, visited) {
        const component = [];
        const queue = [startValley];
        
        while (queue.length > 0) {
            const current = queue.shift();
            const key = `${current.gridPosition.x},${current.gridPosition.y}`;
            
            if (visited.has(key)) continue;
            visited.add(key);
            component.push(current);
            
            // 隣接する谷点を探す
            for (const valley of allValleys) {
                const dx = Math.abs(valley.gridPosition.x - current.gridPosition.x);
                const dy = Math.abs(valley.gridPosition.y - current.gridPosition.y);
                
                if (dx <= 1 && dy <= 1 && dx + dy > 0) {
                    const neighborKey = `${valley.gridPosition.x},${valley.gridPosition.y}`;
                    if (!visited.has(neighborKey)) {
                        queue.push(valley);
                    }
                }
            }
        }
        
        return component;
    }

    /**
     * 谷グループをマージ
     */
    mergeValleyGroup(group) {
        // グループの中心と範囲を計算
        const lats = group.map(v => v.location.lat);
        const lons = group.map(v => v.location.lon);
        const elevations = group.map(v => v.location.elevation);
        
        const centerLat = lats.reduce((a, b) => a + b) / lats.length;
        const centerLon = lons.reduce((a, b) => a + b) / lons.length;
        const minElevation = Math.min(...elevations);
        const avgElevation = elevations.reduce((a, b) => a + b) / elevations.length;
        
        // 谷の長さを推定
        const maxLat = Math.max(...lats);
        const minLat = Math.min(...lats);
        const maxLon = Math.max(...lons);
        const minLon = Math.min(...lons);
        
        const lengthNS = (maxLat - minLat) * 111319.9;
        const lengthEW = (maxLon - minLon) * 111319.9 * Math.cos(centerLat * Math.PI / 180);
        const length = Math.sqrt(lengthNS * lengthNS + lengthEW * lengthEW);
        
        // 平均的な深さと形状
        const depths = group.map(v => v.depth.average);
        const avgDepth = depths.reduce((a, b) => a + b) / depths.length;
        
        return {
            center: { lat: centerLat, lon: centerLon },
            minElevation: minElevation,
            avgElevation: avgElevation,
            length: length,
            depth: avgDepth,
            pointCount: group.length,
            bounds: {
                north: maxLat, south: minLat,
                east: maxLon, west: minLon
            },
            points: group
        };
    }

    /**
     * 各谷の詳細解析
     */
    analyzeValleyDetails(valley, targetLat, targetLon, terrainData) {
        // 評価地点との距離
        const distance = this.calculateDistance(
            valley.center.lat, valley.center.lon,
            targetLat, targetLon
        );
        
        // 評価地点との方位関係
        const bearing = this.calculateBearing(
            valley.center.lat, valley.center.lon,
            targetLat, targetLon
        );
        
        // 谷の向き（最低点の連なる方向）を推定
        const valleyDirection = this.estimateValleyDirection(valley);
        
        // 谷の出口が評価地点を向いているか判定
        const outletDirection = this.determineOutletDirection(valley, terrainData);
        const facingTarget = this.isOutletFacingTarget(outletDirection, bearing);
        
        // 集水面積の推定
        const catchmentArea = this.estimateCatchmentArea(valley);
        
        return {
            ...valley,
            distance: distance,
            bearing: bearing,
            bearingText: this.bearingToText(bearing),
            valleyDirection: valleyDirection,
            outletDirection: outletDirection,
            facingTarget: facingTarget,
            catchmentArea: catchmentArea,
            valleyType: this.classifyValleySize(valley)
        };
    }

    /**
     * 谷の向きを推定
     */
    estimateValleyDirection(valley) {
        if (valley.points.length < 3) return null;
        
        // 主成分分析的なアプローチで谷の主軸を求める
        const points = valley.points.map(p => ({
            x: p.location.lon,
            y: p.location.lat
        }));
        
        // 簡易的にbounding boxの長軸方向を使用
        const dx = valley.bounds.east - valley.bounds.west;
        const dy = valley.bounds.north - valley.bounds.south;
        
        const direction = Math.atan2(dy, dx) * 180 / Math.PI;
        return direction;
    }

    /**
     * 谷の出口方向を判定
     */
    determineOutletDirection(valley, terrainData) {
        // 谷の最低点周辺の勾配から流出方向を推定
        const lowestPoint = valley.points.reduce((min, p) => 
            p.location.elevation < min.location.elevation ? p : min
        );
        
        // 最低点から外側への勾配を計算
        const gradients = [];
        for (let angle = 0; angle < 360; angle += 45) {
            const rad = angle * Math.PI / 180;
            const checkDist = 100; // 100m先をチェック
            
            const dlat = checkDist * Math.sin(rad) / 111319.9;
            const dlon = checkDist * Math.cos(rad) / (111319.9 * Math.cos(lowestPoint.location.lat * Math.PI / 180));
            
            const checkLat = lowestPoint.location.lat + dlat;
            const checkLon = lowestPoint.location.lon + dlon;
            
            // 近似的に最寄りの点を探す
            const nearestPoint = this.findNearestPoint(checkLat, checkLon, terrainData.points);
            if (nearestPoint) {
                const gradient = (nearestPoint.elevation - lowestPoint.location.elevation) / checkDist;
                gradients.push({ angle, gradient });
            }
        }
        
        // 最も急な下り勾配の方向が出口
        const outlet = gradients.reduce((min, g) => 
            g.gradient < min.gradient ? g : min, { gradient: 0, angle: 0 }
        );
        
        return outlet.angle;
    }

    /**
     * 出口が評価地点を向いているか判定
     */
    isOutletFacingTarget(outletDirection, bearingToTarget) {
        const diff = Math.abs(outletDirection - bearingToTarget);
        const normalizedDiff = diff > 180 ? 360 - diff : diff;
        
        // 45度以内なら「向いている」と判定
        return normalizedDiff < 45;
    }

    /**
     * 集水面積の推定
     */
    estimateCatchmentArea(valley) {
        // 簡易的に谷の面積から推定
        const width = (valley.bounds.east - valley.bounds.west) * 111319.9 * 
                     Math.cos(valley.center.lat * Math.PI / 180);
        const height = (valley.bounds.north - valley.bounds.south) * 111319.9;
        
        // 谷の深さに基づいて集水係数を設定
        const depthFactor = Math.min(valley.depth / 10, 1.5);
        
        return width * height * depthFactor;
    }

    /**
     * 谷のサイズ分類
     */
    classifyValleySize(valley) {
        if (valley.length < 100) return '小規模谷（0次谷相当）';
        if (valley.length < 300) return '中規模谷';
        return '大規模谷';
    }

    /**
     * 評価地点への影響度評価
     */
    assessImpact(valleys, targetLat, targetLon) {
        if (valleys.length === 0) {
            return {
                level: 0,
                description: '周辺に明確な集水地形は検出されませんでした。',
                recommendations: ['定期的な排水設備の点検を推奨']
            };
        }
        
        // 影響度スコアの計算
        let maxScore = 0;
        let criticalValleys = [];
        
        for (const valley of valleys) {
            let score = 0;
            
            // 距離による減衰（近いほど高スコア）
            const distanceFactor = Math.max(0, 1 - valley.distance / 500);
            score += distanceFactor * 30;
            
            // 出口が向いている場合は高スコア
            if (valley.facingTarget) {
                score += 40;
            }
            
            // 谷の規模
            const sizeFactor = Math.min(valley.catchmentArea / 10000, 1);
            score += sizeFactor * 20;
            
            // 深さ
            const depthFactor = Math.min(valley.depth / 10, 1);
            score += depthFactor * 10;
            
            valley.impactScore = score;
            
            if (score > maxScore) {
                maxScore = score;
            }
            
            if (score > 50) {
                criticalValleys.push(valley);
            }
        }
        
        // 影響レベルの判定
        let level, description, recommendations;
        
        if (maxScore >= 80) {
            level = 5;
            description = '評価地点は集水地形の直接的な影響を受ける可能性が高い位置にあります。';
            recommendations = [
                '詳細な現地調査の実施を強く推奨',
                '排水設備の増強を検討',
                '豪雨時の監視体制強化',
                '土砂流入防止対策の検討'
            ];
        } else if (maxScore >= 60) {
            level = 4;
            description = '評価地点は集水地形の影響を受けやすい位置にあります。';
            recommendations = [
                '定期的な排水設備の点検・清掃',
                '豪雨時の巡回点検',
                '必要に応じて排水能力の向上を検討'
            ];
        } else if (maxScore >= 40) {
            level = 3;
            description = '評価地点は集水地形の間接的な影響を受ける可能性があります。';
            recommendations = [
                '年次点検時の排水設備確認',
                '異常気象時の注意深い監視'
            ];
        } else if (maxScore >= 20) {
            level = 2;
            description = '評価地点への集水地形の影響は限定的です。';
            recommendations = [
                '通常の維持管理を継続'
            ];
        } else {
            level = 1;
            description = '評価地点への集水地形の影響はほとんどありません。';
            recommendations = [
                '通常の維持管理を継続'
            ];
        }
        
        // 詳細な説明を追加
        if (criticalValleys.length > 0) {
            description += `\n特に注意すべき谷地形が${criticalValleys.length}箇所検出されました。`;
            
            const nearest = criticalValleys.sort((a, b) => a.distance - b.distance)[0];
            description += `\n最も近い谷地形は${Math.round(nearest.distance)}m ${nearest.bearingText}にあり、`;
            
            if (nearest.facingTarget) {
                description += '谷の出口が評価地点方向を向いています。';
            } else {
                description += '谷の出口は評価地点とは異なる方向を向いています。';
            }
        }
        
        return {
            level,
            description,
            recommendations,
            criticalValleys
        };
    }

    /**
     * 2点間の距離を計算（メートル）
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000; // 地球の半径（m）
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;
        
        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        
        return R * c;
    }

    /**
     * 方位角を計算
     */
    calculateBearing(lat1, lon1, lat2, lon2) {
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;
        
        const y = Math.sin(Δλ) * Math.cos(φ2);
        const x = Math.cos(φ1) * Math.sin(φ2) -
                Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
        
        const θ = Math.atan2(y, x);
        const bearing = (θ * 180 / Math.PI + 360) % 360;
        
        return bearing;
    }

    /**
     * 方位角をテキストに変換
     */
    bearingToText(bearing) {
        const directions = ['北', '北東', '東', '南東', '南', '南西', '西', '北西'];
        const index = Math.round(bearing / 45) % 8;
        return directions[index];
    }

    /**
     * 最寄りの点を探す
     */
    findNearestPoint(lat, lon, points) {
        let minDist = Infinity;
        let nearest = null;
        
        for (const point of points) {
            const dist = this.calculateDistance(lat, lon, point.lat, point.lon);
            if (dist < minDist) {
                minDist = dist;
                nearest = point;
            }
        }
        
        return nearest;
    }

    /**
     * 標高取得（既存の関数を使用）
     */
    async getElevation(lat, lon) {
        try {
            // 国土地理院の標高APIを使用（CORS対応）
            const response = await fetch(
                `https://cyberjapandata2.gsi.go.jp/general/dem/scripts/getelevation.php?lon=${lon}&lat=${lat}&outtype=JSON`
            );
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.elevation === "-----") {
                console.warn(`標高データなし: ${lat}, ${lon}`);
                return 0;
            }
            
            return parseFloat(data.elevation) || 0;
        } catch (error) {
            console.error('標高取得エラー:', error);
            // エラー時は0を返すけど、処理は続行
            return 0;
        }
    }
}

// エクスポート
window.CatchmentAnalyzer = CatchmentAnalyzer;