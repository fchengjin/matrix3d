class TransformEl {
  constructor (el,obj) {
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
        start(){
          _this.handler && _this.handler.onDragStart && _this.handler.onDragStart(_this)
          return _this.$el.css('pointer-events', 'none')
        },
        drag(){
          //应用变换
          const targetPos = []

          _this.controlPoints.forEach(function ($el, index) {
            targetPos.push([$el.offset().left,$el.offset().top])
          })
          const cb = (_this.handler && _this.handler.onDragging) ? _this.handler.onDragging : null
          _this.applyTransform(targetPos,cb)
        },
        stop(){
          const targetPos = []
          _this.controlPoints.forEach(function ($el, index) {
            targetPos.push([$el.offset().left,$el.offset().top])
          })
          const cb = (_this.handler && _this.handler.onDragStop) ? _this.handler.onDragStop : null
          _this.applyTransform(targetPos,cb)
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
    for(let i =0 ;i < this.originalPos.length; i++){
      from.push({
        x: this.originalPos[i][0] - this.originalPos[0][0],
        y: this.originalPos[i][1] - this.originalPos[0][1]
      })
    }
    for(let j = 0; j < targetPos.length;j++){
      to.push({
        x: targetPos[j][0] - this.originalPos[0][0],
        y: targetPos[j][1] - this.originalPos[0][1]
      })
    }
    const H = this.getTransform(from,to)


    const matrix3d = []
    for (let i = 0; i < 4;i++) {
      const temp = []
      for (let j = 0; j < 4;j++) {
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
        -from[i].y * to[i].x
      ])
      A.push([
        0,
        0,
        0,
        from[i].x,
        from[i].y,
        1,
        -from[i].x * to[i].y,
        -from[i].y * to[i].y
      ])
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

const changeWrapper = document.querySelector('#change')
const valueShow = document.querySelector('.matrix3d-value')
var matrix3dEl = new TransformEl(changeWrapper,{
  onDragging: function (_this, matrix3d) {
    let s = ''
    for(let i=0;i <matrix3d.length;i++){
      s += '<tr>'
      for (let j = 0;j < matrix3d[i].length;j++){
        const temp = i === matrix3d.length -1 && j === matrix3d[i].length -1 ? '': ','
        s += '<td>' + matrix3d[i][j] + temp + '</td>'
      }
      s += '</tr>'
    }
    valueShow.innerHTML = s
  }
})
var referenceImg = document.querySelector('#reference img')
var changeImg = document.querySelector('#change *')
var referenceUpload = document.querySelector('#reference-upload')
var referenceResetBtn = document.querySelector('#reference-reset-btn')
var changeResetBtn = document.querySelector('#change-reset-btn')
var changeUpload = document.querySelector('#change-upload')
var changeWrapper = document.querySelector('#change')
//上传
function getUploadUrl (fileinput, callback) {
  fileinput.addEventListener('change',function(){
    if(!fileinput.value){
      return
    }
    //获取file引用
    var file = this.files[0]
    //FileReader 无法读取大文件
    // //读取file
    // var reader = new FileReader()
    // //以DataURL的形式读取文件:
    // reader.readAsDataURL(file)
    // reader.onload = function (ev) {
    //   var data = ev.target.result
    //   referenceImg.src = data
    //   changeReadyByUrl(referenceImg,function () {
    //     console.log()
    //   })
    // }
    var blob = new Blob([file]), // 文件转化成二进制文件
      url = URL.createObjectURL(blob); //转化成url
    if (/image/g.test(file.type)) {
      var img = $('<img src="' + url + '">');
      img[0].onload = function(e) {
        URL.revokeObjectURL(this.src);  // 释放createObjectURL创建的对象
      }
      $('.preview2').html('').append(img);
    } else if (/video/g.test(file.type)) {
      var video = $('<video controls src="' + url + '">');
      $('.preview2').html('').append(video);
      video[0].onload = function(e) {
        URL.revokeObjectURL(this.src);  // 释放createObjectURL创建的对象
      }
    }

  })
}
//远程加载完成后触发回调
function changeReadyByUrl (node, callback) {
  var timer = null
  switch (node.nodeName.toLowerCase()) {
    case 'img':
      timer = setInterval(function () {
        if (node.complete) {
          callback(node)
          clearInterval(timer)
        }
      }, 50)
      break
    case 'video':
      node.addEventListener('loadedmetadata', callback(node), false)
      break
    default:
      return false
  }
}

//定时器超时处理
function handleTimeout(timer,timeout){
  timeout = timeout || 5000
  setTimeout(function () {
    if(timer){
      clearInterval(timer)
      alert('无法获取资源')
    }
  },timeout)
}

getUploadUrl(referenceUpload)
getUploadUrl(changeUpload,function () {

})