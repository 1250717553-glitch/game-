/**
 * ============================================================
 *  GongfaPavilionScene.js —— 功法阁场景（重写版）
 * ============================================================
 *  【这是什么？】
 *  宗门的功法阁。玩家可以在这里：
 *    1. 查看所有功法（从constants.js的CULTIVATION_MANUALS读取）
 *    2. 查看已学习的功法
 *    3. 切换当前修炼的功法
 *    4. 查看功法详情和技能列表
 *
 *  【功法数据来源】
 *  所有功法定义在 src/config/constants.js 的 CULTIVATION_MANUALS 对象里
 *  玩家已学功法存在 player.learnedManuals 数组里
 *  当前修炼功法存在 player.manual 字段里
 */

class GongfaPavilionScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GongfaPavilionScene' });
        this.player = null;
        this.gongfaPanel = null;
    }

    create() {
        console.log('%c[功法阁] 进入功法阁场景', 'color: #9c27b0; font-weight: bold');

        // 从全局状态获取玩家数据
        if (window.gameState && window.gameState.player) {
            this.player = window.gameState.player;
        }

        // 确保玩家数据存在
        if (!this.player) {
            this.showToast('玩家数据异常！');
            this.time.delayedCall(1000, () => this.returnToBase());
            return;
        }

        // 确保已学功法数组存在
        if (!this.player.learnedManuals) this.player.learnedManuals = [];

        // 背景
        this.drawBackground('gongfa_pavilion');

        // 标题
        this.add.text(GAME_WIDTH / 2, 50, '📖 功法阁 · 修炼功法', {
            fontFamily: '楷体, KaiTi, serif',
            fontSize: '30px',
            color: '#f5f0e1',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: { x: 30, y: 10 }
        }).setOrigin(0.5).setDepth(100);

        // 当前修炼功法提示
        const currentManual = this.player.manual ? CULTIVATION_MANUALS[this.player.manual] : null;
        const currentText = currentManual
            ? `当前修炼：${currentManual.name}`
            : '当前修炼：无（请选择一部功法）';
        this.add.text(GAME_WIDTH / 2, 95, currentText, {
            fontFamily: '楷体, KaiTi, serif',
            fontSize: '18px',
            color: '#c9a84c',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: { x: 15, y: 5 }
        }).setOrigin(0.5).setDepth(100);

        // 创建功法列表面板（HTML实现）
        this.createGongfaPanel();

        // ESC返回
        this.input.keyboard.on('keydown-ESC', () => this.returnToBase());
    }

    /**
     * 创建功法列表面板（HTML实现，一栏一个功法）
     */
    createGongfaPanel() {
        const self = this;

        // 从constants.js读取所有功法
        const allGongfa = Object.entries(CULTIVATION_MANUALS).map(([id, data]) => ({
            id: id,
            ...data
        }));

        // 品级配置（和物品品级一致）
        const gradeConfig = {
            1: { name: '凡品', color: '#999999' },
            2: { name: '良品', color: '#4ade80' },
            3: { name: '上品', color: '#60a5fa' },
            4: { name: '极品', color: '#facc15' },
            5: { name: '仙品', color: '#fb923c' },
            6: { name: '神品', color: '#ef4444' }
        };

        // 功法图标映射
        const iconMap = {
            'qi_refining': 'gongfa_jianqi',
            'fire_art': 'gongfa_lieyan',
            'thunder_art': 'gongfa_tianlei',
            'wood_art': 'gongfa_jianqi',
            'sword_art': 'gongfa_jianqi',
            'ice_art': 'gongfa_lieyan'
        };

        // 创建遮罩
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position:fixed; top:0; left:0; width:100%; height:100%;
            z-index:9998; display:flex; align-items:center; justify-content:center;
            pointer-events:none;
        `;

        // 主面板
        const panel = document.createElement('div');
        panel.style.cssText = `
            width:750px; max-height:75vh; overflow-y:auto;
            background:linear-gradient(135deg, rgba(245,240,225,0.95) 0%, rgba(232,220,200,0.95) 100%);
            border:3px solid #5c4a32; border-radius:12px;
            box-shadow:0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.5);
            padding:20px; position:relative;
            font-family:'楷体',KaiTi,serif;
            pointer-events:auto;
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
        title.innerHTML = '📖 功法秘籍';
        panel.appendChild(title);

        // 副标题
        const subtitle = document.createElement('div');
        subtitle.style.cssText = `
            text-align:center; font-size:13px; color:#8b5a2b; margin-bottom:15px; letter-spacing:2px;
        `;
        subtitle.textContent = '—— 功法修炼，逆天改命 ——';
        panel.appendChild(subtitle);

        // 已学/未学统计
        const learnedCount = allGongfa.filter(g => this.player.learnedManuals.includes(g.id)).length;
        const statsText = document.createElement('div');
        statsText.style.cssText = `
            text-align:center; font-size:13px; color:#666; margin-bottom:15px;
            padding:8px; background:rgba(255,255,255,0.4); border-radius:8px;
            border:1px solid #c4b896;
        `;
        statsText.innerHTML = `已学习 <strong style="color:#4ade80;">${learnedCount}</strong> 部功法 | 未学习 <strong style="color:#999;">${allGongfa.length - learnedCount}</strong> 部`;
        panel.appendChild(statsText);

        // 技能装备按钮
        const equipBtn = document.createElement('button');
        const equippedCount = (this.player.equippedSkills || []).length;
        equipBtn.textContent = `⚔ 技能装备（已装备 ${equippedCount}/${this.player.maxEquippedSkills || 4}）`;
        equipBtn.style.cssText = `
            display:block; margin:0 auto 15px; padding:10px 30px;
            font-size:15px; font-family:'楷体',KaiTi,serif;
            background:linear-gradient(135deg, #c9a84c, #a88a3c); color:#fff;
            border:none; border-radius:8px; cursor:pointer;
            box-shadow:0 4px 8px rgba(0,0,0,0.3);
            letter-spacing:2px;
        `;
        equipBtn.onclick = () => this.showSkillEquipPanel();
        panel.appendChild(equipBtn);

        // 功法列表（一栏一个功法）
        allGongfa.forEach(gongfa => {
            const isLearned = this.player.learnedManuals.includes(gongfa.id);
            const isCurrent = this.player.manual === gongfa.id;
            const grade = gongfa.grade || 2;  // 默认良品
            const gradeInfo = gradeConfig[grade] || gradeConfig[2];
            const iconKey = iconMap[gongfa.id] || 'gongfa_jianqi';

            // 功法卡片
            const card = document.createElement('div');
            card.style.cssText = `
                display:flex; align-items:center; gap:15px;
                padding:15px; margin-bottom:12px;
                background:${isCurrent ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.6)'};
                border:2px solid ${isCurrent ? '#c9a84c' : gradeInfo.color};
                border-radius:10px;
                box-shadow:0 2px 8px ${gradeInfo.color}33;
                transition:all 0.2s;
                cursor:pointer;
                ${isCurrent ? 'border-width:3px;' : ''}
            `;

            // 悬停效果
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateX(5px)';
                card.style.boxShadow = `0 4px 16px ${gradeInfo.color}66`;
                card.style.background = 'rgba(255,255,255,0.85)';
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateX(0)';
                card.style.boxShadow = `0 2px 8px ${gradeInfo.color}33`;
                card.style.background = isCurrent ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.6)';
            });

            // 功法图标（圆形背景）
            const iconBox = document.createElement('div');
            iconBox.style.cssText = `
                width:70px; height:70px; flex-shrink:0;
                background:radial-gradient(circle, ${gradeInfo.color}44 0%, ${gradeInfo.color}22 100%);
                border:3px solid ${gradeInfo.color};
                border-radius:50%;
                display:flex; align-items:center; justify-content:center;
                overflow:hidden;
                box-shadow:0 2px 8px ${gradeInfo.color}44;
            `;
            // 用Phaser纹理创建图片
            if (this.textures.exists(iconKey)) {
                const iconImg = document.createElement('img');
                iconImg.src = this.textures.get(iconKey).getSourceImage().src;
                iconImg.style.cssText = 'width:55px; height:55px; object-fit:contain;';
                iconBox.appendChild(iconImg);
            } else {
                iconBox.innerHTML = '<span style="font-size:30px;">📜</span>';
            }
            card.appendChild(iconBox);

            // 功法信息
            const infoBox = document.createElement('div');
            infoBox.style.cssText = 'flex:1; min-width:0;';

            // 功法名称 + 品级 + 状态
            const nameRow = document.createElement('div');
            nameRow.style.cssText = 'display:flex; align-items:center; gap:10px; margin-bottom:5px;';
            nameRow.innerHTML = `
                <span style="font-size:18px; font-weight:bold; color:#3a2a1a;">${gongfa.name}</span>
                <span style="font-size:11px; color:${gradeInfo.color}; border:1px solid ${gradeInfo.color}; padding:1px 6px; border-radius:3px;">${gradeInfo.name}</span>
                ${isCurrent ? '<span style="font-size:11px; color:#c9a84c; border:1px solid #c9a84c; padding:1px 6px; border-radius:3px;">修炼中</span>' : ''}
                ${!isLearned ? '<span style="font-size:11px; color:#999; border:1px solid #999; padding:1px 6px; border-radius:3px;">未学习</span>' : ''}
            `;
            infoBox.appendChild(nameRow);

            // 功法描述
            const desc = document.createElement('div');
            desc.style.cssText = 'font-size:12px; color:#666; line-height:1.5; margin-bottom:5px;';
            desc.textContent = gongfa.description || '暂无描述';
            infoBox.appendChild(desc);

            // 技能列表（区分已学习和未学习）
            const skillsRow = document.createElement('div');
            skillsRow.style.cssText = 'font-size:12px; color:#5c4a32; margin-bottom:3px;';
            const skillNames = (gongfa.skills || []).map(skillId => {
                const skill = SKILLS[skillId];
                const skillLearned = this.player.skills && this.player.skills.includes(skillId);
                const name = skill ? skill.name : skillId;
                return skillLearned
                    ? `<span style="color:#4ade80; font-weight:bold;">${name}✓</span>`
                    : `<span style="color:#999;">${name}</span>`;
            }).join('、');
            skillsRow.innerHTML = `⚡ 技能：${skillNames || '无'}`;
            infoBox.appendChild(skillsRow);

            // 已学技能数量
            const learnedCount = (gongfa.skills || []).filter(s => this.player.skills && this.player.skills.includes(s)).length;
            const totalCount = (gongfa.skills || []).length;
            const learnProgress = document.createElement('div');
            learnProgress.style.cssText = 'font-size:11px; color:#8b7355;';
            learnProgress.textContent = `📖 已学 ${learnedCount}/${totalCount} 个技能 | 适用境界：${gongfa.maxRealm || '炼气期'}`;
            infoBox.appendChild(learnProgress);

            card.appendChild(infoBox);

            // 操作按钮
            const btnBox = document.createElement('div');
            btnBox.style.cssText = 'flex-shrink:0; display:flex; flex-direction:column; gap:5px;';

            if (isLearned) {
                if (!isCurrent) {
                    // 切换修炼按钮
                    const switchBtn = document.createElement('button');
                    switchBtn.textContent = '切换修炼';
                    switchBtn.style.cssText = `
                        padding:6px 12px; font-size:12px; font-family:'楷体',KaiTi,serif;
                        background:linear-gradient(135deg, #c9a84c, #a88a3c); color:#fff;
                        border:none; border-radius:5px; cursor:pointer;
                        box-shadow:0 2px 4px rgba(0,0,0,0.2);
                    `;
                    switchBtn.onclick = (e) => {
                        e.stopPropagation();
                        this.player.manual = gongfa.id;
                        this.showToast(`已切换修炼：${gongfa.name}`);
                        this.saveGame();
                        // 刷新面板
                        this.refreshPanel();
                    };
                    btnBox.appendChild(switchBtn);
                }

                // 详情按钮
                const detailBtn = document.createElement('button');
                detailBtn.textContent = '查看详情';
                detailBtn.style.cssText = `
                    padding:6px 12px; font-size:12px; font-family:'楷体',KaiTi,serif;
                    background:linear-gradient(135deg, #60a5fa, #3b82f6); color:#fff;
                    border:none; border-radius:5px; cursor:pointer;
                    box-shadow:0 2px 4px rgba(0,0,0,0.2);
                `;
                detailBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.showGongfaDetail(gongfa, gradeInfo);
                };
                btnBox.appendChild(detailBtn);
            } else {
                // 未学习提示
                const tip = document.createElement('div');
                tip.style.cssText = 'font-size:11px; color:#999; text-align:center; white-space:nowrap;';
                tip.textContent = '前往功德堂\n兑换学习';
                btnBox.appendChild(tip);
            }

            card.appendChild(btnBox);

            // 点击卡片显示详情
            card.onclick = () => {
                this.showGongfaDetail(gongfa, gradeInfo);
            };

            panel.appendChild(card);
        });

        // 关闭按钮
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕ 关闭';
        closeBtn.style.cssText = `
            display:block; margin:15px auto 0; padding:10px 40px;
            font-size:16px; font-family:'楷体',KaiTi,serif;
            background:linear-gradient(135deg, #8b7355, #6b5344); color:#fff;
            border:none; border-radius:8px; cursor:pointer;
            box-shadow:0 4px 8px rgba(0,0,0,0.3);
        `;
        closeBtn.onclick = () => this.returnToBase();
        panel.appendChild(closeBtn);

        overlay.appendChild(panel);
        document.body.appendChild(overlay);
        this.gongfaPanel = overlay;
    }

    /**
     * 刷新面板（切换功法后调用）
     */
    refreshPanel() {
        if (this.gongfaPanel) {
            this.gongfaPanel.remove();
            this.gongfaPanel = null;
        }
        this.createGongfaPanel();
    }

    /**
     * 显示功法详情弹窗
     */
    showGongfaDetail(gongfa, gradeInfo) {
        const self = this;

        // 遮罩
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position:fixed; top:0; left:0; width:100%; height:100%;
            background:rgba(0,0,0,0.6); z-index:9999;
            display:flex; align-items:center; justify-content:center;
        `;

        // 详情面板
        const detailPanel = document.createElement('div');
        detailPanel.style.cssText = `
            width:500px; max-height:80vh; overflow-y:auto;
            background:linear-gradient(135deg, rgba(245,240,225,0.98) 0%, rgba(232,220,200,0.98) 100%);
            border:3px solid ${gradeInfo.color}; border-radius:12px;
            box-shadow:0 8px 32px rgba(0,0,0,0.5);
            padding:25px; position:relative;
            font-family:'楷体',KaiTi,serif;
        `;

        // 标题
        const title = document.createElement('div');
        title.style.cssText = `
            text-align:center; font-size:24px; color:#3a2a1a;
            font-weight:bold; margin-bottom:10px; letter-spacing:3px;
            padding-bottom:10px; border-bottom:2px dashed ${gradeInfo.color};
        `;
        title.innerHTML = `📜 ${gongfa.name}`;
        detailPanel.appendChild(title);

        // 品级
        const grade = document.createElement('div');
        grade.style.cssText = `text-align:center; font-size:14px; color:${gradeInfo.color}; margin-bottom:15px;`;
        grade.textContent = `【${gradeInfo.name}】`;
        detailPanel.appendChild(grade);

        // 描述
        const desc = document.createElement('div');
        desc.style.cssText = `
            font-size:14px; color:#5c4a32; line-height:1.8;
            padding:12px; background:rgba(255,255,255,0.5);
            border-radius:8px; margin-bottom:15px; text-indent:2em;
        `;
        desc.textContent = gongfa.description || '暂无描述';
        detailPanel.appendChild(desc);

        // 基本信息
        const infoBox = document.createElement('div');
        infoBox.style.cssText = `
            padding:12px; background:rgba(255,255,255,0.5);
            border-radius:8px; margin-bottom:15px;
        `;
        infoBox.innerHTML = `
            <div style="font-size:13px; color:#5c4a32; margin-bottom:5px;">
                <strong>适用境界：</strong>${gongfa.maxRealm || '炼气期'}
            </div>
            <div style="font-size:13px; color:#5c4a32; margin-bottom:5px;">
                <strong>功法类型：</strong>${gongfa.type || '攻击类'}
            </div>
            <div style="font-size:13px; color:#5c4a32;">
                <strong>特效加成：</strong>${this.formatBonuses(gongfa.bonuses)}
            </div>
        `;
        detailPanel.appendChild(infoBox);

        // 技能列表
        const skillsTitle = document.createElement('div');
        skillsTitle.style.cssText = `
            font-size:16px; color:#3a2a1a; font-weight:bold;
            margin-bottom:10px; padding-left:10px;
            border-left:4px solid ${gradeInfo.color};
        `;
        skillsTitle.textContent = '⚡ 技能列表';
        detailPanel.appendChild(skillsTitle);

        (gongfa.skills || []).forEach(skillId => {
            const skill = SKILLS[skillId];
            if (!skill) return;

            // 检查是否已学习
            const isLearned = this.player.skills && this.player.skills.includes(skillId);
            // 学习消耗（根据伤害计算）
            let learnCost = 50;
            if (skill.damage > 15) learnCost = 80;
            if (skill.damage > 20) learnCost = 120;
            if (skill.damage > 30) learnCost = 200;
            if (skill.damage > 40) learnCost = 250;
            // 斩击免费
            if (skillId === 'slash') learnCost = 0;

            const skillItem = document.createElement('div');
            skillItem.style.cssText = `
                padding:10px; margin-bottom:8px;
                background:${isLearned ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.6)'};
                border-left:3px solid ${isLearned ? '#4ade80' : '#60a5fa'};
                border-radius:4px;
            `;

            // 技能信息
            const skillInfo = document.createElement('div');
            skillInfo.innerHTML = `
                <div style="font-size:14px; color:#3a2a1a; font-weight:bold; margin-bottom:3px;">
                    ${skill.name}
                    ${isLearned ? '<span style="font-size:11px; color:#4ade80; margin-left:10px; border:1px solid #4ade80; padding:1px 5px; border-radius:3px;">已学习</span>' : ''}
                    <span style="font-size:11px; color:#c44536; margin-left:10px;">灵气：${skill.cost}</span>
                    <span style="font-size:11px; color:#8b5a2b; margin-left:10px;">伤害：${skill.damage > 0 ? skill.damage : '恢复' + Math.abs(skill.damage)}</span>
                </div>
                <div style="font-size:12px; color:#666; line-height:1.5;">
                    ${skill.description}
                </div>
            `;
            skillItem.appendChild(skillInfo);

            // 学习按钮（未学习时显示）
            if (!isLearned) {
                const learnBtn = document.createElement('button');
                const canAfford = (this.player.contribution || 0) >= learnCost;
                learnBtn.textContent = learnCost === 0 ? '免费学习' : `学习（${learnCost}贡献）`;
                learnBtn.style.cssText = `
                    margin-top:8px; padding:6px 15px;
                    font-size:12px; font-family:'楷体',KaiTi,serif;
                    background:${canAfford ? 'linear-gradient(135deg, #4ade80, #22c55e)' : '#999'};
                    color:#fff; border:none; border-radius:5px; cursor:${canAfford ? 'pointer' : 'not-allowed'};
                    box-shadow:0 2px 4px rgba(0,0,0,0.2);
                `;
                if (canAfford) {
                    learnBtn.onclick = () => {
                        // 扣除贡献
                        this.player.contribution -= learnCost;
                        // 学习技能
                        if (!this.player.skills) this.player.skills = [];
                        if (!this.player.skills.includes(skillId)) {
                            this.player.skills.push(skillId);
                        }
                        // 初始化技能熟练度
                        if (!this.player.skillProficiency) this.player.skillProficiency = {};
                        if (!this.player.skillProficiency[skillId]) {
                            this.player.skillProficiency[skillId] = 0;
                        }
                        this.showToast(`学习成功！掌握了 ${skill.name}！`);
                        this.saveGame();
                        // 关闭详情弹窗，刷新面板
                        overlay.remove();
                        this.refreshPanel();
                    };
                } else {
                    learnBtn.onclick = () => {
                        this.showToast(`贡献不足！需要${learnCost}贡献，当前${this.player.contribution || 0}`);
                    };
                }
                skillItem.appendChild(learnBtn);
            }

            detailPanel.appendChild(skillItem);
        });

        // 关闭按钮
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '关闭';
        closeBtn.style.cssText = `
            display:block; margin:15px auto 0; padding:8px 30px;
            font-size:14px; font-family:'楷体',KaiTi,serif;
            background:linear-gradient(135deg, #8b7355, #6b5344); color:#fff;
            border:none; border-radius:6px; cursor:pointer;
        `;
        closeBtn.onclick = () => overlay.remove();
        detailPanel.appendChild(closeBtn);

        // 点击遮罩关闭
        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
        };

        overlay.appendChild(detailPanel);
        document.body.appendChild(overlay);
    }

    /**
     * 格式化功法加成显示
     */
    formatBonuses(bonuses) {
        if (!bonuses || Object.keys(bonuses).length === 0) return '无';
        const texts = [];
        if (bonuses.fireballDamage) texts.push(`火球术伤害+${Math.round((bonuses.fireballDamage - 1) * 100)}%`);
        if (bonuses.slashDamage) texts.push(`斩击伤害+${Math.round((bonuses.slashDamage - 1) * 100)}%`);
        if (bonuses.farmBonus) texts.push(`种田收获+${bonuses.farmBonus}`);
        return texts.join('、') || '无';
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
        } else {
            // 备用背景
            this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x1a1a2e).setOrigin(0);
        }
    }

    /**
     * 显示提示
     */
    showToast(text) {
        const toast = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, text, {
            fontFamily: '微软雅黑, sans-serif',
            fontSize: '18px',
            color: '#fff',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setDepth(1000);

        this.tweens.add({
            targets: toast,
            alpha: 0,
            y: toast.y - 50,
            duration: 2000,
            onComplete: () => toast.destroy()
        });
    }

    /**
     * 保存游戏
     */
    saveGame() {
        const slotKey = this.registry.get('selectedSaveSlot') || 'xiuxian_save_1';
        if (this.player && this.player.inventory && this.player.storage) {
            SaveSystem.saveToSlot(slotKey, this.player, this.player.inventory, this.player.storage, {});
        }
    }

    /**
     * 显示技能装备面板
     * 列出所有已学习的技能，可以自由选择装备/卸下
     * 最多装备4个技能，斩击默认装备不能卸下
     */
    showSkillEquipPanel() {
        const self = this;

        // 确保数据存在
        if (!this.player.skills) this.player.skills = ['slash'];
        if (!this.player.equippedSkills) this.player.equippedSkills = ['slash'];
        if (!this.player.maxEquippedSkills) this.player.maxEquippedSkills = 4;

        // 遮罩
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position:fixed; top:0; left:0; width:100%; height:100%;
            background:rgba(0,0,0,0.6); z-index:10000;
            display:flex; align-items:center; justify-content:center;
        `;

        // 主面板
        const panel = document.createElement('div');
        panel.style.cssText = `
            width:600px; max-height:80vh; overflow-y:auto;
            background:linear-gradient(135deg, rgba(245,240,225,0.98) 0%, rgba(232,220,200,0.98) 100%);
            border:3px solid #c9a84c; border-radius:12px;
            box-shadow:0 8px 32px rgba(0,0,0,0.5);
            padding:25px; position:relative;
            font-family:'楷体',KaiTi,serif;
        `;

        // 标题
        const title = document.createElement('div');
        title.style.cssText = `
            text-align:center; font-size:24px; color:#3a2a1a;
            font-weight:bold; margin-bottom:5px; letter-spacing:3px;
            padding-bottom:10px; border-bottom:2px dashed #c9a84c;
        `;
        title.innerHTML = '⚔ 技能装备';
        panel.appendChild(title);

        // 说明
        const desc = document.createElement('div');
        desc.style.cssText = `
            text-align:center; font-size:13px; color:#8b5a2b; margin-bottom:15px;
        `;
        desc.textContent = `—— 选择带入战斗的技能（最多${this.player.maxEquippedSkills}个）——`;
        panel.appendChild(desc);

        // 已装备技能栏
        const equippedBox = document.createElement('div');
        equippedBox.style.cssText = `
            padding:12px; margin-bottom:15px;
            background:rgba(201,168,76,0.15);
            border:2px solid #c9a84c; border-radius:8px;
        `;
        const equippedTitle = document.createElement('div');
        equippedTitle.style.cssText = 'font-size:15px; color:#8b5a2b; font-weight:bold; margin-bottom:8px;';
        equippedTitle.textContent = `📦 已装备技能（${this.player.equippedSkills.length}/${this.player.maxEquippedSkills}）`;
        equippedBox.appendChild(equippedTitle);

        const equippedList = document.createElement('div');
        equippedList.style.cssText = 'display:flex; flex-wrap:wrap; gap:8px;';
        this.player.equippedSkills.forEach(skillId => {
            const skill = SKILLS[skillId];
            if (!skill) return;
            const tag = document.createElement('span');
            tag.style.cssText = `
                padding:5px 12px; background:linear-gradient(135deg, #4ade80, #22c55e);
                color:#fff; border-radius:15px; font-size:13px;
                box-shadow:0 2px 4px rgba(0,0,0,0.2);
            `;
            tag.textContent = `${skill.name} ✓`;
            equippedList.appendChild(tag);
        });
        equippedBox.appendChild(equippedList);
        panel.appendChild(equippedBox);

        // 所有已学技能列表
        const allSkillsTitle = document.createElement('div');
        allSkillsTitle.style.cssText = `
            font-size:15px; color:#3a2a1a; font-weight:bold;
            margin-bottom:10px; padding-left:10px;
            border-left:4px solid #60a5fa;
        `;
        allSkillsTitle.textContent = '📚 所有已学技能';
        panel.appendChild(allSkillsTitle);

        // 技能列表
        this.player.skills.forEach(skillId => {
            const skill = SKILLS[skillId];
            if (!skill) return;

            const isEquipped = this.player.equippedSkills.includes(skillId);
            const isSlash = skillId === 'slash';  // 斩击不能卸下

            const skillItem = document.createElement('div');
            skillItem.style.cssText = `
                display:flex; align-items:center; justify-content:space-between;
                padding:12px; margin-bottom:8px;
                background:${isEquipped ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.6)'};
                border:2px solid ${isEquipped ? '#4ade80' : '#c4b896'};
                border-radius:8px;
                transition:all 0.2s;
            `;

            // 技能信息
            const skillInfo = document.createElement('div');
            skillInfo.style.cssText = 'flex:1;';
            skillInfo.innerHTML = `
                <div style="font-size:15px; color:#3a2a1a; font-weight:bold; margin-bottom:3px;">
                    ${skill.name}
                    ${isEquipped ? '<span style="font-size:11px; color:#4ade80; margin-left:8px;">已装备</span>' : ''}
                    ${isSlash ? '<span style="font-size:11px; color:#999; margin-left:8px;">默认技能</span>' : ''}
                </div>
                <div style="font-size:12px; color:#666;">
                    <span style="color:#c44536;">灵气：${skill.cost}</span> |
                    <span style="color:#8b5a2b;">${skill.damage > 0 ? '伤害：' + skill.damage : '恢复：' + Math.abs(skill.damage)}</span> |
                    ${skill.description}
                </div>
            `;
            skillItem.appendChild(skillInfo);

            // 装备/卸下按钮
            if (!isSlash) {  // 斩击不能卸下
                const btn = document.createElement('button');
                if (isEquipped) {
                    btn.textContent = '卸下';
                    btn.style.cssText = `
                        padding:6px 15px; font-size:13px; font-family:'楷体',KaiTi,serif;
                        background:linear-gradient(135deg, #ef4444, #dc2626); color:#fff;
                        border:none; border-radius:5px; cursor:pointer;
                        box-shadow:0 2px 4px rgba(0,0,0,0.2);
                    `;
                    btn.onclick = () => {
                        // 卸下技能
                        this.player.equippedSkills = this.player.equippedSkills.filter(s => s !== skillId);
                        this.showToast(`已卸下 ${skill.name}`);
                        this.saveGame();
                        // 刷新面板
                        overlay.remove();
                        this.showSkillEquipPanel();
                    };
                } else {
                    const canEquip = this.player.equippedSkills.length < this.player.maxEquippedSkills;
                    btn.textContent = canEquip ? '装备' : '已满';
                    btn.style.cssText = `
                        padding:6px 15px; font-size:13px; font-family:'楷体',KaiTi,serif;
                        background:${canEquip ? 'linear-gradient(135deg, #4ade80, #22c55e)' : '#999'};
                        color:#fff; border:none; border-radius:5px;
                        cursor:${canEquip ? 'pointer' : 'not-allowed'};
                        box-shadow:0 2px 4px rgba(0,0,0,0.2);
                    `;
                    if (canEquip) {
                        btn.onclick = () => {
                            // 装备技能
                            this.player.equippedSkills.push(skillId);
                            this.showToast(`已装备 ${skill.name}！`);
                            this.saveGame();
                            // 刷新面板
                            overlay.remove();
                            this.showSkillEquipPanel();
                        };
                    } else {
                        btn.onclick = () => {
                            this.showToast(`技能栏已满！最多装备${this.player.maxEquippedSkills}个技能`);
                        };
                    }
                }
                skillItem.appendChild(btn);
            }

            panel.appendChild(skillItem);
        });

        // 关闭按钮
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕ 关闭';
        closeBtn.style.cssText = `
            display:block; margin:15px auto 0; padding:10px 40px;
            font-size:16px; font-family:'楷体',KaiTi,serif;
            background:linear-gradient(135deg, #8b7355, #6b5344); color:#fff;
            border:none; border-radius:8px; cursor:pointer;
            box-shadow:0 4px 8px rgba(0,0,0,0.3);
        `;
        closeBtn.onclick = () => {
            overlay.remove();
            this.refreshPanel();  // 刷新功法阁主面板
        };
        panel.appendChild(closeBtn);

        // 点击遮罩关闭
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                overlay.remove();
                this.refreshPanel();
            }
        };

        overlay.appendChild(panel);
        document.body.appendChild(overlay);
    }

    /**
     * 返回主地图
     */
    returnToBase() {
        // 保存玩家数据到全局状态
        if (!window.gameState) window.gameState = {};
        window.gameState.player = this.player;

        // 清理面板
        if (this.gongfaPanel) {
            this.gongfaPanel.remove();
            this.gongfaPanel = null;
        }

        this.scene.start('BaseMapScene');
    }
}
