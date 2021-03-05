layui.define(['table', 'layer', 'form'], function (exports) {
    "use strict";

    function gpInfo(mktNum, code, type, number, costPrice) {
        this.mktNum = mktNum;//1=上证 0=深证
        this.code = code;//股票代码
        this.name = '';//股票名称
        this.price = 0;//价格
        this.change = 0;//涨幅/跌幅
        this.changePercent = 0;//涨幅
        this.type = type;//1=股票 0=基金
        this.number = number || 0;//持有数量
        this.costPrice = costPrice || 0;//成本价格
        this.totalPrice = 0;//总盈亏
    }

    var table = layui.table;
    var $ = layui.$;
    var layer = layui.layer;
    var form = layui.form;

    exports('gp', function () {
        const num = 1000;

        var totalPrice = 0;
        var currentPrice = 0;

        var gpListKey = "gp_list";
        var gpList;

        // gpList.push(new gpInfo('1', '588090', '0', 33961, 1.437));
        // gpList.push(new gpInfo('0', '159837', '0', 8000, 0.95));
        // gpList.push(new gpInfo('0', '159850', '0', 3000, 1.001));
        // gpList.push(new gpInfo('1', '600519', '1'));
        // gpList.push(new gpInfo('0', '000858', '1'));
        // gpList.push(new gpInfo('0', '159905', '0'));
        // gpList.push(new gpInfo('1', '600000', '1'));

        function init() {
            initGpList();

            initTable();

            initData();
        }

        function initTable() {
            table.render({
                elem: '#gpTable'
                // , height: 500
                , data: gpList //数据接口
                , page: false //开启分页
                , cols: [[
                    { field: 'code', title: '代码', width: 100 }
                    , { field: 'name', title: '名称', width: 140 }
                    , { field: 'price', title: '当前价格', width: 120, align: 'center' }
                    , {
                        field: 'change', title: '涨幅值', width: 120, align: 'center', templet: function (d) {
                            var className = getClassName(d.change);
                            return '<div class="' + className + '">' + d.change + '</div>';
                        }
                    }
                    , {
                        field: 'changePercent', title: '涨幅', width: 120, align: 'center', templet: function (d) {
                            var className = getClassName(d.change);
                            return '<div class="' + className + '">' + d.changePercent + '</div>';
                        }
                    }
                    , {
                        edit: 'text', field: 'costPrice', title: '持仓成本', width: 120, align: 'center', templet: function (d) {
                            if (d.costPrice === 0) {
                                return '<div>--</div>'
                            }
                            return '<div>' + d.costPrice + '</div>';
                        }
                    }
                    , {
                        edit: 'text', field: 'number', title: '持仓数量', width: 120, align: 'center', templet: function (d) {
                            if (d.number === 0) {
                                return '<div>--</div>'
                            }
                            return '<div>' + d.number + '</div>';
                        }
                    }
                    , {
                        field: 'totalPrice', title: '今日盈亏', width: 120, align: 'center', templet: function (d) {
                            if (d.number === 0) {
                                return '<div>--</div>'
                            }
                            var tPrice = d.number * d.change;
                            var className = getClassName(tPrice);
                            return '<div class="' + className + '">' + toFixed(tPrice) + '</div>';
                        }
                    }
                    , {
                        field: 'totalPrice', title: '总盈亏', width: 120, align: 'center', templet: function (d) {
                            if (d.totalPrice === 0) {
                                return '<div>--</div>'
                            }
                            var className = getClassName(d.totalPrice);
                            return '<div class="' + className + '">' + toFixed(d.totalPrice) + '</div>';
                        }
                    }
                    , {
                        title: '操作', width: 120, align: 'center', templet: function (d) {
                            return '<div><a class="layui-btn layui-btn-danger layui-btn-xs" lay-event="del">删除</a></div>';
                        }
                    }
                ]]
            });
        }

        function initGpList() {
            var data = localStorage.getItem(gpListKey);
            if (data) {
                gpList = JSON.parse(data);
            }
            else {
                gpList = [];
            }
        }

        function saveData() {
            localStorage.setItem(gpListKey, JSON.stringify(gpList));

            console.log(gpList)
        }

        function toFixed(n) {
            return n.toFixed(2);
        }

        function getClassName(n) {
            if (n === 0) return '';
            return n > 0 ? 'zhang' : 'die';
        }

        function reload() {
            table.reload('gpTable', { data: gpList });
        }

        function calcPrice() {
            currentPrice = 0;
            totalPrice = 0;
            $.each(gpList, function (i, item) {
                currentPrice += item.number * item.change;
                totalPrice += item.totalPrice;
            });

            $('#currentPrice').removeClass('zhang die').addClass(getClassName(currentPrice)).text(toFixed(currentPrice));
            $('#totalPrice').removeClass('zhang die').addClass(getClassName(totalPrice)).text(toFixed(totalPrice));
        }

        function getData(info) {
            var dt = new Date();
            var url = 'http://push2.eastmoney.com/api/qt/stock/get?secid=' + info.mktNum + '.' + info.code + '&fields=f43,f169,f170,f46,f60,f84,f116,f44,f45,f171,f126,f47,f48,f168,f164,f49,f161,f55,f92,f59,f152,f167,f50,f86,f71,f172,f191,f192,f51,f52,f58&_=' + dt.getTime();
            if (info.type === '1') {
                url += '&invt=2&fltt=2';
            }

            $.ajax({
                type: 'get',
                url: url,
                dataType: 'json',
                success: function (res) {
                    var data = res.data;
                    var type = info.type;
                    info.name = data['f58'];
                    info.price = type === '0' ? data['f43'] / num : data['f43'];
                    info.change = type === '0' ? data['f169'] / num : data['f169'];
                    info.changePercent = (type === '0' ? data['f170'] / 100 : data['f170']) + '%';
                    info.totalPrice = (info.price - info.costPrice) * info.number;

                    calcPrice();
                    reload();
                },
                error: function (e, m) {
                    showMsg('数据接口请求异常：' + m, 2);
                }
            });
        }

        function showMsg(msg, icon) {
            layer.open({
                title: '提示'
                , icon: icon || 1
                , content: msg
            });
        }

        function dateFormat(thisDate, fmt) {
            var o = {
                "M+": thisDate.getMonth() + 1,
                "d+": thisDate.getDate(),
                "h+": thisDate.getHours(),
                "m+": thisDate.getMinutes(),
                "s+": thisDate.getSeconds(),
                "q+": Math.floor((thisDate.getMonth() + 3) / 3),
                "S": thisDate.getMilliseconds()
            };
            if (/(y+)/.test(fmt))
                fmt = fmt.replace(RegExp.$1, (thisDate.getFullYear() + "").substr(4 - RegExp.$1.length));
            for (var k in o)
                if (new RegExp("(" + k + ")").test(fmt))
                    fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
            return fmt;
        }

        function isWork() {
            var dt = new Date();
            var day = dt.getDay();
            if (day > 0 && day < 6) {
                var dt0 = new Date();
                var dt1 = new Date();
                var dt2 = new Date();
                var dt3 = new Date();
                dt0.setHours(9);
                dt0.setMinutes(30);
                dt0.setSeconds(0);
                dt1.setHours(11);
                dt1.setMinutes(30);
                dt1.setSeconds(0);
                dt2.setHours(13);
                dt2.setMinutes(0);
                dt2.setSeconds(0);
                dt3.setHours(15);
                dt3.setMinutes(0);
                dt3.setSeconds(0);

                if (dt.getTime() >= dt0.getTime() && dt.getTime() < dt1.getTime()) {
                    return true;
                }

                if (dt.getTime() >= dt2.getTime() && dt.getTime() < dt3.getTime()) {
                    return true;
                }
            }
            return false;
        }

        function initData() {
            var weekDic = {
                0: '日',
                1: '一',
                2: '二',
                3: '三',
                4: '四',
                5: '五',
                6: '日'
            };
            setInterval(function () {
                var date = new Date();
                var dt = dateFormat(date, 'yyyy-MM-dd hh:mm:ss');
                dt += ' (星期' + weekDic[date.getDay()] + ')'
                $('#currentTime').text(dt);
            }, 1000);

            if (isWork()) {
                requestData();
                setInterval(function () {
                    requestData();
                }, 4000);
            }
            else {
                requestData();
            }

            $('input[name="keyword"]').on('keydown', function (e) {
                var keyCode = e.keyCode;
                if (keyCode === 13) {
                    e.preventDefault();
                    var word = $('input[name="keyword"]').val();

                    searchGp(word);

                    $('.layui-select-title').trigger('click');
                }
            });

            form.on('select(search_gp)', function (data) {
                var option = $(data.elem).find('option:selected');
                var classify = option.attr('data-classify') ?? '';
                classify = classify.toLowerCase();
                var type = classify.indexOf('fund') > -1 ? '0' : '1';

                form.val('submit_form', {
                    code: data.value,
                    name: option.attr('data-name'),
                    mktNum: option.attr('data-mktnum'),
                    type: type
                });
            });

            form.on('submit(submit_gp)', function (data) {
                addGp(data.field);

                return false;
            });

            //监听行工具事件
            table.on('tool(gpTable)', function (obj) {
                var data = obj.data;
                console.log(obj)
                if (obj.event === 'del') {
                    layer.confirm('确定要删除该行数据吗?', { icon: 2, title: '提示' }, function (index) {
                        removeGp(data);
                        obj.del();
                        layer.close(index);
                    });
                }
            });

            //监听单元格编辑
            table.on('edit(gpTable)', function (obj) {
                updateGp(obj.data, obj.field, parseFloat(obj.value));
            });
        }

        function addGp(data) {
            var flag = true;
            $.each(gpList, function (i, item) {
                if (item.code === data.code) {
                    flag = false;
                    return false;
                }
            });

            if (flag) {
                gpList.push(new gpInfo(data.mktNum, data.code, data.type, parseFloat(data.number), parseFloat(data.costPrice)));

                saveData();
                requestData();
                clearForm();
            }
            else {
                showMsg('已经存在该股票!', 1);
            }
        }

        function removeGp(data) {
            var index = -1;
            $.each(gpList, function (i, item) {
                if (item.code === data.code) {
                    index = i;
                    return false;
                }
            });

            if (index > -1) {
                gpList.splice(index, 1);
            }

            calcPrice();

            saveData();
        }

        function updateGp(data, field, value) {
            $.each(gpList, function (i, item) {
                if (item.code === data.code) {
                    item[field] = value;
                    item.totalPrice = (item.price - item.costPrice) * item.number;
                    return false;
                }
            });

            calcPrice();

            reload();

            saveData();
        }

        function requestData() {
            $.each(gpList, function (i, item) {
                getData(item);
            });
        }

        function searchGp(word) {
            var dt = new Date();
            var url = `http://searchapi.eastmoney.com/api/suggest/get?input=${word}&type=14&token=D43BF722C8E33BDC906FB84D85E326E8&markettype=&mktnum=&jys=&classify=&securitytype=&status=&count=10&cb=?&_=${dt.getTime()}`;

            $.ajax({
                type: 'get',
                url: url,
                dataType: 'jsonp',
                success: function (res) {
                    var data = res.QuotationCodeTable.Data;
                    renderForm(data);
                }
            });
        }

        function renderForm(list) {
            clearForm();

            var arr = [];
            arr.push('<option value="">选择股票</option>');
            $.each(list, function (i, item) {
                arr.push(`<option value="${item.Code}" data-mktnum="${item.MktNum}" data-name="${item.Name}" data-classify="${item.Classify}">${item.SecurityTypeName}--${item.Code}--${item.Name}</option>`);
            });
            var html = arr.join('');
            $('select[name="gp_list"]').html(html);

            form.render('select');
        }

        function clearForm() {
            form.val('submit_form', {
                gp_list: '',
                code: '',
                name: '',
                mktNum: '',
                type: ''
            });
        }

        init();
    });
});