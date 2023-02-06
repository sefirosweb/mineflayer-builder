const blocksWithVariablePropierties: Record<string, {
  prop: string,
  defaultValue: boolean | string | number
}> = {
  "birch_trapdoor": { prop: 'open', defaultValue: false },
  "acacia_trapdoor": { prop: 'open', defaultValue: false },
  "dark_oak_trapdoor": { prop: 'open', defaultValue: false },
  "jungle_trapdoor": { prop: 'open', defaultValue: false },
  "oak_trapdoor": { prop: 'open', defaultValue: false },
  "comparator": { prop: 'mode', defaultValue: 'substract' }
}

export default blocksWithVariablePropierties