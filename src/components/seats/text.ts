import DrawObject, { type DrawObjectConfig } from './draw-object'

export default class Text extends DrawObject {
  constructor(x: number, y: number, config: DrawObjectConfig = {}) {
    const {
      width = 0,
      height = 0,
      text = '',
      id = 'text',
      fill = '#fff',
      fontSize = 8,
      type = 'v-text'
    } = config
    super(x, y, id, { text, width, height, fill, fontSize, type })
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
