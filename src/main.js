/**
 * ============================================================
 *  main.js —— 游戏总入口
 * ============================================================
 *  【这是什么？】
 *  整个游戏的"总开关"。
 *  在这里创建 Phaser 游戏实例，告诉它有哪些场景、
 *  先启动哪个场景。
 *
 *  【你需要改的地方】
 *  一般不用改这里。除非你要加新场景、改屏幕大小。
 */

// 创建 Phaser 游戏实例
const game = new Phaser.Game({
    // 游戏画布放在哪个HTML元素里
    parent: 'game-container',

    // 屏幕大小（从constants.js读取）
    width: GAME_WIDTH,
    height: GAME_HEIGHT,

    // 渲染方式：AUTO 让Phaser自动选（优先WebGL）
    type: Phaser.AUTO,

    // 背景色
    backgroundColor: '#f5f0e1',

    // 物理引擎配置（现在第一版暂时不用，以后战斗会用到）
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },  // 俯视角游戏，没有重力
            debug: DEBUG_MODE   // 调试模式下显示碰撞框
        }
    },

    // 所有场景列表（按顺序加载，第一个是启动场景）
    scene: [
        BootScene,
        PreloadScene,
        LoginScene,          // 登录/选档界面
        BaseMapScene,        // 宗门主地图
        WorldMapScene,       // 世界大地图
        BattleScene,         // 战斗场景
        DongfuScene,         // 洞府场景（家+田地）
        FarmScene,           // 灵田场景（专门的种田页面）
        TrainingGroundScene, // 练功台场景
        SectHallScene,       // 宗门大殿场景
        GongfaPavilionScene, // 功法阁场景
        EditorScene          // 编辑器
    ]
});

// 游戏启动成功提示
console.log('%c========================================', 'color: #c44536');
console.log('%c  修仙录 - 水墨风修仙游戏 已启动！', 'color: #c44536; font-size: 16px; font-weight: bold');
console.log('%c========================================', 'color: #c44536');
console.log('%c操作：鼠标点击地面移动 | 按F2打开编辑器', 'color: #3a6b8c');

/**
 * ============================================================
 *  全局点击事件管理（最可靠的方案）
 * ============================================================
 *  问题：Phaser场景切换时，input.on('pointerdown')有时会失效
 *  方案：在document上只绑定一个点击事件，各场景注册/注销处理函数
 *  优点：无论场景切换多少次，点击事件都不会丢失
 */
window.globalClickHandlers = [];  // 全局点击处理函数列表

// 只绑定一次document点击事件
document.addEventListener('click', function(e) {
    try {
        // 遍历所有注册的处理函数
        for (let i = window.globalClickHandlers.length - 1; i >= 0; i--) {
            const handler = window.globalClickHandlers[i];
            if (handler && typeof handler.callback === 'function') {
                handler.callback(e);
            }
        }
    } catch (err) {
        console.error('[全局点击] 处理失败:', err);
    }
});

/**
 * 注册全局点击处理函数
 * @param {string} id - 处理函数ID（用于移除）
 * @param {function} callback - 处理函数
 */
window.registerGlobalClick = function(id, callback) {
    // 先移除同名的旧处理函数
    window.unregisterGlobalClick(id);
    // 添加新的处理函数
    window.globalClickHandlers.push({ id: id, callback: callback });
    console.log('[全局点击] 注册处理函数:', id, '当前总数:', window.globalClickHandlers.length);
};

/**
 * 移除全局点击处理函数
 * @param {string} id - 处理函数ID
 */
window.unregisterGlobalClick = function(id) {
    const before = window.globalClickHandlers.length;
    window.globalClickHandlers = window.globalClickHandlers.filter(h => h.id !== id);
    if (before !== window.globalClickHandlers.length) {
        console.log('[全局点击] 移除处理函数:', id, '当前总数:', window.globalClickHandlers.length);
    }
};
