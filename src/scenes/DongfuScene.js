/**
 * ============================================================
 *  DongfuScene.js —— 洞府场景
 * ============================================================
 *  【这是什么？】
 *  玩家的私人洞府。上半部分是家（休息），下半部分是田地（种田）。
 *  点击相应区域进入对应功能。
 *
 *  【功能】
 *  1. 家：点击休息，回满气血灵气
 *  2. 田地：种植灵草灵稻，等待成熟收获
 *  3. 返回宗门主地图
 */

class DongfuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DongfuScene' });
    }

    create() {
        console.log('%c[洞府] 进入洞府场景', 'color: #3a6b8c; font-weight: bold');

        // 从全局状态获取玩家数据
        this.loadPlayerState();

        // 绘制洞府背景
        this.createBackground();

        // 标题
        this.add.text(GAME_WIDTH / 2, 35, '🏠 我的洞府', {
            fontFamily: '楷体, KaiTi, serif',
            fontSize: '28px',
            color: '#4a3728',
            backgroundColor: 'rgba(245,240,225,0.85)',
            padding: { x: 20, y: 6 }
        }).setOrigin(0.5);

        // 家（上半部分）- 休息区
        this.createHomeArea();

        // 田地（下半部分）- 种植区
        this.createFarmArea();

        // 返回按钮
        this.createReturnButton();

        // 状态栏
        this.createStatusBar();
    }

    /**
     * 从全局状态加载玩家数据
     */
    loadPlayerState() {
        if (window.gameState && window.gameState.player) {
            const p = window.gameState.player;
            this.playerHp = p.hp || 100;
            this.playerMaxHp = p.maxHp || 100;
            this.playerQi = p.qi || 5;
            this.playerMaxQi = p.maxQi || 5;
            this.playerName = p.playerName || '道友';
            // 保存完整的player对象引用（如果有的话）
            this.player = p.playerObject || null;
        } else {
            this.playerHp = 100;
            this.playerMaxHp = 100;
            this.playerQi = 5;
            this.playerMaxQi = 5;
            this.playerName = '道友';
            this.player = null;
        }
    }

    /**
     * 保存玩家数据到全局状态
     */
    savePlayerState() {
        if (!window.gameState) window.gameState = {};
        if (!window.gameState.player) window.gameState.player = {};
        const p = window.gameState.player;
        p.hp = this.playerHp;
        p.maxHp = this.playerMaxHp;
        p.qi = this.playerQi;
        p.maxQi = this.playerMaxQi;
    }

    /**
     * 绘制洞府背景
     */
    createBackground() {
        if (this.textures.exists('dongfu')) {
            const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'dongfu');
            bg.setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
        } else {
            // fallback：宣纸底色
            const g = this.add.graphics();
            g.fillStyle(0xf5f0e1, 1);
            g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        }

        // 半透明遮罩，让UI更清晰
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.1);
        overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    /**
     * 创建家（休息区）- 上半部分
     */
    createHomeArea() {
        const areaY = GAME_HEIGHT * 0.3;
        const areaHeight = GAME_HEIGHT * 0.35;

        // 区域提示框
        const homeBox = this.add.rectangle(GAME_WIDTH / 2, areaY, 400, areaHeight, 0xf5f0e1, 0.7)
            .setStrokeStyle(3, 0x8b4513, 0.8)
            .setInteractive({ useHandCursor: true });

        // 标题
        this.add.text(GAME_WIDTH / 2, areaY - areaHeight / 2 + 30, '🏠 家', {
            fontFamily: '楷体, KaiTi, serif',
            fontSize: '32px',
            color: '#8b4513',
            fontWeight: 'bold'
        }).setOrigin(0.5);

        // 说明
        this.add.text(GAME_WIDTH / 2, areaY - 10, '点击休息', {
            fontFamily: '楷体, KaiTi, serif',
            fontSize: '20px',
            color: '#4a3728'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, areaY + 25, '回满气血灵气', {
            fontFamily: '微软雅黑, sans-serif',
            fontSize: '14px',
            color: '#666'
        }).setOrigin(0.5);

        // 悬停效果
        homeBox.on('pointerover', () => {
            homeBox.setFillStyle(0xf5f0e1, 0.85);
            homeBox.setStrokeStyle(3, 0xc44536, 1);
        });
        homeBox.on('pointerout', () => {
            homeBox.setFillStyle(0xf5f0e1, 0.7);
            homeBox.setStrokeStyle(3, 0x8b4513, 0.8);
        });

        // 点击休息
        homeBox.on('pointerdown', () => {
            this.rest();
        });

        // ===== 仓库按钮 =====
        const storageBtnX = GAME_WIDTH / 2 + 280;
        const storageBtnY = areaY;
        const storageBtn = this.add.rectangle(storageBtnX, storageBtnY, 120, 80, 0x8b7355, 0.9)
            .setStrokeStyle(3, 0x5a4232, 1)
            .setInteractive({ useHandCursor: true });

        this.add.text(storageBtnX, storageBtnY - 15, '📦', {
            fontFamily: '楷体, KaiTi, serif',
            fontSize: '28px',
            color: '#fff'
        }).setOrigin(0.5);

        this.add.text(storageBtnX, storageBtnY + 15, '仓库', {
            fontFamily: '楷体, KaiTi, serif',
            fontSize: '18px',
            color: '#fff',
            fontWeight: 'bold'
        }).setOrigin(0.5);

        storageBtn.on('pointerover', () => {
            storageBtn.setFillStyle(0xc44536, 0.95);
            storageBtn.setScale(1.05);
        });
        storageBtn.on('pointerout', () => {
            storageBtn.setFillStyle(0x8b7355, 0.9);
            storageBtn.setScale(1);
        });
        storageBtn.on('pointerdown', () => {
            this.openStorage();
        });
    }

    /**
     * 休息
     */
    rest() {
        this.playerHp = this.playerMaxHp;
        this.playerQi = this.playerMaxQi;
        this.savePlayerState();
        this.updateStatusBar();

        // 休息提示
        const restText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '💤 休息中...\n气血灵气已回满', {
            fontFamily: '楷体, KaiTi, serif',
            fontSize: '28px',
            color: '#3a6b8c',
            backgroundColor: 'rgba(245,240,225,0.95)',
            padding: { x: 30, y: 20 },
            align: 'center'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: restText,
            alpha: 0,
            duration: 500,
            delay: 1500,
            onComplete: () => restText.destroy()
        });

        console.log('[洞府] 休息完成，气血灵气已回满');
    }

    /**
     * 创建田地（种植区）- 下半部分
     */
    createFarmArea() {
        const areaY = GAME_HEIGHT * 0.72;
        const areaHeight = GAME_HEIGHT * 0.22;

        // 区域提示框
        const farmBox = this.add.rectangle(GAME_WIDTH / 2, areaY, 500, areaHeight, 0xf5f0e1, 0.7)
            .setStrokeStyle(3, 0x5a8c3a, 0.8)
            .setInteractive({ useHandCursor: true });

        // 标题
        this.add.text(GAME_WIDTH / 2, areaY - areaHeight / 2 + 25, '🌾 灵田', {
            fontFamily: '楷体, KaiTi, serif',
            fontSize: '28px',
            color: '#3a6b1b',
            fontWeight: 'bold'
        }).setOrigin(0.5);

        // 说明
        this.add.text(GAME_WIDTH / 2, areaY - 5, '点击进入种植', {
            fontFamily: '楷体, KaiTi, serif',
            fontSize: '18px',
            color: '#4a3728'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, areaY + 25, '种植灵草灵稻，等待成熟收获', {
            fontFamily: '微软雅黑, sans-serif',
            fontSize: '13px',
            color: '#666'
        }).setOrigin(0.5);

        // 悬停效果
        farmBox.on('pointerover', () => {
            farmBox.setFillStyle(0xf5f0e1, 0.85);
            farmBox.setStrokeStyle(3, 0xc44536, 1);
        });
        farmBox.on('pointerout', () => {
            farmBox.setFillStyle(0xf5f0e1, 0.7);
            farmBox.setStrokeStyle(3, 0x5a8c3a, 0.8);
        });

        // 点击进入洞府灵田场景
        farmBox.on('pointerdown', () => {
            // 把farmManager保存到全局状态
            if (!window.gameState) window.gameState = {};
            if (this.farmManager) {
                window.gameState.farmManager = this.farmManager;
            }
            // 跳转到灵田场景（洞府灵田）
            this.scene.start('FarmScene', { type: 'dongfu' });
        });
    }

    /**
     * 创建返回按钮
     */
    createReturnButton() {
        const btnX = 80;
        const btnY = GAME_HEIGHT - 50;

        const btn = this.add.rectangle(btnX, btnY, 120, 45, 0x8b7355, 0.9)
            .setStrokeStyle(2, 0x4a3728, 1)
            .setInteractive({ useHandCursor: true });

        this.add.text(btnX, btnY, '← 返回宗门', {
            fontFamily: '楷体, KaiTi, serif',
            fontSize: '18px',
            color: '#fff'
        }).setOrigin(0.5);

        btn.on('pointerover', () => btn.setFillStyle(0xc44536, 0.9));
        btn.on('pointerout', () => btn.setFillStyle(0x8b7355, 0.9));
        btn.on('pointerdown', () => this.returnToBaseMap());
    }

    /**
     * 返回宗门主地图
     */
    returnToBaseMap() {
        this.savePlayerState();
        this.scene.start('BaseMapScene');
    }

    /**
     * 打开仓库（洞府仓库）
     */
    openStorage() {
        // 确保有完整的player对象
        if (!this.player && window.gameState && window.gameState.player) {
            this.player = window.gameState.player.playerObject;
        }
        if (!this.player) {
            console.error('[洞府] 没有player对象，无法打开仓库');
            return;
        }

        const self = this;
        this.uiLocked = true;

        // 遮罩层
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position:fixed; top:0; left:0; width:100%; height:100%;
            background:rgba(0,0,0,0.6); z-index:9998;
            display:flex; align-items:center; justify-content:center;
        `;

        // 主面板
        const panel = document.createElement('div');
        panel.style.cssText = `
            width:900px; height:600px;
            background:linear-gradient(135deg, rgba(245,240,225,0.98), rgba(230,220,200,0.96));
            border:3px solid #5c4a32; border-radius:12px;
            box-shadow:0 8px 32px rgba(0,0,0,0.4), inset 0 2px 0 rgba(255,255,255,0.5);
            display:flex; flex-direction:column; overflow:hidden;
            font-family:'楷体',KaiTi,serif;
        `;

        // 标题栏
        const titleBar = document.createElement('div');
        titleBar.style.cssText = `
            display:flex; justify-content:space-between; align-items:center;
            padding:12px 20px; background:rgba(92,74,50,0.15);
            border-bottom:2px solid #8b7355;
        `;
        const title = document.createElement('span');
        title.textContent = '🏠 洞府仓库';
        title.style.cssText = 'font-size:22px; color:#4a3728; font-weight:bold;';
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕ 关闭';
        closeBtn.style.cssText = `
            padding:6px 16px; background:#8b3a3a; color:#fff;
            border:none; border-radius:6px; cursor:pointer;
            font-family:'楷体',KaiTi,serif; font-size:14px;
        `;
        closeBtn.onclick = () => {
            overlay.remove();
            self.uiLocked = false;
        };
        titleBar.appendChild(title);
        titleBar.appendChild(closeBtn);
        panel.appendChild(titleBar);

        // 内容区：左右分栏
        const content = document.createElement('div');
        content.style.cssText = 'flex:1; display:flex; padding:15px; gap:15px;';

        // ===== 左侧：仓库 =====
        const leftPanel = document.createElement('div');
        leftPanel.style.cssText = 'flex:1; display:flex; flex-direction:column; gap:10px;';

        const leftTitle = document.createElement('div');
        leftTitle.style.cssText = 'display:flex; justify-content:space-between; align-items:center;';
        const leftTitleText = document.createElement('span');
        leftTitleText.textContent = `📦 仓库 (${self.player.storage.getFilledSlots().length}/999)`;
        leftTitleText.style.cssText = 'font-size:16px; color:#4a3728; font-weight:bold;';
        const sortStorageBtn = document.createElement('button');
        sortStorageBtn.textContent = '整理';
        sortStorageBtn.style.cssText = `
            padding:4px 12px; background:#3a6b8c; color:#fff;
            border:none; border-radius:4px; cursor:pointer;
            font-family:'楷体',KaiTi,serif; font-size:12px;
        `;
        sortStorageBtn.onclick = () => {
            self.player.storage.sort();
            self.saveGame();
            renderStorage();
            self.showToast('仓库已整理！');
        };
        leftTitle.appendChild(leftTitleText);
        leftTitle.appendChild(sortStorageBtn);
        leftPanel.appendChild(leftTitle);

        // 仓库格子（滚动）
        const storageGrid = document.createElement('div');
        storageGrid.style.cssText = `
            flex:1; overflow-y:auto;
            display:grid; grid-template-columns:repeat(5, 1fr);
            gap:6px; padding:8px;
            background:rgba(0,0,0,0.05); border-radius:8px;
            border:1px solid #8b7355;
        `;
        leftPanel.appendChild(storageGrid);

        // ===== 中间：转移按钮 =====
        const middlePanel = document.createElement('div');
        middlePanel.style.cssText = `
            width:80px; display:flex; flex-direction:column;
            justify-content:center; align-items:center; gap:15px;
        `;
        const transferAllToStorageBtn = document.createElement('button');
        transferAllToStorageBtn.textContent = '全部\n存入\n→';
        transferAllToStorageBtn.style.cssText = `
            width:70px; height:70px; background:#5c8c3a; color:#fff;
            border:none; border-radius:8px; cursor:pointer;
            font-family:'楷体',KaiTi,serif; font-size:13px;
            line-height:1.3; white-space:pre-line;
        `;
        transferAllToStorageBtn.onclick = () => {
            const filled = self.player.inventory.getFilledSlots();
            let transferred = 0;
            for (const slot of filled) {
                if (self.player.storage.addItem(slot.itemId, slot.count)) {
                    self.player.inventory.removeItem(slot.itemId, slot.count);
                    transferred++;
                }
            }
            self.saveGame();
            renderStorage();
            renderInventory();
            self.showToast(`已存入 ${transferred} 种物品！`);
        };

        const transferAllToInventoryBtn = document.createElement('button');
        transferAllToInventoryBtn.textContent = '全部\n取出\n←';
        transferAllToInventoryBtn.style.cssText = `
            width:70px; height:70px; background:#8c6b3a; color:#fff;
            border:none; border-radius:8px; cursor:pointer;
            font-family:'楷体',KaiTi,serif; font-size:13px;
            line-height:1.3; white-space:pre-line;
        `;
        transferAllToInventoryBtn.onclick = () => {
            const filled = self.player.storage.getFilledSlots();
            let transferred = 0;
            for (const slot of filled) {
                if (self.player.inventory.addItem(slot.itemId, slot.count)) {
                    self.player.storage.removeItem(slot.itemId, slot.count);
                    transferred++;
                }
            }
            self.saveGame();
            renderStorage();
            renderInventory();
            self.showToast(`已取出 ${transferred} 种物品！`);
        };
        middlePanel.appendChild(transferAllToStorageBtn);
        middlePanel.appendChild(transferAllToInventoryBtn);

        // ===== 右侧：储物戒 =====
        const rightPanel = document.createElement('div');
        rightPanel.style.cssText = 'flex:1; display:flex; flex-direction:column; gap:10px;';

        const rightTitle = document.createElement('div');
        rightTitle.style.cssText = 'display:flex; justify-content:space-between; align-items:center;';
        const rightTitleText = document.createElement('span');
        rightTitleText.textContent = `💍 储物戒 (${self.player.inventory.getFilledSlots().length}/50)`;
        rightTitleText.style.cssText = 'font-size:16px; color:#4a3728; font-weight:bold;';
        const sortInventoryBtn = document.createElement('button');
        sortInventoryBtn.textContent = '整理';
        sortInventoryBtn.style.cssText = `
            padding:4px 12px; background:#3a6b8c; color:#fff;
            border:none; border-radius:4px; cursor:pointer;
            font-family:'楷体',KaiTi,serif; font-size:12px;
        `;
        sortInventoryBtn.onclick = () => {
            self.player.inventory.sort();
            self.saveGame();
            renderInventory();
            self.showToast('储物戒已整理！');
        };
        rightTitle.appendChild(rightTitleText);
        rightTitle.appendChild(sortInventoryBtn);
        rightPanel.appendChild(rightTitle);

        // 储物戒格子（滚动）
        const inventoryGrid = document.createElement('div');
        inventoryGrid.style.cssText = `
            flex:1; overflow-y:auto;
            display:grid; grid-template-columns:repeat(5, 1fr);
            gap:6px; padding:8px;
            background:rgba(0,0,0,0.05); border-radius:8px;
            border:1px solid #8b7355;
        `;
        rightPanel.appendChild(inventoryGrid);

        content.appendChild(leftPanel);
        content.appendChild(middlePanel);
        content.appendChild(rightPanel);
        panel.appendChild(content);

        // 底部提示
        const footer = document.createElement('div');
        footer.style.cssText = `
            padding:8px 20px; background:rgba(92,74,50,0.1);
            border-top:1px solid #8b7355; text-align:center;
            font-size:12px; color:#666;
        `;
        footer.textContent = '点击仓库物品取出 | 点击储物戒物品存入 | 丹药点击直接使用 | 灵石可叠加10w';
        panel.appendChild(footer);

        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        // 品级颜色
        const qualityColors = ['#ccc', '#4ade80', '#60a5fa', '#facc15', '#ff8c00', '#ef4444'];

        // 渲染仓库
        function renderStorage() {
            storageGrid.innerHTML = '';
            leftTitleText.textContent = `📦 仓库 (${self.player.storage.getFilledSlots().length}/999)`;

            const displayCount = Math.min(100, self.player.storage.maxSlots);
            for (let i = 0; i < displayCount; i++) {
                const slot = self.player.storage.slots[i];
                const cell = document.createElement('div');
                cell.style.cssText = `
                    aspect-ratio:1; background:rgba(255,255,255,0.5);
                    border:1px solid #8b7355; border-radius:4px;
                    display:flex; flex-direction:column; align-items:center; justify-content:center;
                    cursor:pointer; position:relative; transition:all 0.2s;
                `;

                if (slot) {
                    const item = ITEMS[slot.itemId];
                    if (item) {
                        const quality = item.quality || 1;
                        const borderColor = qualityColors[quality - 1] || '#ccc';
                        cell.style.border = `2px solid ${borderColor}`;
                        cell.style.background = quality === 1 ? 'rgba(200,200,200,0.3)' : 'rgba(255,255,255,0.7)';

                        // 物品图标（使用真实贴图）
                        const icon = document.createElement('img');
                        const iconKey = item.icon || slot.itemId;
                        const iconData = (window.ITEM_IMAGES && window.ITEM_IMAGES[iconKey]) ? window.ITEM_IMAGES[iconKey] : null;
                        if (iconData) {
                            icon.src = iconData;
                        } else {
                            // fallback：用颜色块
                            icon.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><rect width="28" height="28" fill="' + (item.color || '#888') + '"/></svg>';
                        }
                        icon.style.cssText = `
                            width:28px; height:28px; object-fit:contain; margin-bottom:2px;
                            border-radius:4px;
                        `;
                        cell.appendChild(icon);

                        const name = document.createElement('div');
                        name.textContent = item.name;
                        name.style.cssText = `
                            font-size:9px; color:${quality === 1 ? '#555' : '#333'};
                            text-align:center; line-height:1.1;
                            overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
                            width:100%; padding:0 2px;
                        `;
                        cell.appendChild(name);

                        const count = document.createElement('div');
                        count.textContent = `x${slot.count}`;
                        count.style.cssText = `
                            position:absolute; bottom:1px; right:3px;
                            font-size:10px; color:#c44536; font-weight:bold;
                        `;
                        cell.appendChild(count);

                        cell.onclick = () => {
                            const item = ITEMS[slot.itemId];
                            // 如果是丹药，直接使用
                            if (item && (item.type === 'pill' || item.type === 'cultivation_pill')) {
                                const result = self.player.usePill(slot.itemId);
                                if (result.success) {
                                    self.player.storage.removeItem(slot.itemId, 1);
                                    self.saveGame();
                                    renderStorage();
                                    self.showToast(result.message);
                                }
                            } else {
                                // 普通物品取出到储物戒
                                if (self.player.inventory.addItem(slot.itemId, 1)) {
                                    self.player.storage.removeItem(slot.itemId, 1);
                                    self.saveGame();
                                    renderStorage();
                                    renderInventory();
                                } else {
                                    self.showToast('储物戒已满！');
                                }
                            }
                        };
                    }
                }

                storageGrid.appendChild(cell);
            }
        }

        // 渲染储物戒
        function renderInventory() {
            inventoryGrid.innerHTML = '';
            rightTitleText.textContent = `💍 储物戒 (${self.player.inventory.getFilledSlots().length}/50)`;

            for (let i = 0; i < self.player.inventory.maxSlots; i++) {
                const slot = self.player.inventory.slots[i];
                const cell = document.createElement('div');
                cell.style.cssText = `
                    aspect-ratio:1; background:rgba(255,255,255,0.5);
                    border:1px solid #8b7355; border-radius:4px;
                    display:flex; flex-direction:column; align-items:center; justify-content:center;
                    cursor:pointer; position:relative; transition:all 0.2s;
                `;

                if (slot) {
                    const item = ITEMS[slot.itemId];
                    if (item) {
                        const quality = item.quality || 1;
                        const borderColor = qualityColors[quality - 1] || '#ccc';
                        cell.style.border = `2px solid ${borderColor}`;
                        cell.style.background = quality === 1 ? 'rgba(200,200,200,0.3)' : 'rgba(255,255,255,0.7)';

                        // 物品图标（使用真实贴图）
                        const icon = document.createElement('img');
                        const iconKey = item.icon || slot.itemId;
                        const iconData = (window.ITEM_IMAGES && window.ITEM_IMAGES[iconKey]) ? window.ITEM_IMAGES[iconKey] : null;
                        if (iconData) {
                            icon.src = iconData;
                        } else {
                            // fallback：用颜色块
                            icon.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><rect width="28" height="28" fill="' + (item.color || '#888') + '"/></svg>';
                        }
                        icon.style.cssText = `
                            width:28px; height:28px; object-fit:contain; margin-bottom:2px;
                            border-radius:4px;
                        `;
                        cell.appendChild(icon);

                        const name = document.createElement('div');
                        name.textContent = item.name;
                        name.style.cssText = `
                            font-size:9px; color:${quality === 1 ? '#555' : '#333'};
                            text-align:center; line-height:1.1;
                            overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
                            width:100%; padding:0 2px;
                        `;
                        cell.appendChild(name);

                        const count = document.createElement('div');
                        count.textContent = `x${slot.count}`;
                        count.style.cssText = `
                            position:absolute; bottom:1px; right:3px;
                            font-size:10px; color:#c44536; font-weight:bold;
                        `;
                        cell.appendChild(count);

                        cell.onclick = () => {
                            const item = ITEMS[slot.itemId];
                            // 如果是丹药，直接使用
                            if (item && (item.type === 'pill' || item.type === 'cultivation_pill')) {
                                const result = self.player.usePill(slot.itemId);
                                if (result.success) {
                                    self.player.inventory.removeItem(slot.itemId, 1);
                                    self.saveGame();
                                    renderInventory();
                                    self.showToast(result.message);
                                }
                            } else {
                                // 普通物品存入仓库
                                if (self.player.storage.addItem(slot.itemId, 1)) {
                                    self.player.inventory.removeItem(slot.itemId, 1);
                                    self.saveGame();
                                    renderStorage();
                                    renderInventory();
                                } else {
                                    self.showToast('仓库已满！');
                                }
                            }
                        };
                    }
                }

                inventoryGrid.appendChild(cell);
            }
        }

        renderStorage();
        renderInventory();
    }

    /**
     * 保存游戏
     */
    saveGame() {
        if (this.player && this.player.scene) {
            // 通过player的scene保存
            if (this.player.scene.saveGame) {
                this.player.scene.saveGame();
            }
        }
    }

    /**
     * 显示提示
     */
    showToast(text) {
        const toast = document.createElement('div');
        toast.textContent = text;
        toast.style.cssText = `
            position:fixed; top:100px; left:50%; transform:translateX(-50%);
            background:rgba(245,240,225,0.95); color:#1a1a1a;
            padding:10px 25px; border-radius:8px; font-size:16px;
            font-family:'楷体',KaiTi,serif; z-index:99999;
            border:2px solid #8b7355; box-shadow:0 4px 16px rgba(0,0,0,0.3);
            animation:toastFade 2s ease-out forwards;
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);

        // 添加CSS动画
        if (!document.getElementById('dongfu-toast-style')) {
            const style = document.createElement('style');
            style.id = 'dongfu-toast-style';
            style.textContent = `
                @keyframes toastFade {
                    0% { opacity:0; transform:translateX(-50%) translateY(-20px); }
                    15% { opacity:1; transform:translateX(-50%) translateY(0); }
                    80% { opacity:1; }
                    100% { opacity:0; transform:translateX(-50%) translateY(-10px); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * 创建状态栏
     */
    createStatusBar() {
        const barY = GAME_HEIGHT - 50;

        // 气血
        this.add.text(GAME_WIDTH - 280, barY - 15, '气血', {
            fontFamily: '微软雅黑, sans-serif', fontSize: '12px', color: '#c44536'
        }).setOrigin(0, 0.5);
        this.add.rectangle(GAME_WIDTH - 230, barY - 15, 150, 12, 0x333333, 0.7).setOrigin(0, 0.5);
        this.hpBar = this.add.rectangle(GAME_WIDTH - 228, barY - 15, 146, 8, 0xc44536).setOrigin(0, 0.5);
        this.hpText = this.add.text(GAME_WIDTH - 155, barY - 15, '', {
            fontFamily: 'Arial', fontSize: '10px', color: '#fff'
        }).setOrigin(0.5);

        // 灵气
        this.add.text(GAME_WIDTH - 280, barY + 10, '灵气', {
            fontFamily: '微软雅黑, sans-serif', fontSize: '12px', color: '#3a6b8c'
        }).setOrigin(0, 0.5);
        this.add.rectangle(GAME_WIDTH - 230, barY + 10, 150, 10, 0x333333, 0.7).setOrigin(0, 0.5);
        this.qiBar = this.add.rectangle(GAME_WIDTH - 228, barY + 10, 146, 6, 0x3a6b8c).setOrigin(0, 0.5);

        this.updateStatusBar();
    }

    /**
     * 更新状态栏
     */
    updateStatusBar() {
        const hpPercent = Math.max(0, this.playerHp / this.playerMaxHp);
        if (this.hpBar) this.hpBar.width = 146 * hpPercent;
        if (this.hpText) this.hpText.setText(`${this.playerHp}/${this.playerMaxHp}`);

        const qiPercent = Math.max(0, this.playerQi / this.playerMaxQi);
        if (this.qiBar) this.qiBar.width = 146 * qiPercent;
    }
}
