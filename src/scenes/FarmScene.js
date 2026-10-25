/**
 * ============================================================
 *  FarmScene.js —— 灵田场景（专门的种田页面）
 * ============================================================
 *  【这是什么？】
 *  专门的灵田管理场景，类似QQ农场的风格。
 *  点击宗门/洞府的农田后跳转到这里，在精美的背景上
 *  显示真正的农田格子，可以种植、收获、升级。
 *
 *  【场景参数】
 *  type: 'sect'（宗门灵田）或 'dongfu'（洞府灵田）
 *
 *  【怎么用】
 *  this.scene.start('FarmScene', { type: 'sect' });
 */

class FarmScene extends Phaser.Scene {
    constructor() {
        super({ key: 'FarmScene' });
        this.farmType = 'sect';  // 默认宗门灵田
        this.farmTiles = [];      // 农田格子对象数组
        this.player = null;
        this.farmManager = null;
        this.selectedTile = -1;   // 当前选中的空地
    }

    init(data) {
        this.farmType = data.type || 'sect';
        console.log(`[灵田场景] 进入${this.farmType === 'sect' ? '宗门' : '洞府'}灵田`);
    }

    create() {
        // 从全局状态恢复玩家数据
        if (window.gameState && window.gameState.player) {
            this.player = window.gameState.player;
        } else {
            // 如果没有全局玩家数据，创建一个默认的
            this.player = new Player(this, 0, 0);
        }

        // 获取FarmManager（从主场景共享）
        if (window.gameState && window.gameState.farmManager) {
            this.farmManager = window.gameState.farmManager;
        } else {
            this.farmManager = new FarmManager(this, this.player);
            this.farmManager.init();
        }

        // 画背景
        this.drawBackground();

        // 创建农田格子
        this.createFarmTiles();

        // 创建顶部信息栏
        this.createTopBar();

        // 创建底部操作栏
        this.createBottomBar();

        // 创建种子选择面板（默认隐藏）
        this.createSeedPanel();

        // 键盘ESC返回
        this.input.keyboard.on('keydown-ESC', () => this.returnToBase());
    }

    /**
     * 画背景
     */
    drawBackground() {
        const bgKey = this.farmType === 'sect' ? 'farm_sect_bg' : 'farm_dongfu_bg';

        if (this.textures.exists(bgKey)) {
            const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, bgKey);
            // 缩放适配屏幕
            const scaleX = GAME_WIDTH / bg.width;
            const scaleY = GAME_HEIGHT / bg.height;
            const scale = Math.max(scaleX, scaleY);
            bg.setScale(scale);
            bg.setDepth(0);
        } else {
            // 备用背景
            this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0xe8dcc8).setOrigin(0);
        }

        // 半透明遮罩，让农田更突出
        this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.15).setOrigin(0).setDepth(1);
    }

    /**
     * 创建农田格子
     */
    createFarmTiles() {
        const farm = this.farmManager.getFarmData(this.farmType);
        const tileCount = farm.tiles.length;

        // 计算行列数（完全平方数开方）
        const cols = Math.ceil(Math.sqrt(tileCount));
        const rows = Math.ceil(tileCount / cols);

        // 格子大小和间距
        const tileSize = this.farmType === 'dongfu' ? 110 : 95;
        const gap = 12;

        // 计算整体宽度和高度，居中显示
        const totalWidth = cols * tileSize + (cols - 1) * gap;
        const totalHeight = rows * tileSize + (rows - 1) * gap;
        const startX = (GAME_WIDTH - totalWidth) / 2 + tileSize / 2;
        const startY = (GAME_HEIGHT - totalHeight) / 2 + tileSize / 2 + 20;

        this.farmTiles = [];

        farm.tiles.forEach((tile, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = startX + col * (tileSize + gap);
            const y = startY + row * (tileSize + gap);

            // 创建农田格子容器
            const tileContainer = this.add.container(x, y);
            tileContainer.setDepth(10);

            // 农田底色（立体效果）
            const tileBg = this.add.rectangle(0, 0, tileSize, tileSize, 0x8b6f47, 0.7);
            tileBg.setStrokeStyle(3, 0x5c4a32, 0.9);
            tileContainer.add(tileBg);

            // 农田土壤纹理（内层）
            const tileInner = this.add.rectangle(0, 0, tileSize - 10, tileSize - 10, 0x6b5344, 0.5);
            tileInner.setStrokeStyle(1, 0x4a3728, 0.6);
            tileContainer.add(tileInner);

            // 立体阴影效果
            const tileShadow = this.add.rectangle(3, 3, tileSize, tileSize, 0x000000, 0.2);
            tileShadow.setDepth(-1);
            tileContainer.add(tileShadow);

            // 植物贴图（根据状态显示）
            let plantImage = null;
            let stageText = null;

            if (tile.state === 'empty') {
                // 空地：显示加号
                const plusText = this.add.text(0, 0, '+', {
                    fontFamily: '楷体, KaiTi, serif',
                    fontSize: '32px',
                    color: '#c4b896'
                }).setOrigin(0.5);
                tileContainer.add(plusText);
            } else {
                // 生长中或成熟：显示植物贴图
                const textureKey = this.farmManager.getPlantTexture(tile.seed, tile.stage);
                const stageNames = ['播种期', '幼苗期', '成长期', '成熟期'];
                const stageColors = ['#8b7355', '#7cb342', '#4caf50', '#ff9800'];

                if (textureKey && this.textures.exists(textureKey)) {
                    plantImage = this.add.image(0, -5, textureKey);
                    plantImage.setDisplaySize(tileSize - 20, tileSize - 20);
                    tileContainer.add(plantImage);
                }

                // 阶段标签
                stageText = this.add.text(0, tileSize / 2 - 12, stageNames[tile.stage], {
                    fontFamily: '微软雅黑, sans-serif',
                    fontSize: '11px',
                    color: stageColors[tile.stage],
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    padding: { x: 4, y: 1 }
                }).setOrigin(0.5);
                tileContainer.add(stageText);

                // 成熟发光效果
                if (tile.state === 'mature') {
                    const glow = this.add.rectangle(0, 0, tileSize - 5, tileSize - 5, 0xff9800, 0.2);
                    glow.setStrokeStyle(2, 0xff9800, 0.8);
                    tileContainer.add(glow);
                    // 呼吸动画
                    this.tweens.add({
                        targets: glow,
                        alpha: 0.4,
                        duration: 800,
                        yoyo: true,
                        repeat: -1
                    });
                }
            }

            // 设置交互
            tileContainer.setSize(tileSize, tileSize);
            tileContainer.setInteractive({ useHandCursor: true });

            // 悬停效果
            tileContainer.on('pointerover', () => {
                tileBg.setFillStyle(0x9b7f57, 0.8);
                tileContainer.setScale(1.05);
            });
            tileContainer.on('pointerout', () => {
                tileBg.setFillStyle(0x8b6f47, 0.7);
                tileContainer.setScale(1);
            });

            // 点击事件
            tileContainer.on('pointerdown', () => {
                if (tile.state === 'empty') {
                    // 空地：打开种子选择面板
                    this.selectedTile = index;
                    this.showSeedPanel(x, y);
                } else if (tile.state === 'mature') {
                    // 成熟：收获
                    this.harvestTile(index, tileContainer);
                } else {
                    // 生长中：显示剩余时间
                    const seed = SEEDS[tile.seed];
                    const qualityConfig = this.farmManager.QUALITY_CONFIG[farm.quality];
                    const elapsed = (this.time.now - tile.plantTime) * qualityConfig.growSpeed;
                    const remain = Math.max(0, Math.ceil((seed.growTime - elapsed) / 1000));
                    this.showToast(`${seed.name} 生长中，剩余${remain}秒`);
                }
            });

            this.farmTiles.push({
                container: tileContainer,
                bg: tileBg,
                inner: tileInner,
                plantImage: plantImage,
                stageText: stageText,
                index: index
            });
        });
    }

    /**
     * 创建顶部信息栏
     */
    createTopBar() {
        const farm = this.farmManager.getFarmData(this.farmType);
        const stats = this.farmManager.getStats(this.farmType);
        const qualityConfig = this.farmManager.QUALITY_CONFIG[farm.quality];
        const typeName = this.farmType === 'sect' ? '宗门灵田' : '洞府灵田';

        // 顶部背景
        const topBar = this.add.rectangle(GAME_WIDTH / 2, 35, GAME_WIDTH - 40, 55, 0x000000, 0.5);
        topBar.setStrokeStyle(2, 0x8b7355, 0.8);
        topBar.setDepth(100);

        // 标题
        const title = this.add.text(30, 35, `🌿 ${typeName}`, {
            fontFamily: '楷体, KaiTi, serif',
            fontSize: '22px',
            color: '#f5f0e1'
        }).setOrigin(0, 0.5).setDepth(101);

        // 品质
        const qualityText = this.add.text(200, 35, `品质：${qualityConfig.name}`, {
            fontFamily: '微软雅黑, sans-serif',
            fontSize: '14px',
            color: qualityConfig.color
        }).setOrigin(0, 0.5).setDepth(101);

        // 状态统计
        const statsText = this.add.text(GAME_WIDTH - 30, 35,
            `共${farm.tiles.length}块 | 空地${stats.empty} | 生长中${stats.growing} | 成熟${stats.mature}`, {
            fontFamily: '微软雅黑, sans-serif',
            fontSize: '13px',
            color: '#e8dcc8'
        }).setOrigin(1, 0.5).setDepth(101);

        this.topBarStats = statsText;
    }

    /**
     * 创建底部操作栏
     */
    createBottomBar() {
        // 底部背景
        const bottomBar = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 35, GAME_WIDTH - 40, 55, 0x000000, 0.5);
        bottomBar.setStrokeStyle(2, 0x8b7355, 0.8);
        bottomBar.setDepth(100);

        // 返回按钮
        const returnBtn = this.createButton(80, GAME_HEIGHT - 35, '← 返回', () => this.returnToBase());
        returnBtn.setDepth(101);

        // 收获所有按钮
        const harvestBtn = this.createButton(GAME_WIDTH / 2, GAME_HEIGHT - 35, '🌾 收获所有成熟', () => this.harvestAll());
        harvestBtn.setDepth(101);

        // 洞府灵田显示升级按钮
        if (this.farmType === 'dongfu') {
            const upgradeBtn = this.createButton(GAME_WIDTH - 100, GAME_HEIGHT - 35, '🔨 扩建灵田', () => this.upgradeFarm());
            upgradeBtn.setDepth(101);
        }
    }

    /**
     * 创建按钮
     */
    createButton(x, y, text, callback) {
        const btnContainer = this.add.container(x, y);

        const btnBg = this.add.rectangle(0, 0, 130, 38, 0x8b7355, 0.9);
        btnBg.setStrokeStyle(2, 0x5c4a32, 1);
        btnContainer.add(btnBg);

        const btnText = this.add.text(0, 0, text, {
            fontFamily: '楷体, KaiTi, serif',
            fontSize: '15px',
            color: '#f5f0e1'
        }).setOrigin(0.5);
        btnContainer.add(btnText);

        btnContainer.setSize(130, 38);
        btnContainer.setInteractive({ useHandCursor: true });

        btnContainer.on('pointerover', () => {
            btnBg.setFillStyle(0x9b8365, 0.95);
            btnContainer.setScale(1.05);
        });
        btnContainer.on('pointerout', () => {
            btnBg.setFillStyle(0x8b7355, 0.9);
            btnContainer.setScale(1);
        });
        btnContainer.on('pointerdown', callback);

        return btnContainer;
    }

    /**
     * 创建种子选择面板
     */
    createSeedPanel() {
        this.seedPanel = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
        this.seedPanel.setDepth(200);
        this.seedPanel.setVisible(false);

        // 遮罩
        const mask = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.5);
        mask.setInteractive();
        mask.on('pointerdown', () => this.hideSeedPanel());
        this.seedPanel.add(mask);

        // 面板背景
        const panelBg = this.add.rectangle(0, 0, 450, 200, 0xf5f0e1, 0.98);
        panelBg.setStrokeStyle(3, 0x5c4a32, 1);
        this.seedPanel.add(panelBg);

        // 标题
        const title = this.add.text(0, -75, '【 选择种子 】', {
            fontFamily: '楷体, KaiTi, serif',
            fontSize: '20px',
            color: '#3a2a1a'
        }).setOrigin(0.5);
        this.seedPanel.add(title);

        // 种子按钮
        const seedKeys = ['ling_cao_seed', 'ling_dao_seed', 'ling_cha_seed'];
        const seedTextureKeys = ['seed_lingcao', 'seed_lingdao', 'seed_lingcha'];
        const seedColors = ['#5a8c3a', '#c9a84c', '#6b8e5a'];

        seedKeys.forEach((seedKey, i) => {
            const seed = SEEDS[seedKey];
            const x = -140 + i * 140;

            // 种子按钮背景
            const btnBg = this.add.rectangle(x, 10, 120, 110, 0xffffff, 0.9);
            btnBg.setStrokeStyle(2, seedColors[i], 1);
            this.seedPanel.add(btnBg);

            // 种子图标
            if (this.textures.exists(seedTextureKeys[i])) {
                const seedImg = this.add.image(x, -15, seedTextureKeys[i]);
                seedImg.setDisplaySize(50, 50);
                this.seedPanel.add(seedImg);
            }

            // 种子名称
            const nameText = this.add.text(x, 25, seed.name, {
                fontFamily: '微软雅黑, sans-serif',
                fontSize: '13px',
                color: seedColors[i],
                fontStyle: 'bold'
            }).setOrigin(0.5);
            this.seedPanel.add(nameText);

            // 生长时间
            const timeText = this.add.text(x, 45, `${seed.growTime/1000}秒成熟`, {
                fontFamily: '微软雅黑, sans-serif',
                fontSize: '10px',
                color: '#888'
            }).setOrigin(0.5);
            this.seedPanel.add(timeText);

            // 交互
            btnBg.setInteractive({ useHandCursor: true });
            btnBg.on('pointerover', () => {
                btnBg.setFillStyle(0xf0f0f0, 0.95);
                btnBg.setScale(1.05);
            });
            btnBg.on('pointerout', () => {
                btnBg.setFillStyle(0xffffff, 0.9);
                btnBg.setScale(1);
            });
            btnBg.on('pointerdown', () => {
                this.plantSeed(seedKey);
            });
        });

        // 取消按钮
        const cancelBtn = this.add.text(0, 85, '点击空白处取消', {
            fontFamily: '微软雅黑, sans-serif',
            fontSize: '12px',
            color: '#999'
        }).setOrigin(0.5);
        this.seedPanel.add(cancelBtn);
    }

    /**
     * 显示种子选择面板
     */
    showSeedPanel(x, y) {
        this.seedPanel.setVisible(true);
        // 面板位置固定在屏幕中央
        this.seedPanel.setPosition(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    }

    /**
     * 隐藏种子选择面板
     */
    hideSeedPanel() {
        this.seedPanel.setVisible(false);
        this.selectedTile = -1;
    }

    /**
     * 种植种子
     */
    plantSeed(seedKey) {
        if (this.selectedTile < 0) return;

        const success = this.farmManager.plant(this.farmType, seedKey, this.selectedTile);
        if (success) {
            this.hideSeedPanel();
            this.refreshTiles();
            this.saveGame();
        }
    }

    /**
     * 收获单块田
     */
    harvestTile(index, tileContainer) {
        const success = this.farmManager.harvestTile(this.farmType, index);
        if (success) {
            // 收获动画
            this.tweens.add({
                targets: tileContainer,
                scale: 1.2,
                alpha: 0,
                duration: 300,
                onComplete: () => {
                    this.refreshTiles();
                }
            });
            this.saveGame();
        }
    }

    /**
     * 收获所有成熟
     */
    harvestAll() {
        const result = this.farmManager.harvest(this.farmType);
        if (result) {
            this.refreshTiles();
            this.saveGame();
        }
    }

    /**
     * 扩建洞府灵田
     */
    upgradeFarm() {
        const success = this.farmManager.upgradeDongfuTileCount();
        if (success) {
            this.saveGame();
            // 重新创建农田格子
            this.farmTiles.forEach(t => t.container.destroy());
            this.createFarmTiles();
            this.updateTopBar();
        }
    }

    /**
     * 刷新所有农田格子显示
     */
    refreshTiles() {
        // 销毁旧的格子
        this.farmTiles.forEach(t => t.container.destroy());
        // 重新创建
        this.createFarmTiles();
        // 更新顶部信息
        this.updateTopBar();
    }

    /**
     * 更新顶部信息栏
     */
    updateTopBar() {
        const farm = this.farmManager.getFarmData(this.farmType);
        const stats = this.farmManager.getStats(this.farmType);
        if (this.topBarStats) {
            this.topBarStats.setText(`共${farm.tiles.length}块 | 空地${stats.empty} | 生长中${stats.growing} | 成熟${stats.mature}`);
        }
    }

    /**
     * 保存游戏
     */
    saveGame() {
        if (window.gameState && window.gameState.saveSlot) {
            SaveSystem.saveToSlot(window.gameState.saveSlot, this.player, this.player.inventory, this.player.storage, this.farmManager.toJSON());
        }
    }

    /**
     * 返回主地图
     */
    returnToBase() {
        // 保存farmManager到全局状态
        if (!window.gameState) window.gameState = {};
        window.gameState.farmManager = this.farmManager;

        this.scene.start('BaseMapScene');
    }

    /**
     * 显示提示
     */
    showToast(message) {
        const toast = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, message, {
            fontFamily: '微软雅黑, sans-serif',
            fontSize: '16px',
            color: '#fff',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setDepth(300);

        this.tweens.add({
            targets: toast,
            y: GAME_HEIGHT / 2 - 150,
            alpha: 0,
            duration: 1500,
            onComplete: () => toast.destroy()
        });
    }

    update(time, delta) {
        // 更新农田生长
        if (this.farmManager) {
            this.farmManager.update(time);
        }

        // 每2秒刷新一次显示（避免每帧重建）
        if (!this.lastRefreshTime || time - this.lastRefreshTime > 2000) {
            this.lastRefreshTime = time;
            // 检查是否有阶段变化
            const farm = this.farmManager.getFarmData(this.farmType);
            let needRefresh = false;
            farm.tiles.forEach((tile, i) => {
                if (this.farmTiles[i] && this.farmTiles[i].stageText) {
                    const stageNames = ['播种期', '幼苗期', '成长期', '成熟期'];
                    if (this.farmTiles[i].stageText.text !== stageNames[tile.stage]) {
                        needRefresh = true;
                    }
                }
            });
            if (needRefresh) {
                this.refreshTiles();
            }
        }
    }
}
