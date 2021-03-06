class TransformEl {
  constructor (el, obj) {
    if (el instanceof $) {
      this.$el = el
    } else {
      this.$el = $(el)
    }
    this.controlPoints = []
    this.originalPos = []
    this.handler = obj
    this.init()
  }

  init () {
    this.$el.removeAttr('style')
    const _this = this
    if (this.controlPoints.length !== 4) {
      const results = []
      for (let i = 0; i < 4; i++) {
        results.push($('<div>').css({
          border: '10px solid black',
          borderRadius: '10px',
          cursor: 'move',
          position: 'absolute',
          zIndex: 100000
        }).appendTo('body'))
      }
      this.controlPoints = results
      //绑定draggable
      $(this.controlPoints).draggable({
        start () {
          _this.handler && _this.handler.onDragStart &&
          _this.handler.onDragStart(_this)
          return _this.$el.css('pointer-events', 'none')
        },
        drag () {
          //应用变换
          const targetPos = []

          _this.controlPoints.forEach(function ($el, index) {
            targetPos.push([$el.offset().left, $el.offset().top])
          })
          const cb = (_this.handler && _this.handler.onDragging)
            ? _this.handler.onDragging
            : null
          _this.applyTransform(targetPos, cb)
        },
        stop () {
          const targetPos = []
          _this.controlPoints.forEach(function ($el, index) {
            targetPos.push([$el.offset().left, $el.offset().top])
          })
          const cb = (_this.handler && _this.handler.onDragStop)
            ? _this.handler.onDragStop
            : null
          _this.applyTransform(targetPos, cb)
        }
      })
    }

    const ref = ['left top', 'left bottom', 'right top', 'right bottom']
    const originPos = []
    $(this.controlPoints).each((i, $el) => {
      $el.position({
        at: ref[i],
        of: _this.$el[0],
        collision: 'none'
      })
      originPos.push([$el.offset().left, $el.offset().top])
    })
    this.originalPos = originPos

  }

  applyTransform (targetPos, callback) {
    const from = []
    const to = []
    for (let i = 0; i < this.originalPos.length; i++) {
      from.push({
        x: this.originalPos[i][0] - this.originalPos[0][0],
        y: this.originalPos[i][1] - this.originalPos[0][1]
      })
    }
    for (let j = 0; j < targetPos.length; j++) {
      to.push({
        x: targetPos[j][0] - this.originalPos[0][0],
        y: targetPos[j][1] - this.originalPos[0][1]
      })
    }
    const H = this.getTransform(from, to)

    const matrix3d = []
    for (let i = 0; i < 4; i++) {
      const temp = []
      for (let j = 0; j < 4; j++) {
        temp.push(H[j][i].toFixed(20))
      }
      matrix3d.push(temp)
    }
    this.matrix3d = matrix3d
    this.$el.css({
      'transform': 'matrix3d(' + matrix3d.join(',') + ')',
      'transform-origin': '0 0'
    })
    return typeof callback === 'function' ? callback(this, matrix3d) : void 0
  }

  getTransform (from, to) {
    const A = [],
      B = []

    for (let i = 0; i < 4; i++) {
      A.push([
        from[i].x,
        from[i].y,
        1,
        0,
        0,
        0,
        -from[i].x * to[i].x,
        -from[i].y * to[i].x])
      A.push([
        0,
        0,
        0,
        from[i].x,
        from[i].y,
        1,
        -from[i].x * to[i].y,
        -from[i].y * to[i].y])
    }

    for (let j = 0; j < 4; j++) {
      B.push(to[j].x)
      B.push(to[j].y)
    }

    const h = numeric.solve(A, B)
    const H = [
      [h[0], h[1], 0, h[2]],
      [h[3], h[4], 0, h[5]],
      [0, 0, 1, 0],
      [h[6], h[7], 0, 1]
    ]

    let lhs, rhs, k_i
    for (let k = 0; k < 4; k++) {
      lhs = numeric.dot(H, [from[k].x, from[k].y, 0, 1])
      k_i = lhs[3]
      rhs = numeric.dot(k_i, [to[k].x, to[k].y, 0, 1])
      console.assert(numeric.norm2(numeric.sub(lhs, rhs)) < 1e-9, 'Not equal:',
        lhs, rhs)
    }
    return H
  }
}

const valueShow = document.querySelector('.matrix3d-value')
var reference = document.querySelector('#reference')
var referenceUpload = document.querySelector('#reference-upload')
var referenceResetBtn = document.querySelector('#reference-reset-btn')
var referenceSubmitBtn = document.querySelector('#reference-submit-btn')
var changeUpload = document.querySelector('#change-upload')
var changeWrapper = document.querySelector('#change')
var changeEl = document.querySelector('#change *')
var changeImg = document.querySelector('#change *')
var changeResetBtn = document.querySelector('#change-reset-btn')
var changeSubmitBtn = document.querySelector('#change-submit-btn')
//初始化
var matrix3dEl = new TransformEl(changeWrapper, {
  onDragging: function (_this, matrix3d) {
    let s = ''
    for (let i = 0; i < matrix3d.length; i++) {
      s += '<tr>'
      for (let j = 0; j < matrix3d[i].length; j++) {
        const temp = i === matrix3d.length - 1 && j === matrix3d[i].length - 1
          ? ''
          : ','
        s += '<td>' + Number(matrix3d[i][j]) + temp + '</td>'
      }
      s += '</tr>'
    }
    valueShow.innerHTML = s
  },
  onDragStop: function (_this, matrix3d) {
    let s = ''
    for (let i = 0; i < matrix3d.length; i++) {
      s += '<tr>'
      for (let j = 0; j < matrix3d[i].length; j++) {
        const temp = i === matrix3d.length - 1 && j === matrix3d[i].length - 1
          ? ''
          : ','
        s += '<td>' + Number(matrix3d[i][j]) + temp + '</td>'
      }
      s += '</tr>'
    }
    valueShow.innerHTML = s
  }
})
loadCompete(changeEl, function () {
  matrix3dEl.init()
})

//表单处理
referenceSubmitBtn.addEventListener('click', function (e) {
  e.preventDefault()
  const oForm = new FormData(document.querySelector('#reference-form'))
  const width = oForm.get('width') > 0 ? oForm.get('width') + 'px' : 'auto'
  const height = oForm.get('height') > 0 ? oForm.get('height') + 'px' : 'auto'
  const url = oForm.get('url')
  const file = oForm.get('upload')
  reference.style.width = width
  reference.style.height = height
  if (/image/g.test(file.type)) {
    const blob = new Blob([file])// 文件转化成二进制文件
    const url = URL.createObjectURL(blob) //转化成url
    reference.src = url
    loadCompete(reference, function () {
      URL.revokeObjectURL(url) // 释放createObjectURL创建的对象
    })
  } else if (url) {
    reference.src = url
  }
})
changeSubmitBtn.addEventListener('click', function (e) {
  e.preventDefault()
  const oForm = new FormData(document.querySelector('#change-form'))
  const width = oForm.get('width') > 0 ? oForm.get('width') + 'px' : 'auto'
  const height = oForm.get('height') > 0 ? oForm.get('height') + 'px' : 'auto'
  const file = oForm.get('upload')
  if (/image/g.test(file.type)) {
    //FileReader 无法读取大文件,此处使用URL.createObjectURL

    const blob = new Blob([file])// 文件转化成二进制文件
    const url = URL.createObjectURL(blob) //转化成url
    const img = document.createElement('img')
    img.src = url
    img.style.width = width
    img.style.height = height
    changeWrapper.innerHTML = ''
    changeWrapper.appendChild(img)
    loadCompete(img, function () {
      URL.revokeObjectURL(url) // 释放createObjectURL创建的对象
      matrix3dEl.init()
    })
  } else if (/video/g.test(file.type)) {
    const blob = new Blob([file])
    const url = URL.createObjectURL(blob)
    const video = document.createElement('video')
    video.autoplay = true
    video.loop = true
    video.src = url
    video.style.width = width
    video.style.height = height
    changeWrapper.innerHTML = ''
    changeWrapper.appendChild(video)
    loadCompete(video, function () {
      // URL.revokeObjectURL(url) // 此处释放createObjectURL，video将无法循环
      matrix3dEl.init()
    })
  }
})

//加载完成后触发回调
function loadCompete (el, callback) {
  var timer = null
  switch (el.nodeName.toLowerCase()) {
    case 'img':
      timer = setInterval(function () {
        if (el.complete || el.width) {
          typeof callback === 'function' && callback(el)
          clearInterval(timer)
          timer = null
        }
      }, 50)
      break
    case 'video':
      el.oncanplay = function () {
        typeof callback === 'function' && callback(el)
        el.oncanplay = null
      }
      break
    default:
      return false
  }
}

