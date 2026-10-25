/**
 * ============================================================
 *  LoginScene.js —— 登录/选档/取名字界面
 * ============================================================
 *  【这是什么？】
 *  游戏启动后第一个看到的界面。
 *  使用用户上传的水墨风登录背景图，左侧排列存档列表。
 *  新存档需要先取名字（纯HTML弹窗，确保输入框可用）。
 *  支持删除存档，显示游戏版本号。
 */

// 游戏版本号
const GAME_VERSION = 'v0.8.0';

class LoginScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LoginScene' });
        this.htmlPopup = null;  // HTML弹窗元素
    }

    create() {
        console.log('%c[登录] 进入登录界面', 'color: #c9a84c; font-weight: bold');

        // 清理可能残留的HTML弹窗
        this.removeHtmlPopup();

        // 绘制背景（用户上传的登录背景图）
        this.paintBackground();

        // 游戏标题（放在右侧留白区域）
        this.add.text(GAME_WIDTH * 0.72, 120, '修 仙 录', {
            fontFamily: '楷体, KaiTi, serif',
            fontSize: '64px',
            color: '#c44536',
            stroke: '#4a3728',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH * 0.72, 185, '—— 水墨风修仙游戏 ——', {
            fontFamily: '楷体, KaiTi, serif',
            fontSize: '18px',
            color: '#8b7355'
        }).setOrigin(0.5);

        // 存档列表标题（放在左侧）
        this.add.text(180, 80, '【 选择存档 】', {
            fontFamily: '楷体, KaiTi, serif',
            fontSize: '26px',
            color: '#4a3728',
            backgroundColor: 'rgba(245,240,225,0.7)',
            padding: { x: 15, y: 5 }
        }).setOrigin(0.5);

        // 创建3个存档位（竖向排列在左侧）
        this.createSaveSlots();

        // 游戏版本号（右下角）
        this.add.text(GAME_WIDTH - 15, GAME_HEIGHT - 15, `${GAME_VERSION}`, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            color: '#8b7355',
            backgroundColor: 'rgba(245,240,225,0.6)',
            padding: { x: 8, y: 3 }
        }).setOrigin(1, 1);

        // 底部提示
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 35, '点击存档进入游戏 | 新存档需先取道号 | 悬停存档可删除', {
            fontFamily: '微软雅黑, sans-serif',
            fontSize: '13px',
            color: '#666',
            backgroundColor: 'rgba(245,240,225,0.6)',
            padding: { x: 10, y: 3 }
        }).setOrigin(0.5);
    }

    /**
     * 绘制背景（用户上传的登录背景图）
     */
    paintBackground() {
        if (this.textures.exists('login_bg')) {
            const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'login_bg');
            bg.setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
            const overlay = this.add.graphics();
            overlay.fillStyle(0x000000, 0.15);
            overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        } else {
            const g = this.add.graphics();
            g.fillStyle(0xf5f0e1, 1);
            g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        }
    }

    /**
     * 创建3个存档位（竖向排列在左侧，带删除按钮）
     */
    createSaveSlots() {
        const slotX = 180;
        const slotY = [170, 290, 410];

        for (let i = 0; i < 3; i++) {
            const y = slotY[i];
            const slotKey = `xiuxian_save_${i + 1}`;
            const saveData = this.loadSave(slotKey);

            // 存档框背景
            const bg = this.add.rectangle(slotX, y, 300, 100, 0xf5f0e1, 0.9)
                .setStrokeStyle(2, 0x8b7355, 0.8)
                .setInteractive({ useHandCursor: true });

            // 存档编号
            this.add.text(slotX - 130, y - 30, `存档 ${i + 1}`, {
                fontFamily: '楷体, serif',
                fontSize: '16px',
                color: '#8b7355'
            }).setOrigin(0, 0.5);

            if (saveData) {
                // 有存档：显示角色名+存档信息
                const playerName = saveData.playerName || '无名道友';
                const info = `【${playerName}】 Lv.${saveData.level || 1}\n` +
                             `${saveData.realm || '炼气期'}  气血${Math.floor(saveData.hp || 100)}\n` +
                             `灵气${saveData.qi || 5}/${saveData.maxQi || 5}`;

                this.add.text(slotX, y + 5, info, {
                    fontFamily: '微软雅黑, sans-serif',
                    fontSize: '13px',
                    color: '#4a3728',
                    align: 'center',
                    lineSpacing: 4
                }).setOrigin(0.5);

                // 删除按钮（右上角小叉）
                const delBtn = this.add.text(slotX + 130, y - 35, '✕', {
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '16px',
                    color: '#c44536',
                    backgroundColor: 'rgba(245,240,225,0.9)',
                    padding: { x: 5, y: 2 }
                }).setOrigin(0.5).setInteractive({ useHandCursor: true });

                delBtn.on('pointerdown', (pointer) => {
                    pointer.stopPropagation();
                    this.confirmDeleteSave(slotKey, i + 1);
                });

                // 点击读取存档
                bg.on('pointerdown', () => {
                    console.log(`[登录] 读取存档 ${i + 1}，角色名：${playerName}`);
                    this.registry.set('selectedSaveSlot', slotKey);
                    this.registry.set('playerName', playerName);
                    // 清除全局状态，避免旧数据干扰
                    if (window.gameState) {
                        delete window.gameState.player;
                        delete window.gameState.farmManager;
                    }
                    this.scene.start('BaseMapScene');
                });
            } else {
                // 空存档：显示新的开始
                this.add.text(slotX, y, '【 新的开始 】\n点击创建角色', {
                    fontFamily: '楷体, serif',
                    fontSize: '18px',
                    color: '#8b7355',
                    align: 'center',
                    lineSpacing: 8
                }).setOrigin(0.5);

                // 点击弹出取名字界面
                bg.on('pointerdown', () => {
                    console.log(`[登录] 创建新存档 ${i + 1}，请取道号`);
                    this.showNameInput(slotKey);
                });
            }

            // 鼠标悬停效果
            bg.on('pointerover', () => bg.setStrokeStyle(3, 0xc44536, 1));
            bg.on('pointerout', () => bg.setStrokeStyle(2, 0x8b7355, 0.8));
        }
    }

    /**
     * 确认删除存档
     */
    confirmDeleteSave(slotKey, slotNum) {
        this.showHtmlPopup({
            title: '⚠ 删除存档',
            message: `确定要删除存档 ${slotNum} 吗？\n此操作不可撤销！`,
            confirmText: '确认删除',
            cancelText: '取消',
            confirmColor: '#c44536',
            onConfirm: () => {
                localStorage.removeItem(slotKey);
                console.log(`[登录] 存档 ${slotNum} 已删除`);
                // 刷新场景
                this.scene.restart();
            }
        });
    }

    /**
     * 显示取名字输入框（纯HTML弹窗，确保输入框可用）
     */
    showNameInput(slotKey) {
        // 创建HTML弹窗
        const popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.6); display: flex; align-items: center;
            justify-content: center; z-index: 10000; font-family: '楷体', KaiTi, serif;
        `;

        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: #f5f0e1; border: 3px solid #8b7355; border-radius: 8px;
            padding: 30px 40px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            min-width: 400px;
        `;

        // 标题
        const title = document.createElement('div');
        title.textContent = '【 取道号 】';
        title.style.cssText = 'font-size: 28px; color: #c44536; margin-bottom: 10px;';
        dialog.appendChild(title);

        // 提示
        const hint = document.createElement('div');
        hint.textContent = '道友，请输入你的道号（2-8个字）';
        hint.style.cssText = 'font-size: 15px; color: #4a3728; margin-bottom: 20px; font-family: 微软雅黑, sans-serif;';
        dialog.appendChild(hint);

        // 确认/取消按钮（在输入框上方）
        const btnRow = document.createElement('div');
        btnRow.style.cssText = 'display: flex; gap: 20px; justify-content: center; margin-bottom: 20px;';

        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = '✓ 确认';
        confirmBtn.style.cssText = `
            padding: 10px 30px; font-size: 17px; font-family: '楷体', KaiTi, serif;
            background: #c44536; color: #fff; border: 2px solid #8b3a2c;
            border-radius: 5px; cursor: pointer;
        `;
        confirmBtn.onmouseover = () => confirmBtn.style.background = '#a03828';
        confirmBtn.onmouseout = () => confirmBtn.style.background = '#c44536';

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = '✕ 取消';
        cancelBtn.style.cssText = `
            padding: 10px 30px; font-size: 17px; font-family: '楷体', KaiTi, serif;
            background: #8b8680; color: #fff; border: 2px solid #5a5a5a;
            border-radius: 5px; cursor: pointer;
        `;
        cancelBtn.onmouseover = () => cancelBtn.style.background = '#6b6660';
        cancelBtn.onmouseout = () => cancelBtn.style.background = '#8b8680';

        btnRow.appendChild(confirmBtn);
        btnRow.appendChild(cancelBtn);
        dialog.appendChild(btnRow);

        // 输入框（在按钮下方）
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = '请输入道号...';
        input.maxLength = 8;
        input.style.cssText = `
            width: 280px; height: 45px; font-size: 22px; font-family: '楷体', KaiTi, serif;
            text-align: center; border: 2px solid #8b7355; border-radius: 5px;
            background: #fff; color: #4a3728; outline: none;
        `;
        dialog.appendChild(input);

        // 底部提示
        const bottomHint = document.createElement('div');
        bottomHint.textContent = '回车确认 | 不输入默认为"无名道友"';
        bottomHint.style.cssText = 'font-size: 12px; color: #999; margin-top: 15px; font-family: 微软雅黑, sans-serif;';
        dialog.appendChild(bottomHint);

        popup.appendChild(dialog);
        document.body.appendChild(popup);
        this.htmlPopup = popup;

        // 确认动作
        const confirmAction = () => {
            let name = input.value.trim();
            if (!name || name.length < 2) {
                name = '无名道友';
            }
            console.log(`[登录] 角色名：${name}`);
            this.removeHtmlPopup();
            this.registry.set('selectedSaveSlot', slotKey);
            this.registry.set('playerName', name);
            this.registry.set('isNewGame', true);
            // 清除全局状态，避免旧数据干扰
            if (window.gameState) {
                delete window.gameState.player;
                delete window.gameState.farmManager;
            }
            this.scene.start('BaseMapScene');
        };

        confirmBtn.onclick = confirmAction;
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') confirmAction();
        });
        cancelBtn.onclick = () => this.removeHtmlPopup();

        // 自动聚焦
        setTimeout(() => input.focus(), 100);
    }

    /**
     * 通用HTML确认弹窗
     */
    showHtmlPopup(options) {
        const popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.6); display: flex; align-items: center;
            justify-content: center; z-index: 10000; font-family: '楷体', KaiTi, serif;
        `;

        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: #f5f0e1; border: 3px solid #8b7355; border-radius: 8px;
            padding: 30px 40px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            min-width: 350px; max-width: 500px;
        `;

        const title = document.createElement('div');
        title.textContent = options.title;
        title.style.cssText = `font-size: 24px; color: ${options.confirmColor || '#c44536'}; margin-bottom: 15px;`;
        dialog.appendChild(title);

        const message = document.createElement('div');
        message.textContent = options.message;
        message.style.cssText = 'font-size: 16px; color: #4a3728; margin-bottom: 25px; white-space: pre-line; line-height: 1.6; font-family: 微软雅黑, sans-serif;';
        dialog.appendChild(message);

        const btnRow = document.createElement('div');
        btnRow.style.cssText = 'display: flex; gap: 20px; justify-content: center;';

        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = options.confirmText || '确认';
        confirmBtn.style.cssText = `
            padding: 10px 25px; font-size: 16px; font-family: '楷体', KaiTi, serif;
            background: ${options.confirmColor || '#c44536'}; color: #fff; border: none;
            border-radius: 5px; cursor: pointer;
        `;

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = options.cancelText || '取消';
        cancelBtn.style.cssText = `
            padding: 10px 25px; font-size: 16px; font-family: '楷体', KaiTi, serif;
            background: #8b8680; color: #fff; border: none;
            border-radius: 5px; cursor: pointer;
        `;

        btnRow.appendChild(confirmBtn);
        btnRow.appendChild(cancelBtn);
        dialog.appendChild(btnRow);
        popup.appendChild(dialog);
        document.body.appendChild(popup);
        this.htmlPopup = popup;

        confirmBtn.onclick = () => {
            this.removeHtmlPopup();
            if (options.onConfirm) options.onConfirm();
        };
        cancelBtn.onclick = () => {
            this.removeHtmlPopup();
            if (options.onCancel) options.onCancel();
        };
    }

    /**
     * 移除HTML弹窗
     */
    removeHtmlPopup() {
        if (this.htmlPopup && this.htmlPopup.parentNode) {
            this.htmlPopup.parentNode.removeChild(this.htmlPopup);
        }
        this.htmlPopup = null;
    }

    /**
     * 场景关闭时清理HTML弹窗
     */
    shutdown() {
        this.removeHtmlPopup();
    }

    /**
     * 读取指定存档
     */
    loadSave(slotKey) {
        try {
            const data = localStorage.getItem(slotKey);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }
}
