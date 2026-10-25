/**
 * ============================================================
 *  UIPanelManager.js —— 水墨风UI面板管理器
 * ============================================================
 *  【这是什么？】
 *  管理游戏中的HTML UI面板（任务、背包、地图）。
 *  面板布局由用户在UI设计器中编辑，这里负责显示内容。
 *
 *  【功能】
 *  1. 显示/隐藏UI面板
 *  2. 动态生成背包格子（显示物品图标、数量、品级颜色）
 *  3. 更新任务面板内容
 */

class UIPanelManager {
    /**
     * 初始化UI面板
     * @param {Phaser.Scene} scene - 游戏场景
     * @param {Player} player - 玩家对象
     */
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;

        // 获取面板元素
        this.questPanel = document.getElementById('panel-quest');
        this.inventoryPanel = document.getElementById('panel-inventory');
        this.mapPanel = document.getElementById('panel-map');
        this.invGrid = document.getElementById('inv-grid');

        console.log('[UI面板] 初始化完成');
    }

    /**
     * 显示所有UI面板
     */
    show() {
        if (this.questPanel) this.questPanel.style.display = 'block';
        if (this.inventoryPanel) this.inventoryPanel.style.display = 'block';
        // 地图面板用户编辑时width为0，保持隐藏
        // if (this.mapPanel) this.mapPanel.style.display = 'block';
        this.updateInventory();
    }

    /**
     * 隐藏所有UI面板
     */
    hide() {
        if (this.questPanel) this.questPanel.style.display = 'none';
        if (this.inventoryPanel) this.inventoryPanel.style.display = 'none';
        if (this.mapPanel) this.mapPanel.style.display = 'none';
    }

    /**
     * 更新背包面板
     */
    updateInventory() {
        if (!this.invGrid || !this.player) return;

        // 清空格子
        this.invGrid.innerHTML = '';

        // 获取背包格子数据
        const slots = this.player.inventory.slots || [];

        // 生成50个格子
        const totalSlots = 50;
        for (let i = 0; i < totalSlots; i++) {
            const slot = document.createElement('div');
            slot.className = 'inv-slot';

            const slotData = slots[i];
            if (slotData && slotData.itemId) {
                const itemData = ITEMS[slotData.itemId];
                if (itemData) {
                    // 品级颜色
                    slot.classList.add(`quality-${itemData.quality || 1}`);

                    // 物品图标（用base64图片）
                    const iconKey = itemData.icon || 'icon_herb';
                    if (window.ITEM_IMAGES && window.ITEM_IMAGES[iconKey]) {
                        const img = document.createElement('img');
                        img.src = window.ITEM_IMAGES[iconKey];
                        img.style.width = '80%';
                        img.style.height = '80%';
                        img.style.objectFit = 'contain';
                        slot.appendChild(img);
                    } else {
                        // fallback：用物品名第一个字
                        slot.textContent = itemData.name.charAt(0);
                    }

                    // 数量
                    if (slotData.count > 1) {
                        const count = document.createElement('span');
                        count.className = 'item-count';
                        count.textContent = slotData.count;
                        slot.appendChild(count);
                    }

                    // 鼠标悬停提示
                    const qualityName = ITEM_QUALITY[itemData.quality]?.name || '普通';
                    slot.title = `${itemData.name} [${qualityName}]\n${itemData.description}\n数量：${slotData.count}`;
                }
            }

            this.invGrid.appendChild(slot);
        }
    }

    /**
     * 更新任务面板
     * @param {Array} quests - 任务列表
     */
    updateQuests(quests) {
        const questContent = document.getElementById('quest-content');
        if (!questContent) return;

        if (!quests || quests.length === 0) {
            questContent.innerHTML = '<div style="color:#888; text-align:center; padding:20px;">暂无任务</div>';
            return;
        }

        questContent.innerHTML = '';
        quests.forEach(quest => {
            const item = document.createElement('div');
            item.className = 'quest-item';
            item.innerHTML = `
                <div class="quest-name">${quest.name}</div>
                <div class="quest-desc">${quest.description}</div>
                <div class="quest-progress">${quest.progress}</div>
            `;
            questContent.appendChild(item);
        });
    }
}
