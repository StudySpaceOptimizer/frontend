import DrawObject from './draw-object'

export default class Table extends DrawObject {
  constructor(
    x: number,
    y: number,
    width: number = 0,
    height: number = 0,
    color: string = '#FFF',
    id: string = 'table'
  ) {
    super(x, y, id, '', width, height, color)
  }
}
