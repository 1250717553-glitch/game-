/**
 * ============================================================
 *  BaseMapScene.js —— 主地图场景（你的宗门/洞府）
 * ============================================================
 *  【这一版】
 *  使用抽离出来的组件：
 *  - StatusBar（状态栏）
 *  - InventoryUI（背包界面）
 *  - FarmManager（种田系统）
 *  主场景只负责场景逻辑，代码更简洁。
 */

class BaseMapScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BaseMapScene' });

        this.player = null;
        this.moveTarget = null;
        this.interactables = [];
        this.nearbyInteractable = null;
        this.interactHint = null;

        // 组件
        this.statusBar = null;
        this.inventoryUI = null;
        this.farmManager = null;

        // 场景参数
        this.sceneParams = {};
    }

    init(data) {
        this.sceneParams = data || {};
    }

    create() {
        console.log('%c[主地图] 进入宗门场景', 'color: #3a6b8c; font-weight: bold');

        // UI锁定标志：任何弹窗打开时为true，禁止建筑点击和玩家移动
        this.uiLocked = false;

        // 建筑点击区域数组（供全局点击事件使用）
        this.buildingClickAreas = [];

        // 【最重要】注册全局点击事件，不依赖Phaser输入系统，场景切换后也能正常点击
        this.setupGlobalClickHandler();

        // 画背景
        this.paintInkBackground();

        // 建建筑
        this.buildBuildings();

        // 创建玩家（主地图不显示人物，只保留数据用于种田/休息/战斗等）
        // 优先从全局状态恢复player（从灵田/战斗场景返回时，背包等数据是最新的）
        this.playerRestoredFromGlobal = false;
        if (window.gameState && window.gameState.player) {
            // 从全局状态恢复的是数据对象，需要创建新的Player对象并复制数据
            const savedPlayer = window.gameState.player;
            this.player = new Player(this, GAME_WIDTH / 2, GAME_HEIGHT / 2);
            // 复制所有属性（跳过特殊对象，单独处理）
            for (const key in savedPlayer) {
                if (key !== 'scene' && key !== 'container' && key !== 'sprite' &&
                    key !== 'inventory' && key !== 'storage') {
                    this.player[key] = savedPlayer[key];
                }
            }
            // 单独恢复inventory（创建新的Inventory对象，再复制数据）
            try {
                if (savedPlayer.inventory) {
                    // 如果有toJSON方法返回的数据格式，用fromJSON恢复
                    if (savedPlayer.inventory.slots) {
                        this.player.inventory.slots = JSON.parse(JSON.stringify(savedPlayer.inventory.slots));
                    }
                    if (savedPlayer.inventory.maxSlots) {
                        this.player.inventory.maxSlots = savedPlayer.inventory.maxSlots;
                    }
                    if (savedPlayer.inventory.maxStack) {
                        this.player.inventory.maxStack = savedPlayer.inventory.maxStack;
                    }
                    console.log('[主地图] inventory已恢复，物品数:', this.player.inventory.getFilledSlots().length);
                }
            } catch (e) {
                console.error('[主地图] 恢复inventory失败:', e);
            }
            // 单独恢复storage
            try {
                if (savedPlayer.storage && savedPlayer.storage.slots) {
                    this.player.storage.slots = JSON.parse(JSON.stringify(savedPlayer.storage.slots));
                }
            } catch (e) {
                console.error('[主地图] 恢复storage失败:', e);
            }
            this.player.scene = this;  // 更新scene引用
            this.playerRestoredFromGlobal = true;
            console.log('[主地图] 从全局状态恢复player（已创建新Player对象）');
        } else {
            this.player = new Player(this, GAME_WIDTH / 2, GAME_HEIGHT / 2);
        }
        // 隐藏人物显示（只有完整的Player对象才有container）
        if (this.player.container) {
            this.player.container.setVisible(false);
        }

        // 初始化组件
        // 优先从全局状态恢复farmManager（从灵田场景返回时）
        this.farmManagerRestoredFromGlobal = false;
        if (window.gameState && window.gameState.farmManager) {
            // 从全局状态恢复的是数据对象，需要创建新的FarmManager对象并复制数据
            const savedFarm = window.gameState.farmManager;
            this.farmManager = new FarmManager(this, this.player);
            // 复制所有属性（跳过scene和player，因为已经设置好了）
            for (const key in savedFarm) {
                if (key !== 'scene' && key !== 'player') {
                    this.farmManager[key] = savedFarm[key];
                }
            }
            this.farmManager.scene = this;  // 更新scene引用
            this.farmManager.player = this.player;  // 更新player引用
            this.farmManagerRestoredFromGlobal = true;
            console.log('[主地图] 从全局状态恢复farmManager（已创建新FarmManager对象）');
        } else {
            this.farmManager = new FarmManager(this, this.player);
            this.farmManager.init();
        }

        this.statusBar = null;  // 底部状态栏已移除，属性只在储物戒界面显示

        try {
            this.inventoryUI = new InventoryUI(this, this.player);
            window.inventoryUI = this.inventoryUI;  // 挂到全局，供UI按钮调用
        } catch (e) {
            console.error('[主地图] 创建inventoryUI失败:', e);
        }

        // 尝试读档
        try {
            this.tryLoadGame();
        } catch (e) {
            console.error('[主地图] 读档失败:', e);
        }

        // 测试期：给玩家增加1w宗门贡献和1w灵石
        try {
            if (!this.player.contribution) this.player.contribution = 0;
            if (this.player.contribution < 10000) {
                this.player.contribution = 10000;
                console.log('[测试] 宗门贡献已设置为10000');
            }
            // 给玩家添加1w灵石
            if (this.player.inventory && this.player.inventory.addItem) {
                const stoneCount = this.player.inventory.getItemCount('spirit_stone');
                if (stoneCount < 10000) {
                    this.player.inventory.addItem('spirit_stone', 10000 - stoneCount);
                    console.log('[测试] 灵石已设置为10000');
                }
            }
            // 给玩家添加一些丹药测试
            if (this.player.inventory && this.player.inventory.addItem) {
                if (this.player.inventory.getItemCount('heal_pill') < 10) {
                    this.player.inventory.addItem('heal_pill', 10);
                }
                if (this.player.inventory.getItemCount('qi_pill') < 10) {
                    this.player.inventory.addItem('qi_pill', 10);
                }
                if (this.player.inventory.getItemCount('spirit_pill') < 5) {
                    this.player.inventory.addItem('spirit_pill', 5);
                }
                console.log('[测试] 丹药已添加');
            }
        } catch (e) {
            console.error('[主地图] 设置测试资源失败:', e);
        }

        // 从战斗状态同步（战斗后血量、经验、背包掉落等）
        try {
            this.syncFromBattleState();
        } catch (e) {
            console.error('[主地图] 同步战斗状态失败:', e);
        }

        // 鼠标移动
        try {
            this.setupInput();
        } catch (e) {
            console.error('[主地图] 设置输入失败:', e);
        }

        // 顶部UI
        try {
            this.createTopUI();
        } catch (e) {
            console.error('[主地图] 创建顶部UI失败:', e);
        }

        // 按键
        try {
            this.input.keyboard.on('keydown-E', () => this.handleInteraction());
            this.input.keyboard.on('keydown-B', () => this.inventoryUI.toggle());
            this.input.keyboard.on('keydown-ESC', () => this.toggleEscMenu());
        } catch (e) {
            console.error('[主地图] 绑定按键失败:', e);
        }

        // 全局存档管理面板关闭方法（供HTML按钮调用）
        window.closeSaveManager = () => {
            try {
                this.closeSaveManagerHTML();
                this.openEscMenu();
            } catch (e) {
                console.error('[主地图] 关闭存档管理面板失败:', e);
            }
        };

        // 每10秒自动存档
        try {
            this.time.addEvent({
                delay: 10000,
                loop: true,
                callback: () => this.saveGame()
            });
        } catch (e) {
            console.error('[主地图] 创建自动存档定时器失败:', e);
        }

        // 初始化水墨风UI面板（任务/背包/地图）
        try {
            this.uiPanelManager = new UIPanelManager(this, this.player);
        } catch (e) {
            console.error('[主地图] 创建UIPanelManager失败:', e);
        }

        // 初始化功法UI管理器
        try {
            if (typeof ManualUIManager !== 'undefined') {
                ManualUIManager.init(this.player);
            }
        } catch (e) {
            console.error('[主地图] 初始化功法UI失败:', e);
        }

        // 显示底部按钮栏
        try {
            if (typeof UIManager !== 'undefined') {
                UIManager.showButtons();
            }
        } catch (e) {
            console.error('[主地图] 显示底部按钮栏失败:', e);
        }

        // 场景关闭时隐藏UI面板
        this.events.on('shutdown', () => {
            if (this.uiPanelManager) {
                this.uiPanelManager.hide();
            }
            if (typeof UIManager !== 'undefined') {
                UIManager.hideAll();
            }
            if (typeof ManualUIManager !== 'undefined' && ManualUIManager.isOpen) {
                ManualUIManager.close();
            }
            // 关闭ESC菜单
            if (this.escMenuContainer) {
                this.escMenuContainer.destroy();
                this.escMenuContainer = null;
            }
            // 关闭存档管理HTML面板
            this.closeSaveManagerHTML();
            if (window.closeSaveManager) {
                delete window.closeSaveManager;
            }
            // 关闭储物戒界面
            if (this.inventoryUI && this.inventoryUI.isOpen) {
                this.inventoryUI.close();
            }
            if (window.inventoryUI) {
                delete window.inventoryUI;
            }
            // 移除左上角紧凑状态栏
            if (this.compactStatusBar) {
                this.compactStatusBar.remove();
                this.compactStatusBar = null;
            }
        });

        // 背包变化时更新UI面板
        try {
            if (this.player.inventory && this.player.inventory.addItem) {
                const originalAddItem = this.player.inventory.addItem.bind(this.player.inventory);
                this.player.inventory.addItem = (...args) => {
                    try {
                        const result = originalAddItem(...args);
                        if (this.uiPanelManager) {
                            this.uiPanelManager.updateInventory();
                        }
                        return result;
                    } catch (e) {
                        console.error('[主地图] addItem包装失败:', e);
                        return originalAddItem(...args);
                    }
                };
            }
        } catch (e) {
            console.error('[主地图] 包装inventory.addItem失败:', e);
        }

        // 如果从洞府场景过来，自动打开农田界面
        try {
            if (this.sceneParams && this.sceneParams.openFarm) {
                this.time.delayedCall(500, () => {
                    try {
                        this.openFarmUI();
                    } catch (e) {
                        console.error('[主地图] 自动打开农田界面失败:', e);
                    }
                });
            }
        } catch (e) {
            console.error('[主地图] 设置自动打开农田失败:', e);
        }

        console.log('[主地图] create方法执行完成');
    }

    /**
     * 【最重要】设置全局点击事件
     * 不依赖Phaser输入系统，场景切换后也能正常点击
     */
    setupGlobalClickHandler() {
        const self = this;

        this.clickHandler = function(e) {
            try {
                // UI锁定时不响应
                if (self.uiLocked) return;

                // 获取游戏画布
                const canvas = document.querySelector('canvas');
                if (!canvas) return;

                // 获取画布位置和大小
                const rect = canvas.getBoundingClientRect();

                // 计算点击位置相对于画布的比例
                const scaleX = (e.clientX - rect.left) / rect.width;
                const scaleY = (e.clientY - rect.top) / rect.height;

                // 转换成游戏逻辑坐标
                const gameX = scaleX * GAME_WIDTH;
                const gameY = scaleY * GAME_HEIGHT;

                // 检测是否点击了某个建筑
                for (const area of self.buildingClickAreas) {
                    if (gameX >= area.x - area.width / 2 &&
                        gameX <= area.x + area.width / 2 &&
                        gameY >= area.y - area.height / 2 &&
                        gameY <= area.y + area.height / 2) {
                        console.log('[主地图] 点击了建筑:', area.name);
                        area.onClick();
                        return;
                    }
                }
            } catch (err) {
                console.error('[主地图] 全局点击处理失败:', err);
            }
        };

        // 注册到全局点击事件管理
        window.registerGlobalClick('BaseMapScene', this.clickHandler);

        // 场景关闭时移除
        this.events.on('shutdown', () => {
            window.unregisterGlobalClick('BaseMapScene');
            console.log('[主地图] 全局点击事件已移除');
        });

        console.log('[主地图] 全局点击事件已注册');
    }

    /**
     * 水墨背景（使用生成的精美背景图）
     */
    paintInkBackground() {
        if (this.textures.exists('basemap_bg')) {
            // 使用生成的精美水墨风主地图背景
            const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'basemap_bg');
            bg.setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
            // 轻微半透明遮罩，让程序绘制的UI更清晰
            const overlay = this.add.graphics();
            overlay.fillStyle(0xffffff, 0.08);
            overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        } else {
            // fallback：程序绘制的水墨背景
            const g = this.add.graphics();
            g.fillStyle(COLORS.PAPER, 1);
            g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

            for (let i = 0; i < 30; i++) {
                const x = Phaser.Math.Between(0, GAME_WIDTH);
                const y = Phaser.Math.Between(0, GAME_HEIGHT);
                const radius = Phaser.Math.Between(40, 180);
                const alpha = Phaser.Math.FloatBetween(0.02, 0.07);
                g.fillStyle(COLORS.INK_LIGHT, alpha);
                g.fillCircle(x, y, radius);
            }
        }
    }

    /**
     * 建建筑（识别背景图元素，悬停时建筑变亮+放大，无任何边框）
     */
    buildBuildings() {
        // 根据背景图元素位置设置交互区域
        // 背景图：左侧洞府山洞、中央大殿、右侧青色圆形练功台、右下方小溪出口

        // ===== 洞府（左侧山洞）=====
        this.createBuildingHighlight({
            x: 200, y: 390, width: 170, height: 150,
            shape: 'rect',
            name: '洞府', hint: '点击进入洞府（家）',
            onClick: () => this.enterDongfu()
        });
        this.interactables.push({ x: 200, y: 390, radius: 85, name: '洞府', action: 'dongfu' });

        // ===== 宗门大殿（正中间整个大殿建筑）=====
        this.createBuildingHighlight({
            x: 590, y: 290, width: 290, height: 210,
            shape: 'rect',
            name: '宗门大殿', hint: '点击进入宗门大殿',
            onClick: () => this.enterSectHall()
        });
        this.interactables.push({ x: 590, y: 290, radius: 110, name: '宗门大殿', action: 'secthall' });

        // ===== 练功台（右侧青色圆形小建筑）=====
        this.createBuildingHighlight({
            x: 905, y: 360, width: 130, height: 130,
            shape: 'circle',
            name: '练功台', hint: '点击进入练功台',
            onClick: () => this.enterTrainingGround()
        });
        this.interactables.push({ x: 905, y: 360, radius: 65, name: '练功台', action: 'training' });

        // ===== 功法阁（练功台旁边的建筑）=====
        this.createBuildingHighlight({
            x: 1050, y: 300, width: 150, height: 150,
            shape: 'rect',
            name: '功法阁', hint: '点击进入功法阁学习功法',
            onClick: () => this.enterGongfaPavilion()
        });
        this.interactables.push({ x: 1050, y: 300, radius: 75, name: '功法阁', action: 'gongfa' });

        // ===== 宗门大门/出口（右下方小溪）=====
        this.createBuildingHighlight({
            x: 855, y: 610, width: 190, height: 130,
            shape: 'rect',
            name: '宗门出口', hint: '点击出门前往世界地图',
            onClick: () => this.enterWorldMap()
        });
        this.interactables.push({ x: 855, y: 610, radius: 70, name: '宗门大门', action: 'worldmap' });

        // ===== 宗门灵田（背景图上的农田区域，点击进入灵田场景）=====
        this.createBuildingHighlight({
            x: 420, y: 590, width: 280, height: 160,
            shape: 'rect',
            name: '宗门灵田', hint: '点击进入灵田种植灵药',
            onClick: () => this.enterFarmScene('sect')
        });
        this.interactables.push({ x: 420, y: 590, radius: 90, name: '宗门灵田', action: 'farm' });

        // 建筑提示文字
        this.buildingHint = this.add.text(0, 0, '', {
            fontFamily: '楷体, KaiTi, serif', fontSize: '16px', color: '#fff',
            backgroundColor: 'rgba(0,0,0,0.6)', padding: { x: 12, y: 5 }
        }).setOrigin(0.5).setAlpha(0).setDepth(1000);
    }

    /**
     * 创建建筑交互（无任何视觉高亮，只保留鼠标手型和文字提示，不影响游戏画面）
     * @param {object} config - {x, y, width, height, shape, name, hint, onClick}
     */
    createBuildingHighlight(config) {
        const { x, y, width, height, name, hint, onClick } = config;

        // 保存点击区域到全局数组（供全局点击事件使用）
        this.buildingClickAreas.push({ x, y, width, height, name, onClick });

        // 名称标签（悬停时显示，简单文字无方框）
        const nameTag = this.add.text(x, y - height / 2 - 20, name, {
            fontFamily: '楷体, KaiTi, serif', fontSize: '18px', color: '#ffd700',
            stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5).setAlpha(0).setDepth(100);

        // 可点击区域（完全透明，只响应鼠标）
        const hitZone = this.add.zone(x, y, width, height).setInteractive({ useHandCursor: true });
        hitZone.setDepth(99);

        // 悬停进入：显示名称和提示
        hitZone.on('pointerover', () => {
            nameTag.setAlpha(1);
            this.showBuildingHint(x, y - height / 2 - 50, hint);
        });

        // 悬停离开：隐藏
        hitZone.on('pointerout', () => {
            nameTag.setAlpha(0);
            this.hideBuildingHint();
        });

        // 点击（Phaser输入系统，作为备用）
        hitZone.on('pointerdown', () => {
            if (this.uiLocked) return;  // UI锁定时禁止点击建筑
            onClick();
        });

        return { nameTag, hitZone };
    }

    /**
     * 显示建筑悬停提示
     */
    showBuildingHint(x, y, text) {
        if (this.buildingHint) {
            this.buildingHint.setPosition(x, y);
            this.buildingHint.setText(text);
            this.buildingHint.setAlpha(1);
        }
    }

    /**
     * 隐藏建筑悬停提示
     */
    hideBuildingHint() {
        if (this.buildingHint) {
            this.buildingHint.setAlpha(0);
        }
    }

    /**
     * 进入洞府场景
     */
    enterDongfu() {
        console.log('[主地图] 进入洞府');
        // 保存完整的player对象到全局状态，供洞府场景使用
        if (!window.gameState) window.gameState = {};
        window.gameState.player = {
            hp: this.player.hp,
            maxHp: this.player.maxHp,
            qi: this.player.qi,
            maxQi: this.player.maxQi,
            playerName: this.player.name,
            playerObject: this.player
        };
        this.scene.start('DongfuScene');
    }

    /**
     * 进入练功台场景
     */
    enterTrainingGround() {
        console.log('[主地图] 进入练功台');
        // 保存完整的player对象到全局状态，供练功台场景使用
        if (!window.gameState) window.gameState = {};
        if (!window.gameState.player) window.gameState.player = {};
        window.gameState.player.playerObject = this.player;
        console.log('[主地图] 已保存player到全局状态:', this.player);
        this.scene.start('TrainingGroundScene');
    }

    /**
     * 进入宗门大殿场景
     */
    enterSectHall() {
        console.log('[主地图] 进入宗门大殿');
        // 保存玩家数据到全局状态
        if (!window.gameState) window.gameState = {};
        window.gameState.player = this.player;
        this.scene.start('SectHallScene');
    }

    /**
     * 进入功法阁
     */
    enterGongfaPavilion() {
        console.log('[主地图] 进入功法阁');
        // 保存玩家数据到全局状态
        if (!window.gameState) window.gameState = {};
        window.gameState.player = this.player;
        this.scene.start('GongfaPavilionScene');
    }

    /**
     * 切换ESC菜单（按ESC键弹出/关闭）
     */
    toggleEscMenu() {
        if (this.escMenuContainer && this.escMenuContainer.active) {
            this.closeEscMenu();
        } else {
            this.openEscMenu();
        }
    }

    /**
     * 打开ESC菜单（保存/退出/继续）
     */
    openEscMenu() {
        this.uiLocked = true;  // 锁定UI，禁止后面的建筑点击和玩家移动
        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2;

        // 半透明遮罩（拦截所有点击，防止穿透到后面的场景）
        const mask = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6)
            .setOrigin(0, 0).setDepth(900).setInteractive();

        // 弹窗背景
        const dialog = this.add.rectangle(cx, cy, 380, 400, 0xf5f0e1, 1)
            .setStrokeStyle(3, 0x8b7355, 1).setDepth(901);

        // 标题
        const title = this.add.text(cx, cy - 120, '【 游戏菜单 】', {
            fontFamily: '楷体, KaiTi, serif', fontSize: '28px', color: '#c44536'
        }).setOrigin(0.5).setDepth(902);

        // 提示
        const hint = this.add.text(cx, cy - 80, '按 ESC 继续游戏', {
            fontFamily: '微软雅黑, sans-serif', fontSize: '13px', color: '#999'
        }).setOrigin(0.5).setDepth(902);

        // 按钮列表
        const buttons = [
            { text: '▶ 继续游戏', color: 0x5a8c3a, action: () => this.closeEscMenu() },
            { text: '💾 存档管理', color: 0x3a6b8c, action: () => this.openSaveManager() },
            { text: '⚙ 设置', color: 0x6b5b95, action: () => this.openSettingsMenu() },
            { text: '❓ 帮助', color: 0x3a8c8c, action: () => this.openHelpMenu() },
            { text: '🏠 返回登录', color: 0xc9a84c, action: () => this.backToLogin() }
        ];

        const btnElements = [];
        buttons.forEach((btn, i) => {
            const by = cy - 50 + i * 52;
            const btnBg = this.add.rectangle(cx, by, 260, 42, btn.color, 0.9)
                .setStrokeStyle(2, 0x4a3728, 0.5).setInteractive({ useHandCursor: true }).setDepth(901);
            const btnText = this.add.text(cx, by, btn.text, {
                fontFamily: '楷体, KaiTi, serif', fontSize: '18px', color: '#fff'
            }).setOrigin(0.5).setDepth(902);

            btnBg.on('pointerover', () => btnBg.setScale(1.05));
            btnBg.on('pointerout', () => btnBg.setScale(1));
            btnBg.on('pointerdown', btn.action);

            btnElements.push(btnBg, btnText);
        });

        // 保存容器
        this.escMenuContainer = this.add.container(0, 0, [
            mask, dialog, title, hint, ...btnElements
        ]).setDepth(900);
    }

    /**
     * 关闭ESC菜单
     */
    closeEscMenu() {
        if (this.escMenuContainer) {
            this.escMenuContainer.destroy();
            this.escMenuContainer = null;
        }
        this.uiLocked = false;  // 解除UI锁定
    }

    /**
     * 从菜单保存游戏
     */
    saveGameFromMenu() {
        const slotKey = this.registry.get('selectedSaveSlot') || 'xiuxian_save_1';
        if (typeof SaveSystem !== 'undefined') {
            SaveSystem.saveToSlot(slotKey, this.player);
        }
        // 保存成功提示
        const cx = GAME_WIDTH / 2, cy = GAME_HEIGHT / 2;
        const tip = this.add.text(cx, cy + 130, '✓ 游戏已保存！', {
            fontFamily: '楷体, KaiTi, serif', fontSize: '20px', color: '#5a8c3a',
            backgroundColor: 'rgba(245,240,225,0.95)', padding: { x: 20, y: 8 }
        }).setOrigin(0.5).setDepth(910);
        this.tweens.add({
            targets: tip, alpha: 0, duration: 500, delay: 1200,
            onComplete: () => tip.destroy()
        });
        console.log('[ESC菜单] 游戏已保存到', slotKey);
    }

    /**
     * 返回登录界面
     */
    backToLogin() {
        this.closeEscMenu();
        // 先保存（try-catch确保保存失败也能返回）
        try {
            const slotKey = this.registry.get('selectedSaveSlot') || 'xiuxian_save_1';
            if (typeof SaveSystem !== 'undefined') {
                SaveSystem.saveToSlot(slotKey, this.player);
            }
            console.log('[ESC菜单] 已保存，返回登录界面');
        } catch (e) {
            console.warn('[ESC菜单] 保存失败，但继续返回登录:', e);
        }
        // 延迟切换场景，确保ESC菜单完全关闭
        this.time.delayedCall(100, () => {
            this.scene.start('LoginScene');
        });
    }

    /**
     * 显示关闭游戏提示
     */
    showCloseHint() {
        const cx = GAME_WIDTH / 2, cy = GAME_HEIGHT / 2;
        const tip = this.add.text(cx, cy + 130, '请直接关闭浏览器标签页退出游戏', {
            fontFamily: '微软雅黑, sans-serif', fontSize: '15px', color: '#666',
            backgroundColor: 'rgba(245,240,225,0.95)', padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setDepth(910);
        this.tweens.add({
            targets: tip, alpha: 0, duration: 500, delay: 2000,
            onComplete: () => tip.destroy()
        });
    }

    /**
     * 打开设置菜单（音量、画质等）
     */
    openSettingsMenu() {
        this.closeEscMenu();
        this.uiLocked = true;  // 锁定UI
        // 延迟创建，确保ESC菜单先销毁，避免重叠
        this.time.delayedCall(50, () => this.createSettingsPanel());
    }

    /**
     * 创建设置面板
     */
    createSettingsPanel() {
        const cx = GAME_WIDTH / 2, cy = GAME_HEIGHT / 2;

        const mask = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6)
            .setOrigin(0, 0).setDepth(900);
        const dialog = this.add.rectangle(cx, cy, 420, 380, 0xf5f0e1, 1)
            .setStrokeStyle(3, 0x6b5b95, 1).setDepth(901);

        this.add.text(cx, cy - 140, '【 游戏设置 】', {
            fontFamily: '楷体, KaiTi, serif', fontSize: '26px', color: '#6b5b95'
        }).setOrigin(0.5).setDepth(902);

        // 音量设置（占位）
        this.add.text(cx - 150, cy - 80, '🔊 音量', {
            fontFamily: '楷体, KaiTi, serif', fontSize: '18px', color: '#4a3728'
        }).setOrigin(0, 0.5).setDepth(902);
        this.add.text(cx + 130, cy - 80, '80%', {
            fontFamily: 'Arial', fontSize: '16px', color: '#6b5b95'
        }).setOrigin(1, 0.5).setDepth(902);
        // 音量条
        this.add.rectangle(cx, cy - 55, 300, 8, 0xddd, 0.8).setDepth(902);
        this.add.rectangle(cx - 150, cy - 55, 240, 8, 0x6b5b95, 0.9).setOrigin(0, 0.5).setDepth(902);

        // 画质设置（占位）
        this.add.text(cx - 150, cy - 20, '🖼 画质', {
            fontFamily: '楷体, KaiTi, serif', fontSize: '18px', color: '#4a3728'
        }).setOrigin(0, 0.5).setDepth(902);
        const qualityBtn = this.add.rectangle(cx + 80, cy - 20, 100, 32, 0x6b5b95, 0.8)
            .setInteractive({ useHandCursor: true }).setDepth(901);
        this.add.text(cx + 80, cy - 20, '高清', {
            fontFamily: '楷体, KaiTi, serif', fontSize: '15px', color: '#fff'
        }).setOrigin(0.5).setDepth(902);
        qualityBtn.on('pointerdown', () => {
            this.showToast('画质切换功能开发中...');
        });

        // 显示FPS
        this.add.text(cx - 150, cy + 25, '📊 显示FPS', {
            fontFamily: '楷体, KaiTi, serif', fontSize: '18px', color: '#4a3728'
        }).setOrigin(0, 0.5).setDepth(902);
        const fpsBtn = this.add.rectangle(cx + 80, cy + 25, 100, 32, 0x8b8680, 0.8)
            .setInteractive({ useHandCursor: true }).setDepth(901);
        this.add.text(cx + 80, cy + 25, '关闭', {
            fontFamily: '楷体, KaiTi, serif', fontSize: '15px', color: '#fff'
        }).setOrigin(0.5).setDepth(902);
        fpsBtn.on('pointerdown', () => {
            this.showToast('FPS显示功能开发中...');
        });

        // 返回按钮
        const backBtn = this.add.rectangle(cx, cy + 100, 160, 40, 0x8b7355, 0.9)
            .setStrokeStyle(2, 0x4a3728, 0.5).setInteractive({ useHandCursor: true }).setDepth(901);
        this.add.text(cx, cy + 100, '← 返回菜单', {
            fontFamily: '楷体, KaiTi, serif', fontSize: '17px', color: '#fff'
        }).setOrigin(0.5).setDepth(902);

        const container = this.add.container(0, 0, [
            mask, dialog, qualityBtn, fpsBtn, backBtn
        ]).setDepth(900);

        backBtn.on('pointerdown', () => {
            container.destroy();
            this.uiLocked = false;
            this.openEscMenu();
        });
        mask.on('pointerdown', () => {
            container.destroy();
            this.uiLocked = false;
        });
    }

    /**
     * 打开帮助菜单（操作说明）
     */
    openHelpMenu() {
        this.closeEscMenu();
        this.uiLocked = true;  // 锁定UI
        this.time.delayedCall(50, () => this.createHelpPanel());
    }

    /**
     * 创建帮助面板
     */
    createHelpPanel() {
        const cx = GAME_WIDTH / 2, cy = GAME_HEIGHT / 2;

        const mask = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6)
            .setOrigin(0, 0).setDepth(900);
        const dialog = this.add.rectangle(cx, cy, 480, 460, 0xf5f0e1, 1)
            .setStrokeStyle(3, 0x3a8c8c, 1).setDepth(901);

        this.add.text(cx, cy - 190, '【 操作帮助 】', {
            fontFamily: '楷体, KaiTi, serif', fontSize: '26px', color: '#3a8c8c'
        }).setOrigin(0.5).setDepth(902);

        const helpText = `
🖱 鼠标点击建筑 → 进入对应场景
🖱 鼠标点击灵田 → 进入种植界面
⌨ 按 B 键 → 打开/关闭背包
⌨ 按 ESC 键 → 打开游戏菜单

🏠 洞府：休息回满状态，后续可种田
🧘 练功台：修炼增加修为（开发中）
🏛 宗门大殿：领取任务（开发中）
🌾 宗门灵田：种植灵药，收获材料
🚪 宗门大门：前往世界地图打怪

⚔ 战斗：站桩回合制，消耗灵气放技能
📈 熟练度：多用技能提升熟练度，增加伤害
💾 存档：ESC菜单保存，或自动保存
        `.trim();

        this.add.text(cx, cy - 10, helpText, {
            fontFamily: '微软雅黑, sans-serif',
            fontSize: '14px',
            color: '#4a3728',
            lineSpacing: 6,
            align: 'left'
        }).setOrigin(0.5).setDepth(902);

        // 返回按钮
        const backBtn = this.add.rectangle(cx, cy + 170, 160, 40, 0x8b7355, 0.9)
            .setStrokeStyle(2, 0x4a3728, 0.5).setInteractive({ useHandCursor: true }).setDepth(901);
        this.add.text(cx, cy + 170, '← 返回菜单', {
            fontFamily: '楷体, KaiTi, serif', fontSize: '17px', color: '#fff'
        }).setOrigin(0.5).setDepth(902);

        const container = this.add.container(0, 0, [mask, dialog, backBtn]).setDepth(900);

        backBtn.on('pointerdown', () => {
            container.destroy();
            this.uiLocked = false;
            this.openEscMenu();
        });
        mask.on('pointerdown', () => {
            container.destroy();
            this.uiLocked = false;
        });
    }

    /**
     * 打开存档管理面板（用HTML面板，确保按钮点击不被遮挡）
     */
    openSaveManager() {
        this.closeEscMenu();
        this.uiLocked = true;  // 锁定UI
        this.time.delayedCall(50, () => this.renderSaveManagerHTML());
    }

    /**
     * 渲染HTML存档管理面板
     */
    renderSaveManagerHTML() {
        const panel = document.getElementById('save-manager-panel');
        if (!panel) return;
        panel.style.display = 'block';

        const currentSlot = this.registry.get('selectedSaveSlot') || 'xiuxian_save_1';
        document.getElementById('save-current-slot').textContent = '当前存档：' + currentSlot.replace('xiuxian_save_', '存档');

        const container = document.getElementById('save-slots-container');
        container.innerHTML = '';

        for (let i = 0; i < 3; i++) {
            const slotKey = `xiuxian_save_${i + 1}`;
            const isCurrent = slotKey === currentSlot;

            // 读取存档数据
            let saveData = null;
            try {
                const data = localStorage.getItem(slotKey);
                saveData = data ? JSON.parse(data) : null;
            } catch (e) { saveData = null; }

            // 创建存档位div
            const slotDiv = document.createElement('div');
            slotDiv.style.cssText = `background:${isCurrent ? '#e8f0f5' : '#fff'}; border:2px solid ${isCurrent ? '#3a6b8c' : '#ccc'}; border-radius:6px; padding:12px; margin-bottom:10px; display:flex; align-items:center;`;

            // 左侧信息
            const infoDiv = document.createElement('div');
            infoDiv.style.cssText = 'flex:1;';

            const titleSpan = document.createElement('div');
            titleSpan.style.cssText = `font-size:15px; color:${isCurrent ? '#3a6b8c' : '#8b7355'}; margin-bottom:4px; font-weight:bold;`;
            titleSpan.textContent = `存档 ${i + 1}${isCurrent ? '（当前）' : ''}`;
            infoDiv.appendChild(titleSpan);

            if (saveData) {
                const playerName = saveData.playerName || '无名道友';
                const saveTime = new Date(saveData.saveTime || Date.now()).toLocaleString();
                // 境界层数显示（练气1-9层，后面筑基、金丹等也是1-9层）
                const levelNames = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
                const realmLevelName = levelNames[(saveData.realmLevel || 1) - 1] || '一';
                const realmName = (saveData.realm || '炼气期').replace('期', '');
                const infoText = document.createElement('div');
                infoText.style.cssText = 'font-size:12px; color:#4a3728; line-height:1.6; font-family:微软雅黑,sans-serif;';
                infoText.innerHTML = `【${playerName}】 ${realmName}${realmLevelName}层<br>` +
                    `气血${Math.floor(saveData.hp || 100)}/${saveData.maxHp || 100}  灵气${saveData.qi || 5}/${saveData.maxQi || 5}<br>` +
                    `${saveTime}`;
                infoDiv.appendChild(infoText);
            } else {
                const emptyText = document.createElement('div');
                emptyText.style.cssText = 'font-size:14px; color:#999;';
                emptyText.textContent = '【 空存档 】点击右侧"保存"写入当前进度';
                infoDiv.appendChild(emptyText);
            }

            slotDiv.appendChild(infoDiv);

            // 右侧按钮
            const btnDiv = document.createElement('div');
            btnDiv.style.cssText = 'display:flex; flex-direction:column; gap:6px; margin-left:10px;';

            // 保存按钮
            const saveBtn = document.createElement('button');
            saveBtn.textContent = '保存';
            saveBtn.style.cssText = 'padding:6px 16px; font-size:14px; font-family:楷体,KaiTi,serif; background:#3a6b8c; color:#fff; border:none; border-radius:4px; cursor:pointer;';
            saveBtn.onclick = () => {
                if (typeof SaveSystem !== 'undefined') {
                    SaveSystem.saveToSlot(slotKey, this.player);
                }
                this.showToast(`已保存到存档 ${i + 1}`);
                this.renderSaveManagerHTML();
            };
            btnDiv.appendChild(saveBtn);

            // 读取按钮（只有非当前存档且有数据时可读取）
            if (saveData && !isCurrent) {
                const loadBtn = document.createElement('button');
                loadBtn.textContent = '读取';
                loadBtn.style.cssText = 'padding:6px 16px; font-size:14px; font-family:楷体,KaiTi,serif; background:#5a8c3a; color:#fff; border:none; border-radius:4px; cursor:pointer;';
                loadBtn.onclick = () => {
                    if (confirm(`确定读取存档 ${i + 1} 吗？\n当前未保存进度将丢失！`)) {
                        this.registry.set('selectedSaveSlot', slotKey);
                        this.registry.set('playerName', saveData.playerName || '道友');
                        this.closeSaveManagerHTML();
                        this.scene.restart();
                    }
                };
                btnDiv.appendChild(loadBtn);
            } else if (isCurrent) {
                const currentLabel = document.createElement('div');
                currentLabel.style.cssText = 'font-size:12px; color:#999; text-align:center;';
                currentLabel.textContent = '当前使用中';
                btnDiv.appendChild(currentLabel);
            }

            // 删除按钮（有存档时显示）
            if (saveData) {
                const delBtn = document.createElement('button');
                delBtn.textContent = '删除';
                delBtn.style.cssText = 'padding:6px 16px; font-size:14px; font-family:楷体,KaiTi,serif; background:#c44536; color:#fff; border:none; border-radius:4px; cursor:pointer;';
                delBtn.onclick = () => {
                    if (confirm(`确定删除存档 ${i + 1}（${saveData.playerName || '无名道友'}）吗？\n此操作不可撤销！`)) {
                        try {
                            localStorage.removeItem(slotKey);
                            console.log(`[存档管理] 存档 ${i + 1} 已删除`);
                        } catch (e) {
                            console.warn('[存档管理] 删除失败:', e);
                        }
                        this.showToast(`存档 ${i + 1} 已删除`);
                        this.renderSaveManagerHTML();
                    }
                };
                btnDiv.appendChild(delBtn);
            }

            slotDiv.appendChild(btnDiv);
            container.appendChild(slotDiv);
        }
    }

    /**
     * 关闭HTML存档管理面板
     */
    closeSaveManagerHTML() {
        const panel = document.getElementById('save-manager-panel');
        if (panel) panel.style.display = 'none';
        this.uiLocked = false;  // 解除UI锁定
    }

    /**
     * 创建存档管理面板（所有元素都加入container，确保点击不被遮挡）
     */
    createSaveManagerPanel() {
        const cx = GAME_WIDTH / 2, cy = GAME_HEIGHT / 2;
        const currentSlot = this.registry.get('selectedSaveSlot') || 'xiuxian_save_1';

        // 所有元素都加入这个数组，最后一起加入container
        const elements = [];

        // 遮罩
        const mask = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6)
            .setOrigin(0, 0).setInteractive();
        elements.push(mask);

        // 面板背景
        const dialog = this.add.rectangle(cx, cy, 520, 480, 0xf5f0e1, 1)
            .setStrokeStyle(3, 0x3a6b8c, 1);
        elements.push(dialog);

        // 标题
        const titleText = this.add.text(cx, cy - 200, '【 存档管理 】', {
            fontFamily: '楷体, KaiTi, serif', fontSize: '26px', color: '#3a6b8c'
        }).setOrigin(0.5);
        elements.push(titleText);

        // 当前存档提示
        const currentText = this.add.text(cx, cy - 165, '当前存档：' + currentSlot.replace('xiuxian_save_', '存档'), {
            fontFamily: '微软雅黑, sans-serif', fontSize: '13px', color: '#666'
        }).setOrigin(0.5);
        elements.push(currentText);

        const slotY = [cy - 100, cy + 10, cy + 120];

        for (let i = 0; i < 3; i++) {
            const y = slotY[i];
            const slotKey = `xiuxian_save_${i + 1}`;
            const isCurrent = slotKey === currentSlot;

            // 存档框
            const slotBg = this.add.rectangle(cx, y, 460, 90, isCurrent ? 0xe8f0f5 : 0xffffff, 0.9)
                .setStrokeStyle(2, isCurrent ? 0x3a6b8c : 0xccc, 1);
            elements.push(slotBg);

            // 存档编号
            const slotNumText = this.add.text(cx - 210, y - 25, `存档 ${i + 1}${isCurrent ? '（当前）' : ''}`, {
                fontFamily: '楷体, serif', fontSize: '15px', color: isCurrent ? '#3a6b8c' : '#8b7355'
            }).setOrigin(0, 0.5);
            elements.push(slotNumText);

            // 读取存档数据
            let saveData = null;
            try {
                const data = localStorage.getItem(slotKey);
                saveData = data ? JSON.parse(data) : null;
            } catch (e) { saveData = null; }

            if (saveData) {
                const playerName = saveData.playerName || '无名道友';
                const saveTime = new Date(saveData.saveTime || Date.now()).toLocaleString();
                // 境界层数显示（练气1-9层，后面筑基、金丹等也是1-9层）
                const levelNames = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
                const realmLevelName = levelNames[(saveData.realmLevel || 1) - 1] || '一';
                const realmName = (saveData.realm || '炼气期').replace('期', '');
                const info = `【${playerName}】 ${realmName}${realmLevelName}层\n` +
                             `气血${Math.floor(saveData.hp || 100)}/${saveData.maxHp || 100}  灵气${saveData.qi || 5}/${saveData.maxQi || 5}\n` +
                             `${saveTime}`;
                const infoText = this.add.text(cx - 210, y + 8, info, {
                    fontFamily: '微软雅黑, sans-serif', fontSize: '11px', color: '#4a3728', lineSpacing: 3
                }).setOrigin(0, 0.5);
                elements.push(infoText);

                // 删除按钮（右上角红色小方块）
                const delBtnBg = this.add.rectangle(cx + 215, y - 32, 36, 30, 0xc44536, 0.95)
                    .setStrokeStyle(1, 0x8b2020, 1).setInteractive({ useHandCursor: true });
                const delBtnText = this.add.text(cx + 215, y - 32, '删除', {
                    fontFamily: '楷体, serif', fontSize: '12px', color: '#fff', fontWeight: 'bold'
                }).setOrigin(0.5);
                elements.push(delBtnBg, delBtnText);

                delBtnBg.on('pointerover', () => delBtnBg.setFillStyle(0xa03828, 1));
                delBtnBg.on('pointerout', () => delBtnBg.setFillStyle(0xc44536, 0.95));
                delBtnBg.on('pointerdown', (pointer) => {
                    pointer.stopPropagation();
                    // 直接删除
                    try {
                        localStorage.removeItem(slotKey);
                        console.log(`[存档管理] 存档 ${i + 1}（${playerName}）已删除`);
                    } catch (e) {
                        console.warn('[存档管理] 删除失败:', e);
                    }
                    this.showToast(`存档 ${i + 1} 已删除`);
                    container.destroy();
                    this.time.delayedCall(100, () => this.openSaveManager());
                });
            } else {
                const emptyText = this.add.text(cx - 210, y + 5, '【 空存档 】\n点击右侧"保存"写入当前进度', {
                    fontFamily: '楷体, serif', fontSize: '14px', color: '#999', lineSpacing: 5
                }).setOrigin(0, 0.5);
                elements.push(emptyText);
            }

            // 保存按钮
            const saveBtn = this.add.rectangle(cx + 150, y - 15, 80, 30, 0x3a6b8c, 0.9)
                .setInteractive({ useHandCursor: true });
            const saveBtnText = this.add.text(cx + 150, y - 15, '保存', {
                fontFamily: '楷体, serif', fontSize: '14px', color: '#fff'
            }).setOrigin(0.5);
            elements.push(saveBtn, saveBtnText);

            saveBtn.on('pointerdown', () => {
                if (typeof SaveSystem !== 'undefined') {
                    SaveSystem.saveToSlot(slotKey, this.player);
                }
                this.showToast(`已保存到存档 ${i + 1}`);
                container.destroy();
                this.time.delayedCall(100, () => this.openSaveManager());
            });

            // 读取按钮（只有非当前存档且有数据时可读取）
            if (saveData && !isCurrent) {
                const loadBtn = this.add.rectangle(cx + 150, y + 20, 80, 30, 0x5a8c3a, 0.9)
                    .setInteractive({ useHandCursor: true });
                const loadBtnText = this.add.text(cx + 150, y + 20, '读取', {
                    fontFamily: '楷体, serif', fontSize: '14px', color: '#fff'
                }).setOrigin(0.5);
                elements.push(loadBtn, loadBtnText);

                loadBtn.on('pointerdown', () => {
                    this.showConfirmDialog('读取存档', `确定读取存档 ${i + 1} 吗？\n当前未保存进度将丢失！`, () => {
                        this.registry.set('selectedSaveSlot', slotKey);
                        this.registry.set('playerName', saveData.playerName || '道友');
                        container.destroy();
                        this.scene.restart();
                    });
                });
            } else if (isCurrent) {
                const currentUseText = this.add.text(cx + 150, y + 20, '当前使用中', {
                    fontFamily: '楷体, serif', fontSize: '12px', color: '#999'
                }).setOrigin(0.5);
                elements.push(currentUseText);
            }
        }

        // 返回按钮
        const backBtn = this.add.rectangle(cx, cy + 205, 160, 40, 0x8b7355, 0.9)
            .setStrokeStyle(2, 0x4a3728, 0.5).setInteractive({ useHandCursor: true });
        const backBtnText = this.add.text(cx, cy + 205, '← 返回菜单', {
            fontFamily: '楷体, KaiTi, serif', fontSize: '17px', color: '#fff'
        }).setOrigin(0.5);
        elements.push(backBtn, backBtnText);

        // 所有元素加入container
        const container = this.add.container(0, 0, elements).setDepth(950);

        backBtn.on('pointerdown', () => {
            container.destroy();
            this.openEscMenu();
        });
        mask.on('pointerdown', () => {
            container.destroy();
        });
    }

    /**
     * 显示确认对话框
     */
    showConfirmDialog(title, message, onConfirm) {
        const cx = GAME_WIDTH / 2, cy = GAME_HEIGHT / 2;
        const mask = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7)
            .setOrigin(0, 0).setDepth(950).setInteractive();
        const dialog = this.add.rectangle(cx, cy, 380, 200, 0xf5f0e1, 1)
            .setStrokeStyle(3, 0xc44536, 1).setDepth(951);

        const titleText = this.add.text(cx, cy - 55, title, {
            fontFamily: '楷体, KaiTi, serif', fontSize: '22px', color: '#c44536'
        }).setOrigin(0.5).setDepth(952);

        const msgText = this.add.text(cx, cy - 5, message, {
            fontFamily: '微软雅黑, sans-serif', fontSize: '14px', color: '#4a3728',
            align: 'center', lineSpacing: 5
        }).setOrigin(0.5).setDepth(952);

        const confirmBtn = this.add.rectangle(cx - 70, cy + 50, 110, 38, 0xc44536, 0.9)
            .setInteractive({ useHandCursor: true }).setDepth(951);
        const confirmText = this.add.text(cx - 70, cy + 50, '确认', {
            fontFamily: '楷体, serif', fontSize: '16px', color: '#fff'
        }).setOrigin(0.5).setDepth(952);

        const cancelBtn = this.add.rectangle(cx + 70, cy + 50, 110, 38, 0x8b8680, 0.9)
            .setInteractive({ useHandCursor: true }).setDepth(951);
        const cancelText = this.add.text(cx + 70, cy + 50, '取消', {
            fontFamily: '楷体, serif', fontSize: '16px', color: '#fff'
        }).setOrigin(0.5).setDepth(952);

        // 所有元素加入container，确保销毁时一起清理
        const container = this.add.container(0, 0, [
            mask, dialog, titleText, msgText, confirmBtn, confirmText, cancelBtn, cancelText
        ]).setDepth(950);

        confirmBtn.on('pointerdown', () => {
            container.destroy();
            if (onConfirm) onConfirm();
        });
        cancelBtn.on('pointerdown', () => {
            container.destroy();
        });
        mask.on('pointerdown', () => {
            container.destroy();
        });
    }

    setupInput() {
        // 主地图不显示人物，不需要移动玩家
        // 只保留空方法，避免调用报错
        this.input.on('pointerdown', (pointer) => {
            // UI锁定时不做任何事
            if (this.uiLocked) return;
            // 主地图纯点击交互，不需要移动
        });
    }

    showClickMark(x, y) {
        const mark = this.add.circle(x, y, 5, COLORS.CINNABAR, 0.8);
        this.tweens.add({
            targets: mark, alpha: 0, scale: 2, duration: 500,
            onComplete: () => mark.destroy()
        });
    }

    createTopUI() {
        // 右上角境界文字（练气1-9层，后面筑基、金丹等也是1-9层）
        const levelNames = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
        const realmLevelName = levelNames[(this.player.realmLevel || 1) - 1] || '一';
        const realmName = (this.player.realm || '炼气期').replace('期', '');
        this.realmText = this.add.text(GAME_WIDTH - 20, 20, `${realmName}${realmLevelName}层`, {
            fontFamily: '楷体, KaiTi, serif', fontSize: '18px', color: '#c44536',
            backgroundColor: 'rgba(245,240,225,0.8)', padding: { x: 10, y: 4 }
        }).setOrigin(1, 0).setDepth(50);

        // 交互提示
        this.interactHint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 50, '', {
            fontFamily: '微软雅黑, sans-serif', fontSize: '16px', color: '#ffffff',
            backgroundColor: 'rgba(0,0,0,0.6)', padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setAlpha(0).setDepth(100);

        // ===== 左上角紧凑状态栏（水墨风HTML）=====
        this.createCompactStatusBar();

        // ===== 任务面板更新（合并到之前设计的任务UI里）=====
        this.updateQuestPanel();
    }

    /**
     * 创建左上角紧凑状态栏（头像+血条+灵气+经验）
     */
    createCompactStatusBar() {
        // PLAYER_IMAGE_DATA 是一个base64字符串，直接用
        const playerImg = window.PLAYER_IMAGE_DATA || '';

        const bar = document.createElement('div');
        bar.id = 'compact-status-bar';
        bar.style.cssText = `
            position:fixed; bottom:15px; left:15px; z-index:500;
            display:flex; align-items:flex-start; gap:10px;
            background:linear-gradient(135deg, rgba(245,240,225,0.95), rgba(230,220,200,0.92));
            border:2px solid #5c4a32; border-radius:10px;
            padding:10px 14px 10px 10px;
            box-shadow:0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.5);
            font-family:'楷体',KaiTi,serif;
        `;

        // 圆形头像
        const avatar = document.createElement('div');
        avatar.style.cssText = `
            width:56px; height:56px; border-radius:50%;
            border:2px solid #8b7355; overflow:hidden;
            background:#fff; flex-shrink:0;
            box-shadow:0 2px 8px rgba(0,0,0,0.2);
        `;
        const avatarImg = document.createElement('img');
        avatarImg.src = playerImg;
        avatarImg.style.cssText = 'width:100%; height:100%; object-fit:cover;';
        avatar.appendChild(avatarImg);
        bar.appendChild(avatar);

        // 右侧信息区
        const infoContainer = document.createElement('div');
        infoContainer.style.cssText = 'display:flex; flex-direction:column; gap:5px; width:200px;';

        // 角色名和境界
        const nameRow = document.createElement('div');
        nameRow.style.cssText = 'display:flex; justify-content:space-between; align-items:center;';
        const nameText = document.createElement('span');
        nameText.id = 'compact-name-text';
        nameText.style.cssText = 'font-size:14px; color:#4a3728; font-weight:bold;';
        nameText.textContent = '道友';
        const realmText = document.createElement('span');
        realmText.id = 'compact-realm-text';
        realmText.style.cssText = 'font-size:12px; color:#c44536; font-weight:bold;';
        realmText.textContent = '炼气一层';
        nameRow.appendChild(nameText);
        nameRow.appendChild(realmText);
        infoContainer.appendChild(nameRow);

        // 血条
        const hpRow = document.createElement('div');
        hpRow.style.cssText = 'display:flex; align-items:center; gap:5px;';
        const hpIcon = document.createElement('span');
        hpIcon.style.cssText = 'font-size:11px; width:14px;';
        hpIcon.textContent = '❤';
        const hpBarBg = document.createElement('div');
        hpBarBg.style.cssText = `
            flex:1; height:10px; background:rgba(0,0,0,0.2);
            border-radius:5px; overflow:hidden; border:1px solid #8b3a3a;
        `;
        const hpBarFill = document.createElement('div');
        hpBarFill.id = 'compact-hp-fill';
        hpBarFill.style.cssText = `
            height:100%; background:linear-gradient(90deg,#8b2020,#c44536,#e57373);
            border-radius:4px; transition:width 0.3s; width:100%;
        `;
        hpBarBg.appendChild(hpBarFill);
        const hpText = document.createElement('span');
        hpText.id = 'compact-hp-text';
        hpText.style.cssText = 'font-size:10px; color:#5c2020; width:52px; text-align:right;';
        hpText.textContent = '100/100';
        hpRow.appendChild(hpIcon);
        hpRow.appendChild(hpBarBg);
        hpRow.appendChild(hpText);
        infoContainer.appendChild(hpRow);

        // 灵气条
        const qiRow = document.createElement('div');
        qiRow.style.cssText = 'display:flex; align-items:center; gap:5px;';
        const qiIcon = document.createElement('span');
        qiIcon.style.cssText = 'font-size:11px; width:14px;';
        qiIcon.textContent = '✨';
        const qiBarBg = document.createElement('div');
        qiBarBg.style.cssText = `
            flex:1; height:10px; background:rgba(0,0,0,0.2);
            border-radius:5px; overflow:hidden; border:1px solid #3a5a8c;
        `;
        const qiBarFill = document.createElement('div');
        qiBarFill.id = 'compact-qi-fill';
        qiBarFill.style.cssText = `
            height:100%; background:linear-gradient(90deg,#2a4a7c,#3a6b8c,#6ba3c4);
            border-radius:4px; transition:width 0.3s; width:100%;
        `;
        qiBarBg.appendChild(qiBarFill);
        const qiText = document.createElement('span');
        qiText.id = 'compact-qi-text';
        qiText.style.cssText = 'font-size:10px; color:#2a4a7c; width:52px; text-align:right;';
        qiText.textContent = '5/5';
        qiRow.appendChild(qiIcon);
        qiRow.appendChild(qiBarBg);
        qiRow.appendChild(qiText);
        infoContainer.appendChild(qiRow);

        // 修为条
        const expRow = document.createElement('div');
        expRow.style.cssText = 'display:flex; align-items:center; gap:5px;';
        const expIcon = document.createElement('span');
        expIcon.style.cssText = 'font-size:11px; width:14px;';
        expIcon.textContent = '📈';
        const expBarBg = document.createElement('div');
        expBarBg.style.cssText = `
            flex:1; height:10px; background:rgba(0,0,0,0.2);
            border-radius:5px; overflow:hidden; border:1px solid #8b7020;
        `;
        const expBarFill = document.createElement('div');
        expBarFill.id = 'compact-exp-fill';
        expBarFill.style.cssText = `
            height:100%; background:linear-gradient(90deg,#7a6010,#c9a84c,#e8d080);
            border-radius:4px; transition:width 0.3s; width:0%;
        `;
        expBarBg.appendChild(expBarFill);
        const expText = document.createElement('span');
        expText.id = 'compact-exp-text';
        expText.style.cssText = 'font-size:10px; color:#7a6010; width:52px; text-align:right;';
        expText.textContent = '0/100';
        expRow.appendChild(expIcon);
        expRow.appendChild(expBarBg);
        expRow.appendChild(expText);
        infoContainer.appendChild(expRow);

        // 攻击防御
        const statsRow = document.createElement('div');
        statsRow.style.cssText = 'display:flex; justify-content:space-between; margin-top:2px;';
        const atkText = document.createElement('span');
        atkText.id = 'compact-atk-text';
        atkText.style.cssText = 'font-size:11px; color:#8b2020;';
        atkText.textContent = '攻击:5';
        const defText = document.createElement('span');
        defText.id = 'compact-def-text';
        defText.style.cssText = 'font-size:11px; color:#2a5a8c;';
        defText.textContent = '防御:0';
        statsRow.appendChild(atkText);
        statsRow.appendChild(defText);
        infoContainer.appendChild(statsRow);

        bar.appendChild(infoContainer);
        document.body.appendChild(bar);
        this.compactStatusBar = bar;
    }

    /**
     * 更新左上角紧凑状态栏
     */
    updateCompactStatusBar() {
        if (!this.compactStatusBar || !this.player) return;
        const p = this.player;

        // 角色名
        const nameText = document.getElementById('compact-name-text');
        if (nameText) nameText.textContent = p.name || '道友';

        // 境界（练气1-9层等）
        const realmText = document.getElementById('compact-realm-text');
        if (realmText) {
            const levelNames = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
            const realmLevelName = levelNames[(p.realmLevel || 1) - 1] || '一';
            const realmName = (p.realm || '炼气期').replace('期', '');
            realmText.textContent = `${realmName}${realmLevelName}层`;
        }

        // 血量
        const hpFill = document.getElementById('compact-hp-fill');
        const hpText = document.getElementById('compact-hp-text');
        if (hpFill) hpFill.style.width = Math.max(0, (p.hp / p.maxHp) * 100) + '%';
        if (hpText) hpText.textContent = `${Math.floor(p.hp)}/${p.maxHp}`;

        // 灵气
        const qiFill = document.getElementById('compact-qi-fill');
        const qiText = document.getElementById('compact-qi-text');
        if (qiFill) qiFill.style.width = Math.max(0, (p.qi / p.maxQi) * 100) + '%';
        if (qiText) qiText.textContent = `${p.qi}/${p.maxQi}`;

        // 修为（不是人物经验，是修炼的修为exp / expToLevelUp）
        const expFill = document.getElementById('compact-exp-fill');
        const expText = document.getElementById('compact-exp-text');
        if (expFill) expFill.style.width = Math.min(100, (p.exp / p.expToLevelUp) * 100) + '%';
        if (expText) expText.textContent = `${Math.floor(p.exp)}/${p.expToLevelUp}`;

        // 攻击
        const atkText = document.getElementById('compact-atk-text');
        if (atkText) atkText.textContent = `攻击:${p.attack || 0}`;

        // 防御
        const defText = document.getElementById('compact-def-text');
        if (defText) defText.textContent = `防御:${p.defense || 0}`;
    }

    /**
     * 更新任务面板（合并到之前设计的任务UI里，id为panel-quest）
     */
    updateQuestPanel() {
        const questPanel = document.getElementById('panel-quest');
        const questContent = document.getElementById('quest-content');
        if (!questPanel || !questContent) return;

        // 确保任务列表存在
        if (!window.gameState) window.gameState = {};
        if (!window.gameState.questList) {
            window.gameState.questList = this.createDefaultQuests();
        }
        const questListData = window.gameState.questList;

        // 更新所有任务进度
        this.updateAllQuestProgress(questListData);

        // 清空任务面板
        questContent.innerHTML = '';

        // 显示所有任务（可接取、进行中、已完成）
        let hasQuest = false;

        questListData.forEach(quest => {
            // 已提交的任务不显示
            if (quest.status === 'submitted') return;
            hasQuest = true;

            const isCompleted = quest.status === 'completed';
            const isActive = quest.status === 'active';
            const progressColor = isCompleted ? '#4caf50' : (isActive ? '#ff9800' : '#999');

            const questItem = document.createElement('div');
            questItem.className = 'quest-item';
            questItem.style.cssText = `
                padding:8px; margin-bottom:8px;
                background:rgba(255,255,255,0.5);
                border-left:4px solid ${progressColor};
                border-radius:4px;
                cursor:pointer;
                transition:all 0.2s;
            `;

            // 任务状态标签
            let statusText = '';
            if (quest.status === 'available') statusText = '【可接取】';
            else if (quest.status === 'active') statusText = '【进行中】';
            else if (quest.status === 'completed') statusText = '【可提交】';

            questItem.innerHTML = `
                <div class="quest-name" style="font-size:14px; color:#5a3a1b; font-weight:bold; margin-bottom:4px;">
                    ${isCompleted ? '✅' : (isActive ? '📋' : '📜')} ${quest.name}
                    <span style="font-size:11px; color:${progressColor}; margin-left:5px;">${statusText}</span>
                </div>
                <div class="quest-desc" style="font-size:12px; color:#666; margin-bottom:4px; line-height:1.5;">
                    ${quest.desc}
                </div>
                <div class="quest-progress" style="font-size:12px; color:${progressColor}; font-weight:bold;">
                    进度：${quest.currentProgress || 0}/${quest.targetCount}
                    ${isCompleted ? ' ✓ 可提交' : ''}
                </div>
                <div style="font-size:11px; color:#8b7355; margin-top:3px;">
                    👤 ${quest.npcName} | 奖励：${this.formatQuestRewards(quest.rewards)}
                </div>
            `;

            // 点击任务显示详情或接取/提交
            questItem.addEventListener('click', () => {
                if (quest.status === 'available') {
                    // 接取任务
                    quest.status = 'active';
                    quest.currentProgress = 0;
                    this.showToast(`已接取任务：${quest.name}`);
                    this.updateQuestPanel();
                } else if (quest.status === 'completed') {
                    // 提交任务
                    this.submitQuestFromPanel(quest);
                } else {
                    // 进行中，显示提示
                    this.showToast(`任务进行中：${quest.name}（${quest.currentProgress || 0}/${quest.targetCount}）`);
                }
            });

            questContent.appendChild(questItem);
        });

        if (!hasQuest) {
            questContent.innerHTML = `
                <div style="text-align:center; color:#999; font-size:13px; padding:20px 0;">
                    暂无任务<br>
                    <span style="font-size:11px;">前往宗门大殿接取任务</span>
                </div>
            `;
        }
    }

    /**
     * 更新所有任务进度
     */
    updateAllQuestProgress(questListData) {
        if (!questListData || !this.player || !this.player.inventory) return;

        questListData.forEach(quest => {
            if (quest.status !== 'active') return;

            if (quest.type === 'collect') {
                // 采集任务：检查储物戒物品数量
                const count = this.player.inventory.getItemCount(quest.targetId);
                quest.currentProgress = Math.min(count, quest.targetCount);
                if (quest.currentProgress >= quest.targetCount) {
                    quest.status = 'completed';
                }
            } else if (quest.type === 'kill') {
                // 击杀任务：从全局状态获取击杀数
                if (!window.gameState.killCount) window.gameState.killCount = {};
                const count = window.gameState.killCount[quest.targetId] || 0;
                quest.currentProgress = Math.min(count, quest.targetCount);
                if (quest.currentProgress >= quest.targetCount) {
                    quest.status = 'completed';
                }
            }
        });
    }

    /**
     * 格式化任务奖励显示
     */
    formatQuestRewards(rewards) {
        if (!rewards) return '';
        let text = '';
        if (rewards.lingshi) text += `灵石x${rewards.lingshi} `;
        if (rewards.contribution) text += `贡献x${rewards.contribution} `;
        if (rewards.exp) text += `经验x${rewards.exp} `;
        if (rewards.item) text += `${rewards.item}x${rewards.itemCount}`;
        return text.trim();
    }

    /**
     * 从任务面板提交任务
     */
    submitQuestFromPanel(quest) {
        try {
            console.log('[任务] 提交任务:', quest.name);

            // 扣除采集任务的物品
            if (quest.type === 'collect') {
                const removed = this.player.inventory.removeItem(quest.targetId, quest.targetCount);
                console.log('[任务] 扣除物品:', quest.targetId, 'x', quest.targetCount, '结果:', removed);
            }

            // 发放奖励
            if (quest.rewards.lingshi) {
                this.player.inventory.addItem('lingshi', quest.rewards.lingshi);
                console.log('[任务] 获得灵石:', quest.rewards.lingshi);
            }
            if (quest.rewards.exp) {
                this.player.gainLevelExp(quest.rewards.exp);
                console.log('[任务] 获得经验:', quest.rewards.exp);
            }
            if (quest.rewards.contribution) {
                if (!this.player.contribution) this.player.contribution = 0;
                this.player.contribution += quest.rewards.contribution;
                console.log('[任务] 获得贡献:', quest.rewards.contribution);
            }
            if (quest.rewards.item) {
                this.player.inventory.addItem(quest.rewards.item, quest.rewards.itemCount);
                console.log('[任务] 获得物品:', quest.rewards.item, 'x', quest.rewards.itemCount);
            }

            // 标记任务已提交
            quest.status = 'submitted';

            let rewardMsg = `任务完成！获得：`;
            if (quest.rewards.lingshi) rewardMsg += `灵石x${quest.rewards.lingshi} `;
            if (quest.rewards.contribution) rewardMsg += `贡献x${quest.rewards.contribution} `;
            if (quest.rewards.exp) rewardMsg += `经验x${quest.rewards.exp}`;
            this.showToast(rewardMsg);

            // 保存游戏
            this.saveGame();

            // 立即更新任务面板
            this.updateQuestPanel();

            console.log('[任务] 提交成功！');
        } catch (e) {
            console.error('[任务] 提交失败:', e);
            this.showToast('任务提交失败：' + e.message);
        }
    }

    /**
     * 创建默认任务列表
     */
    createDefaultQuests() {
        return [
            {
                id: 'quest_1', name: '入门试炼', desc: '采集10株聚灵草，上交任务殿。',
                type: 'collect', targetId: 'ling_cao', targetName: '聚灵草', targetCount: 10,
                rewards: { lingshi: 50, contribution: 10, exp: 100 },
                npc: 'npc_zhanglao', npcName: '王长老', difficulty: '简单', diffColor: '#4caf50',
                status: 'available', currentProgress: 0
            },
            {
                id: 'quest_2', name: '妖兽讨伐', desc: '前往妖兽森林，击败5只狼妖。',
                type: 'kill', targetId: 'wolf', targetName: '狼妖', targetCount: 5,
                rewards: { lingshi: 100, contribution: 20, exp: 200 },
                npc: 'npc_shixiong', npcName: '李师兄', difficulty: '中等', diffColor: '#ff9800',
                status: 'available', currentProgress: 0
            },
            {
                id: 'quest_3', name: '灵药培育', desc: '在灵田中种植并收获3株灵茶。',
                type: 'collect', targetId: 'ling_cha', targetName: '灵茶', targetCount: 3,
                rewards: { lingshi: 80, contribution: 15, item: 'ling_cao_seed', itemCount: 5 },
                npc: 'npc_shijie', npcName: '赵师姐', difficulty: '简单', diffColor: '#4caf50',
                status: 'available', currentProgress: 0
            }
        ];
    }

    /**
     * E键交互分发
     */
    handleInteraction() {
        if (!this.nearbyInteractable) return;
        const item = this.nearbyInteractable;

        switch (item.action) {
            case 'dongfu': this.enterDongfu(); break;
            case 'farm': this.enterFarmScene('sect'); break;
            case 'training': this.enterTrainingGround(); break;
            case 'secthall': this.enterSectHall(); break;
            case 'gongfa': this.enterGongfaPavilion(); break;
            case 'worldmap': this.enterWorldMap(); break;
        }
    }

    /**
     * 房屋休息界面
     */
    openRestUI() {
        const popup = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);

        const bg = this.add.rectangle(0, 0, 400, 280, 0xf5f0e1, 0.95)
            .setStrokeStyle(2, 0x8b7355, 1);
        const title = this.add.text(0, -100, '🏠 房屋', {
            fontFamily: '楷体, serif', fontSize: '24px', color: '#4a3728'
        }).setOrigin(0.5);

        // 休息按钮
        const restBtn = this.add.rectangle(-100, -20, 140, 40, 0xc44536, 0.9)
            .setStrokeStyle(2, 0x8b2020, 1).setInteractive({ useHandCursor: true });
        this.add.text(-100, -20, '休息回满状态', {
            fontFamily: '微软雅黑, sans-serif', fontSize: '13px', color: '#fff'
        }).setOrigin(0.5);

        // 仓库按钮
        const storageBtn = this.add.rectangle(100, -20, 140, 40, 0x3a6b8c, 0.9)
            .setStrokeStyle(2, 0x2a4b6c, 1).setInteractive({ useHandCursor: true });
        this.add.text(100, -20, '打开仓库', {
            fontFamily: '微软雅黑, sans-serif', fontSize: '13px', color: '#fff'
        }).setOrigin(0.5);

        // 关闭按钮
        const closeBtn = this.add.rectangle(0, 70, 100, 30, 0x888, 0.8)
            .setInteractive({ useHandCursor: true });
        this.add.text(0, 70, '离开', {
            fontFamily: '微软雅黑, sans-serif', fontSize: '13px', color: '#fff'
        }).setOrigin(0.5);

        popup.add([bg, title, restBtn, storageBtn, closeBtn]);
        popup.setDepth(100);

        restBtn.on('pointerdown', () => {
            this.player.restoreAll();
            popup.destroy();
            this.showToast('已休息，气血灵气回满！');
            this.saveGame();
        });

        storageBtn.on('pointerdown', () => {
            popup.destroy();
            this.openStorage();
        });

        closeBtn.on('pointerdown', () => popup.destroy());
    }

    /**
     * 打开仓库（重制版：HTML DOM，左右分栏，整理+一键转移）
     */
    openStorage() {
        this.uiLocked = true;
        const self = this;

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
            this.uiLocked = false;
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
        leftTitleText.textContent = `📦 仓库 (${this.player.storage.getFilledSlots().length}/999)`;
        leftTitleText.style.cssText = 'font-size:16px; color:#4a3728; font-weight:bold;';
        const sortStorageBtn = document.createElement('button');
        sortStorageBtn.textContent = '整理';
        sortStorageBtn.style.cssText = `
            padding:4px 12px; background:#3a6b8c; color:#fff;
            border:none; border-radius:4px; cursor:pointer;
            font-family:'楷体',KaiTi,serif; font-size:12px;
        `;
        sortStorageBtn.onclick = () => {
            this.player.storage.sort();
            this.saveGame();
            renderStorage();
            this.showToast('仓库已整理！');
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
            // 一键转移：储物戒所有物品存入仓库
            const filled = this.player.inventory.getFilledSlots();
            let transferred = 0;
            for (const slot of filled) {
                if (this.player.storage.addItem(slot.itemId, slot.count)) {
                    this.player.inventory.removeItem(slot.itemId, slot.count);
                    transferred++;
                }
            }
            this.saveGame();
            renderStorage();
            renderInventory();
            this.showToast(`已存入 ${transferred} 种物品！`);
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
            // 一键转移：仓库所有物品取出到储物戒
            const filled = this.player.storage.getFilledSlots();
            let transferred = 0;
            for (const slot of filled) {
                if (this.player.inventory.addItem(slot.itemId, slot.count)) {
                    this.player.storage.removeItem(slot.itemId, slot.count);
                    transferred++;
                }
            }
            this.saveGame();
            renderStorage();
            renderInventory();
            this.showToast(`已取出 ${transferred} 种物品！`);
        };
        middlePanel.appendChild(transferAllToStorageBtn);
        middlePanel.appendChild(transferAllToInventoryBtn);

        // ===== 右侧：储物戒 =====
        const rightPanel = document.createElement('div');
        rightPanel.style.cssText = 'flex:1; display:flex; flex-direction:column; gap:10px;';

        const rightTitle = document.createElement('div');
        rightTitle.style.cssText = 'display:flex; justify-content:space-between; align-items:center;';
        const rightTitleText = document.createElement('span');
        rightTitleText.textContent = `💍 储物戒 (${this.player.inventory.getFilledSlots().length}/50)`;
        rightTitleText.style.cssText = 'font-size:16px; color:#4a3728; font-weight:bold;';
        const sortInventoryBtn = document.createElement('button');
        sortInventoryBtn.textContent = '整理';
        sortInventoryBtn.style.cssText = `
            padding:4px 12px; background:#3a6b8c; color:#fff;
            border:none; border-radius:4px; cursor:pointer;
            font-family:'楷体',KaiTi,serif; font-size:12px;
        `;
        sortInventoryBtn.onclick = () => {
            this.player.inventory.sort();
            this.saveGame();
            renderInventory();
            this.showToast('储物戒已整理！');
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
        footer.textContent = '点击仓库物品取出到储物戒 | 点击储物戒物品存入仓库 | 灵石可叠加10w，其他物品99';
        panel.appendChild(footer);

        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        // 品级颜色
        const qualityColors = ['#ccc', '#4ade80', '#60a5fa', '#facc15', '#ff8c00', '#ef4444'];

        // 渲染仓库
        function renderStorage() {
            storageGrid.innerHTML = '';
            leftTitleText.textContent = `📦 仓库 (${self.player.storage.getFilledSlots().length}/999)`;

            // 显示前100格（滚动加载）
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

                        // 物品图标（用颜色方块代替）
                        const icon = document.createElement('div');
                        icon.style.cssText = `
                            width:24px; height:24px; background:${item.color || '#888'};
                            border-radius:4px; margin-bottom:2px;
                        `;
                        cell.appendChild(icon);

                        // 物品名
                        const name = document.createElement('div');
                        name.textContent = item.name;
                        name.style.cssText = `
                            font-size:9px; color:${quality === 1 ? '#555' : '#333'};
                            text-align:center; line-height:1.1;
                            overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
                            width:100%; padding:0 2px;
                        `;
                        cell.appendChild(name);

                        // 数量
                        const count = document.createElement('div');
                        count.textContent = `x${slot.count}`;
                        count.style.cssText = `
                            position:absolute; bottom:1px; right:3px;
                            font-size:10px; color:#c44536; font-weight:bold;
                        `;
                        cell.appendChild(count);

                        // 点击取出或使用丹药
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
                                    // 显示飘字特效
                                    self.showPillFloatText(item, result);
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

                        const icon = document.createElement('div');
                        icon.style.cssText = `
                            width:24px; height:24px; background:${item.color || '#888'};
                            border-radius:4px; margin-bottom:2px;
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

                        // 点击存入
                        cell.onclick = () => {
                            if (self.player.storage.addItem(slot.itemId, 1)) {
                                self.player.inventory.removeItem(slot.itemId, 1);
                                self.saveGame();
                                renderStorage();
                                renderInventory();
                            } else {
                                self.showToast('仓库已满！');
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
     * 农田种植界面（重制版：支持洞府/宗门两套灵田，格子显示，四阶段生长）
     */
    openFarmUI() {
        // 如果已经打开了，先关闭
        if (this.farmPanel && this.farmPanel.parentNode) {
            this.farmPanel.remove();
        }
        this.uiLocked = true;

        const self = this;
        let currentType = 'sect';  // 默认显示宗门灵田

        // 创建遮罩层
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position:fixed; top:0; left:0; width:100%; height:100%;
            background:rgba(0,0,0,0.6); z-index:9998;
            display:flex; align-items:center; justify-content:center;
        `;

        // 主面板
        const panel = document.createElement('div');
        panel.style.cssText = `
            width:780px; max-height:88vh; overflow-y:auto;
            background:linear-gradient(135deg, #f5f0e1 0%, #e8dcc8 100%);
            border:3px solid #5c4a32; border-radius:12px;
            box-shadow:0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.5);
            padding:20px; position:relative;
            font-family:'楷体',KaiTi,serif;
        `;

        // 水墨装饰角纹
        const cornerDecor = document.createElement('div');
        cornerDecor.style.cssText = `
            position:absolute; top:8px; left:8px; right:8px; bottom:8px;
            border:1px solid #8b7355; border-radius:8px; pointer-events:none; opacity:0.5;
        `;
        panel.appendChild(cornerDecor);

        // 标题
        const title = document.createElement('div');
        title.style.cssText = `
            text-align:center; font-size:26px; color:#3a2a1a;
            font-weight:bold; margin-bottom:5px; letter-spacing:4px;
        `;
        title.innerHTML = '🌿 灵田管理 🌿';
        panel.appendChild(title);

        // 副标题
        const subtitle = document.createElement('div');
        subtitle.style.cssText = `
            text-align:center; font-size:13px; color:#8b5a2b; margin-bottom:15px; letter-spacing:2px;
        `;
        subtitle.textContent = '—— 灵气滋养，万物生长 ——';
        panel.appendChild(subtitle);

        // 标签页切换（洞府/宗门）
        const tabBar = document.createElement('div');
        tabBar.style.cssText = `
            display:flex; justify-content:center; gap:10px; margin-bottom:15px;
        `;

        const tabDongfu = document.createElement('div');
        tabDongfu.textContent = '🏠 洞府灵田';
        tabDongfu.style.cssText = `
            padding:8px 25px; border-radius:8px; cursor:pointer;
            font-size:15px; font-weight:bold; transition:all 0.2s;
            border:2px solid #8b7355; background:rgba(255,255,255,0.5); color:#5a4232;
        `;

        const tabSect = document.createElement('div');
        tabSect.textContent = '⛰️ 宗门灵田';
        tabSect.style.cssText = `
            padding:8px 25px; border-radius:8px; cursor:pointer;
            font-size:15px; font-weight:bold; transition:all 0.2s;
            border:2px solid #2196f3; background:linear-gradient(135deg, #2196f3 0%, #1976d2 100%); color:#fff;
        `;

        function setActiveTab(type) {
            currentType = type;
            if (type === 'dongfu') {
                tabDongfu.style.background = 'linear-gradient(135deg, #8b7355 0%, #6b5344 100%)';
                tabDongfu.style.color = '#fff';
                tabDongfu.style.borderColor = '#5a4232';
                tabSect.style.background = 'rgba(255,255,255,0.5)';
                tabSect.style.color = '#5a4232';
                tabSect.style.borderColor = '#8b7355';
            } else {
                tabSect.style.background = 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)';
                tabSect.style.color = '#fff';
                tabSect.style.borderColor = '#2196f3';
                tabDongfu.style.background = 'rgba(255,255,255,0.5)';
                tabDongfu.style.color = '#5a4232';
                tabDongfu.style.borderColor = '#8b7355';
            }
            refreshFarmGrid();
        }

        tabDongfu.addEventListener('click', () => setActiveTab('dongfu'));
        tabSect.addEventListener('click', () => setActiveTab('sect'));
        tabBar.appendChild(tabDongfu);
        tabBar.appendChild(tabSect);
        panel.appendChild(tabBar);

        // 农田信息栏（品质、数量、状态统计）
        const infoBar = document.createElement('div');
        infoBar.style.cssText = `
            display:flex; justify-content:space-between; align-items:center;
            padding:10px 15px; margin-bottom:12px;
            background:rgba(255,255,255,0.4); border-radius:8px;
            border:1px solid #c4b896; font-size:13px;
        `;
        panel.appendChild(infoBar);

        // 农田格子容器
        const gridContainer = document.createElement('div');
        gridContainer.style.cssText = `
            display:flex; justify-content:center; margin-bottom:15px;
            padding:15px; background:rgba(139,115,85,0.1); border-radius:10px;
            border:1px dashed #c4b896; min-height:100px;
        `;
        panel.appendChild(gridContainer);

        // 种子选择区（点击空地时显示）
        const seedSelector = document.createElement('div');
        seedSelector.style.cssText = `
            display:none; margin-bottom:15px; padding:12px;
            background:rgba(255,255,255,0.5); border-radius:8px;
            border:1px solid #c4b896;
        `;
        const seedSelectorTitle = document.createElement('div');
        seedSelectorTitle.style.cssText = 'font-size:14px; color:#5a3a1b; margin-bottom:8px; font-weight:bold;';
        seedSelectorTitle.textContent = '【 选择种子 】';
        seedSelector.appendChild(seedSelectorTitle);

        const seedBtnRow = document.createElement('div');
        seedBtnRow.style.cssText = 'display:flex; gap:10px; justify-content:center;';
        seedSelector.appendChild(seedBtnRow);
        panel.appendChild(seedSelector);

        let selectedTileIndex = -1;  // 当前选中的空地索引

        // 种子按钮
        const seedKeys = ['ling_cao_seed', 'ling_dao_seed', 'ling_cha_seed'];
        const seedIcons = ['🌿', '🌾', '🍵'];
        const seedColors = ['#5a8c3a', '#c9a84c', '#6b8e5a'];

        seedKeys.forEach((seedKey, i) => {
            const seed = SEEDS[seedKey];
            const btn = document.createElement('div');
            btn.style.cssText = `
                background:linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(245,240,225,0.9) 100%);
                border:2px solid ${seedColors[i]}; border-radius:8px;
                padding:10px 15px; text-align:center; cursor:pointer;
                transition:all 0.2s; min-width:120px;
            `;
            btn.innerHTML = `
                <div style="font-size:24px;">${seedIcons[i]}</div>
                <div style="font-size:13px; color:${seedColors[i]}; font-weight:bold;">${seed.name}</div>
                <div style="font-size:10px; color:#888;">${seed.growTime/1000}秒成熟</div>
            `;
            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'translateY(-2px)';
                btn.style.boxShadow = `0 4px 10px ${seedColors[i]}66`;
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'translateY(0)';
                btn.style.boxShadow = 'none';
            });
            btn.addEventListener('click', () => {
                if (selectedTileIndex >= 0) {
                    self.farmManager.plant(currentType, seedKey, selectedTileIndex);
                    self.saveGame();
                    seedSelector.style.display = 'none';
                    selectedTileIndex = -1;
                    refreshFarmGrid();
                }
            });
            seedBtnRow.appendChild(btn);
        });

        // 取消种植按钮
        const cancelPlantBtn = document.createElement('div');
        cancelPlantBtn.textContent = '取消';
        cancelPlantBtn.style.cssText = `
            padding:10px 20px; background:#999; color:#fff;
            border-radius:8px; cursor:pointer; font-size:13px;
            display:flex; align-items:center; justify-content:center;
        `;
        cancelPlantBtn.addEventListener('click', () => {
            seedSelector.style.display = 'none';
            selectedTileIndex = -1;
        });
        seedBtnRow.appendChild(cancelPlantBtn);

        // 洞府升级区（只在洞府标签显示）
        const upgradeArea = document.createElement('div');
        upgradeArea.style.cssText = `
            display:none; margin-bottom:15px; padding:12px;
            background:rgba(255,255,255,0.4); border-radius:8px;
            border:1px solid #c4b896;
        `;
        panel.appendChild(upgradeArea);

        // 操作按钮区
        const btnRow = document.createElement('div');
        btnRow.style.cssText = 'display:flex; justify-content:center; gap:15px; margin-top:10px;';

        // 收获所有按钮
        const harvestAllBtn = document.createElement('div');
        harvestAllBtn.textContent = '🌾 收获所有成熟';
        harvestAllBtn.style.cssText = `
            background:linear-gradient(135deg, #c9a84c 0%, #a88a3c 100%);
            color:#fff; padding:10px 25px; border-radius:8px;
            font-size:15px; font-weight:bold; cursor:pointer;
            border:2px solid #8b7020; transition:all 0.2s;
        `;
        harvestAllBtn.addEventListener('mouseenter', () => harvestAllBtn.style.transform = 'translateY(-2px)');
        harvestAllBtn.addEventListener('mouseleave', () => harvestAllBtn.style.transform = 'translateY(0)');
        harvestAllBtn.addEventListener('click', () => {
            self.farmManager.harvest(currentType);
            self.saveGame();
            refreshFarmGrid();
        });
        btnRow.appendChild(harvestAllBtn);

        // 关闭按钮
        const closeBtn = document.createElement('div');
        closeBtn.textContent = '关闭';
        closeBtn.style.cssText = `
            background:linear-gradient(135deg, #8b7355 0%, #6b5344 100%);
            color:#fff; padding:10px 25px; border-radius:8px;
            font-size:15px; font-weight:bold; cursor:pointer;
            border:2px solid #5a4232; transition:all 0.2s;
        `;
        closeBtn.addEventListener('mouseenter', () => closeBtn.style.transform = 'translateY(-2px)');
        closeBtn.addEventListener('mouseleave', () => closeBtn.style.transform = 'translateY(0)');
        closeBtn.addEventListener('click', closePanel);
        btnRow.appendChild(closeBtn);
        panel.appendChild(btnRow);

        overlay.appendChild(panel);
        document.body.appendChild(overlay);
        this.farmPanel = overlay;

        // 刷新农田格子显示
        function refreshFarmGrid() {
            const farm = self.farmManager.getFarmData(currentType);
            const stats = self.farmManager.getStats(currentType);
            const qualityConfig = self.farmManager.QUALITY_CONFIG[farm.quality];

            // 更新信息栏
            const typeName = currentType === 'dongfu' ? '洞府灵田' : '宗门灵田';
            infoBar.innerHTML = `
                <div><strong>${typeName}</strong> | 品质：<span style="color:${qualityConfig.color};font-weight:bold;">${qualityConfig.name}</span></div>
                <div>共 <strong>${farm.tiles.length}</strong> 块田</div>
                <div style="color:#999;">空地${stats.empty} | 生长中${stats.growing} | 成熟${stats.mature}</div>
            `;

            // 计算网格列数（完全平方数开方）
            const cols = Math.ceil(Math.sqrt(farm.tiles.length));
            const tileSize = currentType === 'dongfu' ? 70 : 60;

            gridContainer.innerHTML = '';
            const grid = document.createElement('div');
            grid.style.cssText = `
                display:grid; grid-template-columns:repeat(${cols}, ${tileSize}px);
                gap:6px;
            `;

            farm.tiles.forEach((tile, index) => {
                const tileEl = document.createElement('div');
                tileEl.style.cssText = `
                    width:${tileSize}px; height:${tileSize}px;
                    border-radius:6px; position:relative;
                    display:flex; align-items:center; justify-content:center;
                    cursor:pointer; transition:all 0.2s;
                    overflow:hidden;
                `;

                if (tile.state === 'empty') {
                    // 空地
                    tileEl.style.background = 'rgba(139,115,85,0.2)';
                    tileEl.style.border = '2px dashed #c4b896';
                    tileEl.innerHTML = `<div style="font-size:20px; color:#c4b896;">+</div>`;
                    tileEl.title = '点击种植';
                    tileEl.addEventListener('mouseenter', () => {
                        tileEl.style.background = 'rgba(139,115,85,0.35)';
                        tileEl.style.borderColor = '#8b7355';
                    });
                    tileEl.addEventListener('mouseleave', () => {
                        tileEl.style.background = 'rgba(139,115,85,0.2)';
                        tileEl.style.borderColor = '#c4b896';
                    });
                    tileEl.addEventListener('click', () => {
                        selectedTileIndex = index;
                        seedSelector.style.display = 'block';
                        seedSelector.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    });
                } else if (tile.state === 'growing' || tile.state === 'mature') {
                    // 生长中或成熟：显示植物贴图
                    const textureKey = self.farmManager.getPlantTexture(tile.seed, tile.stage);
                    const stageNames = ['播种期', '幼苗期', '成长期', '成熟期'];
                    const stageColors = ['#8b7355', '#7cb342', '#4caf50', '#ff9800'];

                    tileEl.style.background = 'rgba(90,140,58,0.15)';
                    tileEl.style.border = `2px solid ${stageColors[tile.stage]}`;

                    if (textureKey && self.textures.exists(textureKey)) {
                        const imgSrc = self.textures.get(textureKey).getSourceImage().src;
                        tileEl.innerHTML = `
                            <img src="${imgSrc}" style="width:90%; height:90%; object-fit:contain; pointer-events:none;" />
                            <div style="position:absolute; bottom:1px; left:0; right:0;
                                font-size:9px; text-align:center; color:${stageColors[tile.stage]};
                                background:rgba(255,255,255,0.7); padding:1px 0;">
                                ${stageNames[tile.stage]}
                            </div>
                        `;
                    } else {
                        // 贴图没加载时用emoji代替
                        const seedEmoji = tile.seed.includes('cao') ? '🌿' : tile.seed.includes('dao') ? '🌾' : '🍵';
                        tileEl.innerHTML = `
                            <div style="font-size:28px;">${seedEmoji}</div>
                            <div style="position:absolute; bottom:1px; left:0; right:0;
                                font-size:9px; text-align:center; color:${stageColors[tile.stage]};
                                background:rgba(255,255,255,0.7); padding:1px 0;">
                                ${stageNames[tile.stage]}
                            </div>
                        `;
                    }

                    if (tile.state === 'mature') {
                        tileEl.title = '点击收获';
                        tileEl.style.boxShadow = '0 0 8px rgba(255,152,0,0.6)';
                        tileEl.addEventListener('mouseenter', () => {
                            tileEl.style.transform = 'scale(1.05)';
                            tileEl.style.boxShadow = '0 0 15px rgba(255,152,0,0.8)';
                        });
                        tileEl.addEventListener('mouseleave', () => {
                            tileEl.style.transform = 'scale(1)';
                            tileEl.style.boxShadow = '0 0 8px rgba(255,152,0,0.6)';
                        });
                        tileEl.addEventListener('click', () => {
                            self.farmManager.harvestTile(currentType, index);
                            self.saveGame();
                            refreshFarmGrid();
                        });
                    } else {
                        // 计算剩余时间
                        const seed = SEEDS[tile.seed];
                        const elapsed = (self.time.now - tile.plantTime) * qualityConfig.growSpeed;
                        const remain = Math.max(0, Math.ceil((seed.growTime - elapsed) / 1000));
                        tileEl.title = `生长中，剩余${remain}秒`;
                    }
                }

                grid.appendChild(tileEl);
            });

            gridContainer.appendChild(grid);

            // 洞府升级区显示/隐藏
            if (currentType === 'dongfu') {
                upgradeArea.style.display = 'block';
                refreshUpgradeArea();
            } else {
                upgradeArea.style.display = 'none';
            }
        }

        // 刷新洞府升级区
        function refreshUpgradeArea() {
            const nextUpgrade = self.farmManager.getNextTileCountUpgrade();
            upgradeArea.innerHTML = '';

            const title = document.createElement('div');
            title.style.cssText = 'font-size:14px; color:#5a3a1b; margin-bottom:8px; font-weight:bold;';
            title.textContent = '【 洞府灵田升级 】';
            upgradeArea.appendChild(title);

            const row = document.createElement('div');
            row.style.cssText = 'display:flex; gap:10px; align-items:center; flex-wrap:wrap;';

            if (nextUpgrade) {
                const info = document.createElement('div');
                info.style.cssText = 'font-size:12px; color:#666; flex:1;';
                let costText = '';
                for (const [itemId, amount] of Object.entries(nextUpgrade.cost)) {
                    const have = self.player.inventory.getItemCount(itemId);
                    const itemName = ITEMS[itemId] ? ITEMS[itemId].name : itemId;
                    costText += `${itemName} ${have}/${amount}  `;
                }
                info.innerHTML = `扩建至 <strong>${nextUpgrade.to}</strong> 块田<br>需要：${costText}`;
                row.appendChild(info);

                const upgradeBtn = document.createElement('div');
                upgradeBtn.textContent = '🔨 扩建灵田';
                upgradeBtn.style.cssText = `
                    background:linear-gradient(135deg, #8b7355 0%, #6b5344 100%);
                    color:#fff; padding:8px 20px; border-radius:6px;
                    font-size:13px; cursor:pointer; border:2px solid #5a4232;
                `;
                upgradeBtn.addEventListener('click', () => {
                    if (self.farmManager.upgradeDongfuTileCount()) {
                        self.saveGame();
                        refreshFarmGrid();
                    }
                });
                row.appendChild(upgradeBtn);
            } else {
                const info = document.createElement('div');
                info.style.cssText = 'font-size:12px; color:#999;';
                info.textContent = '农田数量已达上限（36块）';
                row.appendChild(info);
            }

            // 品质升级（占位，后续完善）
            const qualityInfo = document.createElement('div');
            qualityInfo.style.cssText = 'font-size:11px; color:#aaa; margin-top:5px; width:100%;';
            qualityInfo.textContent = '品质升级功能开发中...';
            row.appendChild(qualityInfo);

            upgradeArea.appendChild(row);
        }

        function closePanel() {
            if (self.farmPanel && self.farmPanel.parentNode) {
                self.farmPanel.remove();
                self.farmPanel = null;
            }
            self.uiLocked = false;
        }

        // 点击遮罩层关闭
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closePanel();
        });

        // 初始刷新
        refreshFarmGrid();

        // 定时刷新生长状态（每2秒刷新一次显示）
        this.farmRefreshTimer = this.time.addEvent({
            delay: 2000,
            loop: true,
            callback: () => {
                if (this.farmPanel && this.farmPanel.parentNode) {
                    refreshFarmGrid();
                } else {
                    this.farmRefreshTimer.remove();
                }
            }
        });
    }

    /**
     * 进入灵田场景
     * @param {string} type - 'sect'（宗门灵田）或 'dongfu'（洞府灵田）
     */
    enterFarmScene(type) {
        // 先存档
        this.saveGame();

        // 把farmManager保存到全局状态，供FarmScene使用
        if (!window.gameState) window.gameState = {};
        window.gameState.farmManager = this.farmManager;
        window.gameState.player = this.player;

        // 跳转到灵田场景
        this.scene.start('FarmScene', { type: type });
    }

    enterWorldMap() {
        // 先存档
        this.saveGame();

        // 把玩家数据同步到全局状态，供战斗场景读取
        if (!window.gameState) window.gameState = {};
        if (!window.gameState.player) window.gameState.player = {};
        const p = window.gameState.player;
        p.hp = this.player.hp;
        p.maxHp = this.player.maxHp;
        p.qi = this.player.qi;
        p.maxQi = this.player.maxQi;
        p.level = this.player.level;
        p.levelExp = this.player.levelExp;
        p.realm = this.player.realm;
        p.realmLevel = this.player.realmLevel || 1;
        p.skills = this.player.skills;
        p.equippedSkills = this.player.equippedSkills || ['slash'];  // 装备的技能，默认斩击
        p.manual = this.player.manual;
        p.learnedManuals = this.player.learnedManuals;
        p.manualProficiency = this.player.manualProficiency;
        p.skillProficiency = this.player.skillProficiency;
        p.attack = this.player.attack;
        p.defense = this.player.defense;
        p.contribution = this.player.contribution || 0;  // 宗门贡献
        p.isBattleState = true;  // 标记为战斗状态，用于区分普通player对象
        // 保存玩家丹药数量（供战斗场景使用）
        p.pills = {};
        if (this.player.inventory && this.player.inventory.getItemCount) {
            p.pills.heal_pill = this.player.inventory.getItemCount('heal_pill');
            p.pills.qi_pill = this.player.inventory.getItemCount('qi_pill');
            p.pills.spirit_pill = this.player.inventory.getItemCount('spirit_pill');
        }
        // 清空战斗掉落临时背包（避免重复添加）
        p.inventory = {};

        console.log('[主地图] 进入大地图前，玩家数据已同步到全局状态:', {
            hp: p.hp,
            qi: p.qi,
            level: p.level
        });

        this.scene.start('WorldMapScene');
    }

    showToast(text) {
        const toast = this.add.text(GAME_WIDTH / 2, 150, text, {
            fontFamily: '微软雅黑, sans-serif', fontSize: '16px', color: '#1a1a1a',
            backgroundColor: 'rgba(245,240,225,0.95)', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setDepth(300);

        this.tweens.add({
            targets: toast, alpha: 0, delay: 2500, duration: 500,
            onComplete: () => toast.destroy()
        });
    }

    /**
     * 显示丹药使用飘字特效
     */
    showPillFloatText(item, result) {
        const effects = result.effects || {};
        const messages = [];

        if (effects.hp) messages.push({ text: `+${effects.hp} 气血`, color: '#4caf50' });
        if (effects.qi) messages.push({ text: `+${effects.qi} 灵气`, color: '#2196f3' });
        if (effects.cultivation) messages.push({ text: `+${effects.cultivation} 修为`, color: '#ff9800' });

        messages.forEach((msg, i) => {
            setTimeout(() => {
                const floatText = document.createElement('div');
                floatText.textContent = msg.text;
                floatText.style.cssText = `
                    position:fixed; top:45%; left:50%;
                    transform:translateX(-50%);
                    font-size:36px; font-weight:bold; color:${msg.color};
                    text-shadow:2px 2px 4px rgba(0,0,0,0.5), 0 0 20px ${msg.color};
                    z-index:99999; pointer-events:none;
                    font-family:'楷体',KaiTi,serif;
                    animation:pillFloatMain 1.2s ease-out forwards;
                `;
                document.body.appendChild(floatText);
                setTimeout(() => floatText.remove(), 1200);
            }, i * 250);
        });

        // 添加CSS动画（如果还没有）
        if (!document.getElementById('pill-float-style-main')) {
            const style = document.createElement('style');
            style.id = 'pill-float-style-main';
            style.textContent = `
                @keyframes pillFloatMain {
                    0% { opacity:0; transform:translateX(-50%) translateY(30px) scale(0.5); }
                    20% { opacity:1; transform:translateX(-50%) translateY(0) scale(1.3); }
                    40% { transform:translateX(-50%) translateY(-15px) scale(1); }
                    100% { opacity:0; transform:translateX(-50%) translateY(-80px) scale(0.8); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * 保存游戏
     */
    saveGame() {
        // 获取当前选中的存档位
        const slotKey = this.registry.get('selectedSaveSlot') || 'xiuxian_save_1';
        SaveSystem.saveToSlot(slotKey, this.player, this.player.inventory, this.player.storage, this.farmManager.toJSON());
    }

    /**
     * 尝试读档
     */
    tryLoadGame() {
        const slotKey = this.registry.get('selectedSaveSlot') || 'xiuxian_save_1';
        const save = SaveSystem.loadFromSlot(slotKey);
        if (!save) return;

        // 恢复玩家属性
        if (save.playerName) {
            this.player.setName(save.playerName);
        }
        this.player.hp = save.hp;
        this.player.maxHp = save.maxHp;
        this.player.qi = save.qi;
        this.player.maxQi = save.maxQi;
        this.player.lifespan = save.lifespan;
        this.player.realm = save.realm;
        this.player.realmLevel = save.realmLevel || 1;
        this.player.exp = save.exp;
        this.player.expToLevelUp = save.expToLevelUp;
        this.player.level = save.level || 1;
        this.player.levelExp = save.levelExp || 0;
        this.player.manual = save.manual;
        this.player.skills = save.skills;
        if (save.learnedManuals) this.player.learnedManuals = save.learnedManuals;
        if (save.equippedSkills) this.player.equippedSkills = save.equippedSkills;
        if (!this.player.equippedSkills) this.player.equippedSkills = ['slash'];
        if (save.manualProficiency) this.player.manualProficiency = save.manualProficiency;
        if (save.skillProficiency) this.player.skillProficiency = save.skillProficiency;
        this.player.refiningLevel = save.refiningLevel || 1;
        this.player.refiningExp = save.refiningExp || 0;
        this.player.contribution = save.contribution || 0;  // 恢复宗门贡献

        // 恢复背包和仓库（只有不是从全局状态恢复的player才从存档恢复）
        // 避免覆盖从灵田/战斗场景返回的最新背包数据
        if (!this.playerRestoredFromGlobal) {
            this.player.inventory.fromJSON(save.inventory);
            this.player.storage.fromJSON(save.storage);
        }

        // 恢复农田（只有不是从全局状态恢复的farmManager才从存档恢复）
        // 避免覆盖从灵田场景返回的最新农田数据
        if (!this.farmManagerRestoredFromGlobal) {
            this.farmManager.fromJSON(save.farmTiles);
        }

        console.log('[读档] 游戏进度已恢复');
    }

    /**
     * 从战斗状态同步数据
     * 战斗后血量、灵气、等级、经验、背包掉落等临时数据存在window.gameState.player里
     * 回到宗门后同步到玩家对象，然后自动存档
     */
    syncFromBattleState() {
        if (!window.gameState || !window.gameState.player) {
            console.log('[主地图] 没有战斗状态需要同步');
            return;
        }

        const battleState = window.gameState.player;

        // 只有真正的战斗状态才同步（有isBattleState标记）
        // 从灵田/宗门大殿返回时，window.gameState.player是普通Player对象，不需要同步
        if (!battleState.isBattleState) {
            console.log('[主地图] 不是战斗状态，跳过同步');
            return;
        }

        console.log('[主地图] 从战斗状态同步数据...');
        console.log('[主地图] 战斗状态背包:', battleState.inventory);
        console.log('[主地图] 同步前玩家背包物品数:', this.player.inventory.getFilledSlots().length);

        // 恢复战斗后的属性
        if (battleState.hp !== undefined) this.player.hp = battleState.hp;
        if (battleState.maxHp !== undefined) this.player.maxHp = battleState.maxHp;
        if (battleState.qi !== undefined) this.player.qi = battleState.qi;
        if (battleState.maxQi !== undefined) this.player.maxQi = battleState.maxQi;
        if (battleState.level !== undefined) this.player.level = battleState.level;
        if (battleState.levelExp !== undefined) this.player.levelExp = battleState.levelExp;
        if (battleState.realm) this.player.realm = battleState.realm;
        if (battleState.realmLevel !== undefined) this.player.realmLevel = battleState.realmLevel;
        if (battleState.skills) this.player.skills = battleState.skills;
        if (battleState.equippedSkills) this.player.equippedSkills = battleState.equippedSkills;
        if (battleState.manual) this.player.manual = battleState.manual;
        if (battleState.learnedManuals) this.player.learnedManuals = battleState.learnedManuals;
        if (battleState.manualProficiency) this.player.manualProficiency = battleState.manualProficiency;
        if (battleState.skillProficiency) this.player.skillProficiency = battleState.skillProficiency;

        // 恢复背包（战斗掉落的物品）
        if (battleState.inventory) {
            console.log('[主地图] 开始同步战斗掉落物...');
            for (const itemId in battleState.inventory) {
                const amount = battleState.inventory[itemId];
                console.log(`[主地图] 处理物品: ${itemId} x${amount}`);
                if (amount > 0) {
                    const result = this.player.inventory.addItem(itemId, amount);
                    console.log(`[主地图] addItem结果: ${result}, 物品: ${ITEMS[itemId] ? ITEMS[itemId].name : itemId} x${amount}`);
                }
            }
            console.log('[主地图] 同步后玩家背包物品数:', this.player.inventory.getFilledSlots().length);
        } else {
            console.log('[主地图] 战斗状态没有背包数据');
        }

        // 同步丹药使用后的数据（战斗中消耗的丹药要从背包里扣除）
        try {
            if (battleState.pills && this.player.inventory && this.player.inventory.removeItem) {
                const pillIds = ['heal_pill', 'qi_pill', 'spirit_pill'];
                for (const pillId of pillIds) {
                    const currentCount = this.player.inventory.getItemCount(pillId);
                    const battleCount = battleState.pills[pillId] || 0;
                    const usedCount = currentCount - battleCount;
                    if (usedCount > 0) {
                        this.player.inventory.removeItem(pillId, usedCount);
                        console.log(`[主地图] 丹药${pillId}使用了${usedCount}个，已从背包扣除`);
                    }
                }
            }
        } catch (e) {
            console.error('[主地图] 同步丹药数据失败:', e);
        }

        // 血量不能低于0，不能超过上限
        if (this.player.hp < 0) this.player.hp = 0;
        if (this.player.hp > this.player.maxHp) this.player.hp = this.player.maxHp;
        if (this.player.qi < 0) this.player.qi = 0;
        if (this.player.qi > this.player.maxQi) this.player.qi = this.player.maxQi;

        // 自动存档
        this.saveGame();

        // 清空战斗状态（避免重复同步）
        window.gameState.player = null;

        console.log('[主地图] 战斗状态同步完成，已自动存档');
    }

    update(time, delta) {
        // 主地图不显示人物，不需要移动和交互检测
        // 只保留农田生长和状态栏更新

        try {
            // 农田生长
            if (this.farmManager && this.farmManager.update) {
                this.farmManager.update(time);
            }
        } catch (e) {
            console.error('[主地图] 农田更新失败:', e);
        }

        try {
            // 更新左上角紧凑状态栏
            if (this.updateCompactStatusBar) {
                this.updateCompactStatusBar();
            }
        } catch (e) {
            console.error('[主地图] 更新状态栏失败:', e);
        }

        try {
            // 更新任务面板（每2秒更新一次，避免频繁刷新）
            if (!this.lastQuestUpdate || time - this.lastQuestUpdate > 2000) {
                this.lastQuestUpdate = time;
                if (this.updateQuestPanel) {
                    this.updateQuestPanel();
                }
            }
        } catch (e) {
            console.error('[主地图] 更新任务面板失败:', e);
        }

        try {
            // 更新境界文字（练气1-9层，后面筑基、金丹等也是1-9层）
            if (this.realmText && this.realmText.setText) {
                const levelNames = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
                const realmLevelName = levelNames[(this.player.realmLevel || 1) - 1] || '一';
                const realmName = (this.player.realm || '炼气期').replace('期', '');
                this.realmText.setText(`${realmName}${realmLevelName}层`);
            }
        } catch (e) {
            console.error('[主地图] 更新境界文字失败:', e);
        }
    }
}
