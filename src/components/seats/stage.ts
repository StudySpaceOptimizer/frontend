import type { Ref } from 'vue'
import { ref } from 'vue'
import type { DrawObjectData } from './basic'
import { Seat } from './seat'
import Group from './group'

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
    // const non_notebook_seats = new Group(0, 0, 0, [], 'non-notebook-seats')

    // non_notebook_seats.add(
    //   new Seat(0, 0, 0, 'seat-1'),
    // )

    // const all_groups = new Group(this.width / 2, this.height / 2, 0, [], 'all-seats')
    // all_groups.add(non_notebook_seats)

    // this.drawObjectDatas.push(all_groups.draw())
  }
}
