import DrawObject from './draw-object'

export default class Text extends DrawObject {
  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    id: string = 'text'
  ) {
    super(x, y, id, text, width, height, '#fff', 12, 'v-text')
  }

  override draw(rotation: number) {
    const ret = super.draw()

    ret.config = {
      ...ret.config,
      x: this.x + this.width / 2,
      y: this.y + this.height / 2,
      fontSize: this.fontSize,
      text: this.text,
      align: 'center',
      verticalAlign: 'middle',
      rotation: -(rotation % 360),
      offsetX: this.width / 2,
      offsetY: this.height / 2
    }

    return ret
  }
}
