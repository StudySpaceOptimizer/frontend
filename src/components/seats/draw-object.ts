import type { DrawObjectData, DrawObjectDataType } from './basic'
import { DrawUntil } from './basic'

export default abstract class DrawObject {
  
  get width(): number {
    return this._width
  }

  set width(value: number) {
    this._width = value
  }

  get height(): number {
    return this._height
  }

  set height(value: number) {
    this._height = value
  }

  constructor(
    public x: number,
    public y: number,
    public id: string,
    public text: string = '',
    private _width: number = 0,
    public _height: number = 0,
    public fill: string = '#fff',
    public fontSize: number = 14,
    public type: DrawObjectDataType = 'v-rect',
    public rotation: number = 0
  ) {
    this.id = DrawUntil.draw_id_gen(id)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  draw(_: number = 0): DrawObjectData {
    const ret: DrawObjectData = {
      type: this.type,
      id: this.id,
      config: {
        x: this.x,
        y: this.y,
        width: this.width,
        height: this._height,
        fill: this.fill,
        cornerRadius: 2,
      }
    }
    return ret
  }
}
