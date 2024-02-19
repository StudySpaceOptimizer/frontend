import type { DrawObjectData, DrawObjectDataType } from './basic'
import { DrawUntil } from './basic'

export type DrawObjectConfig = {
  text?: string;
  width?: number;
  height?: number;
  fill?: string;
  fontSize?: number;
  type?: DrawObjectDataType;
  rotation?: number;
  concerRadius?: number;
  id?: string;
}

export default abstract class DrawObject {
  protected id: string;
  protected text: string;
  private _width: number;
  private _height: number;
  protected fill: string;
  protected fontSize: number;
  protected type: DrawObjectDataType;
  protected rotation: number;
  protected concerRadius: number;
  
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
    id: string,
    config: DrawObjectConfig = {}
  ) {
    const {
      text = '',
      width = 0,
      height = 0,
      fill = '#fff',
      fontSize = 14,
      type = 'v-rect',
      rotation = 0,
      concerRadius = 0
    } = config;

    this.id = DrawUntil.draw_id_gen(id); 
    this.text = text;
    this._width = width;
    this._height = height;
    this.fill = fill;
    this.fontSize = fontSize;
    this.type = type;
    this.rotation = rotation;
    this.concerRadius = concerRadius;
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
        height: this.height,
        fill: this.fill,
        cornerRadius: this.concerRadius,
      }
    }
    return ret
  }
}
