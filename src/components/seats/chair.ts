import DrawObject, { type DrawObjectConfig } from './draw-object'

export default class Chair extends DrawObject {
  constructor(x: number, y: number, config: DrawObjectConfig = {}) {
    const { width = 0, height = 0, id = 'chair', fill = '#00bd7e', concerRadius = 0 } = config

    super(x, y, id, { width, height, fill, concerRadius })
  }

  override draw() {
    const ret = super.draw()
    // annotate the seat as a seat, so that optimizied
    // compute the seat color (status)
    ret.config.seat = true

    return ret
  }
}
