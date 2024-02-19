import DrawObject, { type DrawObjectConfig } from './draw-object'

export default class Table extends DrawObject {
  constructor(x: number, y: number, config: DrawObjectConfig = {}) {
    const { width = 0, height = 0, fill = '#FFF', id = 'table' } = config

    super(x, y, id, { width, height, fill })
  }
}
