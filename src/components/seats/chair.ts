import DrawObject from './draw-object'

export default class Chair extends DrawObject {
  constructor(
    x: number,
    y: number,
    width: number = 0,
    height: number = 0,
    id: string = 'chair',
    color: string = '#00bd7e'
  ) {
    super(x, y, id, '', width, height, color)
  }

  override draw() {
    const ret = super.draw()
    // annotate the seat as a seat, so that optimizied
    // compute the seat color (status)
    ret.config.seat = true

    return ret
  }
}
