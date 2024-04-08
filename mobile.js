const utils = new (class {
    /**
     * @public
     * @method
     * @name isFunction
     * @description 判断传入的值是否是一个函数
     * @param {*} value 需要检测的值
     * @returns {boolean}
     */
    isFunction(value) {
        return Object.prototype.toString.call(value) === '[object Function]'
    }

    /**
     * @public
     * @function
     * @name $
     * @description 获取文档中与指定选择器或选择器组匹配的第一个 HTML 元素
     * @param {string} selectors 包含一个或多个要匹配的选择器的 DOM 字符串
     * @returns {Element | null} 如果找不到匹配项，则返回 null，否则返回对应的 Element
     */
    $(selectors) {
        return document.querySelector(selectors)
    }

    /**
     * @private
     * @method
     * @name _h
     * @description 创建由 tagName 指定的 HTML 元素
     * @param {string} tagName 指定要创建元素类型的字符串
     * @param {object} propMap 可选的，包含 class 等额外配置项
     * @param {string} text 可选的文字节点
     * @returns {Element | HTMLUnknownElement} 如果 tagName 不被识别，则创建一个 HTMLUnknownElement
     */
    h(tagName, propMap = {}, text) {
        const ele = document.createElement(tagName)
        Object.keys(propMap).forEach(prop => ele.setAttribute(prop, propMap[prop]))
        if (text) {
            ele.appendChild(document.createTextNode(text))
        }
        return ele
    }

    /**
     * @public
     * @function
     * @name bindEvents
     * @param {string} events 一个以空格分开的字符串，指定了要绑定的事件
     * @param {function} handler 事件监听器
     * @param {Element | undefined} element 可选的，绑定事件的元素
     * @returns {void}
     */
    bindEvents(events, handler, element = this.$('body')) {
        events.split(' ').forEach(event => {
            element.addEventListener(event, handler, false)
        })
    }

    /**
     * @public
     * @function
     * @name unbindEvents
     * @param {string} events 一个以空格分开的字符串，指定了要取消的事件
     * @param {function} handler 事件监听器
     * @param {Element | undefined} element 可选的，取消事件的元素
     * @returns {void}
     */
    unbindEvents(events, handler, element = this.$('body')) {
        events.split(' ').forEach(event => {
            element.removeEventListener(event, handler, false)
        })
    }

    /**
     * @public
     * @function
     * @name throttle
     * @description 对函数进行包装，避免高频率执行损耗性能
     * @param {function} method 需要执行函数
     * @param {object} context 函数执行时的上下文环境
     * @param {number} delay 时间，以毫秒计
     * @returns {function} 包装后的函数
     */
    throttle(method, context = {}, delay = 4, ...outParams) {
        function withThtottle(...innerParams) {
            clearTimeout(context.$$tId)
            function throttleCore() {
                method.apply(context, [...outParams, ...innerParams])
            }
            throttleCore.displayName = `throttleCore(${method.name})`
            // eslint-disable-next-line no-param-reassign
            context.$$tId = setTimeout(throttleCore, delay)
        }
        withThtottle.displayName = `withThtottle(${method.name})`
        return withThtottle
    }
})()

/**
 * Class implement slide verification.
 * @example
 * new SlideUnlock().init()
 */
// eslint-disable-next-line no-unused-vars

class SlideUnlock {
    /**
     * 初始化滑块，处理配置
     * @param {Element} el 挂载的元素
     * @param {object} options 配置项
     */
    constructor(el = 'body', options = {}) {
        this.$el = utils.$(el)
        this.$$isSuccess = false
        this.$options = {
            tip: '请按住滑块，拖动到最右边',
            unlockText: '验证成功',
            duration: 500,
            ...options
        }
    }

    /**
     * @public
     * @method
     * @name init
     * @description 创建滑块的 DOM 结构，并添加鼠标在滑块上按下的监听器
     * @returns {void}
     */
    init() {
        this.$$root = utils.h('div', { class: 'slide-track' })
        this.$$bg = this.$$root.appendChild(utils.h('div', { class: 'slide-bg' }))
        this.$$block = this.$$root.appendChild(
            utils.h('div', { class: 'slide-block' })
        )
        this.$$text = this.$$root.appendChild(
            utils.h('p', { class: 'slide-text' }, this.$options.tip)
        )
        this.$el.insertBefore(this.$$root, this.$el.firstChild)
        this._bindEvents()
    }

    /**
     * @private
     * @method
     * @name _bindEvents
     * @description 绑定鼠标的按下和松开事件
     * @returns {void}
     */
    _bindEvents() {
        utils.bindEvents(
            'mousedown touchstart',
            (this.$$handleMouseDown = this._handleMouseDown.bind(this)),
            this.$$block
        )
        utils.bindEvents(
            'mouseup touchend',
            (this.$$handleMouseUp = this._handleMouseUp.bind(this)),
            document
        )
    }

    /**
     * @private
     * @method
     * @name _handleMouseDown
     * @description 滑块上鼠标按下的监听器，主要记录鼠标的横坐标并指定滑块滑动的监听器
     * @param {MouseEvent} e 一个基于 Event 的对象
     * @returns {void}
     */
    _handleMouseDown(e) {
        const eve = e || window.e
        const downx = eve.clientX || e.changedTouches[0].clientX

        if (e.cancelable) {
            e.preventDefault() // 阻止默认行为
        }

        if (this.$$isSuccess) {
            return
        }

        // 取消在手动滑动过程中的动画效果
        this.$$bg.style.transition = ''
        this.$$block.style.transition = ''

        utils.bindEvents(
            'mousemove touchmove',
            (this.$$handleMouseMove = utils.throttle(
                this._handleMouseMove,
                this,
                undefined,
                downx
            )),
            document
        )
    }

    /**
     * @private
     * @method
     * @name _handleMouseMove
     * @description 滑块滑动的监听器，主要更新滑块位置和背景元素的宽度
     * @param {MouseEvent} e 一个基于 Event 的对象
     * @returns {void}
     */
    _handleMouseMove(downx, e) {
        const info = this.$$block.getBoundingClientRect()
        const x = e.clientX || e.changedTouches[0].clientX
        const y = e.clientY
        const x1 = info.left
        const y1 = info.top
        const x2 = info.right
        const y2 = info.bottom
        const moveX = x - downx

        if (this.$$isSuccess) {
            return
        }
        if (moveX < 0) {
            return
        }
        if (x < x1 || x > x2 || y < y1 || y > y2) {
            // 当鼠标移开滑块时取消移动
            return
        }

        this.$$block.style.left = `${moveX}px`
        this.$$bg.style.width = `${moveX}px`

        if (moveX >= this.$$root.offsetWidth + x1 - x2) {
            this.$$isSuccess = true
            this.$$text.textContent = this.$options.unlockText
            this.$$text.style.cssText = `color: #fff; left: 0; right: ${this.$$block.offsetWidth}px;`
            this.$$block.classList.add('success')
            if (utils.isFunction(this.$options.cb)) {
                // 为了避免阻塞成功提示界面的渲染，你可以设置两百毫秒左右的延迟
                this.$options.cb.call(this)
            }
        }
    }

    /**
     * @private
     * @method
     * @name _handleMouseUp
     * @description 鼠标松开的监听器，主要用于重置
     * @param {MouseEvent} e 一个基于 Event 的对象
     * @returns {void}
     */
    _handleMouseUp() {
        clearTimeout(this.$$tId)
        utils.unbindEvents(
            'mousemove touchmove',
            this.$$handleMouseMove,
            this.$$block
        )

        if (this.$$isSuccess) {
            utils.unbindEvents('mouseup touchend', this.$$handleMouseUp, document)
            utils.unbindEvents(
                'mousedown touchstart',
                this.$$handleMouseDown,
                this.$$block
            )
            return
        }

        // 给重置过程添加动画效果
        this.$$bg.style.cssText = `transition: width ${this.$options.duration}ms ease; width: 0;`
        this.$$block.style.cssText = `transition: left ${this.$options.duration}ms ease; left: 0;`
    }

    /**
     * @public
     * @method
     * @name isSuccess
     * @description 返回当前滑块的状态
     * @returns {boolean}
     */
    isSuccess() {
        return this.$$isSuccess
    }

    /**
     * @public
     * @method
     * @name reset
     * @description 重置滑块的状态
     * @returns {void}
     */
    reset() {
        if (!this.$$isSuccess) {
            return
        }
        this.$$isSuccess = false
        this.$$bg.style.cssText = `transition: width ${this.$options.duration}ms ease; width: 0;`
        this.$$block.style.cssText = `transition: left ${this.$options.duration}ms ease; left: 0;`
        this.$$text.style.cssText = `color: #5f5f5f; left: ${this.$$block.offsetWidth}px; right: 0;`
        this.$$text.textContent = this.$options.tip
        this.$$block.classList.remove('success')
        this._bindEvents()
    }
}



// Initialize the slide verification
// Initialize the slide verification
// Initialize the slide verification
new SlideUnlock('#slide-container', {
    cb: function () {
        // Capture 'this' reference
        var self = this;
        setTimeout(() => {
            document.getElementById('slide-container').style.display = 'none';

            document.getElementById('content').style.display = 'block';
            // Hide the slide block after verification
        }, 200);
    }
}).init();

