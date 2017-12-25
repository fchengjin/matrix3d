
// makeTransformable('#change', function (element, H) {
//   var i, j
//   // console.log($(element).css('transform'))
//   return $('.matrix3d-value').
//     html($('<table>').
//       append($('<tr>').html($('<td>').text('matrix3d('))).
//       append((function () {
//         var k, results
//         results = []
//         for (i = k = 0; k < 4; i = ++k) {
//           results.push($('<tr>').append((function () {
//             var l, results1
//             results1 = []
//             for (j = l = 0; l < 4; j = ++l) {
//               results1.push(
//                 $('<td>').text(H[j][i] + ((i === j && j === 3) ? '' : ',')))
//             }
//             return results1
//           })()))
//         }
//         return results
//       })()).
//       append($('<tr>').html($('<td>').text(')'))))
// })

var refImg = document.querySelector('#reference img')
var changeImg = document.querySelector('change *')

//上传

//远程加载
function changeReadyByUrl (node, callback) {
  var timer = null
  switch (node.nodeName) {
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
    const _this = this
    if (this.controlPoints.length !== 4 || this.originalPos.length !== 4) {
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

      const originPos = []
      for (let i = 0; i < results.length; i++) {
        const temp = results[i]
        originPos.push([temp.offset().left, temp.offset().top])
      }
      this.originalPos = originPos
    }
    const ref = ['left top', 'left bottom', 'right top', 'right bottom']
    $(this.controlPoints).each((i, $el) => {
      $el.position({
        at: ref[i],
        of: _this.$el[0],
        collision: 'none'
      })
    })
    //绑定draggable
    $(this.controlPoints).draggable({
      start(){
        _this.handler && _this.handler.onDragStart && _this.handler.onDragStart(_this)
        return _this.$el.css('pointer-events', 'none')
      },
      drag(){
        //应用变换
        const targetPos = []
        for (let i = 0; i < 4;i++) {
          const temp = _this.controlPoints[i]
          targetPos.push([temp.offset().left, temp.offset().top])
        }

        const cb = (_this.handler && _this.handler.onDragging) ? _this.handler.onDragging : null
        _this.applyTransform(targetPos,cb)
      },
      stop(){
        const targetPos = []
        for (let i = 0; i < 4;i++) {
         const temp = _this.controlPoints[i]
          targetPos.push([temp.offset().left, temp.offset().top])
        }
        const cb = (_this.handler && _this.handler.onDragStop) ? _this.handler.onDragStop : null
        _this.applyTransform(targetPos,cb)
      }
    })
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
      B.push(to[i].x)
      B.push(to[i].y)
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
      lhs = numeric.dot(H, [from[i].x, from[i].y, 0, 1])
      k_i = lhs[3]
      rhs = numeric.dot(k_i, [to[i].x, to[i].y, 0, 1])
      console.assert(numeric.norm2(numeric.sub(lhs, rhs)) < 1e-9, 'Not equal:',
        lhs, rhs)
    }
    return H
  }

  applyTransform (targetPos, callback) {
    const from = []
    for(let i =0 ;i < this.originalPos.length; i++){
      from.push({
        x: this.originalPos[i][0] - this.originalPos[0][0],
        y: this.originalPos[i][1] - this.originalPos[0][1]
      })
    }
    console.log(from)
    const to = []
    for(let j = 0; j < targetPos;j++){
      to.push({
        x: targetPos[j][0] - this.originalPos[0][0],
        y: targetPos[j][1] - this.originalPos[0][1]
      })
    }
    console.log(to)
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
    return typeof callback === 'function' ? callback(this, H) : void 0
  }
}
