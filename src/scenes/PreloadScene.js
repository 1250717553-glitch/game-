/**
 * ============================================================
 *  PreloadScene.js —— 资源加载场景
 * ============================================================
 *  【这是什么？】
 *  游戏资源（图片、声音）的"卸货区"。
 *  玩家会看到一个加载进度条，等所有资源加载完再进入游戏。
 *
 *  【加载方式说明】
 *  因为游戏是直接双击 index.html 在浏览器里打开的（file:// 协议），
 *  Phaser 自带的 this.load.image() 有时会加载失败（显示空白方框）。
 *  所以我们改用手动创建 Image 对象的方式加载，100% 可靠。
 */

class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    /**
     * preload 阶段：只画加载界面，不用 Phaser loader
     */
    preload() {
        // 显示"加载中"文字
        this.add.text(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2 - 50,
            '正在加载...',
            {
                fontFamily: '楷体, KaiTi, serif',
                fontSize: '32px',
                color: '#4a4a4a'
            }
        ).setOrigin(0.5);

        // 进度条底框
        const barWidth = 400;
        const barHeight = 20;
        const barX = GAME_WIDTH / 2 - barWidth / 2;
        const barY = GAME_HEIGHT / 2 + 20;

        this.add.graphics()
            .lineStyle(2, 0x4a4a4a, 1)
            .strokeRect(barX, barY, barWidth, barHeight);

        // 保存进度条引用，后面加载时更新
        this.progressBar = this.add.graphics();
        this.barX = barX;
        this.barY = barY;
        this.barWidth = barWidth;
        this.barHeight = barHeight;
    }

    /**
     * create 阶段：手动加载所有图片资源
     */
    create() {
        console.log('%c[加载] 开始手动加载资源...', 'color: #c44536; font-weight: bold');

        // ===== 要加载的资源列表 =====
        // 注意：因为游戏是直接双击 index.html 打开的（file:// 协议），
        // 浏览器CORS策略会阻止加载本地图片文件。
        // 所以玩家图片已经转成 base64 内嵌在 player_data.js 里了。
        // 以后加新图片，如果也遇到CORS问题，同样转成base64内嵌即可。
        const assetsToLoad = [];

        // 玩家角色图片（从base64数据加载）
        if (window.PLAYER_IMAGE_DATA) {
            assetsToLoad.push({ key: 'player', url: window.PLAYER_IMAGE_DATA });
        } else {
            console.error('[加载] ✗ 未找到 PLAYER_IMAGE_DATA，请检查 player_data.js 是否引入');
        }

        // 怪物图片和战斗背景（从base64数据加载）
        if (window.MONSTER_IMAGES) {
            for (const key in window.MONSTER_IMAGES) {
                assetsToLoad.push({ key: key, url: window.MONSTER_IMAGES[key] });
            }
        } else {
            console.error('[加载] ✗ 未找到 MONSTER_IMAGES，请检查 monsters_data.js 是否引入');
        }

        // 物品图标（从base64数据加载）
        if (window.ITEM_IMAGES) {
            for (const key in window.ITEM_IMAGES) {
                assetsToLoad.push({ key: key, url: window.ITEM_IMAGES[key] });
            }
        }

        // 场景背景图（从base64数据加载）
        if (window.SCENE_IMAGES) {
            for (const key in window.SCENE_IMAGES) {
                assetsToLoad.push({ key: key, url: window.SCENE_IMAGES[key] });
            }
        }

        // 植物生长阶段贴图（从base64数据加载）
        if (window.PLANT_IMAGES) {
            for (const key in window.PLANT_IMAGES) {
                assetsToLoad.push({ key: key, url: window.PLANT_IMAGES[key] });
            }
            console.log(`[加载] 植物贴图 ${Object.keys(window.PLANT_IMAGES).length} 张`);
        } else {
            console.warn('[加载] 未找到 PLANT_IMAGES，请检查 plants_data.js 是否引入');
        }

        // 农田相关贴图（新的精致植物贴图、种子贴图、灵田背景）
        if (window.FARM_IMAGES) {
            for (const key in window.FARM_IMAGES) {
                assetsToLoad.push({ key: key, url: window.FARM_IMAGES[key] });
            }
            console.log(`[加载] 农田贴图 ${Object.keys(window.FARM_IMAGES).length} 张`);
        } else {
            console.warn('[加载] 未找到 FARM_IMAGES，请检查 farm_data.js 是否引入');
        }

        // 宗门相关贴图（大殿背景、功法图标、NPC头像）
        if (window.SECT_IMAGES) {
            for (const key in window.SECT_IMAGES) {
                assetsToLoad.push({ key: key, url: window.SECT_IMAGES[key] });
            }
            console.log(`[加载] 宗门贴图 ${Object.keys(window.SECT_IMAGES).length} 张`);
        } else {
            console.warn('[加载] 未找到 SECT_IMAGES，请检查 sect_data.js 是否引入');
        }

        let loadedCount = 0;
        const totalCount = assetsToLoad.length;

        // 逐个加载
        assetsToLoad.forEach(asset => {
            const img = new Image();
            // base64 data URL 不需要 crossOrigin 设置

            img.onload = () => {
                // 图片加载成功，添加到 Phaser 纹理管理器
                this.textures.addImage(asset.key, img);
                console.log(`[加载] ✓ ${asset.key} 加载成功 (${img.width}x${img.height})`);

                loadedCount++;
                this.updateProgress(loadedCount / totalCount);

                // 全部加载完，进入登录界面
                if (loadedCount >= totalCount) {
                    this.time.delayedCall(300, () => {
                        console.log('%c[加载] 全部资源加载完成，进入登录界面', 'color: #2d8a4e; font-weight: bold');
                        this.scene.start('LoginScene');
                    });
                }
            };

            img.onerror = () => {
                console.error(`[加载] ✗ ${asset.key} 加载失败: ${asset.url}`);
                loadedCount++;
                this.updateProgress(loadedCount / totalCount);

                // 即使失败也继续，避免卡死
                if (loadedCount >= totalCount) {
                    this.time.delayedCall(300, () => {
                        this.scene.start('LoginScene');
                    });
                }
            };

            img.src = asset.url;
        });

        // 如果没有要加载的资源，直接进入
        if (totalCount === 0) {
            this.scene.start('LoginScene');
        }
    }

    /**
     * 更新进度条
     */
    updateProgress(value) {
        this.progressBar.clear();
        this.progressBar.fillStyle(0xc44536, 1);
        this.progressBar.fillRect(
            this.barX + 2,
            this.barY + 2,
            (this.barWidth - 4) * value,
            this.barHeight - 4
        );
    }
}
