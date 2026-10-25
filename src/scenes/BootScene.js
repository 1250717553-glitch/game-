/**
 * ============================================================
 *  BootScene.js —— 启动场景（最早期）
 * ============================================================
 *  【这是什么？】
 *  游戏最开始运行的场景。
 *  它只做一件事：初始化最基础的东西，然后立刻跳转到加载场景。
 *
 *  【为什么要有这个场景？】
 *  有些Phaser的设置（比如缩放模式、背景色）必须在最早期设好。
 *  就像开店前先把灯打开、门拉开。
 */

class BootScene extends Phaser.Scene {
    constructor() {
        // 给这个场景起个名字，以后用这个名字调用它
        super({ key: 'BootScene' });
    }

    /**
     * 场景创建时自动执行
     */
    create() {
        // 设置游戏背景色为宣纸色
        this.cameras.main.setBackgroundColor(COLORS.PAPER);

        // 简单提示一下正在启动
        console.log('%c[启动] 游戏初始化完成，开始加载资源...', 'color: #c44536; font-weight: bold');

        // 直接跳转到加载场景
        this.scene.start('PreloadScene');
    }
}
