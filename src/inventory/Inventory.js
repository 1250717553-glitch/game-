/**
 * ============================================================
 *  Inventory.js —— 背包系统
 * ============================================================
 *  【这是什么？】
 *  管理玩家背包里的所有物品。
 *  50格，同类物品可堆叠（最多99个/格）。
 *
 *  【怎么用】
 *  inventory.addItem("ling_cao", 3)  // 加3个灵草
 *  inventory.removeItem("ling_cao", 1) // 减1个灵草
 *  inventory.getItemCount("ling_cao")  // 查有几个灵草
 */

class Inventory {
    constructor(maxSlots) {
        this.maxSlots = maxSlots || INVENTORY_CONFIG.maxSlots;  // 默认50格，仓库可以传更大的值
        this.maxStack = INVENTORY_CONFIG.maxStack;  // 默认每格堆叠上限（灵石等货币类用这个）
        // 背包数据：数组，每个元素是 {itemId: "ling_cao", count: 3} 或 null（空格）
        this.slots = new Array(this.maxSlots).fill(null);
    }

    /**
     * 获取指定物品的堆叠上限
     * 灵石等货币类物品：100000
     * 其他材料类物品：99
     */
    getMaxStack(itemId) {
        const item = ITEMS[itemId];
        if (item && item.type === 'currency') {
            return 100000;  // 货币类（灵石）可以叠加10w
        }
        return 99;  // 其他材料都是99
    }

    /**
     * 添加物品
     * @param {string} itemId - 物品ID（对应ITEMS里的key）
     * @param {number} count - 数量
     * @returns {boolean} 是否全部添加成功
     */
    addItem(itemId, count) {
        let remaining = count;
        const itemMaxStack = this.getMaxStack(itemId);

        // 先找已有的同类物品堆叠
        for (let i = 0; i < this.maxSlots && remaining > 0; i++) {
            if (this.slots[i] && this.slots[i].itemId === itemId) {
                const canAdd = itemMaxStack - this.slots[i].count;
                const addAmount = Math.min(canAdd, remaining);
                this.slots[i].count += addAmount;
                remaining -= addAmount;
            }
        }

        // 再找空格放
        for (let i = 0; i < this.maxSlots && remaining > 0; i++) {
            if (!this.slots[i]) {
                const addAmount = Math.min(itemMaxStack, remaining);
                this.slots[i] = { itemId, count: addAmount };
                remaining -= addAmount;
            }
        }

        if (remaining > 0) {
            console.log(`[背包] 空间不足，还有 ${remaining} 个 ${itemId} 没放进去`);
            return false;
        }
        return true;
    }

    /**
     * 移除物品
     * @param {string} itemId
     * @param {number} count
     * @returns {boolean} 是否移除成功
     */
    removeItem(itemId, count) {
        if (this.getItemCount(itemId) < count) {
            console.log(`[背包] ${itemId} 数量不足`);
            return false;
        }

        let remaining = count;
        for (let i = 0; i < this.maxSlots && remaining > 0; i++) {
            if (this.slots[i] && this.slots[i].itemId === itemId) {
                const removeAmount = Math.min(this.slots[i].count, remaining);
                this.slots[i].count -= removeAmount;
                remaining -= removeAmount;
                if (this.slots[i].count <= 0) {
                    this.slots[i] = null;
                }
            }
        }
        return true;
    }

    /**
     * 查询物品数量
     */
    getItemCount(itemId) {
        let total = 0;
        for (const slot of this.slots) {
            if (slot && slot.itemId === itemId) {
                total += slot.count;
            }
        }
        return total;
    }

    /**
     * 获取所有非空格子（用于UI显示）
     */
    getFilledSlots() {
        return this.slots.filter(s => s !== null);
    }

    /**
     * 背包是否有空格
     */
    hasSpace() {
        return this.slots.some(s => s === null);
    }

    /**
     * 整理背包（核心功能）
     * 把相同的物品合并到一起，按堆叠上限分配
     * 比如：灵石有3格，分别是50、80、30，整理后变成1格160（如果没超过上限）
     * 如果超过上限，就放在下一格，以此类推
     */
    sort() {
        // 第一步：统计所有物品的总数（深拷贝，避免引用问题）
        const itemCounts = {};
        let totalItems = 0;
        for (let i = 0; i < this.slots.length; i++) {
            const slot = this.slots[i];
            if (slot && slot.itemId && slot.count > 0) {
                if (!itemCounts[slot.itemId]) {
                    itemCounts[slot.itemId] = 0;
                }
                itemCounts[slot.itemId] += slot.count;
                totalItems += slot.count;
            }
        }

        console.log(`[整理] 统计完成，共 ${Object.keys(itemCounts).length} 种物品，${totalItems} 个`);

        // 第二步：创建新的slots数组
        const newSlots = new Array(this.maxSlots).fill(null);
        let slotIndex = 0;
        let placedItems = 0;

        // 第三步：按物品ID排序，重新放入
        const itemIds = Object.keys(itemCounts).sort();

        for (const itemId of itemIds) {
            let remaining = itemCounts[itemId];
            const itemMaxStack = this.getMaxStack(itemId);

            while (remaining > 0 && slotIndex < this.maxSlots) {
                const addAmount = Math.min(itemMaxStack, remaining);
                newSlots[slotIndex] = { itemId: itemId, count: addAmount };
                remaining -= addAmount;
                placedItems += addAmount;
                slotIndex++;
            }

            if (remaining > 0) {
                console.error(`[整理] 警告：${itemId} 还有 ${remaining} 个放不下！背包空间不足！`);
            }
        }

        // 第四步：验证物品数量是否一致（防止丢失）
        if (placedItems !== totalItems) {
            console.error(`[整理] 严重错误：整理前${totalItems}个，整理后${placedItems}个，丢失了${totalItems - placedItems}个！`);
            // 不替换原数组，防止物品丢失
            return false;
        }

        // 第五步：替换原数组
        this.slots = newSlots;

        console.log(`[整理] 背包整理完成，共 ${itemIds.length} 种物品，${placedItems} 个，使用 ${slotIndex} 格`);
        return true;
    }

    /**
     * 清空背包（调试用）
     */
    clear() {
        this.slots = new Array(this.maxSlots).fill(null);
    }

    /**
     * 导出背包数据（存档用）
     */
    toJSON() {
        return { slots: this.slots };
    }

    /**
     * 导入背包数据（读档用）
     */
    fromJSON(data) {
        if (data && data.slots) {
            // 确保slots长度正确
            if (data.slots.length < this.maxSlots) {
                this.slots = data.slots.concat(new Array(this.maxSlots - data.slots.length).fill(null));
            } else {
                this.slots = data.slots.slice(0, this.maxSlots);
            }
        }
    }
}
