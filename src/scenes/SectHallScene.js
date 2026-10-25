/**
 * ============================================================
 *  SectHallScene.js —— 宗门大殿场景（完整版v2）
 * ============================================================
 *  【这是什么？】
 *  宗门的大殿。包含三大功能：
 *    1. 任务殿 - 接取宗门任务，自动检测完成，提交获得奖励
 *    2. 珍宝阁 - 用灵石购买物品（真正进入储物戒）
 *    3. 功德堂 - 用宗门贡献兑换功法（真正学习）
 *
 *  【任务系统】
 *  - 接取任务后显示任务追踪
 *  - 自动检测储物戒物品数量或击杀数
 *  - 满足条件后任务显示"可提交"
 *  - 提交任务获得奖励
 */

class SectHallScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SectHallScene' });
        this.currentView = 'main';
        this.player = null;
        this.questList = null;  // 任务列表
    }

    init(data) {
        this.currentView = data.view || 'main';
    }

    create() {
        console.log('%c[宗门大殿] 进入宗门大殿场景', 'color: #c44536; font-weight: bold');

        // 从全局状态获取玩家数据
        if (window.gameState && window.gameState.player) {
            this.player = window.gameState.player;
        }

        // 初始化任务列表（从全局状态或新建）
        if (!window.gameState) window.gameState = {};
        if (!window.gameState.questList) {
            window.gameState.questList = this.createDefaultQuests();
        }
        this.questList = window.gameState.questList;

        // 根据当前视图渲染
        this.renderView();

        // ESC返回
        this.input.keyboard.on('keydown-ESC', () => {
            if (this.currentView === 'main') {
                this.returnToBase();
            } else {
                this.currentView = 'main';
                this.scene.restart({ view: 'main' });
            }
        });
    }

    /**
     * 创建默认任务列表（3个示例任务）
     */
    createDefaultQuests() {
        return [
            {
                id: 'quest_1',
                name: '入门试炼',
                desc: '采集10株聚灵草，上交任务殿。',
                type: 'collect',           // collect=采集, kill=击杀
                targetId: 'ling_cao',      // 目标物品ID或怪物ID
                targetName: '聚灵草',
                targetCount: 10,
                rewards: { lingshi: 50, contribution: 10, exp: 100 },
                npc: 'npc_zhanglao',
                npcName: '王长老',
                difficulty: '简单',
                diffColor: '#4caf50',
                status: 'available'        // available=可接取, active=进行中, completed=已完成可提交, submitted=已提交
            },
            {
                id: 'quest_2',
                name: '妖兽讨伐',
                desc: '前往妖兽森林，击败5只狼妖。',
                type: 'kill',
                targetId: 'wolf',
                targetName: '狼妖',
                targetCount: 5,
                rewards: { lingshi: 100, contribution: 20, exp: 200 },
                npc: 'npc_shixiong',
                npcName: '李师兄',
                difficulty: '中等',
                diffColor: '#ff9800',
                status: 'available'
            },
            {
                id: 'quest_3',
                name: '灵药培育',
                desc: '在灵田中种植并收获3株灵茶。',
                type: 'collect',
                targetId: 'ling_cha',
                targetName: '灵茶',
                targetCount: 3,
                rewards: { lingshi: 80, contribution: 15, item: 'ling_cao_seed', itemCount: 5 },
                npc: 'npc_shijie',
                npcName: '赵师姐',
                difficulty: '简单',
                diffColor: '#4caf50',
                status: 'available'
            }
        ];
    }

    /**
     * 更新任务进度（自动检测）
     */
    updateQuestProgress() {
        if (!this.questList || !this.player) return;

        this.questList.forEach(quest => {
            if (quest.status !== 'active') return;

            if (quest.type === 'collect') {
                // 采集任务：检查储物戒物品数量
                const count = this.player.inventory.getItemCount(quest.targetId);
                quest.currentProgress = Math.min(count, quest.targetCount);
            } else if (quest.type === 'kill') {
                // 击杀任务：从全局状态获取击杀数
                if (!window.gameState.killCount) window.gameState.killCount = {};
                const count = window.gameState.killCount[quest.targetId] || 0;
                quest.currentProgress = Math.min(count, quest.targetCount);
            }

            // 检查是否完成
            if (quest.currentProgress >= quest.targetCount) {
                quest.status = 'completed';
            }
        });
    }

    /**
     * 渲染当前视图
     */
    renderView() {
        // 更新任务进度
        this.updateQuestProgress();

        switch (this.currentView) {
            case 'main':
                this.renderMainHall();
                break;
            case 'quest':
                this.renderQuestHall();
                break;
            case 'shop':
                this.renderShop();
                break;
            case 'exchange':
                this.renderExchange();
                break;
        }
    }

    /**
     * 渲染宗门大殿主界面
     */
    renderMainHall() {
        this.drawBackground('sect_hall_inner');

        // 标题
        this.add.text(GAME_WIDTH / 2, 60, '🏛 青云宗 · 宗门大殿', {
            fontFamily: '楷体, KaiTi, serif',
            fontSize: '32px',
            color: '#f5f0e1',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: { x: 30, y: 10 }
        }).setOrigin(0.5).setDepth(100);

        // 三个功能入口
        const functions = [
            { name: '📜 任务殿', desc: '接取宗门任务\n完成获得奖励', color: 0x5a8c3a, borderColor: '#5a8c3a', x: GAME_WIDTH / 2 - 250, y: GAME_HEIGHT / 2, view: 'quest' },
            { name: '💎 珍宝阁', desc: '用灵石购买\n各类珍稀物品', color: 0x2196f3, borderColor: '#2196f3', x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2, view: 'shop' },
            { name: '🎁 功德堂', desc: '用宗门贡献\n兑换稀有功法', color: 0xc9a84c, borderColor: '#c9a84c', x: GAME_WIDTH / 2 + 250, y: GAME_HEIGHT / 2, view: 'exchange' }
        ];

        functions.forEach(func => {
            const cardBg = this.add.rectangle(func.x, func.y, 200, 220, 0x000000, 0.6);
            cardBg.setStrokeStyle(3, func.borderColor, 0.9);
            cardBg.setDepth(50);

            this.add.text(func.x, func.y - 60, func.name, {
                fontFamily: '楷体, KaiTi, serif', fontSize: '24px', color: func.borderColor, fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(51);

            this.add.text(func.x, func.y + 10, func.desc, {
                fontFamily: '微软雅黑, sans-serif', fontSize: '14px', color: '#e8dcc8', align: 'center', lineSpacing: 8
            }).setOrigin(0.5).setDepth(51);

            const enterBtn = this.add.rectangle(func.x, func.y + 75, 120, 40, func.color, 0.9);
            enterBtn.setStrokeStyle(2, func.borderColor, 1);
            enterBtn.setDepth(51);
            this.add.text(func.x, func.y + 75, '进入', {
                fontFamily: '楷体, KaiTi, serif', fontSize: '18px', color: '#fff'
            }).setOrigin(0.5).setDepth(52);

            cardBg.setInteractive({ useHandCursor: true });
            enterBtn.setInteractive({ useHandCursor: true });

            const enterFunc = () => {
                this.currentView = func.view;
                this.scene.restart({ view: func.view });
            };

            cardBg.on('pointerover', () => { cardBg.setFillStyle(0x000000, 0.75); cardBg.setScale(1.05); });
            cardBg.on('pointerout', () => { cardBg.setFillStyle(0x000000, 0.6); cardBg.setScale(1); });
            cardBg.on('pointerdown', enterFunc);
            enterBtn.on('pointerdown', enterFunc);
        });

        this.createReturnButton('返回宗门');
    }

    /**
     * 渲染任务殿
     */
    renderQuestHall() {
        this.drawBackground('quest_hall');

        this.add.text(GAME_WIDTH / 2, 40, '📜 任务殿 · 接取宗门任务', {
            fontFamily: '楷体, KaiTi, serif', fontSize: '26px', color: '#f5f0e1',
            backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 25, y: 8 }
        }).setOrigin(0.5).setDepth(100);

        // 显示进行中的任务数量
        const activeCount = this.questList.filter(q => q.status === 'active').length;
        const completedCount = this.questList.filter(q => q.status === 'completed').length;
        this.add.text(GAME_WIDTH - 30, 40, `进行中：${activeCount} | 可提交：${completedCount}`, {
            fontFamily: '微软雅黑, sans-serif', fontSize: '14px', color: '#c9a84c',
            backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 12, y: 6 }
        }).setOrigin(1, 0.5).setDepth(100);

        this.questList.forEach((quest, i) => {
            const y = 95 + i * 180;

            // 任务卡片背景
            const cardBg = this.add.rectangle(GAME_WIDTH / 2, y, 720, 165, 0x000000, 0.65);
            cardBg.setStrokeStyle(2, '#8b7355', 0.8);
            cardBg.setDepth(50);

            // NPC头像
            if (this.textures.exists(quest.npc)) {
                const npcImg = this.add.image(GAME_WIDTH / 2 - 300, y, quest.npc);
                npcImg.setDisplaySize(90, 90);
                npcImg.setDepth(51);
                // 圆形边框
                const circleBorder = this.add.graphics();
                circleBorder.lineStyle(3, 0xc9a84c, 0.9);
                circleBorder.strokeCircle(GAME_WIDTH / 2 - 300, y, 47);
                circleBorder.setDepth(52);
            }

            // NPC名称
            this.add.text(GAME_WIDTH / 2 - 300, y + 60, quest.npcName, {
                fontFamily: '楷体, KaiTi, serif', fontSize: '14px', color: '#c9a84c'
            }).setOrigin(0.5).setDepth(51);

            // 任务名称
            this.add.text(GAME_WIDTH / 2 - 220, y - 45, quest.name, {
                fontFamily: '楷体, KaiTi, serif', fontSize: '20px', color: '#f5f0e1', fontStyle: 'bold'
            }).setOrigin(0, 0.5).setDepth(51);

            // 难度标签
            this.add.text(GAME_WIDTH / 2 + 30, y - 45, `【${quest.difficulty}】`, {
                fontFamily: '微软雅黑, sans-serif', fontSize: '12px', color: quest.diffColor
            }).setOrigin(0, 0.5).setDepth(51);

            // 任务描述
            this.add.text(GAME_WIDTH / 2 - 220, y - 12, quest.desc, {
                fontFamily: '微软雅黑, sans-serif', fontSize: '13px', color: '#e8dcc8'
            }).setOrigin(0, 0.5).setDepth(51);

            // 任务进度
            const progress = quest.currentProgress || 0;
            const progressText = `进度：${progress}/${quest.targetCount}`;
            const progressColor = quest.status === 'completed' ? '#4caf50' : '#ff9800';
            this.add.text(GAME_WIDTH / 2 - 220, y + 18, progressText, {
                fontFamily: '微软雅黑, sans-serif', fontSize: '13px', color: progressColor
            }).setOrigin(0, 0.5).setDepth(51);

            // 任务奖励
            let rewardText = '奖励：';
            if (quest.rewards.lingshi) rewardText += `灵石x${quest.rewards.lingshi} `;
            if (quest.rewards.contribution) rewardText += `贡献x${quest.rewards.contribution} `;
            if (quest.rewards.exp) rewardText += `经验x${quest.rewards.exp} `;
            if (quest.rewards.item) rewardText += `${quest.rewards.item}x${quest.rewards.itemCount}`;
            this.add.text(GAME_WIDTH / 2 - 220, y + 45, rewardText, {
                fontFamily: '微软雅黑, sans-serif', fontSize: '12px', color: '#c9a84c'
            }).setOrigin(0, 0.5).setDepth(51);

            // 操作按钮（根据状态显示不同按钮）
            let btnText = '接取任务';
            let btnColor = 0x5a8c3a;
            let btnBorderColor = '#3a6b1b';
            let btnEnabled = true;

            if (quest.status === 'active') {
                btnText = '进行中...';
                btnColor = 0x888888;
                btnBorderColor = '#666666';
                btnEnabled = false;
            } else if (quest.status === 'completed') {
                btnText = '提交任务';
                btnColor = 0xc9a84c;
                btnBorderColor = '#8b7020';
                btnEnabled = true;
            } else if (quest.status === 'submitted') {
                btnText = '已完成';
                btnColor = 0x666666;
                btnBorderColor = '#444444';
                btnEnabled = false;
            }

            const actionBtn = this.add.rectangle(GAME_WIDTH / 2 + 280, y, 110, 45, btnColor, 0.9);
            actionBtn.setStrokeStyle(2, btnBorderColor, 1);
            actionBtn.setDepth(51);
            this.add.text(GAME_WIDTH / 2 + 280, y, btnText, {
                fontFamily: '楷体, KaiTi, serif', fontSize: '15px', color: '#fff'
            }).setOrigin(0.5).setDepth(52);

            if (btnEnabled) {
                actionBtn.setInteractive({ useHandCursor: true });
                actionBtn.on('pointerover', () => actionBtn.setFillStyle(btnColor + 0x111111, 0.95));
                actionBtn.on('pointerout', () => actionBtn.setFillStyle(btnColor, 0.9));
                actionBtn.on('pointerdown', () => {
                    if (quest.status === 'available') {
                        // 接取任务
                        quest.status = 'active';
                        quest.currentProgress = 0;
                        this.showToast(`已接取任务：${quest.name}`);
                        this.scene.restart({ view: 'quest' });
                    } else if (quest.status === 'completed') {
                        // 提交任务
                        this.submitQuest(quest);
                    }
                });
            }
        });

        this.createReturnButton('返回大殿');
    }

    /**
     * 提交任务
     */
    submitQuest(quest) {
        // 扣除采集任务的物品
        if (quest.type === 'collect') {
            this.player.inventory.removeItem(quest.targetId, quest.targetCount);
        }

        // 发放奖励
        if (quest.rewards.lingshi) {
            this.player.inventory.addItem('lingshi', quest.rewards.lingshi);
        }
        if (quest.rewards.exp) {
            this.player.gainLevelExp(quest.rewards.exp);
        }
        if (quest.rewards.contribution) {
            if (!this.player.contribution) this.player.contribution = 0;
            this.player.contribution += quest.rewards.contribution;
        }
        if (quest.rewards.item) {
            this.player.inventory.addItem(quest.rewards.item, quest.rewards.itemCount);
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

        this.time.delayedCall(1000, () => {
            this.scene.restart({ view: 'quest' });
        });
    }

    /**
     * 渲染珍宝阁（商店）
     */
    renderShop() {
        this.drawBackground('sect_hall_inner');

        this.add.text(GAME_WIDTH / 2, 40, '💎 珍宝阁 · 灵石购买', {
            fontFamily: '楷体, KaiTi, serif', fontSize: '26px', color: '#f5f0e1',
            backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 25, y: 8 }
        }).setOrigin(0.5).setDepth(100);

        // 玩家灵石显示（统一使用spirit_stone物品ID）
        const playerLingshi = (this.player && this.player.inventory)
            ? this.player.inventory.getItemCount('spirit_stone') : 0;
        this.add.text(GAME_WIDTH - 30, 40, `💰 灵石：${playerLingshi}`, {
            fontFamily: '楷体, KaiTi, serif', fontSize: '18px', color: '#c9a84c',
            backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 15, y: 8 }
        }).setOrigin(1, 0.5).setDepth(100);

        // 丹药商品（和constants.js里的丹药ID一致，使用对应丹药贴图）
        const items = [
            { id: 'heal_pill', name: '回春丹', desc: '服用后恢复50点气血，疗伤必备。', price: 20, icon: 'heal_pill', grade: 2, gradeName: '良品', gradeColor: '#4ade80' },
            { id: 'qi_pill', name: '聚气丹', desc: '服用后恢复3点灵气，战斗必备。', price: 30, icon: 'qi_pill', grade: 3, gradeName: '上品', gradeColor: '#60a5fa' },
            { id: 'spirit_pill', name: '凝神丹', desc: '服用后恢复30点气血和2点灵气。', price: 50, icon: 'spirit_pill', grade: 4, gradeName: '极品', gradeColor: '#facc15' },
            { id: 'wudao_pill', name: '悟道丹', desc: '珍稀丹药，服用后增加100点人物修为，辅助修炼突破境界。', price: 100, icon: 'wudao_pill', grade: 5, gradeName: '仙品', gradeColor: '#ff8c00' }
        ];

        items.forEach((item, i) => {
            // 4个商品自适应布局
            const itemWidth = 220;
            const startX = GAME_WIDTH / 2 - (items.length * itemWidth) / 2 + itemWidth / 2;
            const x = startX + i * itemWidth;
            const y = GAME_HEIGHT / 2;

            const cardBg = this.add.rectangle(x, y, 220, 320, 0x000000, 0.65);
            cardBg.setStrokeStyle(3, item.gradeColor, 0.8);
            cardBg.setDepth(50);

            // 商品图标（用圆形遮罩效果，更服帖）
            if (this.textures.exists(item.icon)) {
                const iconContainer = this.add.container(x, y - 80);
                const iconBg = this.add.circle(0, 0, 55, 0x000000, 0.3);
                iconBg.setStrokeStyle(3, item.gradeColor, 0.8);
                const itemImg = this.add.image(0, 0, item.icon);
                itemImg.setDisplaySize(80, 80);
                iconContainer.add([iconBg, itemImg]);
                iconContainer.setDepth(51);
            }

            this.add.text(x, y - 145, `【${item.gradeName}】`, {
                fontFamily: '微软雅黑, sans-serif', fontSize: '14px', color: item.gradeColor, fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(51);

            this.add.text(x, y - 10, item.name, {
                fontFamily: '楷体, KaiTi, serif', fontSize: '22px', color: '#f5f0e1', fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(51);

            this.add.text(x, y + 30, item.desc, {
                fontFamily: '微软雅黑, sans-serif', fontSize: '12px', color: '#e8dcc8',
                align: 'center', wordWrap: { width: 180 }
            }).setOrigin(0.5).setDepth(51);

            this.add.text(x, y + 85, `💰 ${item.price} 灵石`, {
                fontFamily: '楷体, KaiTi, serif', fontSize: '18px', color: '#c9a84c', fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(51);

            const buyBtn = this.add.rectangle(x, y + 125, 120, 40, 0xc9a84c, 0.9);
            buyBtn.setStrokeStyle(2, '#8b7020', 1);
            buyBtn.setDepth(51);
            this.add.text(x, y + 125, '购买', {
                fontFamily: '楷体, KaiTi, serif', fontSize: '18px', color: '#fff'
            }).setOrigin(0.5).setDepth(52);

            buyBtn.setInteractive({ useHandCursor: true });
            buyBtn.on('pointerover', () => buyBtn.setFillStyle(0xd9b85c, 0.95));
            buyBtn.on('pointerout', () => buyBtn.setFillStyle(0xc9a84c, 0.9));
            buyBtn.on('pointerdown', () => {
                this.buyItem(item);
            });
        });

        this.createReturnButton('返回大殿');
    }

    /**
     * 购买物品
     */
    buyItem(item) {
        if (!this.player || !this.player.inventory) {
            this.showToast('玩家数据异常！');
            return;
        }

        // 统一使用spirit_stone物品ID
        const lingshi = this.player.inventory.getItemCount('spirit_stone');
        if (lingshi < item.price) {
            this.showToast(`灵石不足！需要${item.price}灵石，当前${lingshi}`);
            return;
        }

        // 扣除灵石
        this.player.inventory.removeItem('spirit_stone', item.price);
        // 添加物品
        const success = this.player.inventory.addItem(item.id, 1);

        if (success) {
            this.showToast(`购买成功！获得 ${item.name} x1`);
            this.saveGame();
            this.time.delayedCall(500, () => {
                this.scene.restart({ view: 'shop' });
            });
        } else {
            // 背包满了，退还灵石
            this.player.inventory.addItem('spirit_stone', item.price);
            this.showToast('储物戒已满！');
        }
    }

    /**
     * 渲染功德堂（兑换）
     */
    renderExchange() {
        this.drawBackground('gongfa_pavilion');

        this.add.text(GAME_WIDTH / 2, 40, '🎁 功德堂 · 贡献兑换功法', {
            fontFamily: '楷体, KaiTi, serif', fontSize: '26px', color: '#f5f0e1',
            backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 25, y: 8 }
        }).setOrigin(0.5).setDepth(100);

        // 玩家贡献显示
        const playerContribution = (this.player && this.player.contribution) ? this.player.contribution : 0;
        this.add.text(GAME_WIDTH - 30, 40, `🏅 宗门贡献：${playerContribution}`, {
            fontFamily: '楷体, KaiTi, serif', fontSize: '18px', color: '#c9a84c',
            backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 15, y: 8 }
        }).setOrigin(1, 0.5).setDepth(100);

        // 功法兑换列表（ID必须和constants.js里的CULTIVATION_MANUALS一致）
        const exchanges = [
            {
                id: 'qi_refining', name: '炼气功法',
                desc: '青云宗最基础的入门功法，引天地灵气入体，淬炼经脉。\n修炼后解锁技能：斩击\n适用境界：炼气期',
                cost: 50, icon: 'gongfa_jianqi',
                grade: 2, gradeName: '良品', gradeColor: '#4ade80',
                skills: ['斩击'], maxRealm: '炼气期'
            },
            {
                id: 'fire_art', name: '烈火功',
                desc: '火系攻击功法，凝聚灵气化为烈焰，威力强大。\n修炼后解锁技能：斩击、火球术\n适用境界：炼气期\n特效：火球术伤害+50%',
                cost: 150, icon: 'gongfa_lieyan',
                grade: 3, gradeName: '上品', gradeColor: '#60a5fa',
                skills: ['斩击', '火球术'], maxRealm: '炼气期'
            },
            {
                id: 'thunder_art', name: '天雷功法',
                desc: '雷系顶级功法，引天雷入体，威力惊人，修炼难度极高。\n修炼后解锁技能：斩击、雷击、五雷轰顶\n适用境界：炼气期',
                cost: 300, icon: 'gongfa_tianlei',
                grade: 5, gradeName: '仙品', gradeColor: '#fb923c',
                skills: ['斩击', '雷击', '五雷轰顶'], maxRealm: '炼气期'
            }
        ];

        exchanges.forEach((ex, i) => {
            const x = GAME_WIDTH / 2 - 250 + i * 250;
            const y = GAME_HEIGHT / 2;

            const cardBg = this.add.rectangle(x, y, 220, 340, 0x000000, 0.65);
            cardBg.setStrokeStyle(3, ex.gradeColor, 0.8);
            cardBg.setDepth(50);

            // 功法图标（圆形背景，更服帖）
            if (this.textures.exists(ex.icon)) {
                const iconContainer = this.add.container(x, y - 90);
                const iconBg = this.add.circle(0, 0, 58, 0x000000, 0.3);
                iconBg.setStrokeStyle(3, ex.gradeColor, 0.8);
                const exImg = this.add.image(0, 0, ex.icon);
                exImg.setDisplaySize(85, 85);
                iconContainer.add([iconBg, exImg]);
                iconContainer.setDepth(51);
            }

            this.add.text(x, y - 160, `【${ex.gradeName}】`, {
                fontFamily: '微软雅黑, sans-serif', fontSize: '14px', color: ex.gradeColor, fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(51);

            this.add.text(x, y - 20, ex.name, {
                fontFamily: '楷体, KaiTi, serif', fontSize: '22px', color: '#f5f0e1', fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(51);

            this.add.text(x, y + 30, ex.desc, {
                fontFamily: '微软雅黑, sans-serif', fontSize: '12px', color: '#e8dcc8',
                align: 'center', lineSpacing: 5, wordWrap: { width: 180 }
            }).setOrigin(0.5).setDepth(51);

            this.add.text(x, y + 95, `🏅 ${ex.cost} 贡献`, {
                fontFamily: '楷体, KaiTi, serif', fontSize: '18px', color: '#c9a84c', fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(51);

            const exchangeBtn = this.add.rectangle(x, y + 135, 120, 40, 0x9c27b0, 0.9);
            exchangeBtn.setStrokeStyle(2, '#7b1fa2', 1);
            exchangeBtn.setDepth(51);
            this.add.text(x, y + 135, '兑换', {
                fontFamily: '楷体, KaiTi, serif', fontSize: '18px', color: '#fff'
            }).setOrigin(0.5).setDepth(52);

            exchangeBtn.setInteractive({ useHandCursor: true });
            exchangeBtn.on('pointerover', () => exchangeBtn.setFillStyle(0xab47bc, 0.95));
            exchangeBtn.on('pointerout', () => exchangeBtn.setFillStyle(0x9c27b0, 0.9));
            exchangeBtn.on('pointerdown', () => {
                this.exchangeGongfa(ex);
            });
        });

        this.createReturnButton('返回大殿');
    }

    /**
     * 兑换功法
     */
    exchangeGongfa(gongfa) {
        if (!this.player) {
            this.showToast('玩家数据异常！');
            return;
        }

        const contribution = this.player.contribution || 0;
        if (contribution < gongfa.cost) {
            this.showToast(`贡献不足！需要${gongfa.cost}贡献，当前${contribution}`);
            return;
        }

        // 检查是否已经学习
        if (!this.player.learnedManuals) this.player.learnedManuals = [];
        if (this.player.learnedManuals.includes(gongfa.id)) {
            this.showToast(`你已经学习过 ${gongfa.name} 了！`);
            return;
        }

        // 扣除贡献
        this.player.contribution -= gongfa.cost;
        // 学习功法
        this.player.learnedManuals.push(gongfa.id);
        if (!this.player.manual) this.player.manual = gongfa.id;

        this.showToast(`兑换成功！学习了 ${gongfa.name}！`);
        this.saveGame();

        this.time.delayedCall(500, () => {
            this.scene.restart({ view: 'exchange' });
        });
    }

    /**
     * 绘制背景
     */
    drawBackground(textureKey) {
        if (this.textures.exists(textureKey)) {
            const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, textureKey);
            const scaleX = GAME_WIDTH / bg.width;
            const scaleY = GAME_HEIGHT / bg.height;
            const scale = Math.max(scaleX, scaleY);
            bg.setScale(scale);
            bg.setDepth(0);
        } else {
            this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0xe8dcc8).setOrigin(0).setDepth(0);
        }
        this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.2).setOrigin(0).setDepth(1);
    }

    /**
     * 创建返回按钮
     */
    createReturnButton(text) {
        const btn = this.add.rectangle(80, GAME_HEIGHT - 35, 130, 45, 0x8b7355, 0.9);
        btn.setStrokeStyle(2, 0x4a3728, 1);
        btn.setDepth(100);
        this.add.text(80, GAME_HEIGHT - 35, `← ${text}`, {
            fontFamily: '楷体, KaiTi, serif', fontSize: '18px', color: '#fff'
        }).setOrigin(0.5).setDepth(101);

        btn.setInteractive({ useHandCursor: true });
        btn.on('pointerover', () => btn.setFillStyle(0x9b8365, 0.95));
        btn.on('pointerout', () => btn.setFillStyle(0x8b7355, 0.9));
        btn.on('pointerdown', () => {
            if (this.currentView === 'main') {
                this.returnToBase();
            } else {
                this.currentView = 'main';
                this.scene.restart({ view: 'main' });
            }
        });
    }

    /**
     * 返回宗门主地图
     */
    returnToBase() {
        // 保存任务列表到全局状态
        if (window.gameState) {
            window.gameState.questList = this.questList;
        }
        this.scene.start('BaseMapScene');
    }

    /**
     * 保存游戏
     */
    saveGame() {
        if (window.gameState && window.gameState.saveSlot && this.player) {
            SaveSystem.saveToSlot(
                window.gameState.saveSlot,
                this.player,
                this.player.inventory,
                this.player.storage,
                window.gameState.farmManager ? window.gameState.farmManager.toJSON() : null
            );
        }
    }

    /**
     * 显示提示
     */
    showToast(message) {
        const toast = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, message, {
            fontFamily: '微软雅黑, sans-serif', fontSize: '18px', color: '#fff',
            backgroundColor: 'rgba(0,0,0,0.75)', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setDepth(200);

        this.tweens.add({
            targets: toast, y: GAME_HEIGHT / 2 - 150, alpha: 0, duration: 1500,
            onComplete: () => toast.destroy()
        });
    }
}
