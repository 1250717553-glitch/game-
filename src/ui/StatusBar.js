/**
 * ============================================================
 *  StatusBar.js —— 底部状态栏组件
 * ============================================================
 *  【这是什么？】
 *  游戏底部的状态栏，显示气血、灵气、等级经验、寿元、修为。
 *  从BaseMapScene抽离出来。
 *
 *  【怎么用】
 *  const statusBar = new StatusBar(scene, player);
 *  statusBar.update();  // 每帧调用更新显示
 */

class StatusBar {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.create();
    }

    /**
     * 创建状态栏
     */
    create() {
        const scene = this.scene;
        const barY = GAME_HEIGHT - 20;
        const startX = 20;

        // ===== 气血条 =====
        scene.add.rectangle(startX + 100, barY, 150, 14, 0x333333).setOrigin(0, 0.5);
        this.hpBar = scene.add.rectangle(startX + 102, barY, 146, 10, 0xc44536).setOrigin(0, 0.5);
        scene.add.text(startX, barY, '气血', {
            fontFamily: '微软雅黑, sans-serif', fontSize: '11px', color: '#c44536'
        }).setOrigin(0, 0.5);
        this.hpText = scene.add.text(startX + 175, barY, '100/100', {
            fontFamily: '微软雅黑, sans-serif', fontSize: '10px', color: '#ccc'
        }).setOrigin(0, 0.5);

        // ===== 灵气条 =====
        const qiX = startX + 280;
        scene.add.rectangle(qiX + 100, barY, 150, 14, 0x333333).setOrigin(0, 0.5);
        this.qiBar = scene.add.rectangle(qiX + 102, barY, 146, 10, 0x3a6b8c).setOrigin(0, 0.5);
        scene.add.text(qiX, barY, '灵气', {
            fontFamily: '微软雅黑, sans-serif', fontSize: '11px', color: '#3a6b8c'
        }).setOrigin(0, 0.5);
        this.qiText = scene.add.text(qiX + 175, barY, '5/5', {
            fontFamily: '微软雅黑, sans-serif', fontSize: '10px', color: '#ccc'
        }).setOrigin(0, 0.5);

        // ===== 等级经验条 =====
        const lvX = qiX + 280;
        scene.add.rectangle(lvX + 100, barY, 150, 14, 0x333333).setOrigin(0, 0.5);
        this.expBar = scene.add.rectangle(lvX + 102, barY, 146, 10, 0xc9a84c).setOrigin(0, 0.5);
        this.lvText = scene.add.text(lvX, barY, 'Lv.1', {
            fontFamily: '微软雅黑, sans-serif', fontSize: '11px', color: '#c9a84c'
        }).setOrigin(0, 0.5);
        this.expText = scene.add.text(lvX + 175, barY, '0/100', {
            fontFamily: '微软雅黑, sans-serif', fontSize: '10px', color: '#ccc'
        }).setOrigin(0, 0.5);

        // ===== 寿元 =====
        this.lifeText = scene.add.text(lvX + 320, barY, '寿元：100', {
            fontFamily: '微软雅黑, sans-serif', fontSize: '11px', color: '#c9a84c'
        }).setOrigin(0, 0.5);

        // ===== 修为 =====
        this.realmExpText = scene.add.text(GAME_WIDTH - 20, barY, '修为：0/100', {
            fontFamily: '微软雅黑, sans-serif', fontSize: '11px', color: '#c9a84c'
        }).setOrigin(1, 0.5);
    }

    /**
     * 每帧更新状态栏显示
     */
    update() {
        const player = this.player;

        // 气血
        this.hpBar.width = 146 * (player.hp / player.maxHp);
        this.hpText.setText(`${Math.floor(player.hp)}/${player.maxHp}`);

        // 灵气
        this.qiBar.width = 146 * (player.qi / player.maxQi);
        this.qiText.setText(`${player.qi}/${player.maxQi}`);

        // 等级经验
        const needExp = player.getExpToNextLevel();
        this.expBar.width = 146 * (player.levelExp / needExp);
        this.expText.setText(`${Math.floor(player.levelExp)}/${needExp}`);
        this.lvText.setText(`Lv.${player.level}`);

        // 寿元
        this.lifeText.setText(`寿元：${Math.floor(player.lifespan)}`);

        // 修为
        this.realmExpText.setText(`修为：${Math.floor(player.exp)}/${player.expToLevelUp}`);
    }
}
