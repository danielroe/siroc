export const time = (id: string) => {
  if (process.env.TIME) console.time(id)
}
export const timeEnd = (id: string) => {
  if (process.env.TIME) console.timeEnd(id)
}
