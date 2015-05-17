/*
    效果不完美，等待修改
 */

angular.module('ngLazyLoad', [''])
.directive('lazySrc', ['$window', '$document', function(win, $doc) {
    var $win = angular.element(win),
            doc = $doc[0],
            isLazyLoading = false,
            //用来维护当前需要lazyload的图片集合
            elements = (function() {
                var _uid = 0;
                var _list = {}
                return {
                    push: function(_data) {
                        _list[_uid++] = _data;
                        setTimeout(function() {
                            checkImage(_data);
                        });
                    },
                    del: function(key) {
                        _list[key] && delete _list[key];
                    },
                    size: function() {
                        return Object.keys(_list).length;
                    },
                    get: function() {
                        return _list;
                    }

                }
            })(),
            //判断图片元素是否在可视区域内，如果超出1/3可见，则显示
            isVisible = function(elem) {
                var rect = elem[0].getBoundingClientRect();
                var ret = true;
                if (rect.height > 0 && rect.width > 0) {
                    var x = rect.top > 0 && (rect.top + rect.height / 3) < Math.max(doc.documentElement.clientHeight, win.innerHeight || 0);
                    var y = rect.left > 0 && (rect.left + rect.width / 3) < Math.max(doc.documentElement.clientWidth, win.innerWidth || 0);
                    ret = x && y;
                }
                return  ret;
            },
            //每次scroll时，调用checkImage，循环检查图片
            checkImage = function(evt, i, item) {
                if (i >= 0 && item) {
                    return isVisible(item.elem) ? item.load(i) : false; //指定检查，返回是否显示
                } else if (elements.size() == 0) {//全部显示之后，解除绑定
                    $win.off('scroll', checkImage);
                    $win.off('resize', checkImage);
                    isLazyLoading = false;
                } else {
                    angular.forEach(elements.get(), function(item, key) {//循环检查
                        isVisible(item.elem) && item.load(key);
                    });
                }
            },
            //初始化，绑定scroll
            //如果已经全部显示了，会off，若有新的指令（ajax、js载入需要lazyload的内容），会重新绑定scroll
            initLazyLoad = function() {
                if (isLazyLoading === false) {
                    isLazyLoading = true;
                    $win.on('scroll', checkImage);
                    $win.on('resize', checkImage);
                }
            }
    return {
        restrict: 'A',//仅可以使用  attr
        scope: {},//独立的scope
        link: function($scope, $elem, attrs) {
            $elem[0].style.cssText && $elem.data('cssText',$elem[0].style.cssText);
            $elem.css({'min-width':'1px','min-height':'1px'});
            //传回调参数，不$watch 状态，以免增加过多
            elements.push({
                elem: $elem,
                load: function(key) {
                    $elem.data('cssText') && ($elem[0].style.cssText = $elem.data('cssText'))
                    $elem.removeClass('ng-lazyload')
                    $elem.attr('src', attrs.lazySrc);
                    key >= 0 && elements.del(key);
                    $scope.$destroy();
                    return true;
                }
            });
            initLazyLoad();
        }
    }
}]);
