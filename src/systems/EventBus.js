/**
 * ============================================================
 *  EventBus.js —— 全局事件总线
 * ============================================================
 *  【这是什么？】
 *  一个"广播站"。各个模块之间不用直接联系，
 *  通过它发消息、收消息。
 *
 *  【举个例子】
 *  玩家被打了 → Player 模块喊一句"玩家掉血了"
 *             → UI 模块听到后，自动把血条减少
 *
 *  【为什么要这样？】
 *  不用让 Player 和 UI 互相"认识"，改一边不会影响另一边。
 *  这就是"高内聚、低耦合"。
 *
 *  【怎么用？】
 *  发送消息：EventBus.emit('玩家掉血', 20)
 *  监听消息：EventBus.on('玩家掉血', (伤害) => { ... })
 */

class EventBusClass {
    constructor() {
        // 用一个对象来存所有监听者
        // 格式：{ '事件名': [回调函数1, 回调函数2, ...] }
        this.listeners = {};
    }

    /**
     * 监听一个事件
     * @param {string} eventName - 事件名称（自己起个好记的名字）
     * @param {function} callback - 收到消息时要执行的函数
     */
    on(eventName, callback) {
        // 如果这个事件还没有监听者列表，就新建一个
        if (!this.listeners[eventName]) {
            this.listeners[eventName] = [];
        }
        // 把回调函数加进去
        this.listeners[eventName].push(callback);
    }

    /**
     * 发送一个事件（触发所有监听者）
     * @param {string} eventName - 要发送的事件名称
     * @param {*} data - 要传递的数据（可以是数字、字符串、对象）
     */
    emit(eventName, data) {
        // 如果没有监听者，就不用发了
        if (!this.listeners[eventName]) return;

        // 遍历所有监听者，把数据传给它们
        this.listeners[eventName].forEach(callback => {
            callback(data);
        });
    }

    /**
     * 取消监听（暂时用不到，先留着）
     */
    off(eventName, callback) {
        if (!this.listeners[eventName]) return;
        this.listeners[eventName] = this.listeners[eventName].filter(
            cb => cb !== callback
        );
    }
}

// 创建一个全局唯一的事件总线实例
// 整个游戏都用这一个，不要重复创建
const EventBus = new EventBusClass();
