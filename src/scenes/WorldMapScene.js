/**
 * ============================================================
 *  WorldMapScene.js —— 世界大地图
 * ============================================================
 *  【这是什么？】
 *  从宗门大门出去后看到的世界地图。
 *  上面有宗门和各个怪物点，点怪物就进入战斗。
 *
 *  【怪物刷新机制】
 *  - 每个怪物点打完后会消失（显示"已击败"）
 *  - 从宗门回来后，所有怪物点自动刷新
 *  - 每个怪物点也有自己的刷新时间（respawnTime），时间到了自动刷新
 */

class WorldMapScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WorldMapScene' });
    }

    /**
     * 接收参数
     * @param {object} data - { fromBattle: true/false, battleResult: 'victory'/'defeat'/'flee' }
     */
    init(data) {
        this.fromBattle = data && data.fromBattle;
        this.battleResult = data && data.battleResult;
        console.log(`[大地图] 进入，fromBattle=${this.fromBattle}, result=${this.battleResult}`);
    }

    create() {
        console.log('%c[大地图] 进入世界地图', 'color: #c9a84c; font-weight: bold');

        // 初始化已击败怪物记录（全局）
        if (!window.defeatedMonsters) {
            window.defeatedMonsters = {};
        }

        // 如果是从宗门进来的（不是从战斗回来），刷新所有怪物
        if (!this.fromBattle) {
            window.defeatedMonsters = {};
            console.log('[大地图] 从宗门进入，刷新所有怪物');
        }

        // ========== 【最重要】先绑定全局点击事件，确保即使后面出错也能点击 ==========
        this.setupGlobalClickHandler();

        // ========== 大地图背景 ==========
        try {
            this.createMapBackground();
        } catch (e) {
            console.error('[大地图] 创建背景失败:', e);
        }

        // ========== 标题 ==========
        try {
            this.add.text(GAME_WIDTH / 2, 45, '🗺 修仙世界 · 野外', {
                fontFamily: '楷体, KaiTi, serif',
                fontSize: '32px',
                color: '#4a3728',
                backgroundColor: 'rgba(245,240,225,0.85)',
                padding: { x: 20, y: 6 }
            }).setOrigin(0.5);
        } catch (e) {
            console.error('[大地图] 创建标题失败:', e);
        }

        // ========== 宗门地点（左下角）==========
        try {
            this.createSectLocation();
        } catch (e) {
            console.error('[大地图] 创建宗门地点失败:', e);
        }

        // ========== 怪物点 ==========
        try {
            this.createMonsterPoints();
        } catch (e) {
            console.error('[大地图] 创建怪物点失败:', e);
        }

        // ========== 底部提示 ==========
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, '点击怪物点进入战斗 | 点击宗门返回（返回后怪物刷新）', {
            fontFamily: '微软雅黑, sans-serif',
            fontSize: '14px',
            color: '#666',
            backgroundColor: 'rgba(245,240,225,0.7)',
            padding: { x: 10, y: 4 }
        }).setOrigin(0.5);

        // 战斗结果提示
        if (this.fromBattle && this.battleResult) {
            let resultText = '';
            if (this.battleResult === 'victory') {
                resultText = '⚔ 战斗胜利！';
            } else if (this.battleResult === 'defeat') {
                resultText = '💀 战斗失败，已返回大地图';
            } else if (this.battleResult === 'flee') {
                resultText = '🏃 已逃离战斗';
            }
            const resultLabel = this.add.text(GAME_WIDTH / 2, 90, resultText, {
                fontFamily: '楷体, KaiTi, serif',
                fontSize: '22px',
                color: this.battleResult === 'victory' ? '#2d8a4e' : '#c44536',
                backgroundColor: 'rgba(245,240,225,0.9)',
                padding: { x: 15, y: 5 }
            }).setOrigin(0.5);

            // 3秒后淡出
            this.tweens.add({
                targets: resultLabel,
                alpha: 0,
                duration: 1000,
                delay: 2500
            });
        }

        // ========== 玩家角色（用你上传的主角图片）==========
        try {
            this.createPlayerCharacter();
        } catch (e) {
            console.error('[大地图] 创建玩家角色失败:', e);
        }
    }

    /**
     * 【最重要】设置全局点击事件
     * 使用全局单一事件管理，不依赖Phaser输入系统，也不会因为场景切换而丢失
     */
    setupGlobalClickHandler() {
        // 保存this引用
        const self = this;

        // 点击处理函数
        this.clickHandler = function(e) {
            try {
                // 获取游戏画布
                const canvas = document.querySelector('canvas');
                if (!canvas) {
                    console.log('[大地图] 找不到canvas');
                    return;
                }

                // 获取画布位置和大小
                const rect = canvas.getBoundingClientRect();

                // 计算点击位置相对于画布的比例
                const scaleX = (e.clientX - rect.left) / rect.width;
                const scaleY = (e.clientY - rect.top) / rect.height;

                // 转换成游戏逻辑坐标
                const gameX = scaleX * GAME_WIDTH;
                const gameY = scaleY * GAME_HEIGHT;

                console.log('[大地图] 全局点击:', gameX, gameY);

                // 动态计算可点击点（宗门 + 未击败的怪物点）
                const clickablePoints = [];
                // 宗门位置
                clickablePoints.push({
                    type: 'sect',
                    x: 150,
                    y: GAME_HEIGHT - 150,
                    radius: 55
                });
                // 怪物点位置
                try {
                    for (const point of WORLD_MONSTERS) {
                        const isDefeated = window.defeatedMonsters && window.defeatedMonsters[point.id];
                        if (!isDefeated) {
                            clickablePoints.push({
                                type: 'monster',
                                id: point.id,
                                x: point.x,
                                y: point.y,
                                radius: 45,
                                monsterId: point.monsterId
                            });
                        }
                    }
                } catch (err) {
                    console.error('[大地图] 计算怪物点失败:', err);
                }

                // 检测是否点击了可交互点
                let clickedPoint = null;
                for (const p of clickablePoints) {
                    const dist = Math.sqrt((gameX - p.x) ** 2 + (gameY - p.y) ** 2);
                    if (dist <= p.radius) {
                        clickedPoint = p;
                        break;
                    }
                }

                if (clickedPoint) {
                    console.log('[大地图] 点击了:', clickedPoint.type);
                    if (clickedPoint.type === 'sect') {
                        // 返回宗门
                        self.scene.start('BaseMapScene');
                    } else if (clickedPoint.type === 'monster') {
                        // 进入战斗
                        try {
                            const point = WORLD_MONSTERS.find(p => p.id === clickedPoint.id);
                            const monster = MONSTERS[clickedPoint.monsterId];
                            self.enterBattle(point, monster);
                        } catch (err) {
                            console.error('[大地图] 进入战斗失败:', err);
                            self.showToast('进入战斗失败，请重试');
                        }
                    }
                } else {
                    // 点击空白区域，移动玩家
                    console.log('[大地图] 点击空白区域，移动玩家');
                    self.playerMoveTarget = new Phaser.Math.Vector2(gameX, gameY);
                    try {
                        self.showClickEffect(gameX, gameY);
                    } catch (err) {
                        console.error('[大地图] 显示点击效果失败:', err);
                    }
                }
            } catch (err) {
                console.error('[大地图] 点击处理失败:', err);
            }
        };

        // 注册到全局点击事件管理
        window.registerGlobalClick('WorldMapScene', this.clickHandler);

        // 场景关闭时移除
        this.events.on('shutdown', () => {
            window.unregisterGlobalClick('WorldMapScene');
            console.log('[大地图] 全局点击事件已移除');
        });

        console.log('[大地图] 全局点击事件已注册');
    }

    /**
     * 创建玩家角色
     */
    createPlayerCharacter() {
        const startX = 250;  // 宗门右侧，避免遮挡宗门点击
        const startY = GAME_HEIGHT - 150;

        // 玩家容器（depth=1，确保在怪物点下面，不遮挡点击）
        this.playerContainer = this.add.container(startX, startY).setDepth(1);

        // 阴影
        const shadow = this.add.ellipse(0, 50, 50, 14, 0x000000, 0.25);
        this.playerContainer.add(shadow);

        // 主角图片（用多种方式确保缩放生效）
        if (this.textures.exists('player')) {
            this.playerSprite = this.add.image(0, 0, 'player');
            // 立即设置显示大小
            this.playerSprite.setDisplaySize(100, 100);
            this.playerSprite.setOrigin(0.5, 0.85);
            this.playerContainer.add(this.playerSprite);
            // 延迟100ms再次设置，确保图片加载完成后缩放生效
            this.time.delayedCall(100, () => {
                if (this.playerSprite) {
                    this.playerSprite.setDisplaySize(100, 100);
                    this.playerSprite.setScale(100 / this.playerSprite.width);
                }
            });
        } else {
            // fallback：简单圆形
            const body = this.add.circle(0, 0, 30, 0x3a6b8c);
            this.playerContainer.add(body);
        }

        // 玩家名字
        const playerName = this.registry.get('playerName') || '道友';
        this.playerNameText = this.add.text(0, -60, playerName, {
            fontFamily: '楷体, KaiTi, serif',
            fontSize: '14px',
            color: '#ffd700',
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5);
        this.playerContainer.add(this.playerNameText);

        this.playerMoveTarget = null;
        this.playerSpeed = 200;  // 移动速度
    }

    /**
     * 显示点击效果
     */
    showClickEffect(x, y) {
        const mark = this.add.circle(x, y, 8, 0xc44536, 0.8);
        this.tweens.add({
            targets: mark,
            alpha: 0,
            scale: 2.5,
            duration: 400,
            onComplete: () => mark.destroy()
        });
    }

    /**
     * 创建大地图背景
     */
    createMapBackground() {
        // 用水墨山林背景
        if (this.textures.exists('battle_bg')) {
            const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'battle_bg');
            bg.setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
            bg.setAlpha(0.7);
        } else {
            // fallback：宣纸底色
            const g = this.add.graphics();
            g.fillStyle(0xe8e0d0, 1);
            g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

            // 几座远山
            g.fillStyle(0x8b8680, 0.25);
            g.fillTriangle(50, 550, 350, 180, 650, 550);
            g.fillTriangle(450, 550, 750, 120, 1050, 550);
            g.fillTriangle(850, 550, 1100, 200, 1350, 550);
        }

        // 加一层宣纸纹理感
        const overlay = this.add.graphics();
        overlay.fillStyle(0xf5f0e1, 0.15);
        overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    /**
     * 创建宗门地点
     */
    createSectLocation() {
        const sx = 150;
        const sy = GAME_HEIGHT - 150;

        // 宗门图标（红色圆圈）
        this.add.circle(sx, sy, 45, 0xc44536, 0.25)
            .setStrokeStyle(3, 0xc44536, 0.9);
        this.add.text(sx, sy, '宗', {
            fontFamily: '楷体, KaiTi, serif',
            fontSize: '28px',
            color: '#c44536',
            fontWeight: 'bold'
        }).setOrigin(0.5);

        // 名字
        this.add.text(sx, sy + 60, '青云宗', {
            fontFamily: '楷体, KaiTi, serif',
            fontSize: '18px',
            color: '#4a3728',
            backgroundColor: 'rgba(245,240,225,0.8)',
            padding: { x: 8, y: 3 }
        }).setOrigin(0.5);
        this.add.text(sx, sy + 85, '（你的家，返回后怪物刷新）', {
            fontFamily: '微软雅黑, sans-serif',
            fontSize: '11px',
            color: '#888'
        }).setOrigin(0.5);

        // 点击区域（只保留悬停效果，点击由全局事件统一处理）
        const hitArea = this.add.circle(sx, sy, 55, 0xffffff, 0)
            .setInteractive({ useHandCursor: true }).setDepth(100);
        hitArea.on('pointerover', () => {
            this.input.setDefaultCursor('pointer');
        });
        hitArea.on('pointerout', () => {
            this.input.setDefaultCursor('default');
        });
    }

    /**
     * 创建所有怪物点
     */
    createMonsterPoints() {
        this.monsterPointObjects = [];

        WORLD_MONSTERS.forEach((point, index) => {
            const monster = MONSTERS[point.monsterId];
            if (!monster) return;

            // 检查是否已击败
            const isDefeated = window.defeatedMonsters[point.id] !== undefined;

            // 创建怪物点
            const pointObj = this.createSingleMonsterPoint(point, monster, isDefeated, index);
            this.monsterPointObjects.push(pointObj);
        });

        // 定时检查刷新（每2秒检查一次）
        this.time.addEvent({
            delay: 2000,
            callback: () => this.checkMonsterRespawn(),
            loop: true
        });
    }

    /**
     * 创建单个怪物点
     */
    createSingleMonsterPoint(point, monster, isDefeated, index) {
        const x = point.x;
        const y = point.y;

        // 怪物点容器（depth=60，确保在玩家角色上面）
        const container = this.add.container(x, y).setDepth(60);

        // 外圈（根据怪物强度变色）
        let ringColor = 0x5a8c3a; // 普通怪：绿色
        let ringAlpha = 0.3;
        if (monster.isBoss) {
            ringColor = 0xff4444; // BOSS：红色
            ringAlpha = 0.4;
        } else if (monster.hp >= 80) {
            ringColor = 0xc9a84c; // 精英怪：金色
            ringAlpha = 0.35;
        }

        const ring = this.add.circle(0, 0, 40, ringColor, ringAlpha)
            .setStrokeStyle(3, ringColor, isDefeated ? 0.3 : 0.9);
        container.add(ring);

        // 怪物图标（用怪物图片的缩略图，如果有的话）
        const monsterImageKey = monster.imageKey;
        if (this.textures.exists(monsterImageKey) && !isDefeated) {
            const icon = this.add.image(0, 0, monsterImageKey);
            icon.setScale(0.12); // 缩小到合适大小
            icon.setOrigin(0.5, 0.5);
            container.add(icon);
        } else if (isDefeated) {
            // 已击败：显示✓
            this.add.text(0, 0, '✓', {
                fontFamily: 'Arial',
                fontSize: '28px',
                color: '#888'
            }).setOrigin(0.5);
        } else {
            // fallback：显示怪物名第一个字
            this.add.text(0, 0, monster.name.charAt(0), {
                fontFamily: '楷体, KaiTi, serif',
                fontSize: '24px',
                color: ringColor === 0xff4444 ? '#ff4444' : '#3a6b1b'
            }).setOrigin(0.5);
        }

        // 怪物名字
        const nameColor = isDefeated ? '#999' : (monster.isBoss ? '#ff4444' : '#4a3728');
        const nameText = this.add.text(0, 55, monster.name, {
            fontFamily: '楷体, KaiTi, serif',
            fontSize: '15px',
            color: nameColor,
            backgroundColor: 'rgba(245,240,225,0.85)',
            padding: { x: 6, y: 2 }
        }).setOrigin(0.5);
        container.add(nameText);

        // 血量/攻击信息
        if (!isDefeated) {
            const infoText = this.add.text(0, 75, `血${monster.hp} 攻${monster.attack}`, {
                fontFamily: '微软雅黑, sans-serif',
                fontSize: '11px',
                color: '#666',
                backgroundColor: 'rgba(245,240,225,0.7)',
                padding: { x: 4, y: 1 }
            }).setOrigin(0.5);
            container.add(infoText);
        } else {
            // 已击败提示
            const defeatedText = this.add.text(0, 75, '已击败', {
                fontFamily: '微软雅黑, sans-serif',
                fontSize: '11px',
                color: '#999'
            }).setOrigin(0.5);
            container.add(defeatedText);
        }

        // BOSS标记
        if (monster.isBoss && !isDefeated) {
            const bossTag = this.add.text(0, -50, '★BOSS★', {
                fontFamily: '微软雅黑, sans-serif',
                fontSize: '12px',
                color: '#ffd700',
                backgroundColor: 'rgba(0,0,0,0.6)',
                padding: { x: 5, y: 2 }
            }).setOrigin(0.5);
            container.add(bossTag);
        }

        // 点击区域（未击败时可点击，只保留悬停效果，点击由全局事件统一处理）
        if (!isDefeated) {
            const hitArea = this.add.circle(0, 0, 45, 0xffffff, 0)
                .setInteractive({ useHandCursor: true });
            container.add(hitArea);

            hitArea.on('pointerover', () => {
                container.setScale(1.1);
                this.input.setDefaultCursor('pointer');
            });
            hitArea.on('pointerout', () => {
                container.setScale(1);
                this.input.setDefaultCursor('default');
            });
        }

        return { container, point, monster, isDefeated };
    }

    /**
     * 进入战斗
     */
    enterBattle(point, monster) {
        console.log(`[大地图] 进入战斗：${monster.name} (${point.id})`);
        this.scene.start('BattleScene', {
            monsterId: point.monsterId,
            monsterPointId: point.id
        });
    }

    /**
     * 检查怪物刷新
     */
    checkMonsterRespawn() {
        const now = Date.now();
        let needRefresh = false;

        for (const pointId in window.defeatedMonsters) {
            const defeatTime = window.defeatedMonsters[pointId];
            const point = WORLD_MONSTERS.find(p => p.id === pointId);
            if (point && now - defeatTime >= point.respawnTime) {
                delete window.defeatedMonsters[pointId];
                needRefresh = true;
                console.log(`[大地图] 怪物点 ${pointId} 已刷新`);
            }
        }

        if (needRefresh) {
            // 刷新显示（简单方式：重启场景）
            this.scene.restart({ fromBattle: true });
        }
    }

    /**
     * 每帧更新：玩家移动
     */
    update(time, delta) {
        // 玩家移动
        if (this.playerMoveTarget && this.playerContainer) {
            const currentX = this.playerContainer.x;
            const currentY = this.playerContainer.y;
            const dx = this.playerMoveTarget.x - currentX;
            const dy = this.playerMoveTarget.y - currentY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 3) {
                this.playerMoveTarget = null;
            } else {
                const moveAmount = this.playerSpeed * delta / 1000;
                const ratio = Math.min(1, moveAmount / distance);
                this.playerContainer.x += dx * ratio;
                this.playerContainer.y += dy * ratio;

                // 简单的上下浮动动画
                if (this.playerSprite) {
                    this.playerSprite.y = Math.sin(time / 150) * 3;
                }
            }
        }

        // 检查怪物刷新
        this.checkMonsterRespawn();
    }

    /**
     * 显示提示文字
     */
    showToast(text) {
        try {
            const toast = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, text, {
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
        } catch (e) {
            console.error('[大地图] 显示提示失败:', e);
        }
    }
}
