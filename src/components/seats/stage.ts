import { ref } from 'vue'
import { DrawUntil, type DrawObjectData } from './basic'
import { Seat } from './seat'
import Group from './group'
import Container from './container'

export default class DrawStage {
  private drawObjectDatas = ref<DrawObjectData[]>([])

  constructor(private datas: any[] = []) {}

  get drawObject() {
    return this.drawObjectDatas
  }

  /**
   * This function will draw all the objects in the stage. It is a usecase of the Composite pattern.
   *
   * @param datas
   */
  public draw(width: number, height: number) {
    if (this.datas.length !== 0) {
      this.drawObjectDatas.value = this.datas
      return
    }
    DrawUntil.seat_id_reset()

    const non_notebook_seats = new Group(0, 0, -45, [], 'non-notebook-seats')

    const non_notebook_seat_map = [
      [0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 0],
      [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0],
      [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1],
      [1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1],
      [1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1],
      [1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0],
      [0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0]
    ]

    non_notebook_seat_map.forEach((row, rowIndex) => {
      row.forEach((seat, columnIndex) => {
        if (seat === 1) {
          const x = columnIndex * 55
          const y = rowIndex * 55
          non_notebook_seats.add(new Seat(x, y, 0, DrawUntil.seat_id_gen('B')))
        }
      })
    })

    const notebook_seats = new Group(-75, -100, 0, [], 'notebook-seats')

    for (let i = 1; i <= 21; ++i) {
      for (let j = 1; j <= 2; ++j) {
        if (i === 5 || i === 6 || i === 19) continue
        notebook_seats.add(new Seat(i * 55, j * 55, 0, DrawUntil.seat_id_gen('A')))
      }
    }

    for (let i = 1; i <= 14; ++i) {
      for (let j = 1; j <= 3; ++j) {
        notebook_seats.add(new Seat(j * 55, i * 60 + 190, 0, DrawUntil.seat_id_gen('A')))
      }
    }

    for (let i = 1; i <= 2; ++i) {
      for (let j = 1; j <= 4; ++j) {
        notebook_seats.add(new Seat(i * 55 + 190, j * 55 + 780, 0, DrawUntil.seat_id_gen('B')))
      }
    }

    notebook_seats.add(new Container(300, 80, { width: 100, height: 100, fill: '#242873', text: '樓梯門', fontSize: 28, concerRadius: 5 }))
    notebook_seats.add(new Container(1350, 480, { width: 100, height: 900, fill: '#242873', text: '大門', fontSize: 28, concerRadius: 5 }))
    notebook_seats.add(new Container(1350, 980, { width: 100, height: 200, fill: '#242873', text: '男廁', fontSize: 28, concerRadius: 5 }))
    notebook_seats.add(new Container(1200, 1005, { width: 150, height: 150, fill: '#242873', text: '電梯', fontSize: 28, concerRadius: 5 }))

    const all_groups = new Group(width / 2, height / 2, 0, [], 'all-seats')
    all_groups.add(non_notebook_seats)
    all_groups.add(notebook_seats)

    this.drawObjectDatas.value.push(all_groups.draw())
  }
}