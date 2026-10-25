/**
 * ============================================================
 *  constants.js —— 全局常量配置
 * ============================================================
 *  【这是什么？】
 *  这里放所有"固定不变的数字和颜色"。
 *  比如屏幕多大、角色跑多快、血条是什么颜色。
 *
 *  【为什么要放这里？】
 *  以后你想改游戏参数，不用翻遍整个代码找数字，
 *  只需要改这一个文件就行。
 *
 *  【怎么用？】
 *  在其他文件里直接写 GAME_WIDTH、PLAYER_SPEED 这样用。
 */

// ---------- 屏幕尺寸 ----------
// 游戏窗口大小（像素）
const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

// ---------- 玩家 ----------
// 角色移动速度（像素/秒）
const PLAYER_SPEED = 200;
// 角色半径（因为现在先用圆形代替角色）
const PLAYER_RADIUS = 16;

// ---------- 初始属性（练气期） ----------
const INITIAL_STATS = {
    hp: 100,          // 初始气血
    maxHp: 100,       // 气血上限
    qi: 5,            // 初始灵气（先设为5，后面再改）
    maxQi: 5,         // 灵气上限
    lifespan: 100,    // 初始寿元（100岁）
    exp: 0,           // 初始修为
    expToLevelUp: 100 // 升下一层需要的修为
};

// ---------- 寿元消耗 ----------
const LIFESPAN_COST = {
    breakthrough: 10,  // 突破境界消耗10年寿元
    trainingPerSecond: 0.01  // 练功台每秒消耗0.01年寿元
};

// ---------- 颜色（水墨风配色） ----------
// 用十六进制颜色值，比如 0xff0000 是红色
const COLORS = {
    // 宣纸底色（暖米白）
    PAPER: 0xf5f0e1,
    // 淡墨色
    INK_LIGHT: 0x8b8680,
    // 中墨色
    INK_MID: 0x4a4a4a,
    // 浓墨色
    INK_DARK: 0x1a1a1a,
    // 朱砂红（印章、血条用）
    CINNABAR: 0xc44536,
    // 石青（灵气、水系用）
    AZURE: 0x3a6b8c,
    // 泥金（法宝、贵重物品用）
    GOLD: 0xc9a84c,
    // 玉色（治疗、生机用）
    JADE: 0x5a8c6e
};

// ---------- 境界系统 ----------
// 修仙境界列表（先做到金丹）
const REALMS = [
    { name: "炼气期", level: 1 },
    { name: "筑基期", level: 2 },
    { name: "金丹期", level: 3 }
];

// ---------- 技能系统 ----------
// 技能数据：name 名字，cost 耗灵气，damage 伤害，type 类型，effect 特效
// 初始灵气只有5点，所以技能消耗从1到5合理安排
const SKILLS = {
    // ===== 练气功法技能 =====
    slash: {
        name: "斩击",
        cost: 1,               // 耗1点灵气（最低，普攻级）
        damage: 10,            // 造成10点伤害
        description: "挥剑斩击敌人，造成一定伤害。",
        effect: "slash",       // 特效类型：刀光
        color: 0xcccccc
    },
    // ===== 烈火功技能 =====
    fireball: {
        name: "火球术",
        cost: 3,               // 耗3点灵气（中等级）
        damage: 25,            // 造成25点伤害
        description: "凝聚灵气化为火球，造成较高伤害。",
        effect: "fireball",    // 特效类型：火球
        color: 0xff6600
    },
    // ===== 御剑术技能 =====
    sword_qi: {
        name: "剑气",
        cost: 2,               // 耗2点灵气
        damage: 18,            // 造成18点伤害
        description: "以气御剑，发出一道凌厉剑气。",
        effect: "sword_qi",    // 特效类型：剑气
        color: 0xd4af37
    },
    ten_thousand_swords: {
        name: "万剑归宗",
        cost: 5,               // 耗5点灵气（大招，满灵气才能放）
        damage: 45,            // 造成45点伤害
        description: "万剑齐发，笼罩敌人，造成巨大伤害。",
        effect: "ten_thousand_swords",  // 特效类型：万剑
        color: 0xffd700
    },
    // ===== 玄冰功技能 =====
    ice_spike: {
        name: "冰刺",
        cost: 2,               // 耗2点灵气
        damage: 20,            // 造成20点伤害
        description: "凝聚寒气化为冰刺，刺穿敌人。",
        effect: "ice_spike",   // 特效类型：冰刺
        color: 0x87ceeb
    },
    ice_lock: {
        name: "冰封",
        cost: 4,               // 耗4点灵气
        damage: 30,            // 造成30点伤害
        description: "寒气爆发，冰封敌人，造成较高伤害。",
        effect: "ice_lock",    // 特效类型：冰封
        color: 0x00bfff
    },
    // ===== 雷法技能 =====
    thunder_strike: {
        name: "雷击",
        cost: 3,               // 耗3点灵气
        damage: 28,            // 造成28点伤害
        description: "召唤天雷劈向敌人，造成较高伤害。",
        effect: "thunder",     // 特效类型：雷击
        color: 0x9932cc
    },
    five_thunders: {
        name: "五雷轰顶",
        cost: 5,               // 耗5点灵气（大招）
        damage: 100,           // 造成100点伤害（最高伤害）
        description: "五雷齐发，轰杀敌人，造成毁灭性伤害。",
        effect: "five_thunders",  // 特效类型：五雷
        color: 0x8a2be2
    },
    // ===== 青木功技能 =====
    vine_whip: {
        name: "缠绕术",
        cost: 2,               // 耗2点灵气
        damage: 15,            // 造成15点伤害
        description: "召唤藤蔓缠绕敌人，造成伤害。",
        effect: "vine",        // 特效类型：藤蔓
        color: 0x228b22
    },
    heal: {
        name: "治愈术",
        cost: 3,               // 耗3点灵气
        damage: -30,           // 负数表示恢复气血（恢复30点）
        description: "木系生机之力，恢复自身30点气血。",
        effect: "heal",        // 特效类型：治愈
        color: 0x32cd32
    }
};

// ---------- 功法系统 ----------
// 功法决定能修到哪个境界、能学哪些技能、以及各种加成
// skills 字段：修炼此功法后可以使用的技能列表
// grade: 1凡品 2良品 3上品 4极品 5仙品 6神品
const CULTIVATION_MANUALS = {
    qi_refining: {
        name: "炼气功法",
        maxRealm: "炼气期",
        grade: 2,           // 良品
        type: "基础类",
        description: "青云宗最基础的入门功法，引天地灵气入体，淬炼经脉，是所有修士的必修课。虽然威力平平，但胜在根基扎实，修炼速度快。",
        skills: ["slash"],           // 只有斩击
        bonuses: {}
    },
    fire_art: {
        name: "烈火功",
        maxRealm: "炼气期",
        grade: 3,           // 上品
        type: "火系攻击",
        description: "火系攻击功法，凝聚灵气化为烈焰，威力强大。修炼后可释放火球术，对敌人造成大量火焰伤害。传说修炼至大成可召唤焚天烈焰，烧尽一切。",
        skills: ["slash", "fireball"],  // 斩击+火球术
        bonuses: { fireballDamage: 1.5 }
    },
    wood_art: {
        name: "青木功",
        maxRealm: "炼气期",
        grade: 3,           // 上品
        type: "木系辅助",
        description: "木系功法，生机盎然。修炼后种田收获额外增加，可使用缠绕术束缚敌人，以及治愈术恢复自身气血。是喜欢种田养生的修士的首选功法。",
        skills: ["slash", "vine_whip", "heal"],  // 斩击+缠绕+治愈
        bonuses: { farmBonus: 1 }
    },
    sword_art: {
        name: "御剑术",
        maxRealm: "炼气期",
        grade: 4,           // 极品
        type: "剑修攻击",
        description: "剑修功法，以气御剑，万剑归宗。修炼后斩击伤害提升，可使用剑气远程攻击，以及大招万剑归宗。是追求极致攻击力的剑修的不二之选。",
        skills: ["slash", "sword_qi", "ten_thousand_swords"],  // 斩击+剑气+万剑
        bonuses: { slashDamage: 1.2 }
    },
    ice_art: {
        name: "玄冰功",
        maxRealm: "炼气期",
        grade: 4,           // 极品
        type: "冰系控制",
        description: "冰系功法，寒气逼人，冻结万物。修炼后可使用冰刺刺穿敌人，以及大招冰封将敌人冻结。冰系功法攻守兼备，控制能力极强。",
        skills: ["slash", "ice_spike", "ice_lock"],  // 斩击+冰刺+冰封
        bonuses: {}
    },
    thunder_art: {
        name: "天雷功法",
        maxRealm: "炼气期",
        grade: 5,           // 仙品
        type: "雷系爆发",
        description: "雷系顶级功法，引天雷入体，威力惊人，修炼难度极高。修炼后可召唤天雷劈向敌人，以及大招五雷轰顶造成毁灭性伤害。是青云宗镇宗功法之一，非天资卓越者不可修炼。",
        skills: ["slash", "thunder_strike", "five_thunders"],  // 斩击+雷击+五雷
        bonuses: {}
    },
    space_annihilation: {
        name: "空间寂灭神通",
        maxRealm: "无上限",
        grade: 6,           // 神品
        type: "空间被动",
        description: "上古失传的空间神通，修炼后可扩展神识空间，携带更多技能。共三层：第一层多带2个技能，第二层多带3个，第三层多带4个。被动生效，无需装备，无需消耗灵气。",
        skills: [],  // 被动技能，没有主动技能
        bonuses: { extraSkillSlots: [2, 3, 4] },  // 每层额外技能槽位
        isPassive: true,  // 被动技能
        maxLevel: 3  // 共三层
    }
};

// ---------- 物品品级配置 ----------
// 红橙黄蓝绿白 六个等级
const ITEM_QUALITY = {
    1: { name: "普通", color: 0xffffff, colorHex: "#ffffff" },      // 白
    2: { name: "优秀", color: 0x4ade80, colorHex: "#4ade80" },      // 绿
    3: { name: "精良", color: 0x60a5fa, colorHex: "#60a5fa" },      // 蓝
    4: { name: "史诗", color: 0xfacc15, colorHex: "#facc15" },      // 黄
    5: { name: "传说", color: 0xfb923c, colorHex: "#fb923c" },      // 橙
    6: { name: "神器", color: 0xef4444, colorHex: "#ef4444" }       // 红
};

// ---------- 功法/技能熟练度系统 ----------
// 熟练度分4个境界，使用技能增加熟练度，熟练度提升技能伤害
const PROFICIENCY_LEVELS = [
    { name: "入门", exp: 0, damageBonus: 1.0, color: "#999" },        // 0%加成
    { name: "小成", exp: 100, damageBonus: 1.1, color: "#4ade80" },    // 10%加成
    { name: "大成", exp: 300, damageBonus: 1.25, color: "#60a5fa" },   // 25%加成
    { name: "圆满", exp: 600, damageBonus: 1.5, color: "#facc15" }     // 50%加成
];

// 每次使用技能增加的熟练度范围
const PROFICIENCY_GAIN = { min: 1, max: 3 };

// ---------- 物品数据库 ----------
// 所有物品定义在这里：id、名字、类型、描述、品级、图标
// quality: 1白 2绿 3蓝 4黄 5橙 6红
// icon: 图标图片key（icon_pelt兽皮/icon_core内丹/icon_stone灵石/icon_herb药材/icon_fang尖牙）
const ITEMS = {
    // ===== 种田收获（白色普通） =====
    ling_cao: {
        id: "ling_cao",
        name: "灵草",
        type: "material",
        description: "最基础的灵草，可入药或炼器。",
        quality: 2,
        icon: "item_lingcao",
        color: 0x5a8c3a
    },
    ling_dao: {
        id: "ling_dao",
        name: "灵稻",
        type: "material",
        description: "蕴含灵气的稻米，可食用恢复少量气血。",
        quality: 2,
        icon: "item_lingdao",
        color: 0xc9a84c
    },
    ling_cha: {
        id: "ling_cha",
        name: "灵茶",
        type: "material",
        description: "灵气充沛的茶叶，可泡茶恢复灵气。",
        quality: 2,
        icon: "item_lingcha",
        color: 0x3a8c5a
    },

    // ===== 妖兽内丹（白色普通，练气期统一白色） =====
    low_core: {
        id: "low_core",
        name: "低级内丹",
        type: "material",
        description: "练气期妖兽体内凝结的内丹，蕴含少量灵气，可入药或炼器。",
        quality: 1,
        icon: "icon_core",
        color: 0x88ccaa
    },

    // ===== 野兔妖掉落（白色普通） =====
    rabbit_pelt: {
        id: "rabbit_pelt",
        name: "兔毛",
        type: "material",
        description: "野兔的柔软皮毛，可用于炼器或制衣。",
        quality: 1,
        icon: "icon_pelt",
        color: 0xd2b48c
    },
    rabbit_meat: {
        id: "rabbit_meat",
        name: "兔肉",
        type: "material",
        description: "鲜美的兔肉，可食用恢复气血。",
        quality: 1,
        icon: "icon_herb",
        color: 0xcd5c5c
    },

    // ===== 毒蛇妖掉落（白色普通） =====
    snake_skin: {
        id: "snake_skin",
        name: "蛇皮",
        type: "material",
        description: "毒蛇的鳞片皮，炼器材料。",
        quality: 1,
        icon: "icon_pelt",
        color: 0x556b2f
    },
    snake_gall: {
        id: "snake_gall",
        name: "蛇胆",
        type: "material",
        description: "毒蛇的胆囊，珍贵药材。",
        quality: 1,
        icon: "icon_herb",
        color: 0x228b22
    },

    // ===== 野狼妖掉落（白色普通） =====
    wolf_pelt: {
        id: "wolf_pelt",
        name: "野狼皮",
        type: "material",
        description: "野狼的皮毛，可用于炼器或制衣。",
        quality: 1,
        icon: "icon_pelt",
        color: 0x8b4513
    },
    wolf_tooth: {
        id: "wolf_tooth",
        name: "野狼牙",
        type: "material",
        description: "野狼的尖牙，炼器材料。",
        quality: 1,
        icon: "icon_fang",
        color: 0xf5f0e1
    },

    // ===== 山贼掉落（绿色优秀） =====
    bandit_coin: {
        id: "bandit_coin",
        name: "铜钱",
        type: "material",
        description: "山贼搜刮的铜钱，可在坊市使用。",
        quality: 2,
        icon: "icon_stone",
        color: 0xb8860b
    },
    iron_sword: {
        id: "iron_sword",
        name: "铁剑",
        type: "material",
        description: "山贼使用的铁剑，可用于炼器。",
        quality: 2,
        icon: "icon_fang",
        color: 0x708090
    },

    // ===== 黑熊妖掉落（白色普通） =====
    bear_gall: {
        id: "bear_gall",
        name: "熊胆",
        type: "material",
        description: "黑熊的胆囊，珍贵药材，价值不菲。",
        quality: 1,
        icon: "icon_herb",
        color: 0x8b4513
    },
    bear_paw: {
        id: "bear_paw",
        name: "熊掌",
        type: "material",
        description: "黑熊的脚掌，珍贵食材。",
        quality: 1,
        icon: "icon_herb",
        color: 0x654321
    },

    // ===== 狼王BOSS掉落（白色普通，练气期统一白色） =====
    wolf_king_pelt: {
        id: "wolf_king_pelt",
        name: "狼王皮",
        type: "material",
        description: "狼王的皮毛，极为珍贵，可炼制高级防具。",
        quality: 1,
        icon: "icon_pelt",
        color: 0x4a4a4a
    },
    wolf_king_tooth: {
        id: "wolf_king_tooth",
        name: "狼王牙",
        type: "material",
        description: "狼王的尖牙，可炼制高级武器。",
        quality: 1,
        icon: "icon_fang",
        color: 0xf5f0e1
    },

    // ===== 灵石（绿色优秀，货币类物品，可叠加10w） =====
    spirit_stone: {
        id: "spirit_stone",
        name: "灵石",
        type: "currency",
        description: "蕴含灵气的石头，修仙界通用货币。可在珍宝阁购买丹药等物品。",
        quality: 2,
        icon: "spirit_stone",
        color: 0x00ced1,
        maxStack: 100000  // 货币类物品可叠加10w
    },

    // ===== 技能书（蓝色精良/黄色史诗） =====
    fireball_scroll: {
        id: "fireball_scroll",
        name: "火球术卷轴",
        type: "skill_book",
        description: "使用后学会火球术。",
        quality: 3,
        icon: "icon_herb",
        color: 0xc44536,
        skill: "fireball"
    },
    sword_manual: {
        id: "sword_manual",
        name: "御剑术秘籍",
        type: "skill_book",
        description: "使用后学会御剑术（剑气+万剑归宗）。",
        quality: 4,
        icon: "icon_herb",
        color: 0xd4af37,
        skill: "sword_qi"
    },

    // ===== 丹药（可在战斗中使用） =====
    heal_pill: {
        id: "heal_pill",
        name: "回春丹",
        type: "pill",
        description: "以灵草炼制的丹药，服用后恢复50点气血。",
        quality: 2,
        icon: "heal_pill",
        color: 0xe57373,
        effect: { hp: 50, qi: 0 }  // 恢复50气血
    },
    qi_pill: {
        id: "qi_pill",
        name: "聚气丹",
        type: "pill",
        description: "凝聚灵气的丹药，服用后恢复3点灵气。",
        quality: 3,
        icon: "qi_pill",
        color: 0x64b5f6,
        effect: { hp: 0, qi: 3 }  // 恢复3灵气
    },
    spirit_pill: {
        id: "spirit_pill",
        name: "凝神丹",
        type: "pill",
        description: "珍贵的丹药，服用后恢复30点气血和2点灵气。",
        quality: 4,
        icon: "spirit_pill",
        color: 0xba68c8,
        effect: { hp: 30, qi: 2 }  // 恢复30气血+2灵气
    },

    // ===== 悟道丹（增加修为） =====
    wudao_pill: {
        id: "wudao_pill",
        name: "悟道丹",
        type: "cultivation_pill",
        description: "以珍稀灵药炼制的悟道丹药，服用后可增加100点人物修为，辅助修炼突破境界。",
        quality: 5,
        icon: "wudao_pill",
        color: 0xff8c00,
        effect: { cultivation: 100 }  // 增加100修为
    },

    // ===== 狼王内丹（蓝色品质，boss掉落） =====
    wolf_king_core: {
        id: "wolf_king_core",
        name: "狼王内丹",
        type: "material",
        description: "狼王毕生修为凝聚的内丹，蕴含强大的冰寒之力，是炼制高阶丹药的珍贵材料。",
        quality: 3,
        icon: "wolf_king_core",
        color: 0x64b5f6
    },

    // ===== 空间寂灭神通（秘籍，被动技能） =====
    space_annihilation_manual: {
        id: "space_annihilation_manual",
        name: "空间寂灭神通",
        type: "manual",
        description: "上古失传的空间神通秘籍，修炼后可扩展神识空间，携带更多技能。共三层：第一层多带2个技能，第二层多带3个，第三层多带4个。被动生效，无需装备。",
        quality: 5,
        icon: "space_annihilation_manual",
        color: 0xba68c8,
        manualId: "space_annihilation",
        isPassive: true
    }
};

// ---------- 怪物数据库 ----------
// 所有怪物定义在这里：id、名字、血量、攻击、掉落、经验、图片
const MONSTERS = {
    rabbit_demon: {
        id: "rabbit_demon",
        name: "野兔妖",
        hp: 30,              // 血量
        attack: 5,           // 攻击力
        defense: 0,          // 防御力
        exp: 10,             // 击杀经验
        description: "最弱小的妖怪，成精的野兔，适合新手练手。",
        drops: [             // 掉落表：{物品id, 数量, 概率}
            { item: "rabbit_pelt", amount: 1, chance: 1.0 },
            { item: "rabbit_meat", amount: 1, chance: 0.5 },
            { item: "low_core", amount: 1, chance: 0.3 },
            { item: "spirit_stone", amount: 100, chance: 0.1 }
        ],
        imageKey: "monster_rabbit",   // 图片资源key
        scale: 0.35                    // 显示缩放
    },
    snake_demon: {
        id: "snake_demon",
        name: "毒蛇妖",
        hp: 45,
        attack: 8,
        defense: 1,
        exp: 15,
        description: "有毒的蛇妖，攻击较高，需要小心。",
        drops: [
            { item: "snake_skin", amount: 1, chance: 1.0 },
            { item: "snake_gall", amount: 1, chance: 0.4 },
            { item: "low_core", amount: 1, chance: 0.35 },
            { item: "spirit_stone", amount: 100, chance: 0.15 }
        ],
        imageKey: "monster_snake",
        scale: 0.35
    },
    wolf_demon: {
        id: "wolf_demon",
        name: "野狼妖",
        hp: 60,
        attack: 12,
        defense: 2,
        exp: 20,
        description: "凶猛的野狼成精，攻守均衡，常见的妖怪。",
        drops: [
            { item: "wolf_pelt", amount: 1, chance: 1.0 },
            { item: "wolf_tooth", amount: 1, chance: 0.5 },
            { item: "low_core", amount: 1, chance: 0.4 },
            { item: "spirit_stone", amount: 100, chance: 0.2 }
        ],
        imageKey: "monster_wolf",
        scale: 0.4
    },
    bandit: {
        id: "bandit",
        name: "山贼",
        hp: 80,
        attack: 15,
        defense: 3,
        exp: 25,
        description: "占山为王的人类山贼，会使用武器，比较难对付。",
        drops: [
            { item: "spirit_stone", amount: 100, chance: 1.0 },
            { item: "spirit_stone", amount: 100, chance: 0.3 },
            { item: "bandit_coin", amount: 3, chance: 0.7 },
            { item: "iron_sword", amount: 1, chance: 0.3 }
        ],
        imageKey: "monster_bandit",
        scale: 0.4
    },
    bear_demon: {
        id: "bear_demon",
        name: "黑熊妖",
        hp: 120,
        attack: 20,
        defense: 5,
        exp: 40,
        description: "力大无穷的黑熊成精，血厚攻高，高级妖怪。",
        drops: [
            { item: "bear_gall", amount: 1, chance: 1.0 },
            { item: "bear_paw", amount: 1, chance: 0.4 },
            { item: "low_core", amount: 1, chance: 0.5 },
            { item: "spirit_stone", amount: 100, chance: 0.4 }
        ],
        imageKey: "monster_bear",
        scale: 0.45
    },
    wolf_king: {
        id: "wolf_king",
        name: "狼王（BOSS）",
        hp: 200,
        attack: 25,
        defense: 8,
        exp: 100,
        description: "狼群之王，强大的BOSS级妖怪，掉落丰厚。",
        drops: [
            { item: "wolf_king_core", amount: 1, chance: 1.0 },           // 必掉：蓝色品质狼王内丹
            { item: "spirit_stone", amount: 10000, chance: 1.0 },         // 必掉：1w灵石
            { item: "space_annihilation_manual", amount: 1, chance: 0.5 } // 50%几率：空间寂灭神通秘籍
        ],
        imageKey: "monster_wolf_king",
        scale: 0.55,
        isBoss: true
    }
};

// ---------- 野外怪物刷新配置 ----------
// 大地图上的怪物点，每个点有什么怪、刷新时间
const WORLD_MONSTERS = [
    { id: "monster_1", x: 400, y: 300, monsterId: "rabbit_demon", respawnTime: 30000 },
    { id: "monster_2", x: 600, y: 250, monsterId: "rabbit_demon", respawnTime: 30000 },
    { id: "monster_3", x: 800, y: 350, monsterId: "snake_demon", respawnTime: 45000 },
    { id: "monster_4", x: 500, y: 450, monsterId: "wolf_demon", respawnTime: 60000 },
    { id: "monster_5", x: 900, y: 500, monsterId: "wolf_demon", respawnTime: 60000 },
    { id: "monster_6", x: 700, y: 550, monsterId: "bandit", respawnTime: 90000 },
    { id: "monster_7", x: 1000, y: 300, monsterId: "bear_demon", respawnTime: 120000 },
    { id: "monster_boss", x: 1100, y: 450, monsterId: "wolf_king", respawnTime: 300000 }
];

// ---------- 种子数据 ----------
const SEEDS = {
    ling_cao_seed: {
        name: "灵草种子",
        growTime: 5000,        // 5秒成熟
        harvest: "ling_cao",    // 收获物品
        amount: 1                // 收获数量
    },
    ling_dao_seed: {
        name: "灵稻种子",
        growTime: 10000,       // 10秒成熟
        harvest: "ling_dao",
        amount: 2
    },
    ling_cha_seed: {
        name: "灵茶种子",
        growTime: 15000,       // 15秒成熟
        harvest: "ling_cha",
        amount: 1
    }
};

// ---------- 等级经验系统 ----------
const LEVEL_SYSTEM = {
    baseExp: 100,              // 1级需要100经验
    expPerLevel: 100,          // 每级增加100
    maxLevel: 99,
    killExp: 20,               // 打怪给20经验
    farmExp: 5                 // 种田收获给5经验
};

// ---------- 炼器系统 ----------
const REFINING_SYSTEM = {
    maxLevel: 9,                // 炼器九层
    expPerLevel: 500,          // 每层需要500炼器经验
    craftExp: 100              // 每次打造给100经验
};

// ---------- 背包配置 ----------
const INVENTORY_CONFIG = {
    maxSlots: 50,               // 50格
    maxStack: 100000            // 每格最多叠10w个（货币类物品）
};

// ---------- 调试开关 ----------
// 设为 true 会显示碰撞框、帧率等调试信息
const DEBUG_MODE = true;
