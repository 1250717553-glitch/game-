/**
 * ============================================================
 *  Player.js —— 玩家角色模块
 * ============================================================
 *  【这是什么？】
 *  控制玩家角色的所有东西：长什么样、怎么动、有什么属性。
 *
 *  【贴图替换说明】
 *  现在我们是用程序画的形状代替贴图。
 *  以后你有真正的美术图了，只需要：
 *  1. 把图片放到 assets/images/player/ 目录
 *  2. 把 USE_SPRITE 改成 true
 *  3. 把 SPRITE_KEY 改成你图片的名字
 *  不用改其他任何代码！
 */

// ===== 贴图替换开关 =====
// 现在是 true（用你提供的人物图片）
const USE_SPRITE = true;
// 贴图key（在PreloadScene里加载的图片key）
const SPRITE_KEY = 'player';
// 玩家显示大小（原图2048x2048，缩放到这个尺寸）
// 推荐值：150~250之间，200是比较标准的俯视角角色大小
const PLAYER_DISPLAY_SIZE = 200;

class Player {
    /**
     * 创建玩家
     */
    constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;

        // 从常量读取初始属性
        this.maxHp = INITIAL_STATS.maxHp;
        this.hp = INITIAL_STATS.hp;
        this.maxQi = INITIAL_STATS.maxQi;
        this.qi = INITIAL_STATS.qi;
        this.lifespan = INITIAL_STATS.lifespan;  // 寿元（能活多少年）
        this.realm = "炼气期";
        this.realmLevel = 1;  // 境界层数（1-9层，每个境界都分9层）
        this.exp = INITIAL_STATS.exp;
        this.expToLevelUp = INITIAL_STATS.expToLevelUp;

        // 战斗属性（攻击/防御，根据境界变化）
        this.attack = 5;    // 攻击力（炼气期初始5）
        this.defense = 0;   // 防御力（炼气期初始0）

        // 等级和经验（人物等级，和境界分开）
        this.level = 1;
        this.levelExp = 0;

        // 炼器等级和经验
        this.refiningLevel = 1;
        this.refiningExp = 0;

        // 功法和技能
        this.manual = "qi_refining";              // 当前修炼的功法
        this.skills = ["slash"];                  // 已学技能列表（初始只有斩击）
        this.learnedManuals = ["qi_refining"];   // 已学功法列表
        this.equippedSkills = ["slash"];          // 装备到战斗栏的技能（最多4个）
        this.maxEquippedSkills = 4;               // 最多装备4个技能

        // 熟练度系统
        this.manualProficiency = {};   // 各功法熟练度 { qi_refining: 0, fire_art: 0, ... }
        this.skillProficiency = {};    // 各技能熟练度 { slash: 0, fireball: 0, ... }
        // 初始化已学功法和技能的熟练度
        this.learnedManuals.forEach(m => this.manualProficiency[m] = 0);
        this.skills.forEach(s => this.skillProficiency[s] = 0);

        // 背包和仓库
        this.inventory = new Inventory();          // 随身背包（50格）
        this.storage = new Inventory(999);         // 家里仓库（999格，近似不限数量）

        // 用容器把玩家所有部件包在一起
        this.container = scene.add.container(x, y);

        // 从registry读取玩家名字（登录界面设置的）
        this.playerName = scene.registry.get('playerName') || '道友';

        // 画玩家的样子
        this.drawPlayer();

        // 走路动画
        this.walkPhase = 0;
        this.isWalking = false;

        // 是否在练功台修炼中
        this.isTraining = false;
    }

    /**
     * 画玩家（使用你提供的人物图片）
     */
    drawPlayer() {
        if (USE_SPRITE) {
            // ===== 使用人物图片 =====
            this.sprite = this.scene.add.image(0, 0, SPRITE_KEY);
            // 原图2048x2048，缩放到合适大小
            const scale = PLAYER_DISPLAY_SIZE / 2048;
            this.sprite.setScale(scale);
            // 让图片底部对齐角色位置（脚在原点）
            this.sprite.setOrigin(0.5, 0.85);
            this.container.add(this.sprite);

            // 脚下阴影
            this.shadow = this.scene.add.ellipse(0, 5, 30, 8, 0x000000, 0.2);
            this.container.add(this.shadow);
        } else {
            // ===== 备用：程序画的水墨风小人 =====
            // 1. 身体（灰袍）
            this.body = this.scene.add.ellipse(0, 5, 18, 22, 0x6b6b6b);
            this.body.setStrokeStyle(2, 0x3a3a3a, 1);

            // 2. 脑袋
            this.head = this.scene.add.circle(0, -10, 10, 0xe8d5b8);
            this.head.setStrokeStyle(1, 0x3a3a3a, 1);

            // 3. 发髻
            this.hair = this.scene.add.circle(0, -18, 4, 0x1a1a1a);

            // 4. 发带（朱砂色）
            this.ribbon = this.scene.add.rectangle(3, -16, 2, 8, 0xc44536);
            this.ribbon.setAngle(20);

            // 5. 眼睛
            this.eyeLeft = this.scene.add.circle(-3, -11, 1.5, 0x1a1a1a);
            this.eyeRight = this.scene.add.circle(3, -11, 1.5, 0x1a1a1a);

            this.container.add([this.body, this.head, this.hair, this.ribbon, this.eyeLeft, this.eyeRight]);
        }

        // 名字标签（在角色头顶上方，往上移避免挡住角色）
        this.nameText = this.scene.add.text(0, -PLAYER_DISPLAY_SIZE * 0.8, this.playerName, {
            fontFamily: '楷体, KaiTi, serif',
            fontSize: '18px',
            color: '#1a1a1a',
            backgroundColor: 'rgba(245,240,225,0.9)',
            padding: { x: 10, y: 4 }
        }).setOrigin(0.5);
        this.container.add(this.nameText);
    }

    /**
     * 设置玩家名字
     */
    setName(name) {
        this.playerName = name;
        if (this.nameText) {
            this.nameText.setText(name);
        }
    }

    /**
     * 设置玩家位置
     */
    setPosition(x, y) {
        this.container.x = x;
        this.container.y = y;
        this.x = x;
        this.y = y;
    }

    /**
     * 走路动画
     */
    updateWalkAnimation(isWalking, delta) {
        this.isWalking = isWalking;
        if (isWalking) {
            this.walkPhase += delta * 0.012;
            // 上下浮动
            const bounce = Math.sin(this.walkPhase * 2) * 3;
            this.container.y = this.y + bounce;
            // 左右轻微摇摆（图片角色）
            if (this.sprite) {
                const sway = Math.sin(this.walkPhase) * 0.03;
                this.sprite.setAngle(sway * 10);
            }
        } else {
            this.container.y = this.y;
            this.walkPhase = 0;
            if (this.sprite) {
                this.sprite.setAngle(0);
            }
        }
    }

    /**
     * 获取位置
     */
    getPosition() {
        return { x: this.x, y: this.y };
    }

    /**
     * 获得修为
     */
    gainExp(amount) {
        this.exp += amount;
        console.log(`[修炼] 获得 ${amount} 修为，当前 ${this.exp}/${this.expToLevelUp}`);

        // 检查是否可以提升一层境界（修为满了先升级，9层满了才能突破大境界）
        while (this.exp >= this.expToLevelUp && this.realmLevel < 9) {
            this.exp -= this.expToLevelUp;
            this.levelUpRealm();
        }

        // 如果9层都满了，修为还有剩余，提示可以突破大境界
        if (this.realmLevel >= 9 && this.exp >= this.expToLevelUp) {
            console.log('[修炼] 已达到9层圆满，可以突破大境界了！');
        }
    }

    /**
     * 提升一层境界（realmLevel +1）
     * 每升一层增加：1点灵气，20血量，1点防御，1点攻击
     * 下一层所需修为增加500
     */
    levelUpRealm() {
        this.realmLevel += 1;

        // 提升属性
        this.maxQi += 1;        // +1灵气上限
        this.qi = this.maxQi;   // 灵气回满
        this.maxHp += 20;       // +20气血上限
        this.hp = this.maxHp;   // 气血回满
        this.defense += 1;      // +1防御
        this.attack += 1;       // +1攻击

        // 下一层所需修为增加500
        this.expToLevelUp += 500;

        console.log(`[境界提升] 提升到 ${this.realm} ${this.realmLevel}层！`);
        console.log(`  属性提升：气血+20(${this.maxHp}) 灵气+1(${this.maxQi}) 攻击+1(${this.attack}) 防御+1(${this.defense})`);
        console.log(`  下一层所需修为：${this.expToLevelUp}`);

        return true;
    }

    /**
     * 尝试突破大境界（消耗寿元）
     * 必须达到当前境界9层圆满才能突破
     */
    tryBreakthrough() {
        // 检查是否达到9层圆满
        if (this.realmLevel < 9) {
            console.log(`[突破失败] 需要达到9层圆满才能突破，当前${this.realmLevel}层`);
            return false;
        }

        // 检查修为是否足够
        if (this.exp < this.expToLevelUp) {
            console.log(`[突破失败] 修为不足，需要${this.expToLevelUp}，当前${this.exp}`);
            return false;
        }

        // 先检查功法是否支持突破到下一个境界
        const manual = CULTIVATION_MANUALS[this.manual];
        const currentRealmIdx = REALMS.findIndex(r => r.name === this.realm);
        const nextRealm = REALMS[currentRealmIdx + 1];

        if (!nextRealm) {
            console.log('[已是最高境界]');
            return false;
        }

        // 检查功法上限
        if (manual.maxRealm !== "无上限" && nextRealm.name !== manual.maxRealm) {
            console.log(`[突破失败] ${manual.name} 只能修到 ${manual.maxRealm}`);
            return false;
        }

        if (this.lifespan < LIFESPAN_COST.breakthrough) {
            console.log('[突破失败] 寿元不足！');
            return false;
        }

        // 消耗寿元和修为
        this.lifespan -= LIFESPAN_COST.breakthrough;
        this.exp = 0;  // 修为清零

        // 提升到大境界
        this.realm = nextRealm.name;
        this.realmLevel = 1;  // 新境界从1层开始

        // 提升属性（大境界突破额外加成）
        this.maxHp += 50;
        this.hp = this.maxHp;
        this.maxQi += 3;
        this.qi = this.maxQi;
        this.attack += 5;
        this.defense += 5;
        this.expToLevelUp = Math.floor(this.expToLevelUp * 1.5);

        console.log(`[突破成功] 进阶为 ${this.realm}！消耗寿元 ${LIFESPAN_COST.breakthrough} 年`);
        return true;
    }

    /**
     * 修炼时消耗寿元
     */
    consumeLifespan(amount) {
        this.lifespan -= amount;
        if (this.lifespan <= 0) {
            this.lifespan = 0;
            console.log('[警告] 寿元耗尽！');
        }
    }

    /**
     * 恢复气血和灵气（休息用）
     */
    restoreAll() {
        this.hp = this.maxHp;
        this.qi = this.maxQi;
        console.log('[休息] 气血灵气已回满');
    }

    /**
     * 使用丹药
     * @param {string} pillId - 丹药ID
     * @returns {object} 使用结果 {success, message, effects}
     */
    usePill(pillId) {
        const pill = ITEMS[pillId];
        if (!pill || (pill.type !== 'pill' && pill.type !== 'cultivation_pill')) {
            return { success: false, message: '这不是丹药' };
        }

        const effects = pill.effect || {};
        const messages = [];

        // 恢复气血
        if (effects.hp && effects.hp > 0) {
            const oldHp = this.hp;
            this.hp = Math.min(this.maxHp, this.hp + effects.hp);
            const healed = this.hp - oldHp;
            messages.push(`恢复气血 +${healed}`);
        }

        // 恢复灵气
        if (effects.qi && effects.qi > 0) {
            const oldQi = this.qi;
            this.qi = Math.min(this.maxQi, this.qi + effects.qi);
            const restored = this.qi - oldQi;
            messages.push(`恢复灵气 +${restored}`);
        }

        // 增加修为
        if (effects.cultivation && effects.cultivation > 0) {
            this.gainExp(effects.cultivation);
            messages.push(`获得修为 +${effects.cultivation}`);
        }

        console.log(`[丹药] 使用 ${pill.name}：${messages.join('，')}`);
        return {
            success: true,
            message: `使用${pill.name}！${messages.join('，')}`,
            effects: effects
        };
    }

    /**
     * 获得人物经验（打怪、种田用）
     */
    gainLevelExp(amount) {
        this.levelExp += amount;
        const needExp = this.getExpToNextLevel();
        console.log(`[经验] 获得 ${amount} 经验，当前 ${this.levelExp}/${needExp}`);

        // 检查升级
        while (this.levelExp >= needExp && this.level < LEVEL_SYSTEM.maxLevel) {
            this.levelExp -= needExp;
            this.level++;
            // 升级奖励
            this.maxHp += 10;
            this.hp = this.maxHp;
            this.maxQi += 1;
            this.qi = this.maxQi;
            console.log(`[升级] 升到 ${this.level} 级！气血+10，灵气+1`);
        }
    }

    /**
     * 计算下一级需要的经验
     */
    getExpToNextLevel() {
        return LEVEL_SYSTEM.baseExp + (this.level - 1) * LEVEL_SYSTEM.expPerLevel;
    }

    /**
     * 获得炼器经验
     */
    gainRefiningExp(amount) {
        this.refiningExp += amount;
        const needExp = REFINING_SYSTEM.expPerLevel;
        console.log(`[炼器] 获得 ${amount} 炼器经验，当前 ${this.refiningExp}/${needExp}`);

        while (this.refiningExp >= needExp && this.refiningLevel < REFINING_SYSTEM.maxLevel) {
            this.refiningExp -= needExp;
            this.refiningLevel++;
            console.log(`[炼器] 炼器等级提升到 ${this.refiningLevel} 层！`);
        }
    }

    /**
     * 学会新技能
     */
    learnSkill(skillId) {
        if (!this.skills.includes(skillId)) {
            this.skills.push(skillId);
            console.log(`[技能] 学会了 ${SKILLS[skillId].name}`);
            return true;
        }
        return false;
    }

    /**
     * 使用物品（比如技能书）
     */
    useItem(itemId) {
        const item = ITEMS[itemId];
        if (!item) return false;

        if (item.type === "skill_book") {
            if (this.learnSkill(item.skill)) {
                this.inventory.removeItem(itemId, 1);
                return true;
            }
        }
        return false;
    }

    // ========== 熟练度系统 ==========

    /**
     * 增加技能熟练度
     */
    gainSkillProficiency(skillId, amount) {
        if (!this.skillProficiency[skillId]) {
            this.skillProficiency[skillId] = 0;
        }
        this.skillProficiency[skillId] += amount;
    }

    /**
     * 增加功法熟练度
     */
    gainManualProficiency(manualId, amount) {
        if (!this.manualProficiency[manualId]) {
            this.manualProficiency[manualId] = 0;
        }
        this.manualProficiency[manualId] += amount;
    }

    /**
     * 获取技能熟练度等级
     * @returns {object} { level, name, exp, nextExp, damageBonus, color, progress }
     */
    getSkillProficiencyInfo(skillId) {
        const exp = this.skillProficiency[skillId] || 0;
        return this.getProficiencyInfo(exp);
    }

    /**
     * 获取功法熟练度等级
     */
    getManualProficiencyInfo(manualId) {
        const exp = this.manualProficiency[manualId] || 0;
        return this.getProficiencyInfo(exp);
    }

    /**
     * 根据经验计算熟练度等级
     */
    getProficiencyInfo(exp) {
        let level = 0;
        for (let i = PROFICIENCY_LEVELS.length - 1; i >= 0; i--) {
            if (exp >= PROFICIENCY_LEVELS[i].exp) {
                level = i;
                break;
            }
        }
        const current = PROFICIENCY_LEVELS[level];
        const next = PROFICIENCY_LEVELS[level + 1];
        const nextExp = next ? next.exp : current.exp;
        const progress = next ? Math.min(1, (exp - current.exp) / (nextExp - current.exp)) : 1;

        return {
            level: level,
            name: current.name,
            exp: exp,
            nextExp: nextExp,
            damageBonus: current.damageBonus,
            color: current.color,
            progress: progress
        };
    }

    /**
     * 获取技能最终伤害（含熟练度加成）
     */
    getSkillFinalDamage(skillId, baseDamage) {
        const info = this.getSkillProficiencyInfo(skillId);
        return Math.floor(baseDamage * info.damageBonus);
    }

    /**
     * 战斗中使用技能，增加熟练度
     */
    useSkillInBattle(skillId) {
        // 增加技能熟练度
        const gain = Phaser.Math.Between(PROFICIENCY_GAIN.min, PROFICIENCY_GAIN.max);
        this.gainSkillProficiency(skillId, gain);

        // 增加当前功法熟练度（一半）
        this.gainManualProficiency(this.manual, Math.ceil(gain / 2));

        return gain;
    }

    /**
     * 学习新功法
     */
    learnManual(manualId) {
        if (!CULTIVATION_MANUALS[manualId]) return false;
        if (!this.learnedManuals.includes(manualId)) {
            this.learnedManuals.push(manualId);
            this.manualProficiency[manualId] = 0;
            // 学习功法的技能
            const manual = CULTIVATION_MANUALS[manualId];
            manual.skills.forEach(s => {
                if (!this.skills.includes(s)) {
                    this.skills.push(s);
                    this.skillProficiency[s] = 0;
                }
            });
            console.log(`[功法] 学会了 ${manual.name}`);
            return true;
        }
        return false;
    }

    /**
     * 切换功法
     */
    switchManual(manualId) {
        if (!this.learnedManuals.includes(manualId)) return false;
        this.manual = manualId;
        console.log(`[功法] 切换为 ${CULTIVATION_MANUALS[manualId].name}`);
        return true;
    }

    /**
     * 【新增】计算最大技能槽位（基础4 + 被动功法加成）
     * 空间寂灭神通：第一层+2，第二层+3，第三层+4
     */
    getMaxSkillSlots() {
        let maxSlots = this.maxEquippedSkills;  // 基础4个
        // 遍历已学习的功法，找到被动功法，累加额外技能槽位
        this.learnedManuals.forEach(manualId => {
            const manual = CULTIVATION_MANUALS[manualId];
            if (manual && manual.isPassive && manual.bonuses && manual.bonuses.extraSkillSlots) {
                // 目前功法等级默认1级，后续加工法等级系统
                const level = this.manualLevels ? (this.manualLevels[manualId] || 1) : 1;
                const extra = manual.bonuses.extraSkillSlots[level - 1] || 0;
                maxSlots += extra;
                console.log(`[被动技能] ${manual.name} 第${level}层，额外技能槽位 +${extra}`);
            }
        });
        return maxSlots;
    }

    /**
     * 【新增】从储物戒里的秘籍物品学习功法
     * @param {string} itemId - 秘籍物品ID
     * @returns {object} {success, message}
     */
    learnManualFromItem(itemId) {
        const item = ITEMS[itemId];
        if (!item) {
            return { success: false, message: '物品不存在' };
        }
        if (item.type !== 'manual') {
            return { success: false, message: '这不是功法秘籍' };
        }
        const manualId = item.manualId;
        if (!manualId || !CULTIVATION_MANUALS[manualId]) {
            return { success: false, message: '秘籍对应的功法不存在' };
        }
        if (this.learnedManuals.includes(manualId)) {
            return { success: false, message: `你已经学会了${CULTIVATION_MANUALS[manualId].name}` };
        }

        // 学习功法
        const learned = this.learnManual(manualId);
        if (learned) {
            // 从储物戒移除一个秘籍
            this.inventory.removeItem(itemId, 1);
            const manual = CULTIVATION_MANUALS[manualId];
            let msg = `学会了${manual.name}！`;
            // 如果是被动功法，提示额外效果
            if (manual.isPassive) {
                const newMaxSlots = this.getMaxSkillSlots();
                msg += `\n被动效果：技能槽位增加，当前最多可装备${newMaxSlots}个技能`;
            }
            console.log(`[秘籍学习] ${msg}`);
            return { success: true, message: msg };
        } else {
            return { success: false, message: '学习失败' };
        }
    }

    /**
     * 获取当前功法可用的技能列表
     */
    getAvailableSkills() {
        const manual = CULTIVATION_MANUALS[this.manual];
        if (!manual) return this.skills;
        // 返回当前功法的技能（且玩家已学）
        return manual.skills.filter(s => this.skills.includes(s));
    }

    destroy() {
        this.container.destroy();
    }
}
