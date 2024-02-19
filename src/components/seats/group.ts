import DrawObject from './draw-object'
import type { DrawObjectData } from './basic'

export default class Group extends DrawObject {
  protected boxBounds: { x: number; y: number; width: number; height: number } = {
    x: 0,
    y: 0,
    width: 0,
    height: 0
  }

  constructor(
    public x: number,
    public y: number,
    public rotation: number = 0,
    protected objects: DrawObject[] = [],
    public id: string = 'group',
    protected offset: boolean = true
  ) {
    super(x, y, id)
  }

  override get width() {
    return this.boxBounds.width
  }

  override get height() {
    return this.boxBounds.height
  }

  add(...o: DrawObject[]) {
    this.objects.push(...o)
  }

  protected computeBounds(o: DrawObject) {
    this.boxBounds = {
      x: Math.min(this.boxBounds.x, o.x),
      y: Math.min(this.boxBounds.y, o.y),
      width: Math.max(this.boxBounds.width, o.x + o.width),
      height: Math.max(this.boxBounds.height, o.y + o.height)
    }
  }

  draw(rotation: number=0): DrawObjectData {
    const children: DrawObjectData[] = []

    this.objects.forEach((o) => {
      this.computeBounds(o)
      children.push(o.draw(this.rotation + rotation))
    })

    return {
      type: 'v-group',
      id: this.id,
      config: {
        x: this.x,
        y: this.y,
        rotation: this.rotation,
        offsetX: this.offset ? this.boxBounds.width / 2 : 0,
        offsetY: this.offset ? this.boxBounds.height / 2 : 0
      },
      children
    }
  }
}
