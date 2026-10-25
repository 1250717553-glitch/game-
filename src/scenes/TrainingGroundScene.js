/**
 * ============================================================
 *  TrainingGroundScene.js —— 练功台场景（完整版）
 * ============================================================
 *  【这是什么？】
 *  宗门的练功台。玩家可以在这里：
 *  1. 查看已学习的功法
 *  2. 登记学习储物戒里的秘籍
 *  3. 查看被动功法效果
 *
 *  【秘籍学习流程】
 *  外面获得的秘籍先放在储物戒 → 来练功台登记 → 学习成功 → 从储物戒移除
 */

class TrainingGroundScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TrainingGroundScene' });
    }

    create() {
        console.log('%c[练功台] 进入练功台场景', 'color: #c9a84c; font-weight: bold');

        // 从全局状态恢复player
        this.loadPlayerState();

        // 背景
        if (this.textures.exists('training_ground')) {
            const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'training_ground');
            bg.setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
        } else {
            const g = this.add.graphics();
            g.fillStyle(0xf5f0e1, 1);
            g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        }

        // 半透明遮罩
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.15);
        overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // 标题
        this.add.text(GAME_WIDTH / 2, 40, '🧘 练功台 - 功法修炼', {
            fontFamily: '楷体, KaiTi, serif',
            fontSize: '32px',
            color: '#4a3728',
            backgroundColor: 'rgba(245,240,225,0.9)',
            padding: { x: 25, y: 8 }
        }).setOrigin(0.5);

        // 创建HTML面板
        this.createHtmlPanel();

        // 返回按钮
        const btn = this.add.rectangle(80, GAME_HEIGHT - 40, 120, 45, 0x8b7355, 0.95)
            .setStrokeStyle(2, 0x4a3728, 1)
            .setInteractive({ useHandCursor: true });
        this.add.text(80, GAME_HEIGHT - 40, '← 返回宗门', {
            fontFamily: '楷体, KaiTi, serif', fontSize: '18px', color: '#fff'
        }).setOrigin(0.5);
        btn.on('pointerover', () => btn.setFillStyle(0xc44536, 0.95));
        btn.on('pointerout', () => btn.setFillStyle(0x8b7355, 0.95));
        btn.on('pointerdown', () => this.returnToBaseMap());
    }

    /**
     * 从全局状态恢复player
     */
    loadPlayerState() {
        if (window.gameState && window.gameState.player && window.gameState.player.playerObject) {
            this.player = window.gameState.player.playerObject;
            console.log('[练功台] 从全局状态恢复player:', this.player);
        } else {
            console.error('[练功台] 无法从全局状态恢复player！');
            this.player = null;
        }
    }

    /**
     * 创建HTML面板
     */
    createHtmlPanel() {
        const self = this;

        // 主容器
        this.panel = document.createElement('div');
        this.panel.style.cssText = `
            position:fixed; top:80px; left:50%; transform:translateX(-50%);
            width:1100px; height:560px;
            background:linear-gradient(135deg, rgba(245,240,225,0.97), rgba(230,220,200,0.95));
            border:3px solid #5c4a32; border-radius:12px;
            box-shadow:0 8px 32px rgba(0,0,0,0.4);
            display:flex; flex-direction:column;
            font-family:'楷体',KaiTi,serif;
            z-index:1000; overflow:hidden;
        `;

        // 内容区：左右分栏
        const content = document.createElement('div');
        content.style.cssText = 'flex:1; display:flex; padding:15px; gap:15px;';

        // ===== 左侧：已学习功法 =====
        const leftPanel = this.createLearnedManualsPanel();
        content.appendChild(leftPanel);

        // ===== 中间：分隔线 =====
        const divider = document.createElement('div');
        divider.style.cssText = 'width:2px; background:linear-gradient(to bottom, transparent, #8b7355, transparent);';
        content.appendChild(divider);

        // ===== 右侧：储物戒里的秘籍（可学习） =====
        const rightPanel = this.createAvailableManualsPanel();
        content.appendChild(rightPanel);

        content.appendChild(leftPanel);
        content.appendChild(divider);
        content.appendChild(rightPanel);
        this.panel.appendChild(content);

        // 底部提示
        const footer = document.createElement('div');
        footer.style.cssText = `
            padding:10px 20px; background:rgba(92,74,50,0.1);
            border-top:1px solid #8b7355; text-align:center;
            font-size:13px; color:#666;
        `;
        footer.textContent = '💡 提示：在野外打怪获得秘籍后，来练功台登记学习。被动功法学习后自动生效，增加技能槽位。';
        this.panel.appendChild(footer);

        document.body.appendChild(this.panel);
    }

    /**
     * 创建已学习功法面板
     */
    createLearnedManualsPanel() {
        const self = this;
        const panel = document.createElement('div');
        panel.style.cssText = 'flex:1; display:flex; flex-direction:column; gap:10px;';

        // 标题
        const title = document.createElement('div');
        title.style.cssText = 'font-size:20px; color:#4a3728; font-weight:bold; text-align:center; padding-bottom:8px; border-bottom:2px solid #8b7355;';
        title.textContent = '📚 已学习功法';
        panel.appendChild(title);

        // 技能槽位信息
        const slotInfo = document.createElement('div');
        slotInfo.style.cssText = 'font-size:14px; color:#8b5a2b; text-align:center; padding:5px; background:rgba(139,90,43,0.1); border-radius:6px;';
        const maxSlots = this.player ? this.player.getMaxSkillSlots() : 4;
        slotInfo.textContent = `⚔ 当前最多可装备 ${maxSlots} 个技能`;
        panel.appendChild(slotInfo);

        // 功法列表（滚动）
        const list = document.createElement('div');
        list.style.cssText = 'flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:8px; padding:5px;';
        list.id = 'learned-manuals-list';

        if (this.player && this.player.learnedManuals) {
            this.player.learnedManuals.forEach(manualId => {
                const manual = CULTIVATION_MANUALS[manualId];
                if (!manual) return;

                const item = document.createElement('div');
                item.style.cssText = `
                    padding:10px; background:rgba(255,255,255,0.7);
                    border:2px solid ${this.getGradeColor(manual.grade)};
                    border-radius:8px; cursor:default;
                `;

                // 功法名称
                const name = document.createElement('div');
                name.style.cssText = `font-size:16px; color:${this.getGradeColor(manual.grade)}; font-weight:bold; margin-bottom:4px;`;
                name.textContent = `${manual.name}【${this.getGradeName(manual.grade)}】`;
                item.appendChild(name);

                // 功法类型
                const type = document.createElement('div');
                type.style.cssText = 'font-size:12px; color:#666; margin-bottom:4px;';
                type.textContent = `类型：${manual.type || '功法'}${manual.isPassive ? '（被动，自动生效）' : ''}`;
                item.appendChild(type);

                // 功法描述
                const desc = document.createElement('div');
                desc.style.cssText = 'font-size:12px; color:#555; line-height:1.5;';
                desc.textContent = manual.desc || manual.description || '暂无描述';
                item.appendChild(desc);

                // 被动效果
                if (manual.isPassive && manual.bonuses && manual.bonuses.extraSkillSlots) {
                    const passive = document.createElement('div');
                    passive.style.cssText = 'font-size:12px; color:#c44536; margin-top:5px; font-weight:bold;';
                    passive.textContent = `✨ 被动效果：技能槽位 +${manual.bonuses.extraSkillSlots[0]}（第一层）`;
                    item.appendChild(passive);
                }

                list.appendChild(item);
            });
        }

        panel.appendChild(list);
        return panel;
    }

    /**
     * 创建可学习秘籍面板（储物戒里的秘籍）
     */
    createAvailableManualsPanel() {
        const self = this;
        const panel = document.createElement('div');
        panel.style.cssText = 'flex:1; display:flex; flex-direction:column; gap:10px;';

        // 标题
        const title = document.createElement('div');
        title.style.cssText = 'font-size:20px; color:#4a3728; font-weight:bold; text-align:center; padding-bottom:8px; border-bottom:2px solid #8b7355;';
        title.textContent = '📖 可学习秘籍（储物戒）';
        panel.appendChild(title);

        // 秘籍列表（滚动）
        const list = document.createElement('div');
        list.style.cssText = 'flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:8px; padding:5px;';
        list.id = 'available-manuals-list';

        // 从储物戒里找秘籍类物品
        const manuals = [];
        if (this.player && this.player.inventory) {
            const filledSlots = this.player.inventory.getFilledSlots();
            filledSlots.forEach(slot => {
                const item = ITEMS[slot.itemId];
                if (item && item.type === 'manual') {
                    manuals.push({ slot: slot, item: item });
                }
            });
        }

        if (manuals.length === 0) {
            const empty = document.createElement('div');
            empty.style.cssText = 'text-align:center; color:#999; font-size:14px; padding:40px 20px;';
            empty.textContent = '储物戒里没有可学习的秘籍\n\n去野外打怪获取秘籍吧！';
            list.appendChild(empty);
        } else {
            manuals.forEach(({ slot, item }) => {
                const manualId = item.manualId;
                const manual = CULTIVATION_MANUALS[manualId];
                const alreadyLearned = this.player && this.player.learnedManuals.includes(manualId);

                const itemEl = document.createElement('div');
                itemEl.style.cssText = `
                    padding:12px; background:rgba(255,255,255,0.8);
                    border:2px solid ${this.getGradeColor(item.grade || manual.grade)};
                    border-radius:8px; cursor:pointer;
                    transition:all 0.2s;
                `;
                itemEl.onmouseover = () => {
                    itemEl.style.background = 'rgba(255,255,255,0.95)';
                    itemEl.style.transform = 'translateY(-2px)';
                    itemEl.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                };
                itemEl.onmouseout = () => {
                    itemEl.style.background = 'rgba(255,255,255,0.8)';
                    itemEl.style.transform = 'translateY(0)';
                    itemEl.style.boxShadow = 'none';
                };

                // 秘籍名称
                const name = document.createElement('div');
                name.style.cssText = `font-size:16px; color:${this.getGradeColor(item.grade || manual.grade)}; font-weight:bold; margin-bottom:4px;`;
                name.textContent = `${item.name} x${slot.count}`;
                itemEl.appendChild(name);

                // 对应功法
                if (manual) {
                    const manualName = document.createElement('div');
                    manualName.style.cssText = 'font-size:13px; color:#8b5a2b; margin-bottom:4px;';
                    manualName.textContent = `对应功法：${manual.name}`;
                    itemEl.appendChild(manualName);

                    // 功法类型
                    const type = document.createElement('div');
                    type.style.cssText = 'font-size:12px; color:#666; margin-bottom:4px;';
                    type.textContent = `类型：${manual.type || '功法'}${manual.isPassive ? '（被动）' : ''}`;
                    itemEl.appendChild(type);

                    // 功法描述
                    const desc = document.createElement('div');
                    desc.style.cssText = 'font-size:12px; color:#555; line-height:1.5; margin-bottom:8px;';
                    desc.textContent = manual.desc || manual.description || '暂无描述';
                    itemEl.appendChild(desc);

                    // 被动效果
                    if (manual.isPassive && manual.bonuses && manual.bonuses.extraSkillSlots) {
                        const passive = document.createElement('div');
                        passive.style.cssText = 'font-size:12px; color:#c44536; margin-bottom:8px; font-weight:bold;';
                        passive.textContent = `✨ 被动效果：技能槽位 +${manual.bonuses.extraSkillSlots[0]}（第一层）`;
                        itemEl.appendChild(passive);
                    }
                }

                // 学习按钮
                const learnBtn = document.createElement('button');
                if (alreadyLearned) {
                    learnBtn.textContent = '✓ 已学习';
                    learnBtn.style.cssText = `
                        width:100%; padding:8px; background:#999; color:#fff;
                        border:none; border-radius:6px; cursor:not-allowed;
                        font-family:'楷体',KaiTi,serif; font-size:14px;
                    `;
                    learnBtn.disabled = true;
                } else {
                    learnBtn.textContent = '📖 登记学习';
                    learnBtn.style.cssText = `
                        width:100%; padding:8px; background:linear-gradient(135deg, #8b3a3a, #a85050);
                        color:#fff; border:none; border-radius:6px; cursor:pointer;
                        font-family:'楷体',KaiTi,serif; font-size:14px; font-weight:bold;
                        transition:all 0.2s;
                    `;
                    learnBtn.onmouseover = () => learnBtn.style.background = 'linear-gradient(135deg, #a85050, #c46060)';
                    learnBtn.onmouseout = () => learnBtn.style.background = 'linear-gradient(135deg, #8b3a3a, #a85050)';
                    learnBtn.onclick = (e) => {
                        e.stopPropagation();
                        self.learnManual(item.id);
                    };
                }
                itemEl.appendChild(learnBtn);

                list.appendChild(itemEl);
            });
        }

        panel.appendChild(list);
        return panel;
    }

    /**
     * 学习秘籍
     */
    learnManual(itemId) {
        if (!this.player) {
            alert('系统错误：player对象不存在');
            return;
        }

        const result = this.player.learnManualFromItem(itemId);
        if (result.success) {
            alert(result.message);
            // 保存游戏
            this.saveGame();
            // 刷新面板
            this.refreshPanel();
        } else {
            alert(result.message);
        }
    }

    /**
     * 刷新面板
     */
    refreshPanel() {
        if (this.panel) {
            this.panel.remove();
        }
        this.createHtmlPanel();
    }

    /**
     * 获取品级颜色
     */
    getGradeColor(grade) {
        const colors = ['#ccc', '#4ade80', '#60a5fa', '#facc15', '#fb923c', '#ef4444'];
        return colors[grade - 1] || '#ccc';
    }

    /**
     * 获取品级名称
     */
    getGradeName(grade) {
        const names = ['', '凡品', '良品', '上品', '极品', '仙品', '神品'];
        return names[grade] || '凡品';
    }

    /**
     * 保存游戏
     */
    saveGame() {
        if (this.player && this.player.scene && this.player.scene.saveGame) {
            this.player.scene.saveGame();
        }
    }

    /**
     * 返回宗门主地图
     */
    returnToBaseMap() {
        // 保存player到全局状态
        if (!window.gameState) window.gameState = {};
        if (!window.gameState.player) window.gameState.player = {};
        window.gameState.player.playerObject = this.player;

        // 移除HTML面板
        if (this.panel) {
            this.panel.remove();
            this.panel = null;
        }

        this.scene.start('BaseMapScene');
    }

    shutdown() {
        // 场景关闭时移除HTML面板
        if (this.panel) {
            this.panel.remove();
            this.panel = null;
        }
    }
}
