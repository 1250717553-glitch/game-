/**
 * ============================================================
 *  SaveSystem.js —— 存档系统
 * ============================================================
 *  【这是什么？】
 *  用浏览器的 localStorage 保存游戏进度。
 *  支持3个存档位，登录界面可以选择。
 *
 *  【保存什么】
 *  - 玩家属性（气血、灵气、寿元、境界、等级、经验）
 *  - 背包物品
 *  - 仓库物品
 *  - 农田状态
 *  - 已学技能、当前功法
 */

const SAVE_KEY_PREFIX = "xiuxian_save_";  // 存档key前缀

class SaveSystem {
    /**
     * 保存到指定存档位
     * @param {string} slotKey - 存档位key，如 "xiuxian_save_1"
     * @param {object} player - 玩家对象
     * @param {Inventory} inventory - 背包
     * @param {Inventory} storage - 仓库
     * @param {array} farmTiles - 农田状态
     */
    static saveToSlot(slotKey, player, inventory, storage, farmTiles) {
        const saveData = {
            playerName: player.playerName || '道友',  // 玩家名字
            hp: player.hp,
            maxHp: player.maxHp,
            qi: player.qi,
            maxQi: player.maxQi,
            lifespan: player.lifespan,
            realm: player.realm,
            realmLevel: player.realmLevel || 1,
            exp: player.exp,
            expToLevelUp: player.expToLevelUp,
            level: player.level,
            levelExp: player.levelExp,
            manual: player.manual,
            skills: player.skills,
            learnedManuals: player.learnedManuals,
            equippedSkills: player.equippedSkills || ['slash'],
            manualProficiency: player.manualProficiency,
            skillProficiency: player.skillProficiency,
            refiningLevel: player.refiningLevel,
            refiningExp: player.refiningExp,
            contribution: player.contribution || 0,  // 宗门贡献
            inventory: inventory.toJSON(),
            storage: storage.toJSON(),
            farmTiles: farmTiles,
            saveTime: Date.now()
        };

        try {
            localStorage.setItem(slotKey, JSON.stringify(saveData));
            console.log(`[存档] 已保存到 ${slotKey}`);
            return true;
        } catch (e) {
            console.error('[存档] 保存失败:', e);
            return false;
        }
    }

    /**
     * 从指定存档位读取
     * @param {string} slotKey - 存档位key
     * @returns {object|null} 存档数据
     */
    static loadFromSlot(slotKey) {
        try {
            const data = localStorage.getItem(slotKey);
            if (!data) {
                console.log(`[读档] ${slotKey} 没有存档`);
                return null;
            }
            const saveData = JSON.parse(data);
            console.log(`[读档] 从 ${slotKey} 读取，保存时间:`, new Date(saveData.saveTime).toLocaleString());
            return saveData;
        } catch (e) {
            console.error('[读档] 读取失败:', e);
            return null;
        }
    }

    /**
     * 检查指定存档位是否有存档
     */
    static hasSave(slotKey) {
        return localStorage.getItem(slotKey) !== null;
    }

    /**
     * 删除指定存档
     */
    static deleteSave(slotKey) {
        localStorage.removeItem(slotKey);
        console.log(`[存档] ${slotKey} 已删除`);
    }

    /**
     * 获取所有存档位信息（登录界面用）
     */
    static getAllSaves() {
        const saves = [];
        for (let i = 1; i <= 3; i++) {
            const slotKey = `${SAVE_KEY_PREFIX}${i}`;
            const data = this.loadFromSlot(slotKey);
            saves.push({
                slot: i,
                slotKey: slotKey,
                hasData: data !== null,
                data: data
            });
        }
        return saves;
    }
}
