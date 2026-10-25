/**
 * ============================================================
 *  UIManager.js —— UI面板切换管理器
 * ============================================================
 *  【这是什么？】
 *  管理游戏中的HTML UI面板的显示/隐藏。
 *  点击底部浮动按钮可以打开/隐藏对应面板。
 *
 *  【面板】
 *  - quest: 任务面板
 *  - inventory: 背包面板
 *  - map: 地图面板
 */

const UIManager = {
    // 面板状态
    panels: {
        quest: false,
        inventory: false,
        map: false
    },

    // 面板元素映射
    panelElements: {
        quest: 'panel-quest',
        inventory: 'panel-inventory',
        map: 'panel-map'
    },

    // 按钮元素映射
    buttonElements: {
        quest: 'btn-quest',
        inventory: 'btn-inventory',
        map: 'btn-map'
    },

    /**
     * 切换面板显示/隐藏
     */
    togglePanel(panelName) {
        if (!this.panels.hasOwnProperty(panelName)) return;

        // 关闭功法面板（如果打开）
        if (typeof ManualUIManager !== 'undefined' && ManualUIManager.isOpen) {
            ManualUIManager.close();
        }

        // 切换状态
        this.panels[panelName] = !this.panels[panelName];

        // 更新显示
        this.updatePanelDisplay(panelName);
    },

    /**
     * 更新面板显示
     */
    updatePanelDisplay(panelName) {
        const panelEl = document.getElementById(this.panelElements[panelName]);
        const btnEl = document.getElementById(this.buttonElements[panelName]);

        if (panelEl) {
            panelEl.style.display = this.panels[panelName] ? 'block' : 'none';
        }
        if (btnEl) {
            if (this.panels[panelName]) {
                btnEl.classList.add('active');
            } else {
                btnEl.classList.remove('active');
            }
        }
    },

    /**
     * 关闭所有面板
     */
    closeAll() {
        for (const name in this.panels) {
            this.panels[name] = false;
            this.updatePanelDisplay(name);
        }
    },

    /**
     * 隐藏所有面板（场景切换时调用）
     */
    hideAll() {
        for (const name in this.panelElements) {
            const el = document.getElementById(this.panelElements[name]);
            if (el) el.style.display = 'none';
            const btn = document.getElementById(this.buttonElements[name]);
            if (btn) btn.classList.remove('active');
        }
        // 隐藏按钮栏
        const buttons = document.getElementById('ui-buttons');
        if (buttons) buttons.style.display = 'none';
    },

    /**
     * 显示按钮栏（进入主场景时调用）
     */
    showButtons() {
        const buttons = document.getElementById('ui-buttons');
        if (buttons) buttons.style.display = 'flex';
    },

    /**
     * 收起/展开UI按钮栏
     */
    toggleUIButtons() {
        const buttons = document.getElementById('ui-buttons');
        const toggleBtn = document.getElementById('btn-toggle');
        if (!buttons) return;

        if (buttons.classList.contains('collapsed')) {
            // 展开
            buttons.classList.remove('collapsed');
            if (toggleBtn) {
                toggleBtn.querySelector('.btn-text').textContent = '收起';
            }
        } else {
            // 收起
            buttons.classList.add('collapsed');
            if (toggleBtn) {
                toggleBtn.querySelector('.btn-text').textContent = '展开';
            }
        }
    }
};
