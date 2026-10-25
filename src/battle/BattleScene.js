/**
 * ============================================================
 *  BattleScene.js —— 战斗场景（站桩回合制）
 * ============================================================
 *  【这是什么？】
 *  进入野外遇到怪物后的战斗画面。
 *  站桩式回合制：你和敌人面对面站着，选技能打。
 *
 *  【怎么进入战斗？】
 *  大地图上点击怪物点 → 传入 monsterId → 进入这个场景
 *
 *  【战斗流程】
 *  1. 你的回合：选技能 → 耗灵气 → 打伤害
 *  2. 灵气耗光或主动结束 → 敌人回合
 *  3. 敌人打你 → 回到你的回合（灵气+2）
 *  4. 怪物血量≤0 → 战斗胜利，掉落物品+经验，返回大地图
 *  5. 玩家血量≤0 → 战斗失败，返回大地图
 */

class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BattleScene' });
    }

    /**
     * 接收从大地图传来的参数
     * @param {object} data - { monsterId: 'wolf_demon', monsterPointId: 'monster_4' }
     */
    init(data) {
        this.monsterId = data.monsterId || 'wolf_demon';
        this.monsterPointId = data.monsterPointId || null;
        console.log(`[战斗] 收到怪物ID: ${this.monsterId}, 怪物点ID: ${this.monsterPointId}`);
    }

    create() {
        console.log('%c[战斗] 进入战斗场景', 'color: #c44536; font-weight: bold');

        // 从配置读取怪物数据
        this.monster = MONSTERS[this.monsterId];
        if (!this.monster) {
            console.error(`[战斗] 找不到怪物配置: ${this.monsterId}`);
            this.monster = MONSTERS.wolf_demon; //  fallback
        }

        // 从全局状态读取玩家数据（如果有的话）
        this.loadPlayerState();

        // 怪物血量
        this.enemyHp = this.monster.hp;
        this.enemyMaxHp = this.monster.hp;

        // 回合状态
        this.turn = 'player';
        this.turnCount = 1;
        this.battleEnded = false;

        // ========== 战斗背景 ==========
        this.createBattleBackground();

        // ========== 标题 ==========
        const title = this.monster.isBoss ? `⚔ BOSS战：${this.monster.name} ⚔` : `⚔ 遭遇战：${this.monster.name} ⚔`;
        this.add.text(GAME_WIDTH / 2, 45, title, {
            fontFamily: '楷体, KaiTi, serif',
            fontSize: '28px',
            color: this.monster.isBoss ? '#ff4444' : '#c44536',
            backgroundColor: 'rgba(245,240,225,0.85)',
            padding: { x: 20, y: 6 }
        }).setOrigin(0.5);

        // ========== 玩家（左边）==========
        this.createPlayerSide();

        // ========== 怪物（右边）==========
        this.createMonsterSide();

        // ========== 回合提示 ==========
        this.turnText = this.add.text(GAME_WIDTH / 2, 110, '【你的回合】请选择技能', {
            fontFamily: '微软雅黑, sans-serif',
            fontSize: '18px',
            color: '#1a1a1a',
            backgroundColor: 'rgba(245,240,225,0.9)',
            padding: { x: 15, y: 6 }
        }).setOrigin(0.5);

        // ========== 技能栏 ==========
        this.createSkillBar();

        // ========== 逃跑按钮 ==========
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 25, '按 R 逃跑（无奖励）', {
            fontFamily: '微软雅黑, sans-serif',
            fontSize: '13px',
            color: '#666666'
        }).setOrigin(0.5);

        this.input.keyboard.on('keydown-R', () => {
            if (!this.battleEnded) {
                this.turnText.setText('你逃跑了...');
                this.time.delayedCall(800, () => this.endBattle('flee'));
            }
        });

        // 特效层
        this.effectLayer = this.add.graphics();
    }

    /**
     * 从全局状态加载玩家数据
     */
    loadPlayerState() {
        // 确保全局状态存在
        if (!window.gameState) window.gameState = {};
        if (!window.gameState.player) window.gameState.player = {};

        const p = window.gameState.player;
        this.playerHp = p.hp || 100;
        this.playerMaxHp = p.maxHp || 100;
        this.playerQi = p.qi || 5;
        this.playerMaxQi = p.maxQi || 5;
        this.playerLevel = p.level || 1;
        this.playerLevelExp = p.levelExp || 0;
        this.learnedSkills = p.skills || ['slash', 'fireball'];
        this.playerManual = p.manual || 'qi_refining';
        this.learnedManuals = p.learnedManuals || ['qi_refining'];
        this.manualProficiency = p.manualProficiency || {};
        this.skillProficiency = p.skillProficiency || {};
        // 加载宗门贡献
        this.playerContribution = p.contribution || 0;

        // 读取玩家丹药数量
        this.playerPills = p.pills || { heal_pill: 0, qi_pill: 0, spirit_pill: 0 };
        console.log('[战斗] 玩家丹药:', this.playerPills);

        // 获取装备到战斗栏的技能（玩家在功法阁自由选择装备的技能）
        // 优先使用equippedSkills，如果没有就用当前功法的已学技能，最后保底斩击
        if (p.equippedSkills && p.equippedSkills.length > 0) {
            this.availableSkills = p.equippedSkills.filter(s => SKILLS[s]);
        } else {
            // 兼容旧存档：用当前功法的已学技能
            const manual = CULTIVATION_MANUALS[this.playerManual];
            if (manual && manual.skills) {
                this.availableSkills = manual.skills.filter(s => this.learnedSkills.includes(s));
            } else {
                this.availableSkills = this.learnedSkills;
            }
        }
        // 保底：至少有斩击
        if (this.availableSkills.length === 0) {
            this.availableSkills = ['slash'];
        }

        console.log('[战斗] 玩家状态已加载:', {
            hp: this.playerHp,
            qi: this.playerQi,
            level: this.playerLevel,
            equippedSkills: this.availableSkills
        });
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
        p.level = this.playerLevel;
        p.levelExp = this.playerLevelExp;
        p.skills = this.learnedSkills;
        p.equippedSkills = this.availableSkills;  // 保存装备的技能
        p.manual = this.playerManual;
        p.learnedManuals = this.learnedManuals;
        p.manualProficiency = this.manualProficiency;
        p.skillProficiency = this.skillProficiency;
        p.pills = this.playerPills;  // 保存丹药使用后的数据
        p.contribution = this.playerContribution;  // 保存宗门贡献
    }

    /**
     * 创建战斗背景
     */
    createBattleBackground() {
        // 用生成的水墨山林背景图
        if (this.textures.exists('battle_bg')) {
            const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'battle_bg');
            bg.setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
            bg.setAlpha(0.9);
        } else {
            // fallback：纯色背景
            const g = this.add.graphics();
            g.fillStyle(0xf5f0e1, 1);
            g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        }

        // 底部加一个水墨晕染的地面
        const ground = this.add.graphics();
        ground.fillStyle(0x8b8680, 0.15);
        ground.fillEllipse(GAME_WIDTH / 2, GAME_HEIGHT - 80, GAME_WIDTH * 0.9, 120);
    }

    /**
     * 创建玩家一侧
     */
    createPlayerSide() {
        const px = 280;
        const py = 400;

        // 玩家脚下阴影
        this.add.ellipse(px, py + 80, 80, 18, 0x000000, 0.2);

        // 玩家图片
        this.playerSprite = this.add.image(px, py, 'player');
        this.playerSprite.setScale(280 / 2048);
        this.playerSprite.setOrigin(0.5, 0.9);

        // 玩家名字
        this.add.text(px, py - 170, '道友', {
            fontFamily: '楷体, KaiTi, serif',
            fontSize: '20px',
            color: '#3a6b8c',
            backgroundColor: 'rgba(245,240,225,0.8)',
            padding: { x: 8, y: 3 }
        }).setOrigin(0.5);

        // 玩家血条背景
        this.add.rectangle(px, py + 100, 180, 18, 0x333333, 0.8).setOrigin(0.5);
        this.playerHpBar = this.add.rectangle(px - 88, py + 100, 176, 14, 0xc44536).setOrigin(0, 0.5);
        this.playerHpText = this.add.text(px, py + 100, `${this.playerHp}/${this.playerMaxHp}`, {
            fontFamily: '微软雅黑, sans-serif',
            fontSize: '12px',
            color: '#fff'
        }).setOrigin(0.5);

        // 玩家灵气条
        this.add.rectangle(px, py + 128, 180, 12, 0x333333, 0.8).setOrigin(0.5);
        this.playerQiBar = this.add.rectangle(px - 88, py + 128, 176, 8, 0x3a6b8c).setOrigin(0, 0.5);
        this.playerQiText = this.add.text(px, py + 128, `灵气 ${this.playerQi}/${this.playerMaxQi}`, {
            fontFamily: '微软雅黑, sans-serif',
            fontSize: '10px',
            color: '#fff'
        }).setOrigin(0.5);

        // 等级显示
        this.add.text(px - 70, py - 140, `Lv.${this.playerLevel}`, {
            fontFamily: '微软雅黑, sans-serif',
            fontSize: '14px',
            color: '#c9a84c',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: { x: 5, y: 2 }
        }).setOrigin(0.5);
    }

    /**
     * 创建怪物一侧
     */
    createMonsterSide() {
        const mx = 950;
        const my = 400;

        // 怪物脚下阴影
        this.add.ellipse(mx, my + 80, 100, 20, 0x000000, 0.25);

        // 怪物图片
        const monsterImageKey = this.monster.imageKey || 'monster_wolf';
        if (this.textures.exists(monsterImageKey)) {
            this.enemySprite = this.add.image(mx, my, monsterImageKey);
            // 怪物图片是1024x1024，根据配置的scale缩放
            const baseScale = this.monster.scale || 0.4;
            this.enemySprite.setScale(baseScale * (1024 / 1024)); // 1024图，直接用scale
            this.enemySprite.setOrigin(0.5, 0.85);
            // BOSS放大一点
            if (this.monster.isBoss) {
                this.enemySprite.setScale(baseScale * 1.3);
            }
        } else {
            // fallback：圆形
            this.enemySprite = this.add.circle(mx, my, 40, 0x8b4513)
                .setStrokeStyle(3, 0xc44536, 1);
        }

        // 怪物名字
        const nameColor = this.monster.isBoss ? '#ff4444' : '#c44536';
        this.add.text(mx, my - 170, this.monster.name, {
            fontFamily: '楷体, KaiTi, serif',
            fontSize: '20px',
            color: nameColor,
            backgroundColor: 'rgba(245,240,225,0.8)',
            padding: { x: 8, y: 3 }
        }).setOrigin(0.5);

        // BOSS标记
        if (this.monster.isBoss) {
            this.add.text(mx, my - 195, '★ BOSS ★', {
                fontFamily: '微软雅黑, sans-serif',
                fontSize: '14px',
                color: '#ffd700',
                backgroundColor: 'rgba(0,0,0,0.6)',
                padding: { x: 6, y: 2 }
            }).setOrigin(0.5);
        }

        // 怪物血条
        this.add.rectangle(mx, my + 100, 200, 18, 0x333333, 0.8).setOrigin(0.5);
        this.enemyHpBar = this.add.rectangle(mx - 98, my + 100, 196, 14, 0xc44536).setOrigin(0, 0.5);
        this.enemyHpText = this.add.text(mx, my + 100, `${this.enemyHp}/${this.enemyMaxHp}`, {
            fontFamily: '微软雅黑, sans-serif',
            fontSize: '12px',
            color: '#fff'
        }).setOrigin(0.5);

        // 怪物攻击力显示
        this.add.text(mx, my + 128, `攻击 ${this.monster.attack} | 防御 ${this.monster.defense}`, {
            fontFamily: '微软雅黑, sans-serif',
            fontSize: '11px',
            color: '#666',
            backgroundColor: 'rgba(245,240,225,0.7)',
            padding: { x: 5, y: 2 }
        }).setOrigin(0.5);
    }

    /**
     * 创建技能栏（根据当前功法显示可用技能，含熟练度）
     */
    createSkillBar() {
        this.skillButtons = [];

        // 使用当前功法的可用技能
        const skillsToShow = this.availableSkills && this.availableSkills.length > 0 ? this.availableSkills : ['slash'];

        skillsToShow.forEach((skillId, i) => {
            const skill = SKILLS[skillId];
            if (!skill) return;

            // 计算熟练度加成后的伤害
            const skillProfExp = this.skillProficiency ? (this.skillProficiency[skillId] || 0) : 0;
            const profInfo = this.getProficiencyInfo(skillProfExp);
            const finalDamage = Math.floor(skill.damage * profInfo.damageBonus);

            const btnWidth = 130;
            const btnHeight = 72;
            const startX = GAME_WIDTH / 2 - (skillsToShow.length * (btnWidth + 15)) / 2 + btnWidth / 2;
            const x = startX + i * (btnWidth + 15);
            const y = GAME_HEIGHT - 95;

            const btn = this.add.rectangle(x, y, btnWidth, btnHeight, 0xf5f0e1)
                .setStrokeStyle(2, skill.color || 0xc9a84c, 1)
                .setInteractive({ useHandCursor: true });

            this.add.text(x, y - 22, skill.name, {
                fontFamily: '楷体, KaiTi, serif', fontSize: '17px', color: '#1a1a1a'
            }).setOrigin(0.5);

            const damageText = skill.damage < 0 ? `回复${-skill.damage}` : `伤害${finalDamage}`;
            this.add.text(x, y, `耗灵${skill.cost} | ${damageText}`, {
                fontFamily: '微软雅黑, sans-serif', fontSize: '11px', color: '#666'
            }).setOrigin(0.5);

            this.add.text(x, y + 20, `熟练度:${profInfo.name}`, {
                fontFamily: '微软雅黑, sans-serif', fontSize: '10px', color: profInfo.color
            }).setOrigin(0.5);

            btn.on('pointerover', () => btn.setFillStyle(0xe8dcc8));
            btn.on('pointerout', () => btn.setFillStyle(0xf5f0e1));
            btn.on('pointerdown', () => this.playerUseSkill(skill, skillId));

            this.skillButtons.push({ btn, skill, skillId });
        });

        // 当前功法显示
        const manualName = CULTIVATION_MANUALS[this.playerManual]?.name || '练气功法';
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 170, `当前功法：${manualName}`, {
            fontFamily: '楷体, KaiTi, serif', fontSize: '14px', color: '#8b4513',
            backgroundColor: 'rgba(245,240,225,0.8)', padding: { x: 10, y: 3 }
        }).setOrigin(0.5);

        // 结束回合按钮
        const endX = GAME_WIDTH - 80;
        const endY = GAME_HEIGHT - 95;
        const endBtn = this.add.rectangle(endX, endY, 100, 50, 0x8b8680)
            .setStrokeStyle(2, 0x4a4a4a, 1)
            .setInteractive({ useHandCursor: true });
        this.add.text(endX, endY, '结束回合', {
            fontFamily: '楷体, KaiTi, serif', fontSize: '16px', color: '#fff'
        }).setOrigin(0.5);
        endBtn.on('pointerdown', () => {
            if (this.turn === 'player' && !this.battleEnded) this.endPlayerTurn();
        });

        // 丹药按钮
        const pillX = GAME_WIDTH - 200;
        const pillY = GAME_HEIGHT - 95;
        this.pillBtn = this.add.rectangle(pillX, pillY, 100, 50, 0x228b22)
            .setStrokeStyle(2, 0x006400, 1)
            .setInteractive({ useHandCursor: true });
        this.add.text(pillX, pillY, '服用丹药', {
            fontFamily: '楷体, KaiTi, serif', fontSize: '16px', color: '#fff'
        }).setOrigin(0.5);
        this.pillBtn.on('pointerover', () => this.pillBtn.setFillStyle(0x2ea82e));
        this.pillBtn.on('pointerout', () => this.pillBtn.setFillStyle(0x228b22));
        this.pillBtn.on('pointerdown', () => this.togglePillPanel());

        // 丹药选择面板（默认隐藏）
        this.pillPanel = null;
    }

    /**
     * 切换丹药选择面板
     */
    togglePillPanel() {
        if (this.pillPanel) {
            this.pillPanel.destroy();
            this.pillPanel = null;
            return;
        }

        // 创建丹药面板
        this.pillPanel = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setDepth(500);

        // 背景
        const bg = this.add.rectangle(0, 0, 450, 280, 0xf5f0e1, 0.98)
            .setStrokeStyle(3, 0x8b7355, 1);
        this.pillPanel.add(bg);

        // 标题
        const title = this.add.text(0, -110, '💊 选择丹药', {
            fontFamily: '楷体, KaiTi, serif', fontSize: '24px', color: '#4a3728'
        }).setOrigin(0.5);
        this.pillPanel.add(title);

        // 三种丹药
        const pillTypes = [
            { id: 'heal_pill', name: '回春丹', desc: '恢复50点气血', color: 0x228b22, y: -50 },
            { id: 'qi_pill', name: '聚气丹', desc: '恢复3点灵气', color: 0x4169e1, y: 10 },
            { id: 'spirit_pill', name: '凝神丹', desc: '恢复30气血+2灵气', color: 0x9932cc, y: 70 }
        ];

        pillTypes.forEach(pill => {
            const count = this.playerPills[pill.id] || 0;

            // 丹药按钮
            const btn = this.add.rectangle(0, pill.y, 380, 50, 0xffffff, 0.9)
                .setStrokeStyle(2, pill.color, 1)
                .setInteractive({ useHandCursor: true });
            this.pillPanel.add(btn);

            // 丹药名称和数量
            const nameText = this.add.text(-160, pill.y, `${pill.name} x${count}`, {
                fontFamily: '楷体, KaiTi, serif', fontSize: '18px', color: '#1a1a1a'
            }).setOrigin(0, 0.5);
            this.pillPanel.add(nameText);

            // 丹药效果
            const descText = this.add.text(20, pill.y, pill.desc, {
                fontFamily: '微软雅黑, sans-serif', fontSize: '13px', color: '#666'
            }).setOrigin(0, 0.5);
            this.pillPanel.add(descText);

            // 数量为0时禁用
            if (count <= 0) {
                btn.setAlpha(0.4);
                btn.disableInteractive();
            } else {
                btn.on('pointerover', () => btn.setFillStyle(0xf0f0f0));
                btn.on('pointerout', () => btn.setFillStyle(0xffffff));
                btn.on('pointerdown', () => this.usePill(pill.id));
            }
        });

        // 关闭按钮
        const closeBtn = this.add.rectangle(0, 120, 100, 35, 0x888888)
            .setInteractive({ useHandCursor: true });
        this.add.text(0, 120, '关闭', {
            fontFamily: '楷体, KaiTi, serif', fontSize: '15px', color: '#fff'
        }).setOrigin(0.5);
        closeBtn.on('pointerdown', () => this.togglePillPanel());
        this.pillPanel.add(closeBtn);
    }

    /**
     * 服用丹药（优化版：有明显的飘字特效和视觉反馈）
     */
    usePill(pillId) {
        if (this.turn !== 'player' || this.battleEnded) return;

        const pill = ITEMS[pillId];
        if (!pill || !pill.effect) return;

        const count = this.playerPills[pillId] || 0;
        if (count <= 0) {
            this.showBattleLog(`没有${pill.name}了！`);
            return;
        }

        // 消耗丹药
        this.playerPills[pillId] = count - 1;

        // 丹药特效颜色
        const pillColors = {
            heal_pill: 0x4caf50,    // 回春丹：绿色
            qi_pill: 0x2196f3,       // 聚气丹：蓝色
            spirit_pill: 0x9c27b0,   // 凝神丹：紫色
            wudao_pill: 0xff9800     // 悟道丹：橙色
        };
        const effectColor = pillColors[pillId] || 0xffffff;

        // 玩家角色闪光特效
        if (this.playerSprite) {
            // 创建光环
            const glow = this.add.circle(this.playerSprite.x, this.playerSprite.y, 80, effectColor, 0.3);
            glow.setDepth(90);
            // 光环放大消失动画
            this.tweens.add({
                targets: glow,
                scale: { from: 0.5, to: 2 },
                alpha: { from: 0.6, to: 0 },
                duration: 800,
                ease: 'Cubic.easeOut',
                onComplete: () => glow.destroy()
            });

            // 角色闪烁
            this.tweens.add({
                targets: this.playerSprite,
                alpha: { from: 1, to: 0.5 },
                duration: 100,
                yoyo: true,
                repeat: 3
            });
        }

        // 恢复气血
        if (pill.effect.hp > 0) {
            const oldHp = this.playerHp;
            this.playerHp = Math.min(this.playerMaxHp, this.playerHp + pill.effect.hp);
            const healed = this.playerHp - oldHp;
            this.showBattleLog(`服用${pill.name}，恢复${healed}点气血！`);

            // 飘字特效：+50 气血
            this.showDamageText(this.playerSprite.x, this.playerSprite.y - 60, `+${healed}`, '#4caf50');
        }

        // 恢复灵气
        if (pill.effect.qi > 0) {
            const oldQi = this.playerQi;
            this.playerQi = Math.min(this.playerMaxQi, this.playerQi + pill.effect.qi);
            const restored = this.playerQi - oldQi;
            if (pill.effect.hp <= 0) {
                this.showBattleLog(`服用${pill.name}，恢复${restored}点灵气！`);
            } else {
                this.showBattleLog(`同时恢复${restored}点灵气！`);
            }

            // 延迟飘字特效：+3 灵气
            this.time.delayedCall(300, () => {
                this.showDamageText(this.playerSprite.x + 30, this.playerSprite.y - 80, `+${restored} 灵气`, '#2196f3');
            });
        }

        // 更新UI
        this.updatePlayerBars();
        this.updateSkillButtons();

        // 关闭丹药面板
        if (this.pillPanel) {
            this.pillPanel.destroy();
            this.pillPanel = null;
        }

        // 服用丹药消耗回合
        this.time.delayedCall(1000, () => {
            if (!this.battleEnded) this.endPlayerTurn();
        });
    }

    /**
     * 显示伤害/治疗飘字
     */
    showDamageText(x, y, text, color) {
        const damageText = this.add.text(x, y, text, {
            fontFamily: '楷体, KaiTi, serif',
            fontSize: '28px',
            color: color,
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(100);

        // 飘字动画：向上飘并消失
        this.tweens.add({
            targets: damageText,
            y: y - 80,
            alpha: { from: 1, to: 0 },
            scale: { from: 0.5, to: 1.3 },
            duration: 1200,
            ease: 'Cubic.easeOut',
            onComplete: () => damageText.destroy()
        });
    }

    /**
     * 根据经验计算熟练度等级
     */
    getProficiencyInfo(exp) {
        let level = 0;
        for (let i = PROFICIENCY_LEVELS.length - 1; i >= 0; i--) {
            if (exp >= PROFICIENCY_LEVELS[i].exp) { level = i; break; }
        }
        const current = PROFICIENCY_LEVELS[level];
        const next = PROFICIENCY_LEVELS[level + 1];
        const nextExp = next ? next.exp : current.exp;
        return {
            level, name: current.name, exp, nextExp,
            damageBonus: current.damageBonus, color: current.color
        };
    }

    /**
     * 更新技能按钮状态（灵气不足时变灰）
     */
    updateSkillButtons() {
        this.skillButtons.forEach(({ btn, skill }) => {
            if (this.playerQi < skill.cost || this.turn !== 'player') {
                btn.setAlpha(0.4);
                btn.disableInteractive();
            } else {
                btn.setAlpha(1);
                btn.setInteractive({ useHandCursor: true });
            }
        });
    }

    /**
     * 玩家使用技能
     */
    playerUseSkill(skill, skillId) {
        if (this.turn !== 'player' || this.battleEnded) return;

        // 检查灵气
        if (this.playerQi < skill.cost) {
            this.turnText.setText('灵气不足！请选择其他技能或结束回合');
            return;
        }

        // 扣灵气
        this.playerQi -= skill.cost;
        this.updatePlayerBars();

        // 增加熟练度
        const profGain = Phaser.Math.Between(PROFICIENCY_GAIN.min, PROFICIENCY_GAIN.max);
        if (!this.skillProficiency) this.skillProficiency = {};
        this.skillProficiency[skillId] = (this.skillProficiency[skillId] || 0) + profGain;
        if (!this.manualProficiency) this.manualProficiency = {};
        this.manualProficiency[this.playerManual] = (this.manualProficiency[this.playerManual] || 0) + Math.ceil(profGain / 2);

        // 播放技能特效
        this.playSkillEffect(skill);

        // 玩家攻击动画（往前冲）
        this.tweens.add({
            targets: this.playerSprite,
            x: 380,
            duration: 150,
            yoyo: true
        });

        // 计算伤害（功法加成 + 熟练度加成）
        let damage = skill.damage;
        const manual = CULTIVATION_MANUALS[this.playerManual];
        if (manual && manual.bonuses) {
            if (manual.bonuses.fireballDamage && skill.name === '火球术') {
                damage = Math.floor(damage * manual.bonuses.fireballDamage);
            }
            if (manual.bonuses.slashDamage && skill.name === '斩击') {
                damage = Math.floor(damage * manual.bonuses.slashDamage);
            }
        }
        // 熟练度加成
        const skillProfExp = this.skillProficiency[skillId] || 0;
        const profInfo = this.getProficiencyInfo(skillProfExp);
        damage = Math.floor(damage * profInfo.damageBonus);

        if (damage < 0) {
            // 治疗技能
            const healAmount = -damage;
            this.playerHp = Math.min(this.playerMaxHp, this.playerHp + healAmount);
            this.updatePlayerBars();
            this.turnText.setText(`你使用了【${skill.name}】，恢复 ${healAmount} 点气血！`);
        } else {
            // 伤害技能，减去怪物防御
            const actualDamage = Math.max(1, damage - this.monster.defense);
            this.enemyHp -= actualDamage;
            this.updateEnemyBars();

            // 怪物受击闪红
            this.tweens.add({
                targets: this.enemySprite,
                alpha: 0.3,
                duration: 80,
                yoyo: true,
                repeat: 2
            });

            // 怪物受击后退
            this.tweens.add({
                targets: this.enemySprite,
                x: 1020,
                duration: 100,
                yoyo: true
            });

            this.turnText.setText(`你使用了【${skill.name}】，造成 ${actualDamage} 点伤害！`);
        }

        this.updateSkillButtons();

        // 检查怪物是否死亡（血量≤0，包括负数）
        if (this.enemyHp <= 0) {
            this.enemyHp = 0;
            this.updateEnemyBars();
            this.time.delayedCall(800, () => this.onMonsterDefeated());
            return;
        }

        // 灵气耗光自动结束回合
        if (this.playerQi <= 0) {
            this.turnText.setText('灵气耗尽，自动结束回合...');
            this.time.delayedCall(1200, () => this.endPlayerTurn());
        }
    }

    /**
     * 怪物被击败
     */
    onMonsterDefeated() {
        if (this.battleEnded) return;
        this.battleEnded = true;

        // 怪物死亡动画（淡出+缩小）
        this.tweens.add({
            targets: this.enemySprite,
            alpha: 0,
            scaleY: 0.5,
            y: this.enemySprite.y + 50,
            duration: 800,
            ease: 'Cubic.easeIn'
        });

        this.turnText.setText(`🎉 ${this.monster.name} 被击败了！`);

        // 计算掉落
        const drops = this.calculateDrops();

        // 给经验
        const expGain = this.monster.exp;
        this.playerLevelExp += expGain;

        // 【新增】给所有野怪额外添加50宗门贡献
        const contributionGain = 50;
        this.playerContribution += contributionGain;
        console.log(`[战斗] 获得宗门贡献 +${contributionGain}，当前宗门贡献: ${this.playerContribution}`);

        // 检查升级
        this.checkLevelUp();

        // 保存玩家状态
        this.savePlayerState();

        // 记录战斗结果到大地图用
        if (!window.gameState) window.gameState = {};
        window.gameState.lastBattleResult = {
            victory: true,
            monsterId: this.monsterId,
            monsterPointId: this.monsterPointId,
            drops: drops,
            expGain: expGain,
            contributionGain: contributionGain
        };

        // 标记怪物点为已击败（大地图上会消失）
        if (this.monsterPointId) {
            if (!window.defeatedMonsters) window.defeatedMonsters = {};
            window.defeatedMonsters[this.monsterPointId] = Date.now();
            console.log(`[战斗] 怪物点 ${this.monsterPointId} 已标记为击败`);
        }

        // 显示掉落信息
        let dropText = `获得 ${expGain} 经验\n宗门贡献 +${contributionGain}`;
        if (drops.length > 0) {
            dropText += '\n掉落：' + drops.map(d => `${ITEMS[d.item].name}x${d.amount}`).join('、');
        }

        this.time.delayedCall(1000, () => {
            this.turnText.setText(dropText);
        });

        // 2.5秒后返回大地图
        this.time.delayedCall(2500, () => {
            this.endBattle('victory');
        });
    }

    /**
     * 计算掉落
     */
    calculateDrops() {
        const drops = [];
        if (!this.monster.drops) {
            console.log('[战斗] 怪物没有掉落配置');
            return drops;
        }

        console.log('[战斗] 开始计算掉落，怪物:', this.monster.name, '掉落配置:', this.monster.drops);

        this.monster.drops.forEach(drop => {
            const roll = Math.random();
            console.log(`[战斗] 掉落 ${drop.item}: 概率=${drop.chance}, 掷骰=${roll.toFixed(3)}, 命中=${roll < drop.chance}`);
            if (roll < drop.chance) {
                drops.push({ item: drop.item, amount: drop.amount });
                // 加到背包（全局状态）
                if (window.gameState && window.gameState.player) {
                    if (!window.gameState.player.inventory) {
                        window.gameState.player.inventory = {};
                    }
                    const inv = window.gameState.player.inventory;
                    inv[drop.item] = (inv[drop.item] || 0) + drop.amount;
                    console.log(`[战斗] 掉落物已添加到全局背包: ${drop.item} x${drop.amount}, 当前背包:`, inv);
                } else {
                    console.log('[战斗] 警告: window.gameState.player 不存在，掉落物无法添加！');
                }
            }
        });

        console.log('[战斗] 最终掉落列表:', drops);
        return drops;
    }

    /**
     * 检查升级
     */
    checkLevelUp() {
        let leveledUp = false;
        while (true) {
            const needExp = LEVEL_SYSTEM.baseExp + (this.playerLevel - 1) * LEVEL_SYSTEM.expPerLevel;
            if (this.playerLevelExp >= needExp && this.playerLevel < LEVEL_SYSTEM.maxLevel) {
                this.playerLevelExp -= needExp;
                this.playerLevel++;
                this.playerMaxHp += 10;
                this.playerHp = this.playerMaxHp;
                this.playerMaxQi += 1;
                this.playerQi = this.playerMaxQi;
                leveledUp = true;
                console.log(`[战斗] 升级！当前 ${this.playerLevel} 级`);
            } else {
                break;
            }
        }
        if (leveledUp) {
            this.updatePlayerBars();
        }
        return leveledUp;
    }

    /**
     * 结束玩家回合，敌人行动
     */
    endPlayerTurn() {
        if (this.battleEnded) return;
        this.turn = 'enemy';
        this.updateSkillButtons();
        this.turnText.setText('【敌人回合】...');

        this.time.delayedCall(1200, () => {
            if (this.battleEnded) return;

            // 敌人攻击（攻击力±20%浮动）
            const baseDamage = this.monster.attack;
            const damage = Math.max(1, Math.floor(baseDamage * (0.8 + Math.random() * 0.4)));
            this.playerHp -= damage;
            if (this.playerHp < 0) this.playerHp = 0;
            this.updatePlayerBars();

            this.turnText.setText(`${this.monster.name} 攻击了你，受到 ${damage} 点伤害！`);

            // 敌人扑过来动画
            this.tweens.add({
                targets: this.enemySprite,
                x: 850,
                duration: 150,
                yoyo: true
            });

            // 玩家受击闪红
            this.tweens.add({
                targets: this.playerSprite,
                alpha: 0.4,
                duration: 80,
                yoyo: true,
                repeat: 2
            });

            // 检查玩家是否死亡
            if (this.playerHp <= 0) {
                this.battleEnded = true;
                this.turnText.setText('💀 你被击败了...');
                this.savePlayerState();
                if (!window.gameState) window.gameState = {};
                window.gameState.lastBattleResult = {
                    victory: false,
                    monsterId: this.monsterId,
                    monsterPointId: this.monsterPointId
                };
                this.time.delayedCall(2000, () => this.endBattle('defeat'));
                return;
            }

            // 回到玩家回合，恢复最大灵气的50%
            this.time.delayedCall(1200, () => {
                if (this.battleEnded) return;
                const qiRestore = Math.ceil(this.playerMaxQi * 0.5);
                this.playerQi = Math.min(this.playerMaxQi, this.playerQi + qiRestore);
                this.updatePlayerBars();
                this.turn = 'player';
                this.turnCount++;
                this.turnText.setText(`【第 ${this.turnCount} 回合】你的回合，灵气+${qiRestore}`);
                this.updateSkillButtons();
            });
        });
    }

    /**
     * 结束战斗，返回大地图
     */
    endBattle(result) {
        this.savePlayerState();
        this.scene.start('WorldMapScene', {
            fromBattle: true,
            battleResult: result,
            monsterPointId: this.monsterPointId
        });
    }

    /**
     * 更新玩家血条灵气条
     */
    updatePlayerBars() {
        const hpPercent = Math.max(0, this.playerHp / this.playerMaxHp);
        this.playerHpBar.width = 176 * hpPercent;
        this.playerHpText.setText(`${this.playerHp}/${this.playerMaxHp}`);

        const qiPercent = Math.max(0, this.playerQi / this.playerMaxQi);
        this.playerQiBar.width = 176 * qiPercent;
        this.playerQiText.setText(`灵气 ${this.playerQi}/${this.playerMaxQi}`);
    }

    /**
     * 更新怪物血条
     */
    updateEnemyBars() {
        const hpPercent = Math.max(0, this.enemyHp / this.enemyMaxHp);
        this.enemyHpBar.width = 196 * hpPercent;
        this.enemyHpText.setText(`${Math.max(0, this.enemyHp)}/${this.enemyMaxHp}`);
    }

    /**
     * 播放技能特效
     */
    playSkillEffect(skill) {
        const g = this.effectLayer;
        g.clear();

        const effectType = skill.effect || 'normal';
        const color = skill.color || 0xffffff;

        switch (effectType) {
            case 'slash':
                // 刀光：一道白色弧线
                g.lineStyle(4, 0xffffff, 0.9);
                g.beginPath();
                g.arc(950, 380, 80, -0.5, 0.5);
                g.strokePath();
                g.lineStyle(2, color, 0.6);
                g.beginPath();
                g.arc(950, 380, 90, -0.6, 0.6);
                g.strokePath();
                break;

            case 'fireball':
                // 火球：一个橙色圆形+光晕
                g.fillStyle(0xff6600, 0.8);
                g.fillCircle(950, 380, 35);
                g.fillStyle(0xffcc00, 0.6);
                g.fillCircle(950, 380, 20);
                g.fillStyle(0xffffff, 0.5);
                g.fillCircle(945, 375, 8);
                break;

            case 'sword_qi':
                // 剑气：一道金色直线
                g.lineStyle(6, 0xffd700, 0.9);
                g.lineBetween(700, 350, 1000, 400);
                g.lineStyle(3, 0xffffff, 0.6);
                g.lineBetween(720, 355, 980, 395);
                break;

            case 'ten_thousand_swords':
                // 万剑归宗：多道剑气
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    const x = 950 + Math.cos(angle) * 100;
                    const y = 380 + Math.sin(angle) * 80;
                    g.lineStyle(3, 0xffd700, 0.7);
                    g.lineBetween(x - 30, y - 20, x + 30, y + 20);
                }
                break;

            case 'ice_spike':
                // 冰刺：蓝色尖刺
                g.fillStyle(0x87ceeb, 0.8);
                g.fillTriangle(930, 420, 950, 320, 970, 420);
                g.fillStyle(0xffffff, 0.5);
                g.fillTriangle(940, 420, 950, 340, 960, 420);
                break;

            case 'ice_lock':
                // 冰封：蓝色冰块
                g.fillStyle(0x00bfff, 0.5);
                g.fillRect(900, 300, 100, 160);
                g.lineStyle(3, 0x87ceeb, 0.8);
                g.strokeRect(900, 300, 100, 160);
                break;

            case 'thunder':
                // 雷击：紫色闪电
                g.lineStyle(4, 0x9932cc, 0.9);
                g.beginPath();
                g.moveTo(950, 200);
                g.lineTo(930, 300);
                g.lineTo(960, 340);
                g.lineTo(940, 420);
                g.strokePath();
                g.fillStyle(0x9932cc, 0.3);
                g.fillCircle(950, 380, 50);
                break;

            case 'five_thunders':
                // 五雷轰顶：多道闪电
                for (let i = 0; i < 5; i++) {
                    const ox = 900 + i * 25;
                    g.lineStyle(3, 0x8a2be2, 0.8);
                    g.beginPath();
                    g.moveTo(ox, 180);
                    g.lineTo(ox - 15, 280);
                    g.lineTo(ox + 10, 350);
                    g.lineTo(ox - 5, 430);
                    g.strokePath();
                }
                break;

            case 'vine':
                // 藤蔓：绿色曲线
                g.lineStyle(5, 0x228b22, 0.8);
                g.beginPath();
                g.moveTo(900, 450);
                g.bezierCurveTo(920, 380, 980, 400, 950, 320);
                g.strokePath();
                g.fillStyle(0x32cd32, 0.6);
                g.fillCircle(950, 340, 15);
                break;

            case 'heal':
                // 治愈：绿色光环
                g.lineStyle(3, 0x32cd32, 0.7);
                g.strokeCircle(280, 380, 60);
                g.fillStyle(0x32cd32, 0.2);
                g.fillCircle(280, 380, 50);
                // 几个十字光点
                for (let i = 0; i < 5; i++) {
                    const angle = (i / 5) * Math.PI * 2;
                    g.fillStyle(0x90ee90, 0.8);
                    g.fillRect(280 + Math.cos(angle) * 50 - 3, 380 + Math.sin(angle) * 50 - 8, 6, 16);
                    g.fillRect(280 + Math.cos(angle) * 50 - 8, 380 + Math.sin(angle) * 50 - 3, 16, 6);
                }
                break;

            default:
                // 默认：一个闪光
                g.fillStyle(color, 0.5);
                g.fillCircle(950, 380, 40);
                break;
        }

        // 特效0.5秒后清除
        this.time.delayedCall(500, () => {
            this.effectLayer.clear();
        });
    }
}
