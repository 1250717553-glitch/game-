/**
 * ============================================================
 *  FarmManager.js —— 种田系统管理器（重制版）
 * ============================================================
 *  【这是什么？】
 *  管理农田的所有逻辑：种植、生长、成熟、收获、升级。
 *  支持两套独立农田：
 *    - 洞府灵田：可升级品质和数量，初始4块，最多36块
 *    - 宗门灵田：固定16块，蓝色品质，不可升级
 *
 *  【生长阶段】
 *  每种植物分4个生长阶段，每个阶段对应一张贴图：
 *    0 - 播种期（刚种下种子）
 *    1 - 幼苗期（发芽）
 *    2 - 成长期（枝叶舒展）
 *    3 - 成熟期（可收获）
 *
 *  【怎么用】
 *  const farm = new FarmManager(scene, player);
 *  farm.init();                    // 初始化两套农田
 *  farm.plant('dongfu', seedKey);  // 在洞府种植
 *  farm.plant('sect', seedKey);    // 在宗门种植
 *  farm.harvest('dongfu');         // 收获洞府成熟作物
 *  farm.harvest('sect');           // 收获宗门成熟作物
 *  farm.update(time);               // 每帧更新生长
 */

class FarmManager {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;

        // 洞府灵田数据
        this.dongfu = {
            tiles: [],           // 农田格子数组
            quality: 1,          // 品质等级（1白 2绿 3蓝 4黄 5橙 6红）
            tileCount: 4,        // 当前农田数量（初始4块）
            maxTileCount: 36     // 最大农田数量
        };

        // 宗门灵田数据（固定16块，蓝色品质，不可升级）
        this.sect = {
            tiles: [],
            quality: 3,          // 蓝色品质
            tileCount: 16,
            maxTileCount: 16
        };

        // 品质配置
        this.QUALITY_CONFIG = {
            1: { name: '凡品', color: '#999999', growSpeed: 1.0 },
            2: { name: '良品', color: '#4caf50', growSpeed: 1.1 },
            3: { name: '上品', color: '#2196f3', growSpeed: 1.2 },
            4: { name: '极品', color: '#ffc107', growSpeed: 1.3 },
            5: { name: '仙品', color: '#ff9800', growSpeed: 1.5 },
            6: { name: '神品', color: '#f44336', growSpeed: 2.0 }
        };

        // 农田数量升级配置（4→9→16→25→36，都是完全平方数，方便排列）
        this.TILE_COUNT_UPGRADES = [
            { from: 4, to: 9, cost: { ling_cao: 10 } },
            { from: 9, to: 16, cost: { ling_cao: 30, ling_dao: 10 } },
            { from: 16, to: 25, cost: { ling_cao: 50, ling_dao: 30, ling_cha: 10 } },
            { from: 25, to: 36, cost: { ling_cao: 100, ling_dao: 50, ling_cha: 30 } }
        ];

        // 品质升级配置（后续完善，暂时占位）
        this.QUALITY_UPGRADES = [
            { from: 1, to: 2, cost: {} },  // 待定
            { from: 2, to: 3, cost: {} },
            { from: 3, to: 4, cost: {} },
            { from: 4, to: 5, cost: {} },
            { from: 5, to: 6, cost: {} }
        ];

        // 植物贴图key映射（种子key前缀 + 阶段）
        this.PLANT_TEXTURE_MAP = {
            'ling_cao_seed': { 0: 'lingcao_seed', 1: 'lingcao_sprout', 2: 'lingcao_grow', 3: 'lingcao_mature' },
            'ling_dao_seed': { 0: 'lingdao_seed', 1: 'lingdao_sprout', 2: 'lingdao_grow', 3: 'lingdao_mature' },
            'ling_cha_seed': { 0: 'lingcha_seed', 1: 'lingcha_sprout', 2: 'lingcha_grow', 3: 'lingcha_mature' }
        };
    }

    /**
     * 初始化两套农田
     */
    init() {
        // 初始化洞府灵田
        this.dongfu.tiles = [];
        for (let i = 0; i < this.dongfu.tileCount; i++) {
            this.dongfu.tiles.push(this.createEmptyTile());
        }

        // 初始化宗门灵田
        this.sect.tiles = [];
        for (let i = 0; i < this.sect.tileCount; i++) {
            this.sect.tiles.push(this.createEmptyTile());
        }
    }

    /**
     * 创建一个空的农田格子
     */
    createEmptyTile() {
        return {
            state: 'empty',       // empty / growing / mature
            seed: null,            // 种子key
            plantTime: 0,          // 种植时间
            stage: 0               // 当前生长阶段（0-3）
        };
    }

    /**
     * 获取指定类型的农田数据
     * @param {string} type - 'dongfu' 或 'sect'
     */
    getFarmData(type) {
        return type === 'dongfu' ? this.dongfu : this.sect;
    }

    /**
     * 种植
     * @param {string} type - 'dongfu' 或 'sect'
     * @param {string} seedKey - 种子ID
     * @param {number} tileIndex - 指定格子索引（可选，不指定则找第一个空地）
     * @returns {boolean} 是否种植成功
     */
    plant(type, seedKey, tileIndex = -1) {
        const farm = this.getFarmData(type);
        let tile = null;

        if (tileIndex >= 0 && tileIndex < farm.tiles.length) {
            // 指定格子
            tile = farm.tiles[tileIndex];
            if (tile.state !== 'empty') {
                this.scene.showToast('这块田已经种了东西！');
                return false;
            }
        } else {
            // 找第一个空地
            tile = farm.tiles.find(t => t.state === 'empty');
            if (!tile) {
                this.scene.showToast('没有空地了！先收获成熟的作物');
                return false;
            }
        }

        tile.state = 'growing';
        tile.plantTime = this.scene.time.now;
        tile.seed = seedKey;
        tile.stage = 0;

        const seed = SEEDS[seedKey];
        const farmName = type === 'dongfu' ? '洞府' : '宗门';
        this.scene.showToast(`【${farmName}灵田】种下了${seed.name}，${Math.ceil(seed.growTime / 1000)}秒后成熟`);

        return true;
    }

    /**
     * 收获指定格子的成熟作物
     * @param {string} type - 'dongfu' 或 'sect'
     * @param {number} tileIndex - 格子索引
     * @returns {boolean} 是否收获成功
     */
    harvestTile(type, tileIndex) {
        const farm = this.getFarmData(type);
        if (tileIndex < 0 || tileIndex >= farm.tiles.length) return false;

        const tile = farm.tiles[tileIndex];
        if (tile.state !== 'mature' || !tile.seed) return false;

        const seed = SEEDS[tile.seed];
        const amount = seed.amount;

        if (this.player.inventory.addItem(seed.harvest, amount)) {
            tile.state = 'empty';
            tile.seed = null;
            tile.plantTime = 0;
            tile.stage = 0;

            this.player.gainLevelExp(LEVEL_SYSTEM.farmExp);
            this.scene.showToast(`收获了 ${ITEMS[seed.harvest].name} x${amount}`);
            return true;
        } else {
            this.scene.showToast('背包已满，无法收获！');
            return false;
        }
    }

    /**
     * 收获所有成熟作物
     * @param {string} type - 'dongfu' 或 'sect'
     * @returns {object} 收获的物品 {itemId: count}
     */
    harvest(type) {
        const farm = this.getFarmData(type);
        let count = 0;
        let itemsGained = {};

        farm.tiles.forEach(tile => {
            if (tile.state === 'mature' && tile.seed) {
                const seed = SEEDS[tile.seed];
                const amount = seed.amount;

                if (this.player.inventory.addItem(seed.harvest, amount)) {
                    tile.state = 'empty';
                    tile.seed = null;
                    tile.plantTime = 0;
                    tile.stage = 0;
                    count++;
                    itemsGained[seed.harvest] = (itemsGained[seed.harvest] || 0) + amount;
                }
            }
        });

        if (count > 0) {
            this.player.gainLevelExp(LEVEL_SYSTEM.farmExp * count);

            const farmName = type === 'dongfu' ? '洞府' : '宗门';
            let msg = `【${farmName}灵田】收获了 ${count} 块田！获得：`;
            for (const [itemId, num] of Object.entries(itemsGained)) {
                msg += `${ITEMS[itemId].name}x${num} `;
            }
            this.scene.showToast(msg);
            return itemsGained;
        } else {
            this.scene.showToast('还没有成熟的作物，或背包已满');
            return null;
        }
    }

    /**
     * 每帧更新生长状态
     * @param {number} time - 当前时间
     */
    update(time) {
        // 更新洞府灵田
        this.updateFarmGrowth(this.dongfu, time);
        // 更新宗门灵田
        this.updateFarmGrowth(this.sect, time);
    }

    /**
     * 更新一套农田的生长状态
     */
    updateFarmGrowth(farm, time) {
        const qualityConfig = this.QUALITY_CONFIG[farm.quality] || this.QUALITY_CONFIG[1];
        const growSpeed = qualityConfig.growSpeed;

        farm.tiles.forEach(tile => {
            if (tile.state === 'growing' && tile.seed) {
                const seed = SEEDS[tile.seed];
                const elapsed = (time - tile.plantTime) * growSpeed;
                const progress = Math.min(elapsed / seed.growTime, 1);

                // 计算当前阶段（0-3）
                const newStage = Math.min(Math.floor(progress * 4), 3);

                if (newStage !== tile.stage) {
                    tile.stage = newStage;
                }

                // 成熟了
                if (progress >= 1 && tile.state !== 'mature') {
                    tile.state = 'mature';
                    tile.stage = 3;
                }
            }
        });
    }

    /**
     * 获取植物当前阶段的贴图key
     * @param {string} seedKey - 种子key
     * @param {number} stage - 阶段（0-3）
     * @returns {string} 贴图key
     */
    getPlantTexture(seedKey, stage) {
        const map = this.PLANT_TEXTURE_MAP[seedKey];
        if (!map) return null;
        return map[stage] || map[0];
    }

    /**
     * 获取农田状态统计
     * @param {string} type - 'dongfu' 或 'sect'
     */
    getStats(type) {
        const farm = this.getFarmData(type);
        let empty = 0, growing = 0, mature = 0;
        farm.tiles.forEach(t => {
            if (t.state === 'empty') empty++;
            else if (t.state === 'growing') growing++;
            else if (t.state === 'mature') mature++;
        });
        return { empty, growing, mature, total: farm.tiles.length };
    }

    /**
     * 升级洞府灵田数量
     * @returns {boolean} 是否升级成功
     */
    upgradeDongfuTileCount() {
        const upgrade = this.TILE_COUNT_UPGRADES.find(u => u.from === this.dongfu.tileCount);
        if (!upgrade) {
            this.scene.showToast('农田数量已达上限！');
            return false;
        }

        // 检查材料（暂时只检查，后续完善材料消耗）
        for (const [itemId, amount] of Object.entries(upgrade.cost)) {
            const have = this.player.inventory.getItemCount(itemId);
            if (have < amount) {
                this.scene.showToast(`材料不足！需要 ${ITEMS[itemId].name} x${amount}，当前 ${have}`);
                return false;
            }
        }

        // 消耗材料
        for (const [itemId, amount] of Object.entries(upgrade.cost)) {
            this.player.inventory.removeItem(itemId, amount);
        }

        // 增加农田格子
        const addCount = upgrade.to - upgrade.from;
        for (let i = 0; i < addCount; i++) {
            this.dongfu.tiles.push(this.createEmptyTile());
        }
        this.dongfu.tileCount = upgrade.to;

        this.scene.showToast(`洞府灵田扩建成功！现在有 ${this.dongfu.tileCount} 块田`);
        return true;
    }

    /**
     * 获取下一次农田数量升级的信息
     */
    getNextTileCountUpgrade() {
        return this.TILE_COUNT_UPGRADES.find(u => u.from === this.dongfu.tileCount) || null;
    }

    /**
     * 导出数据（存档用）
     */
    toJSON() {
        return {
            dongfu: {
                tiles: this.dongfu.tiles,
                quality: this.dongfu.quality,
                tileCount: this.dongfu.tileCount
            },
            sect: {
                tiles: this.sect.tiles,
                quality: this.sect.quality,
                tileCount: this.sect.tileCount
            }
        };
    }

    /**
     * 导入数据（读档用）
     */
    fromJSON(data) {
        if (!data) return;

        if (data.dongfu) {
            this.dongfu.tiles = data.dongfu.tiles || [];
            this.dongfu.quality = data.dongfu.quality || 1;
            this.dongfu.tileCount = data.dongfu.tileCount || 4;
            // 确保格子数量正确
            while (this.dongfu.tiles.length < this.dongfu.tileCount) {
                this.dongfu.tiles.push(this.createEmptyTile());
            }
        }

        if (data.sect) {
            this.sect.tiles = data.sect.tiles || [];
            this.sect.quality = data.sect.quality || 3;
            this.sect.tileCount = data.sect.tileCount || 16;
            while (this.sect.tiles.length < this.sect.tileCount) {
                this.sect.tiles.push(this.createEmptyTile());
            }
        }
    }
}
