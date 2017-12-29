'use strict';

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var TransformEl = function () {
  function TransformEl(el, obj) {
    _classCallCheck(this, TransformEl);

    if (el instanceof $) {
      this.$el = el;
    } else {
      this.$el = $(el);
    }
    this.controlPoints = [];
    this.originalPos = [];
    this.handler = obj;
    this.init();
  }

  _createClass(TransformEl, [{
    key: 'init',
    value: function init() {
      this.$el.removeAttr('style');
      var _this = this;
      if (this.controlPoints.length !== 4) {
        var results = [];
        for (var i = 0; i < 4; i++) {
          results.push($('<div>').css({
            border: '10px solid black',
            borderRadius: '10px',
            cursor: 'move',
            position: 'absolute',
            zIndex: 100000
          }).appendTo('body'));
        }
        this.controlPoints = results;
        //绑定draggable
        $(this.controlPoints).draggable({
          start: function start() {
            _this.handler && _this.handler.onDragStart && _this.handler.onDragStart(_this);
            return _this.$el.css('pointer-events', 'none');
          },
          drag: function drag() {
            //应用变换
            var targetPos = [];

            _this.controlPoints.forEach(function ($el, index) {
              targetPos.push([$el.offset().left, $el.offset().top]);
            });
            var cb = _this.handler && _this.handler.onDragging ? _this.handler.onDragging : null;
            _this.applyTransform(targetPos, cb);
          },
          stop: function stop() {
            var targetPos = [];
            _this.controlPoints.forEach(function ($el, index) {
              targetPos.push([$el.offset().left, $el.offset().top]);
            });
            var cb = _this.handler && _this.handler.onDragStop ? _this.handler.onDragStop : null;
            _this.applyTransform(targetPos, cb);
          }
        });
      }

      var ref = ['left top', 'left bottom', 'right top', 'right bottom'];
      var originPos = [];
      $(this.controlPoints).each(function (i, $el) {
        $el.position({
          at: ref[i],
          of: _this.$el[0],
          collision: 'none'
        });
        originPos.push([$el.offset().left, $el.offset().top]);
      });
      this.originalPos = originPos;
    }
  }, {
    key: 'applyTransform',
    value: function applyTransform(targetPos, callback) {
      var from = [];
      var to = [];
      for (var i = 0; i < this.originalPos.length; i++) {
        from.push({
          x: this.originalPos[i][0] - this.originalPos[0][0],
          y: this.originalPos[i][1] - this.originalPos[0][1]
        });
      }
      for (var j = 0; j < targetPos.length; j++) {
        to.push({
          x: targetPos[j][0] - this.originalPos[0][0],
          y: targetPos[j][1] - this.originalPos[0][1]
        });
      }
      var H = this.getTransform(from, to);

      var matrix3d = [];
      for (var _i = 0; _i < 4; _i++) {
        var temp = [];
        for (var _j = 0; _j < 4; _j++) {
          temp.push(H[_j][_i].toFixed(20));
        }
        matrix3d.push(temp);
      }
      this.matrix3d = matrix3d;
      this.$el.css({
        'transform': 'matrix3d(' + matrix3d.join(',') + ')',
        'transform-origin': '0 0'
      });
      return typeof callback === 'function' ? callback(this, matrix3d) : void 0;
    }
  }, {
    key: 'getTransform',
    value: function getTransform(from, to) {
      var A = [],
          B = [];

      for (var i = 0; i < 4; i++) {
        A.push([from[i].x, from[i].y, 1, 0, 0, 0, -from[i].x * to[i].x, -from[i].y * to[i].x]);
        A.push([0, 0, 0, from[i].x, from[i].y, 1, -from[i].x * to[i].y, -from[i].y * to[i].y]);
      }

      for (var j = 0; j < 4; j++) {
        B.push(to[j].x);
        B.push(to[j].y);
      }

      var h = numeric.solve(A, B);
      var H = [[h[0], h[1], 0, h[2]], [h[3], h[4], 0, h[5]], [0, 0, 1, 0], [h[6], h[7], 0, 1]];

      var lhs = void 0,
          rhs = void 0,
          k_i = void 0;
      for (var k = 0; k < 4; k++) {
        lhs = numeric.dot(H, [from[k].x, from[k].y, 0, 1]);
        k_i = lhs[3];
        rhs = numeric.dot(k_i, [to[k].x, to[k].y, 0, 1]);
        console.assert(numeric.norm2(numeric.sub(lhs, rhs)) < 1e-9, 'Not equal:', lhs, rhs);
      }
      return H;
    }
  }]);

  return TransformEl;
}();

var valueShow = document.querySelector('.matrix3d-value');
var reference = document.querySelector('#reference');
var referenceUpload = document.querySelector('#reference-upload');
var referenceResetBtn = document.querySelector('#reference-reset-btn');
var referenceSubmitBtn = document.querySelector('#reference-submit-btn');
var changeUpload = document.querySelector('#change-upload');
var changeWrapper = document.querySelector('#change');
var changeEl = document.querySelector('#change *');
var changeImg = document.querySelector('#change *');
var changeResetBtn = document.querySelector('#change-reset-btn');
var changeSubmitBtn = document.querySelector('#change-submit-btn');
//初始化
var matrix3dEl = new TransformEl(changeWrapper, {
  onDragging: function onDragging(_this, matrix3d) {
    var s = '';
    for (var i = 0; i < matrix3d.length; i++) {
      s += '<tr>';
      for (var j = 0; j < matrix3d[i].length; j++) {
        var temp = i === matrix3d.length - 1 && j === matrix3d[i].length - 1 ? '' : ',';
        s += '<td>' + Number(matrix3d[i][j]) + temp + '</td>';
      }
      s += '</tr>';
    }
    valueShow.innerHTML = s;
  },
  onDragStop: function onDragStop(_this, matrix3d) {
    var s = '';
    for (var i = 0; i < matrix3d.length; i++) {
      s += '<tr>';
      for (var j = 0; j < matrix3d[i].length; j++) {
        var temp = i === matrix3d.length - 1 && j === matrix3d[i].length - 1 ? '' : ',';
        s += '<td>' + Number(matrix3d[i][j]) + temp + '</td>';
      }
      s += '</tr>';
    }
    valueShow.innerHTML = s;
  }
});
loadCompete(changeEl, function () {
  matrix3dEl.init();
});

//表单处理
referenceSubmitBtn.addEventListener('click', function (e) {
  e.preventDefault();
  var oForm = new FormData(document.querySelector('#reference-form'));
  var width = oForm.get('width') > 0 ? oForm.get('width') + 'px' : 'auto';
  var height = oForm.get('height') > 0 ? oForm.get('height') + 'px' : 'auto';
  var url = oForm.get('url');
  var file = oForm.get('upload');
  reference.style.width = width;
  reference.style.height = height;
  if (/image/g.test(file.type)) {
    var blob = new Blob([file]); // 文件转化成二进制文件
    var _url = URL.createObjectURL(blob); //转化成url
    reference.src = _url;
    loadCompete(reference, function () {
      URL.revokeObjectURL(_url); // 释放createObjectURL创建的对象
    });
  } else if (url) {
    reference.src = url;
  }
});
changeSubmitBtn.addEventListener('click', function (e) {
  e.preventDefault();
  var oForm = new FormData(document.querySelector('#change-form'));
  var width = oForm.get('width') > 0 ? oForm.get('width') + 'px' : 'auto';
  var height = oForm.get('height') > 0 ? oForm.get('height') + 'px' : 'auto';
  var file = oForm.get('upload');
  if (/image/g.test(file.type)) {
    //FileReader 无法读取大文件,此处使用URL.createObjectURL

    var blob = new Blob([file]); // 文件转化成二进制文件
    var url = URL.createObjectURL(blob); //转化成url
    var img = document.createElement('img');
    img.src = url;
    img.style.width = width;
    img.style.height = height;
    changeWrapper.innerHTML = '';
    changeWrapper.appendChild(img);
    loadCompete(img, function () {
      URL.revokeObjectURL(url); // 释放createObjectURL创建的对象
      matrix3dEl.init();
    });
  } else if (/video/g.test(file.type)) {
    var _blob = new Blob([file]);
    var _url2 = URL.createObjectURL(_blob);
    var video = document.createElement('video');
    video.autoplay = true;
    video.loop = true;
    video.src = _url2;
    video.style.width = width;
    video.style.height = height;
    changeWrapper.innerHTML = '';
    changeWrapper.appendChild(video);
    loadCompete(video, function () {
      // URL.revokeObjectURL(url) // 此处释放createObjectURL，video将无法循环
      matrix3dEl.init();
    });
  }
});

//加载完成后触发回调
function loadCompete(el, callback) {
  var timer = null;
  switch (el.nodeName.toLowerCase()) {
    case 'img':
      timer = setInterval(function () {
        if (el.complete || el.width) {
          typeof callback === 'function' && callback(el);
          clearInterval(timer);
          timer = null;
        }
      }, 50);
      break;
    case 'video':
      el.oncanplay = function () {
        typeof callback === 'function' && callback(el);
        el.oncanplay = null;
      };
      break;
    default:
      return false;
  }
}
//# sourceMappingURL=main.es6.js.map