/**
 * ============================================================
 *  ManualUIManager.js —— 功法面板管理器
 * ============================================================
 *  【这是什么？】
 *  管理功法秘籍面板的显示和交互。
 *  点击功法按钮打开面板，左侧是功法列表，右侧是详情。
 *
 *  【功能】
 *  1. 显示已学功法列表
 *  2. 点击功法查看详细介绍
 *  3. 显示功法和技能的熟练度
 *  4. 装备/切换功法
 *  5. 显示该功法下可用的技能列表
 */

const ManualUIManager = {
    isOpen: false,
    selectedManual: null,
    player: null,  // 玩家对象引用

    /**
     * 初始化（传入玩家对象）
     */
    init(player) {
        this.player = player;
    },

    /**
     * 打开/关闭功法面板
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    },

    /**
     * 打开功法面板
     */
    open() {
        if (!this.player) return;

        // 关闭其他面板
        if (typeof UIManager !== 'undefined') {
            UIManager.closeAll();
        }

        this.isOpen = true;
        this.selectedManual = this.player.manual;

        const panel = document.getElementById('panel-manual');
        const overlay = document.getElementById('ui-overlay');
        const btn = document.getElementById('btn-manual');

        if (panel) panel.style.display = 'block';
        if (overlay) overlay.style.display = 'block';
        if (btn) btn.classList.add('active');

        this.renderManualList();
        this.renderManualDetail(this.selectedManual);
    },

    /**
     * 关闭功法面板
     */
    close() {
        this.isOpen = false;
        this.selectedManual = null;

        const panel = document.getElementById('panel-manual');
        const overlay = document.getElementById('ui-overlay');
        const btn = document.getElementById('btn-manual');

        if (panel) panel.style.display = 'none';
        if (overlay) overlay.style.display = 'none';
        if (btn) btn.classList.remove('active');
    },

    /**
     * 渲染功法列表
     */
    renderManualList() {
        const listEl = document.getElementById('manual-list');
        if (!listEl || !this.player) return;

        listEl.innerHTML = '';

        this.player.learnedManuals.forEach(manualId => {
            const manual = CULTIVATION_MANUALS[manualId];
            if (!manual) return;

            const profInfo = this.player.getManualProficiencyInfo(manualId);
            const isEquipped = this.player.manual === manualId;
            const isSelected = this.selectedManual === manualId;

            const item = document.createElement('div');
            item.className = 'manual-item' + (isSelected ? ' selected' : '') + (isEquipped ? ' equipped' : '');
            item.innerHTML = `
                <div class="m-name">
                    ${manual.name}
                    ${isEquipped ? '<span class="m-tag" style="background:#c9a84c;">修炼中</span>' : ''}
                </div>
                <div class="m-level">
                    熟练度：<span style="color:${profInfo.color}">${profInfo.name}</span>
                    (${profInfo.exp}/${profInfo.nextExp})
                </div>
            `;

            item.onclick = () => {
                this.selectedManual = manualId;
                this.renderManualList();
                this.renderManualDetail(manualId);
            };

            listEl.appendChild(item);
        });
    },

    /**
     * 渲染功法详情
     */
    renderManualDetail(manualId) {
        const detailEl = document.getElementById('manual-detail');
        if (!detailEl || !this.player) return;

        const manual = CULTIVATION_MANUALS[manualId];
        if (!manual) return;

        const manualProf = this.player.getManualProficiencyInfo(manualId);
        const isEquipped = this.player.manual === manualId;

        // 技能列表HTML
        let skillsHtml = '';
        manual.skills.forEach(skillId => {
            const skill = SKILLS[skillId];
            if (!skill) return;

            const learned = this.player.skills.includes(skillId);
            const skillProf = this.player.getSkillProficiencyInfo(skillId);
            const finalDamage = this.player.getSkillFinalDamage(skillId, skill.damage);

            skillsHtml += `
                <div class="skill-list-item" style="${learned ? '' : 'opacity:0.5;'}">
                    <div class="skill-icon" style="background:${this.getSkillColor(skill)};">
                        ${this.getSkillIcon(skill)}
                    </div>
                    <div class="skill-info">
                        <div class="skill-name">
                            ${skill.name}
                            ${learned ? '' : '<span style="color:#999; font-size:11px;">（未学会）</span>'}
                        </div>
                        <div class="skill-desc">
                            ${skill.description}
                        </div>
                        <div style="font-size:11px; color:#666; margin-top:3px;">
                            耗灵${skill.cost} | 基础伤害${skill.damage} | 熟练度加成后 <span style="color:#c44536; font-weight:bold;">${finalDamage}</span>
                        </div>
                        ${learned ? `
                        <div class="proficiency-bar" style="margin-top:4px;">
                            <div class="proficiency-fill" style="width:${skillProf.progress * 100}%; background:${skillProf.color};"></div>
                            <span class="proficiency-text">${skillProf.name} ${skillProf.exp}/${skillProf.nextExp}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
        });

        // 功法加成描述
        let bonusesHtml = '';
        if (manual.bonuses) {
            for (const key in manual.bonuses) {
                const value = manual.bonuses[key];
                bonusesHtml += `<div>· ${this.getBonusText(key, value)}</div>`;
            }
        }

        detailEl.innerHTML = `
            <div class="detail-title">${manual.name}</div>

            <div class="detail-section">
                <h4>📖 功法介绍</h4>
                <p>${manual.description}</p>
            </div>

            <div class="detail-section">
                <h4>⚡ 功法境界</h4>
                <p>可修炼至：<span style="color:#c44536; font-weight:bold;">${manual.maxRealm}</span></p>
            </div>

            <div class="detail-section">
                <h4>📈 功法熟练度</h4>
                <div class="proficiency-bar">
                    <div class="proficiency-fill" style="width:${manualProf.progress * 100}%; background:${manualProf.color};"></div>
                    <span class="proficiency-text">${manualProf.name} ${manualProf.exp}/${manualProf.nextExp}</span>
                </div>
                <p style="margin-top:5px; font-size:12px;">熟练度加成：技能伤害 +${Math.round((manualProf.damageBonus - 1) * 100)}%</p>
            </div>

            ${bonusesHtml ? `
            <div class="detail-section">
                <h4>✨ 功法加成</h4>
                <p>${bonusesHtml}</p>
            </div>
            ` : ''}

            <div class="detail-section">
                <h4>⚔ 可用技能（${manual.skills.length}个）</h4>
                ${skillsHtml}
            </div>

            <div style="text-align:center; margin-top:15px;">
                <button class="equip-btn" onclick="ManualUIManager.equipManual('${manualId}')" ${isEquipped ? 'disabled' : ''}>
                    ${isEquipped ? '✓ 正在修炼' : '装备此功法'}
                </button>
            </div>
        `;
    },

    /**
     * 装备功法
     */
    equipManual(manualId) {
        if (!this.player) return;
        if (this.player.switchManual(manualId)) {
            this.renderManualList();
            this.renderManualDetail(manualId);
            console.log(`[功法] 已装备：${CULTIVATION_MANUALS[manualId].name}`);
        }
    },

    /**
     * 获取技能图标
     */
    getSkillIcon(skill) {
        const icons = {
            slash: '⚔',
            fireball: '🔥',
            sword_qi: '🗡',
            ten_thousand_swords: '⚡',
            ice_spike: '❄',
            ice_lock: '🧊',
            thunder_strike: '⚡',
            five_thunders: '🌩',
            vine_whip: '🌿',
            heal: '💚'
        };
        return icons[skill.effect] || '✦';
    },

    /**
     * 获取技能颜色
     */
    getSkillColor(skill) {
        const color = skill.color || 0xcccccc;
        return '#' + color.toString(16).padStart(6, '0');
    },

    /**
     * 获取功法加成描述
     */
    getBonusText(key, value) {
        const texts = {
            fireballDamage: `火球术伤害 +${Math.round((value - 1) * 100)}%`,
            slashDamage: `斩击伤害 +${Math.round((value - 1) * 100)}%`,
            farmBonus: `种田收获 +${value}`
        };
        return texts[key] || `${key}: ${value}`;
    }
};
