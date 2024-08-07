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
      [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0,],
      [0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0,],
      [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0,],
      [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0,],
      [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0,],
      [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0,],
      [1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0,],
      [1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0,],
      [1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 0,],
      [1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 0,],
      [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0,],
      [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0,],
      [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0,],
      [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0,]
    ]

    const seatWidth = 55
    const seatHeight = 55
    const gap = 12

    non_notebook_seat_map.forEach((row, rowIndex) => {
      row.forEach((seat, columnIndex) => {
        if (seat === 1) {
          const tableRow = Math.floor(rowIndex / 2)
          const tableColumn = Math.floor(columnIndex / 2)
          const x = columnIndex * seatWidth + tableColumn * gap
          const y = rowIndex * seatHeight + tableRow * gap
          non_notebook_seats.add(new Seat(x, y, 0, DrawUntil.seat_id_gen('B')))
        }
      })
    })

    const non_notebook_seat_map_2 = [
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1],
      [0, 0, 1, 1, 0, 0],
      [0, 0, 1, 1, 0, 0],
    ]

    non_notebook_seat_map_2.forEach((row, rowIndex) => {
      row.forEach((seat, columnIndex) => {
        if (seat === 1) {
          const tableRow = Math.floor(rowIndex / 2)
          const tableColumn = Math.floor(columnIndex / 2)
          const x = columnIndex * seatWidth + tableColumn * gap + 680
          const y = rowIndex * seatHeight + tableRow * gap
          non_notebook_seats.add(new Seat(x, y, 0, DrawUntil.seat_id_gen('B')))
        }
      })
    })

    for (let i = 1; i <= 2; ++i) {
      for (let j = 1; j <= 3; ++j) {
        const x = i * seatWidth + 625
        const y = j * seatHeight + 55
        non_notebook_seats.add(new Seat(x, y, 0, DrawUntil.seat_id_gen('B')))
      }
    }

    for (let i = 1; i <= 2; ++i) {
      for (let j = 1; j <= 2; ++j) {
        const x = i * seatWidth + 805
        const y = j * seatHeight + 165
        non_notebook_seats.add(new Seat(x, y, 0, DrawUntil.seat_id_gen('B')))
      }
    }

    const notebook_seats = new Group(-30, -100, 0, [], 'notebook-seats')

    for (let i = 1; i <= 21; ++i) {
      for (let j = 1; j <= 2; ++j) {
        if (i === 5 || i === 6 || i === 19) continue
        const tableRow = Math.floor((j - 1) / 2)
        const tableColumn = Math.floor((i - 1) / 2)
        const x = i * seatWidth + tableColumn * gap
        const y = j * seatHeight + tableRow * gap
        notebook_seats.add(new Seat(x, y, 0, DrawUntil.seat_id_gen('A')))
      }
    }

    for (let i = 1; i <= 14; ++i) {
      for (let j = 1; j <= 3; ++j) {
        const tableRow = Math.floor((i - 1) / 2)
        const x = j * seatWidth
        const y = i * seatHeight + tableRow * 30 + 150
        notebook_seats.add(new Seat(x, y, 0, DrawUntil.seat_id_gen('A')))
      }
    }

    for (let i = 1; i <= 2; ++i) {
      for (let j = 1; j <= 4; ++j) {
        const tableRow = Math.floor((j - 1) / 2)
        const x = i * seatWidth + 190
        const y = j * seatHeight + tableRow * gap + 780
        notebook_seats.add(
          new Seat(x, y, 0, DrawUntil.seat_id_gen('B'))
        )
      }
    }

    notebook_seats.add(
      new Container(325, 82.5, {
        width: 100,
        height: 100,
        fill: '#242873',
        text: 'StairDoor',
        fontSize: 28,
        concerRadius: 5
      })
    )
    notebook_seats.add(
      new Container(1450, 480, {
        width: 100,
        height: 900,
        fill: '#242873',
        text: 'MainDoor',
        fontSize: 28,
        concerRadius: 5
      })
    )
    notebook_seats.add(
      new Container(1450, 980, {
        width: 100,
        height: 300,
        fill: '#242873',
        text: 'MenToilet',
        fontSize: 28,
        concerRadius: 5
      })
    )
    notebook_seats.add(
      new Container(1300, 1055, {
        width: 150,
        height: 150,
        fill: '#242873',
        text: 'Elevator',
        fontSize: 28,
        concerRadius: 5
      })
    )

    const all_groups = new Group(width / 2, height / 2, 0, [], 'all-seats')
    all_groups.add(non_notebook_seats)
    all_groups.add(notebook_seats)

    this.drawObjectDatas.value.push(all_groups.draw())
  }
}
