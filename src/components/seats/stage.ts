import type { Ref } from 'vue'
import { ref } from 'vue'
import type { DrawObjectData } from './basic'
import { Seat } from './seat'
import Group from './group'
import type DrawObject from './draw-object'

export default class DrawStage {
  private drawObjectDatas: DrawObjectData[] = []
  private _x: Ref<number> = ref(0)
  private _y: Ref<number> = ref(0)

  constructor(
    private _width: Ref<number>,
    private _height: Ref<number>,
    datas: any[] = []
  ) {
    this.draw(datas)
  }

  get config() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    }
  }

  // ? Is it necessary to have a getter and setter for x and y?
  get x() {
    return this._x.value
  }

  get y() {
    return this._y.value
  }

  set x(x: number) {
    this._x.value = x
  }

  set y(y: number) {
    this._y.value = y
  }

  set config(config: any) {
    this._x = config.x
    this._y = config.y
    this._width = config.width
    this._height = config.height
  }

  get drawObject() {
    return this.drawObjectDatas
  }

  private get width(): number {
    if (typeof this._width === 'number') {
      return this._width
    }
    return this._width.value
  }

  private get height(): number {
    if (typeof this._height === 'number') {
      return this._height
    }
    return this._height.value
  }

  /**
   * This function will draw all the objects in the stage. It is a usecase of the Composite pattern.
   *
   * @param datas
   */
  private draw(datas: any[]) {
    if (datas.length !== 0) {
      this.drawObjectDatas = datas
      return
    }
    const non_notebook_seats = new Group(0, 0, 0, [], 'non-notebook-seats')
   
    const horizontal_seat_datas = [
      [-1, -1, -1, 0, 0, 0, 0],
      [-1, -1, -1, 1, 5, 1, 1],
      [-1, 0, 0, 0, 0, 0, 0],
      [-1, 1, 1, 1, 1, 1, 1],
      [-1, 0, 0, 0, 0, 0, 0],
      [-1, 1, 1, 1, 1, 1, 1],
      [-1, 0, 0, 0, 0, 0, 0],
      [-1, 1, 1, 1, 1, 1, 1],
      [-1, 0, 0, 0, -1, 0, 0],
      [-1, 1, 1, 1, -1, 1, 1],
      [-1, 0, 0, 0, 0, 0, 0],
      [-1, 1, 1, 1, 1, 1, 1]
    ]

    const horizontal_seat_datas2 = [
      [-1, 0, 0, 0, 0, 0, 0],
      [-1, 1, 1, 1, 1, 1, 1],
      [-1, 0, 0, 0, 0, 0, 0],
      [-1, 1, 1, 1, 1, 1, 1],
      [-1, 0, 0, 0, 0, 0, 0],
      [-1, 1, 1, 1, 1, 1, 1],
      [-1, -1, -1, 0, 0, -1, -1],
      [-1, -1, -1, 1, 1, -1, -1]
    ]

    const others_seat_datas = [
      [-1, -1, -1, 0, 0, 0, -1],
      [-1, -1, -1, 1, 1, 1, -1]
    ]

    function genSeat(
      data: number[][],
      offsetX: number,
      offsetY: number,
      width: number = 28,
      height: number = 31,
      margin: number = 14
    ) {
      const ret = new Set<DrawObject>()
      const rotation = [0, 180, 270, 90]
      for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].length; j++) {
          const type = data[i][j]
          if (type === -1) {
            continue
          }
          const margin_x = (type % 4) >= 2 ? margin * (j - (j % 2)) : 0
          const margin_y = (type % 4) < 2 ? margin * (i - (i % 2)) : 0
          const act_width = (type % 4) >= 2 ? width : height
          const act_height = (type % 4) < 2 ? width : height

          const seat = new Seat(
            j * act_height + offsetX + margin_x,
            i * act_width + offsetY + margin_y,
            rotation[type % 4],
            type > 4
          )
          ret.add(seat)
        }
      }

      return ret
    }

    non_notebook_seats.add(...genSeat(horizontal_seat_datas, 0, 0))
    non_notebook_seats.add(...genSeat(horizontal_seat_datas2, 226, 234))
    non_notebook_seats.add(...genSeat(others_seat_datas, 10, 390))

    const vertical_seat_datas = [
      [2, 3],
      [2, 3],
      [2, 3],
    ]

    non_notebook_seats.add(...genSeat(vertical_seat_datas, 255, 100))

    const vertical_seat_datas2 = [
      [2, 3],
      [2, 3],
    ]

    non_notebook_seats.add(...genSeat(vertical_seat_datas2, 348, 128))

    const vertical_seat_datas3 = [
      [2, 3],
      [2, 3],
      [2, 3],
      [2, 3],
      [2, 3],
      [2, 3],
    ]

    non_notebook_seats.add(...genSeat(vertical_seat_datas3, -120, 500))

    const all_groups = new Group(this.width / 2, this.height / 2, 0, [], 'all-seats')
    all_groups.add(non_notebook_seats)

    this.drawObjectDatas.push(all_groups.draw())
    console.log(this.drawObjectDatas)
  }
}
