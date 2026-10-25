/**
 * ============================================================
 *  InventoryUI.js —— 储物戒界面（HTML版，水墨风）
 * ============================================================
 *  【这是什么？】
 *  背包/储物戒的UI显示部分，改用HTML实现，更精美。
 *  左边：人物立绘 + 属性（攻击/防御/血量/灵气/寿元等）
 *  右边：储物戒格子（一排5个，共10排50格）
 *
 *  【怎么用】
 *  const invUI = new InventoryUI(scene, player);
 *  invUI.open();   // 打开储物戒
 *  invUI.close();  // 关闭
 *  invUI.toggle(); // 切换开/关
 */

class InventoryUI {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.isOpen = false;
        this.panel = null;  // HTML面板元素
    }

    /**
     * 打开储物戒
     */
    open() {
        if (this.isOpen) return;
        // 【重要】每次打开时更新player引用，防止读档后player对象被替换导致undefined
        if (this.scene && this.scene.player) {
            this.player = this.scene.player;
            console.log('[储物戒] 打开时更新player引用:', this.player);
        } else {
            console.warn('[储物戒] 警告：scene.player不存在，使用旧的player引用:', this.player);
        }
        this.isOpen = true;
        if (this.scene) this.scene.uiLocked = true;  // 锁定UI，防止点到后面的建筑
        this.render();
    }

    /**
     * 关闭储物戒
     */
    close() {
        if (!this.isOpen) return;
        this.isOpen = false;
        if (this.scene) this.scene.uiLocked = false;  // 解除UI锁定
        if (this.panel) {
            this.panel.remove();
            this.panel = null;
        }
    }

    /**
     * 切换开/关
     */
    toggle() {
        if (this.isOpen) this.close();
        else this.open();
    }

    /**
     * 渲染HTML面板
     */
    render() {
        const player = this.player;
        const self = this;

        // 品级颜色映射（1白2绿3蓝4黄5橙6红）
        const gradeColors = {
            1: '#ffffff', 2: '#4ade80', 3: '#60a5fa',
            4: '#facc15', 5: '#fb923c', 6: '#ef4444'
        };
        const gradeNames = {1:'凡品',2:'良品',3:'上品',4:'极品',5:'仙品',6:'神品'};

        // 获取人物立绘base64（PLAYER_IMAGE_DATA是字符串，直接用）
        const playerImg = window.PLAYER_IMAGE_DATA || '';

        // 创建面板
        const panel = document.createElement('div');
        panel.id = 'inventory-panel';
        panel.style.cssText = `
            position:fixed; top:0; left:0; width:100%; height:100%;
            z-index:10000; background:rgba(0,0,0,0.5);
            display:flex; align-items:center; justify-content:center;
            font-family:'楷体',KaiTi,serif;
        `;

        // 主面板（水墨风背景）
        const main = document.createElement('div');
        main.style.cssText = `
            width:920px; height:620px; position:relative;
            background:url('assets/images/ui/inventory_bg.png') center/cover no-repeat;
            border:3px solid #5c4a32; border-radius:12px;
            box-shadow:0 12px 48px rgba(0,0,0,0.6);
            display:flex; overflow:hidden;
        `;

        // ===== 左侧：人物信息 =====
        const leftPanel = document.createElement('div');
        leftPanel.style.cssText = `
            width:320px; height:100%; padding:25px;
            background:rgba(245,240,225,0.85);
            border-right:2px solid #8b7355;
            display:flex; flex-direction:column; align-items:center;
        `;

        // 人物立绘
        const avatarFrame = document.createElement('div');
        avatarFrame.style.cssText = `
            width:180px; height:180px; border-radius:50%;
            border:3px solid #8b7355; overflow:hidden;
            background:rgba(255,255,255,0.5);
            box-shadow:0 4px 16px rgba(0,0,0,0.2);
            margin-bottom:12px;
        `;
        const avatarImg = document.createElement('img');
        avatarImg.src = playerImg;
        avatarImg.style.cssText = 'width:100%; height:100%; object-fit:cover;';
        avatarFrame.appendChild(avatarImg);
        leftPanel.appendChild(avatarFrame);

        // 人物名字
        const nameEl = document.createElement('div');
        nameEl.style.cssText = `
            font-size:24px; color:#3a2a1a; font-weight:bold;
            margin-bottom:4px; letter-spacing:2px;
        `;
        nameEl.textContent = player.playerName || '无名道友';
        leftPanel.appendChild(nameEl);

        // 境界（练气1-9层，后面筑基、金丹等也是1-9层）
        const realmEl = document.createElement('div');
        realmEl.style.cssText = `
            font-size:16px; color:#8b5a2b; margin-bottom:15px;
            font-weight:bold; letter-spacing:1px;
        `;
        // 数字转中文（一层、二层...九层）
        const levelNames = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
        const realmLevelName = levelNames[(player.realmLevel || 1) - 1] || '一';
        // 去掉"期"字，显示"炼气一层"而不是"炼气期一层"
        const realmName = (player.realm || '炼气期').replace('期', '');
        realmEl.textContent = `${realmName}${realmLevelName}层`;
        leftPanel.appendChild(realmEl);

        // 属性列表
        const stats = [
            { label: '⚔ 攻击', value: player.attack, color: '#c44536' },
            { label: '🛡 防御', value: player.defense, color: '#3a6b8c' },
            { label: '❤ 气血', value: `${Math.floor(player.hp)}/${player.maxHp}`, color: '#c44536' },
            { label: '✨ 灵气', value: `${player.qi}/${player.maxQi}`, color: '#6b5b95' },
            { label: '⏳ 寿元', value: `${Math.floor(player.lifespan)}岁`, color: '#5a8c3a' },
            { label: '🔨 炼器', value: `${player.refiningLevel}层`, color: '#8b7355' },
            { label: '🏛 贡献', value: player.contribution || 0, color: '#c4a04c' },
        ];

        const statsBox = document.createElement('div');
        statsBox.style.cssText = `
            width:100%; background:rgba(255,255,255,0.6);
            border:1px solid #c4b896; border-radius:8px;
            padding:12px; margin-bottom:12px;
        `;
        stats.forEach(s => {
            const row = document.createElement('div');
            row.style.cssText = `
                display:flex; justify-content:space-between;
                padding:4px 8px; font-size:14px;
            `;
            const label = document.createElement('span');
            label.style.color = '#4a3728';
            label.textContent = s.label;
            const value = document.createElement('span');
            value.style.cssText = `color:${s.color}; font-weight:bold;`;
            value.textContent = s.value;
            row.appendChild(label);
            row.appendChild(value);
            statsBox.appendChild(row);
        });
        leftPanel.appendChild(statsBox);

        // 修为条（显示真正的修为exp和境界进度，不是人物等级经验levelExp）
        const expBox = document.createElement('div');
        expBox.style.cssText = 'width:100%;';
        const expLabel = document.createElement('div');
        expLabel.style.cssText = 'font-size:12px; color:#666; margin-bottom:4px;';
        const currentExp = player.exp || 0;
        const expNeeded = player.expToLevelUp || 100;
        const expPercent = Math.min(100, Math.floor(currentExp / expNeeded * 100));
        // 境界层数显示（复用前面声明的levelNames变量）
        const realmLevelName2 = levelNames[(player.realmLevel || 1) - 1] || '一';
        if (player.realmLevel >= 9 && currentExp >= expNeeded) {
            expLabel.textContent = `修为：${currentExp}/${expNeeded}（9层圆满，可突破大境界！）`;
        } else {
            expLabel.textContent = `修为：${currentExp}/${expNeeded}（${realmLevelName2}层进度）`;
        }
        const expBarBg = document.createElement('div');
        expBarBg.style.cssText = `
            width:100%; height:14px; background:#ddd;
            border-radius:7px; overflow:hidden; border:1px solid #999;
        `;
        const expBarFill = document.createElement('div');
        expBarFill.style.cssText = `
            width:${expPercent}%; height:100%;
            background:linear-gradient(90deg,#ff9800,#ffc107);
            border-radius:7px; transition:width 0.3s;
        `;
        expBarBg.appendChild(expBarFill);
        expBox.appendChild(expLabel);
        expBox.appendChild(expBarBg);
        leftPanel.appendChild(expBox);

        // ===== 任务信息空位（后续添加）=====
        const questBox = document.createElement('div');
        questBox.style.cssText = `
            width:100%; margin-top:12px; flex:1;
            background:rgba(255,255,255,0.5);
            border:1px dashed #c4b896; border-radius:8px;
            padding:10px; display:flex; flex-direction:column;
        `;
        const questTitle = document.createElement('div');
        questTitle.style.cssText = `
            font-size:14px; color:#8b7355; font-weight:bold;
            margin-bottom:6px; border-bottom:1px solid #ddd; padding-bottom:4px;
        `;
        questTitle.textContent = '📜 任务信息';
        const questContent = document.createElement('div');
        questContent.style.cssText = `
            font-size:12px; color:#999; text-align:center;
            flex:1; display:flex; align-items:center; justify-content:center;
        `;
        questContent.textContent = '（任务系统开发中...）';
        questBox.appendChild(questTitle);
        questBox.appendChild(questContent);
        leftPanel.appendChild(questBox);

        main.appendChild(leftPanel);

        // ===== 右侧：储物戒 =====
        const rightPanel = document.createElement('div');
        rightPanel.style.cssText = `
            flex:1; height:100%; padding:20px 25px;
            display:flex; flex-direction:column;
        `;

        // 标题
        const titleRow = document.createElement('div');
        titleRow.style.cssText = `
            display:flex; justify-content:space-between; align-items:center;
            margin-bottom:15px;
        `;
        const titleLeft = document.createElement('div');
        titleLeft.style.cssText = 'display:flex; align-items:center; gap:15px;';
        const title = document.createElement('div');
        title.style.cssText = `
            font-size:26px; color:#3a2a1a; font-weight:bold;
            letter-spacing:4px; text-shadow:1px 1px 2px rgba(0,0,0,0.1);
        `;
        title.textContent = '💍 储物戒';
        const sortBtn = document.createElement('button');
        sortBtn.textContent = '整理';
        sortBtn.style.cssText = `
            padding:6px 16px; background:#3a6b8c; color:#fff;
            border:none; border-radius:6px; cursor:pointer;
            font-family:'楷体',KaiTi,serif; font-size:14px;
            transition:all 0.2s;
        `;
        sortBtn.onmouseover = () => sortBtn.style.background = '#4a7b9c';
        sortBtn.onmouseout = () => sortBtn.style.background = '#3a6b8c';
        sortBtn.onclick = () => {
            player.inventory.sort();
            if (self.scene && self.scene.saveGame) self.scene.saveGame();
            // 重新渲染
            self.close();
            self.open();
            if (self.scene && self.scene.showToast) self.scene.showToast('储物戒已整理！');
        };
        titleLeft.appendChild(title);
        titleLeft.appendChild(sortBtn);
        const slotCount = document.createElement('div');
        slotCount.style.cssText = 'font-size:14px; color:#8b7355;';
        const filledCount = player.inventory.getFilledSlots().length;
        slotCount.textContent = `${filledCount}/50 格`;
        titleRow.appendChild(titleLeft);
        titleRow.appendChild(slotCount);
        rightPanel.appendChild(titleRow);

        // 物品格子（一排5个，共10排，可滚动）
        const gridWrapper = document.createElement('div');
        gridWrapper.style.cssText = `
            flex:1; overflow-y:auto; overflow-x:hidden;
            padding-right:4px;
        `;
        // 自定义滚动条样式
        gridWrapper.style.scrollbarWidth = 'thin';
        gridWrapper.style.scrollbarColor = '#8b7355 rgba(245,240,225,0.5)';

        const grid = document.createElement('div');
        grid.style.cssText = `
            display:grid; grid-template-columns:repeat(5, 1fr);
            gap:8px; align-content:start;
        `;

        for (let i = 0; i < 50; i++) {
            const slot = document.createElement('div');
            slot.style.cssText = `
                aspect-ratio:1; background:rgba(245,240,225,0.7);
                border:2px solid #c4b896; border-radius:6px;
                display:flex; flex-direction:column; align-items:center; justify-content:center;
                cursor:pointer; transition:all 0.15s; position:relative;
                font-size:11px;
            `;
            slot.dataset.slotIndex = i;

            // 直接从slots数组获取这个格子的物品（修复之前找不到物品的bug）
            const itemInSlot = player.inventory.slots[i];

            if (itemInSlot) {
                const item = ITEMS[itemInSlot.itemId];
                if (item) {
                    const grade = item.grade || 1;
                    const gradeColor = gradeColors[grade] || '#fff';
                    // 白色物品（凡品）用深色显示，避免和白底融为一体
                    const isWhite = (grade === 1);
                    const borderColor = isWhite ? '#999999' : gradeColor;
                    const textColor = isWhite ? '#555555' : gradeColor;

                    slot.style.borderColor = borderColor;
                    slot.style.boxShadow = `0 0 6px ${borderColor}66, inset 0 0 8px ${borderColor}22`;
                    // 白色物品用浅灰底，其他品级用白底
                    slot.style.background = isWhite ? 'rgba(235,235,235,0.9)' : 'rgba(255,255,255,0.85)';

                    // 物品图标（先从ITEM_IMAGES找，再从FARM_IMAGES找）
                    const itemImgKey = item.icon || itemInSlot.itemId;
                    let itemImgData = null;
                    if (window.ITEM_IMAGES && window.ITEM_IMAGES[itemImgKey]) {
                        itemImgData = window.ITEM_IMAGES[itemImgKey];
                    } else if (window.FARM_IMAGES && window.FARM_IMAGES[itemImgKey]) {
                        itemImgData = window.FARM_IMAGES[itemImgKey];
                    }

                    if (itemImgData) {
                        const icon = document.createElement('img');
                        icon.src = itemImgData;
                        icon.style.cssText = 'width:32px; height:32px; object-fit:contain; margin-bottom:2px;';
                        slot.appendChild(icon);
                    } else {
                        const iconChar = document.createElement('div');
                        iconChar.style.cssText = 'font-size:22px; margin-bottom:2px;';
                        iconChar.textContent = item.iconChar || '📦';
                        slot.appendChild(iconChar);
                    }

                    // 物品名字
                    const name = document.createElement('div');
                    name.style.cssText = `
                        font-size:10px; color:${textColor}; font-weight:bold;
                        text-align:center; line-height:1.2; max-width:90%;
                        overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
                        text-shadow:0 0 2px rgba(0,0,0,0.1);
                    `;
                    name.textContent = item.name;
                    slot.appendChild(name);

                    // 数量
                    if (itemInSlot.count > 1) {
                        const count = document.createElement('div');
                        count.style.cssText = `
                            position:absolute; bottom:2px; right:4px;
                            font-size:11px; color:#333; font-weight:bold;
                            background:rgba(255,255,255,0.8); padding:0 3px; border-radius:3px;
                        `;
                        count.textContent = itemInSlot.count;
                        slot.appendChild(count);
                    }

                    // 品级标签
                    const gradeTag = document.createElement('div');
                    gradeTag.style.cssText = `
                        position:absolute; top:2px; left:3px;
                        font-size:9px; color:${textColor}; font-weight:bold;
                    `;
                    gradeTag.textContent = gradeNames[grade] || '';
                    slot.appendChild(gradeTag);

                    // 悬停显示详情
                    slot.title = `${item.name}（${gradeNames[grade] || '凡品'}）\n${item.desc || ''}\n数量：${itemInSlot.count}`;

                    // 点击显示物品详情
                    slot.addEventListener('click', () => {
                        self.showItemDetail(itemInSlot.itemId, itemInSlot.count, i);
                    });
                }
            } else {
                // 空格子
                slot.style.opacity = '0.6';
                slot.title = '空';
            }

            // 悬停效果
            slot.addEventListener('mouseenter', () => {
                slot.style.transform = 'scale(1.05)';
                slot.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
            });
            slot.addEventListener('mouseleave', () => {
                slot.style.transform = 'scale(1)';
                if (itemInSlot && ITEMS[itemInSlot.itemId]) {
                    const g = ITEMS[itemInSlot.itemId].grade || 1;
                    slot.style.boxShadow = `0 0 6px ${gradeColors[g]}66`;
                } else {
                    slot.style.boxShadow = 'none';
                }
            });

            grid.appendChild(slot);
        }

        gridWrapper.appendChild(grid);
        rightPanel.appendChild(gridWrapper);

        // 底部提示
        const tip = document.createElement('div');
        tip.style.cssText = `
            text-align:center; font-size:12px; color:#8b7355;
            margin-top:10px; padding-top:8px; border-top:1px dashed #c4b896;
        `;
        tip.textContent = '点击物品查看详情 | 按 B 或 ESC 关闭';
        rightPanel.appendChild(tip);

        main.appendChild(rightPanel);

        // 关闭按钮
        const closeBtn = document.createElement('div');
        closeBtn.style.cssText = `
            position:absolute; top:12px; right:15px; width:36px; height:36px;
            background:rgba(196,69,54,0.9); color:#fff; border-radius:50%;
            display:flex; align-items:center; justify-content:center;
            font-size:20px; cursor:pointer; font-weight:bold;
            box-shadow:0 2px 8px rgba(0,0,0,0.3); transition:all 0.15s;
            z-index:10;
        `;
        closeBtn.textContent = '✕';
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = 'rgba(160,56,40,1)';
            closeBtn.style.transform = 'scale(1.1)';
        });
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = 'rgba(196,69,54,0.9)';
            closeBtn.style.transform = 'scale(1)';
        });
        closeBtn.addEventListener('click', () => self.close());
        main.appendChild(closeBtn);

        panel.appendChild(main);

        // 点击遮罩关闭
        panel.addEventListener('click', (e) => {
            if (e.target === panel) self.close();
        });

        document.body.appendChild(panel);
        this.panel = panel;
    }

    /**
     * 刷新面板（物品变化后调用）
     */
    refresh() {
        if (!this.isOpen) return;
        this.close();
        this.open();
    }

    /**
     * 显示丹药使用效果（飘字动画）
     */
    showPillEffect(item, result) {
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
                    position:fixed; top:40%; left:50%;
                    transform:translateX(-50%);
                    font-size:32px; font-weight:bold; color:${msg.color};
                    text-shadow:2px 2px 4px rgba(0,0,0,0.5), 0 0 20px ${msg.color};
                    z-index:99999; pointer-events:none;
                    font-family:'楷体',KaiTi,serif;
                    animation:pillFloat 1.2s ease-out forwards;
                `;
                document.body.appendChild(floatText);
                setTimeout(() => floatText.remove(), 1200);
            }, i * 200);
        });

        // 添加CSS动画
        if (!document.getElementById('pill-effect-style')) {
            const style = document.createElement('style');
            style.id = 'pill-effect-style';
            style.textContent = `
                @keyframes pillFloat {
                    0% { opacity:0; transform:translateX(-50%) translateY(20px) scale(0.5); }
                    20% { opacity:1; transform:translateX(-50%) translateY(0) scale(1.2); }
                    40% { transform:translateX(-50%) translateY(-10px) scale(1); }
                    100% { opacity:0; transform:translateX(-50%) translateY(-60px) scale(0.8); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * 显示物品详情弹窗（点击物品时调用，不会删除物品）
     * @param {string} itemId - 物品ID
     * @param {number} count - 数量
     * @param {number} slotIndex - 格子索引
     */
    showItemDetail(itemId, count, slotIndex) {
        // 【重要】定义self，指向当前InventoryUI实例，防止箭头函数里的this指向错误
        const self = this;

        // 【重要】确保player有效，防止undefined
        if (!this.player && this.scene && this.scene.player) {
            this.player = this.scene.player;
            console.log('[储物戒] showItemDetail时更新player引用:', this.player);
        }
        if (!this.player) {
            console.error('[储物戒] 错误：player对象仍然是undefined！');
            alert('系统错误：player对象未初始化，请重新进入游戏');
            return;
        }

        const item = ITEMS[itemId];
        if (!item) return;

        const grade = item.grade || 1;
        const gradeColors = ['#fff', '#999', '#4caf50', '#2196f3', '#ffc107', '#ff9800', '#f44336'];
        const gradeNames = ['', '凡品', '良品', '上品', '极品', '仙品', '神品'];
        const gradeColor = gradeColors[grade] || '#fff';

        // 如果已经有详情弹窗，先关闭
        if (this.itemDetailPanel && this.itemDetailPanel.parentNode) {
            this.itemDetailPanel.remove();
        }

        // 创建遮罩
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position:fixed; top:0; left:0; width:100%; height:100%;
            background:rgba(0,0,0,0.5); z-index:10000;
            display:flex; align-items:center; justify-content:center;
        `;

        // 详情面板
        const panel = document.createElement('div');
        panel.style.cssText = `
            width:360px; background:linear-gradient(135deg, #f5f0e1 0%, #e8dcc8 100%);
            border:3px solid ${gradeColor}; border-radius:12px;
            box-shadow:0 8px 32px rgba(0,0,0,0.4);
            padding:20px; position:relative;
            font-family:'楷体',KaiTi,serif;
        `;

        // 关闭按钮
        const closeBtn = document.createElement('div');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText = `
            position:absolute; top:10px; right:15px;
            font-size:18px; color:#8b7355; cursor:pointer;
            width:28px; height:28px; display:flex; align-items:center; justify-content:center;
            border-radius:50%; transition:all 0.2s;
        `;
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = 'rgba(139,115,85,0.2)';
        });
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = 'transparent';
        });
        closeBtn.addEventListener('click', () => {
            overlay.remove();
            this.itemDetailPanel = null;
        });
        panel.appendChild(closeBtn);

        // 物品图标
        const iconContainer = document.createElement('div');
        iconContainer.style.cssText = 'text-align:center; margin-bottom:15px;';

        // 获取物品图标
        let iconHtml = '';
        const iconKey = item.icon || itemId;
        let iconData = null;
        if (window.ITEM_IMAGES && window.ITEM_IMAGES[iconKey]) {
            iconData = window.ITEM_IMAGES[iconKey];
        } else if (window.FARM_IMAGES && window.FARM_IMAGES[iconKey]) {
            iconData = window.FARM_IMAGES[iconKey];
        }

        if (iconData) {
            iconHtml = `<img src="${iconData}" style="width:80px; height:80px; object-fit:contain;" />`;
        } else {
            iconHtml = `<div style="font-size:60px;">${item.iconChar || '📦'}</div>`;
        }
        iconContainer.innerHTML = iconHtml;
        panel.appendChild(iconContainer);

        // 物品名称
        const nameEl = document.createElement('div');
        nameEl.style.cssText = `
            text-align:center; font-size:22px; color:${gradeColor};
            font-weight:bold; margin-bottom:5px; letter-spacing:2px;
        `;
        nameEl.textContent = item.name;
        panel.appendChild(nameEl);

        // 品级标签
        const gradeEl = document.createElement('div');
        gradeEl.style.cssText = `
            text-align:center; font-size:13px; color:${gradeColor};
            margin-bottom:15px;
        `;
        gradeEl.textContent = `【${gradeNames[grade] || '凡品'}】 数量：${count}`;
        panel.appendChild(gradeEl);

        // 分割线
        const divider = document.createElement('div');
        divider.style.cssText = `
            height:1px; background:linear-gradient(to right, transparent, #c4b896, transparent);
            margin-bottom:15px;
        `;
        panel.appendChild(divider);

        // 物品描述
        const descEl = document.createElement('div');
        descEl.style.cssText = `
            font-size:14px; color:#5a4232; line-height:1.8;
            text-align:center; margin-bottom:15px;
        `;
        descEl.textContent = item.description || item.desc || '暂无描述';
        panel.appendChild(descEl);

        // 使用按钮（只有丹药类物品才显示）
        if (item.type === 'pill' || item.type === 'cultivation_pill') {
            const useBtn = document.createElement('button');
            useBtn.textContent = '💊 服用丹药';
            useBtn.style.cssText = `
                width:100%; padding:10px; background:linear-gradient(135deg, #8b3a3a, #a85050);
                color:#fff; border:none; border-radius:8px; cursor:pointer;
                font-family:'楷体',KaiTi,serif; font-size:16px; font-weight:bold;
                margin-bottom:10px; transition:all 0.2s;
                box-shadow:0 2px 8px rgba(139,58,58,0.3);
            `;
            useBtn.onmouseover = () => {
                useBtn.style.background = 'linear-gradient(135deg, #a85050, #c46060)';
                useBtn.style.transform = 'translateY(-1px)';
            };
            useBtn.onmouseout = () => {
                useBtn.style.background = 'linear-gradient(135deg, #8b3a3a, #a85050)';
                useBtn.style.transform = 'translateY(0)';
            };
            useBtn.onclick = () => {
                console.log('[储物戒] 点击服用丹药按钮，物品ID:', itemId, '物品类型:', item.type);
                console.log('[储物戒] player对象:', self.player);
                console.log('[储物戒] usePill方法是否存在:', typeof self.player.usePill);

                // 检查player对象是否有usePill方法
                if (typeof self.player.usePill !== 'function') {
                    alert('player对象没有usePill方法，请检查！');
                    return;
                }

                try {
                    // 使用丹药
                    const result = self.player.usePill(itemId);
                    console.log('[储物戒] 丹药使用结果:', result);

                    if (result.success) {
                        // 从背包移除一个丹药
                        const removeResult = self.player.inventory.removeItem(itemId, 1);
                        console.log('[储物戒] 移除丹药结果:', removeResult);

                        // 显示效果提示
                        self.showPillEffect(item, result);

                        // 如果是悟道丹（增加修为），显示当前修为和境界
                        if (item.type === 'cultivation_pill') {
                            console.log('[储物戒] 使用悟道丹后，当前修为:', self.player.exp, '/', self.player.expToLevelUp);
                            console.log('[储物戒] 当前境界:', self.player.realm, '第', self.player.realmLevel, '层');
                        }

                        // 刷新UI（包括境界显示）
                        setTimeout(() => {
                            overlay.remove();
                            self.itemDetailPanel = null;
                            self.refresh();
                            // 保存游戏
                            if (self.scene && self.scene.saveGame) {
                                self.scene.saveGame();
                            }
                            // 更新左下角状态栏（如果有）
                            if (self.scene && self.scene.updateCompactStatusBar) {
                                self.scene.updateCompactStatusBar();
                            }
                        }, 800);
                    } else {
                        alert(result.message);
                    }
                } catch (e) {
                    console.error('[储物戒] 使用丹药时出错:', e);
                    alert('使用丹药时出错：' + e.message);
                }
            };
            panel.appendChild(useBtn);
        }

        // 【新增】秘籍学习按钮（只有功法秘籍类物品才显示）
        if (item.type === 'manual') {
            const manualId = item.manualId;
            const manual = manualId ? CULTIVATION_MANUALS[manualId] : null;
            const alreadyLearned = self.player.learnedManuals && self.player.learnedManuals.includes(manualId);

            const learnBtn = document.createElement('button');
            if (alreadyLearned) {
                learnBtn.textContent = '✓ 已学习此功法';
                learnBtn.style.cssText = `
                    width:100%; padding:10px; background:#999; color:#fff;
                    border:none; border-radius:8px; cursor:not-allowed;
                    font-family:'楷体',KaiTi,serif; font-size:16px; font-weight:bold;
                    margin-bottom:10px;
                `;
                learnBtn.disabled = true;
            } else {
                learnBtn.textContent = '🧘 去练功台学习';
                learnBtn.style.cssText = `
                    width:100%; padding:10px; background:linear-gradient(135deg, #6b4c9a, #8b6cb8);
                    color:#fff; border:none; border-radius:8px; cursor:pointer;
                    font-family:'楷体',KaiTi,serif; font-size:16px; font-weight:bold;
                    margin-bottom:10px; transition:all 0.2s;
                    box-shadow:0 2px 8px rgba(107,76,154,0.3);
                `;
                learnBtn.onmouseover = () => {
                    learnBtn.style.background = 'linear-gradient(135deg, #8b6cb8, #a88cd0)';
                    learnBtn.style.transform = 'translateY(-1px)';
                };
                learnBtn.onmouseout = () => {
                    learnBtn.style.background = 'linear-gradient(135deg, #6b4c9a, #8b6cb8)';
                    learnBtn.style.transform = 'translateY(0)';
                };
                learnBtn.onclick = () => {
                    // 关闭储物戒和详情弹窗
                    overlay.remove();
                    self.itemDetailPanel = null;
                    self.close();
                    // 提示用户去练功台
                    alert(`获得秘籍：${item.name}\n\n请前往练功台（点击宗门里的圆形建筑）登记学习！\n\n${manual ? '对应功法：' + manual.name : ''}`);
                    console.log('[储物戒] 提示用户去练功台学习秘籍:', itemId);
                };
            }
            panel.appendChild(learnBtn);
        }

        // 物品类型
        const typeEl = document.createElement('div');
        typeEl.style.cssText = `
            text-align:center; font-size:12px; color:#8b7355;
            padding-top:10px; border-top:1px dashed #c4b896;
        `;
        typeEl.textContent = `类型：${item.type || '材料'}`;
        panel.appendChild(typeEl);

        overlay.appendChild(panel);
        document.body.appendChild(overlay);
        this.itemDetailPanel = overlay;

        // 点击遮罩关闭
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
                this.itemDetailPanel = null;
            }
        });
    }
}
