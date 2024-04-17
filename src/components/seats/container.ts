import Group from './group'
import Text from './text'
import DrawObject, { type DrawObjectConfig } from './draw-object'

class Rect extends DrawObject {
  constructor(x: number, y: number, config: DrawObjectConfig = {}) {
    const { width = 0, height = 0, fill = '#FFF', id = 'rect' } = config

    super(x, y, id, { width, height, fill, concerRadius: config.concerRadius })
  }
}

export default class Container extends Group {
  constructor(x: number, y: number, config: DrawObjectConfig = {}) {
    let children: DrawObject[] = []
    if (config.text) {
      children = [
        new Rect(0, 0, { width: config.width, height: config.height, fill: config.fill, concerRadius: config.concerRadius }),
        new Text(0, 0, { width: config.width, height: config.height, text: config.text, fontSize: config.fontSize }),
      ]
    } else {
      children = [
        new Rect(0, 0, { width: config.width, height: config.height, fill: config.fill, concerRadius: config.concerRadius })
      ]
    }
    super(x, y, 0, children, 'container')
  }
}
