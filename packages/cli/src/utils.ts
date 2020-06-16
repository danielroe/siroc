export const time = (id: string) => {
  if (process.env.TIME) console.time(id)
}
export const timeEnd = (id: string) => {
  if (process.env.TIME) console.timeEnd(id)
}

export type RemoveFirst<T extends Array<any>> = T[1] extends undefined
  ? never[]
  : [T[1]]
