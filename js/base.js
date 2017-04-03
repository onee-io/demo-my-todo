/**
 * Created by VOREVER on 2017/2/28.
 */
;(function () {
    'use strict';

    var $form_add_task = $('.add-task');
    var $task_detail = $('.task-detail');
    var $task_detail_mask = $('.task-detail-mask');
    var $form_update_task;
    var task_list = [];
    var $delete_task;
    var $detail_task;

    // 初始化task_list
    init();

    // 监听task提交事件
    $form_add_task.on('submit', on_add_task_submit);

    // 监听蒙版点击事件
    $task_detail_mask.on('click', hide_detail_and_mask);

    // 添加task触发事件
    function on_add_task_submit(e) {
        // 禁用默认行为
        e.preventDefault();
        var new_task = {};
        // 获取新的task
        var $input = $(this).find('input[name=content]')
        new_task.content = $input.val();
        // 如果为空，直接返回
        if (!new_task.content) return;
        // 存入新的task
        if (add_task(new_task)) {
            render_task_list();
            $input.val(null);
        }
    }

    // 添加task
    function add_task(task) {
        // 将新的task推入list
        task_list.push(task);
        // 刷新View
        refresh_task_tpl();
        return true;
    }

    // 添加任务的各种监听事件
    function listen_task() {
        // 点击删除按钮
        $delete_task.on('click', function (e) {
            var $this = $(this);
            var $item = $this.parent().parent();
            var index = $item.data('index');
            // console.log('index', index);
            var tmp = confirm('确定删除？');
            if (tmp) {
                delete_task(index);
            }
        });
        // 双击任务事件
        $('.task-item').on('dblclick', function () {
           var index = $(this).data('index');
            show_detail_and_mask(index);
            render_task_detail(index);
        });
        // 点击详情按钮
        $detail_task.on('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            var $this = $(this);
            var $item = $this.parent().parent();
            var index = $item.data('index');
            show_detail_and_mask(index);
            render_task_detail(index);
        });
        // 监听checked点击事件
        $('.complete').on('click', function () {
            // 选中当前task
            var $task = $(this).parent().parent();
            var index = $task.data('index');
            // 添加isComplete标记
            if (task_list[index].isComplete === true) {
                task_list[index].isComplete = false;
            } else {
                task_list[index].isComplete = true;
            }
            update_task(index, task_list[index]);
        });
    }

    // 显示详情及蒙版
    function show_detail_and_mask(index) {
        $task_detail.show();
        $task_detail_mask.show();
    }

    // 隐藏详情及蒙版
    function hide_detail_and_mask() {
        // console.log('1', 1);
        $task_detail.hide();
        $task_detail_mask.hide();
    }

    // 删除task
    function delete_task(index) {
        // index不能存在直接返回
        if (index === undefined || !task_list[index]) return;
        delete task_list[index];
        refresh_task_tpl();
    }

    // 刷新View
    function refresh_task_tpl() {
        store.set('task_list', task_list);
        render_task_list();
    }

    // 初始化数据
    function init() {
        task_list = store.get('task_list') || [];
        if (task_list.length) {
            render_task_list();
            checkTask();
        }
    }

    // 检查任务是否到时间
    function checkTask() {
        // 当前时间
        var currentTime;
        setInterval(function () {
            // 循环遍历所有任务时间
            for (var i = 0; i < task_list.length; i++) {
                // 没有此任务 或 没设置时间 或 已经提醒过了
                if (!task_list[i] || !task_list[i].remind_data || task_list[i].noticed) continue;
                currentTime = new Date().getTime();
                var taskTime = new Date(task_list[i].remind_data).getTime();
                if (currentTime - taskTime >= 1) {
                    task_list[i].noticed = true;
                    update_task(i, task_list[i])
                    showMessage(task_list[i].content);
                }
            }
        }, 300);
    }

    // 显示提示信息
    function showMessage(message) {
        // TODO: 自定义alert
        alert(message);
    }

    // 渲染task_list
    function render_task_list() {
        var $task_list = $('.task-list');
        // 清空html
        $task_list.html(null);
        for (var i = 0; i < task_list.length; i ++) {
            if (task_list[i] === null) continue;
            var $task = render_task_item(task_list[i], i);
            if (task_list[i].isComplete === true) {
                $task_list.append($task);
            } else {
                $task_list.prepend($task);
            }
        }
        $delete_task = $('.action.delete');
        $detail_task = $('.action.detail');
        // 添加监听事件
        listen_task();
    }

    // 生成单个item
    function render_task_item(data, index) {
        if (data == null || index == null) return;
        var list_item_tpl =
            '<form><div class="task-item ' + (data.isComplete? "completed" : "") + '" data-index="' + index + '">' +
            '<span><input type="checkbox" ' + (data.isComplete? "checked" : "") + ' class="complete"></span>' +
            '<span class="task-content">' + data.content + '</span>' +
            '<span class="fr">' +
            '<span class="action delete"> 删除</span>' +
            '<span class="action detail"> 详细</span>' +
            '</span>' +
            '</div></form>';
        return $(list_item_tpl);
    }

    // 渲染详情View
    function render_task_detail(index) {
        if (index === undefined || task_list[index] == null) return;
        var data = task_list[index];
        var tpl =
            '<form>' +
            '<div class="task-content" name="detail-content" style="margin: 10px 0">' +
            data.content +
            '</div>' +
            '<input style="display: none;margin: 10px 0" type="text" name="new_content" value="' + data.content + '"></input>' +
            '<div class="description">' +
            '<textarea name="description" style="height: 200px">' + (data.description || '') + '</textarea>' +
            '</div>' +
            '<div class="remind">' +
            '<input id="remind-date" name="remind_data" type="text" value="' + (data.remind_data || '') + '">' +
            '</div>' +
            '<div>' +
            '<button class="update-task" type="submit">更新</button>' +
            '</div></form>'
            ;
        $task_detail.html(null);
        $task_detail.html(tpl);
        $form_update_task = $('.task-detail').find('form');
        // 使用datepicker插件
        $('#remind-date').datetimepicker();
        // 监听更新按钮提交事件
        $form_update_task.on('submit', function (e) {
            e.preventDefault();
            e.stopPropagation();
            var new_data = {};
            new_data.content = $(this).find('[name = new_content]').val();
            new_data.description = $(this).find('[name = description]').val();
            new_data.remind_data = $(this).find('[name = remind_data]').val();
            update_task(index, new_data);
        });
        // 监听任务名的双击事件
        $('[name=detail-content]').on('dblclick', function () {
            $('[name=detail-content ]').hide();
            $('[name=new_content]').show();
            $('[name=new_content]').focus();
        });
    }

    // 更新task
    function update_task(index, data) {
        if (index === undefined || task_list[index] == null) return;
        task_list[index] = data;
        hide_detail_and_mask();
        refresh_task_tpl();
    }

})();