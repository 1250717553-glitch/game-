/**
 * ============================================================
 *  EditorScene.js —— 内置游戏编辑器（你的"编译器"）
 * ============================================================
 *  【这是什么？】
 *  这就是你说的"游戏编译器"。
 *  以后可以在游戏里直接：
 *    - 画地图（放地砖、刷怪点）
 *    - 加新道具
 *    - 放新NPC
 *    - 改数值
 *
 *  【现在第一版】
 *  先做个"空壳"，让你能按F2切换进来，看到一个编辑器界面。
 *  具体功能后面慢慢加。
 */

class EditorScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EditorScene' });
    }

    create() {
        console.log('%c[编辑器] 进入编辑模式', 'color: #c9a84c; font-weight: bold');

        // 1. 编辑器背景（深色，和游戏区分开）
        this.cameras.main.setBackgroundColor(0x2a2a2a);

        // 2. 顶部工具栏
        this.createToolbar();

        // 3. 左侧工具面板（地图、道具、NPC等按钮）
        this.createToolPanel();

        // 4. 中间画布区域（现在是空的灰色区域）
        this.createCanvas();

        // 5. 提示文字
        this.add.text(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            '编辑器正在建设中...\n\n按 F2 返回游戏',
            {
                fontFamily: '微软雅黑, sans-serif',
                fontSize: '24px',
                color: '#888888',
                align: 'center'
            }
        ).setOrigin(0.5);

        // 6. 按F2返回主地图
        this.input.keyboard.on('keydown-F2', () => {
            console.log('返回游戏');
            this.scene.switch('BaseMapScene');
        });
    }

    /**
     * 顶部工具栏
     */
    createToolbar() {
        // 工具栏背景条
        this.add.rectangle(0, 0, GAME_WIDTH, 50, 0x1a1a1a).setOrigin(0, 0);

        // 标题
        this.add.text(20, 25, '🎮 游戏编辑器', {
            fontFamily: '微软雅黑, sans-serif',
            fontSize: '18px',
            color: '#c9a84c'
        }).setOrigin(0, 0.5);

        // 工具按钮（现在只是摆个样子）
        const buttons = ['保存', '加载', '撤销', '重做', '测试'];
        buttons.forEach((name, i) => {
            const btnX = 200 + i * 80;
            this.add.rectangle(btnX, 25, 70, 32, 0x3a3a3a)
                .setStrokeStyle(1, 0x555555);
            this.add.text(btnX, 25, name, {
                fontFamily: '微软雅黑, sans-serif',
                fontSize: '13px',
                color: '#cccccc'
            }).setOrigin(0.5);
        });
    }

    /**
     * 左侧工具面板
     */
    createToolPanel() {
        // 面板背景
        this.add.rectangle(0, 50, 150, GAME_HEIGHT - 50, 0x222222)
            .setOrigin(0, 0);

        // 工具列表（以后做成可点击的）
        const tools = ['地图绘制', '放置怪物', '放置NPC', '添加道具', '区域设置'];
        tools.forEach((tool, i) => {
            const y = 80 + i * 45;
            this.add.rectangle(75, y, 130, 35, 0x333333)
                .setStrokeStyle(1, 0x444444);
            this.add.text(75, y, tool, {
                fontFamily: '微软雅黑, sans-serif',
                fontSize: '13px',
                color: '#aaaaaa'
            }).setOrigin(0.5);
        });
    }

    /**
     * 中间编辑画布
     */
    createCanvas() {
        // 画一个大的灰色矩形代表画布
        this.add.rectangle(
            150 + (GAME_WIDTH - 150) / 2,
            50 + (GAME_HEIGHT - 50) / 2,
            GAME_WIDTH - 150 - 20,
            GAME_HEIGHT - 50 - 20,
            0x333333
        ).setStrokeStyle(2, 0x555555);
    }
}
