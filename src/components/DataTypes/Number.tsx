import { defineEasyType } from './defineEasyType'

const isInt = (n: number) => n % 1 === 0

export const nanType = defineEasyType<number>({
  is: (value) => typeof value === 'number' && isNaN(value),
  type: 'NaN',
  colorKey: 'base08',
  displayTypeLabel: false,
  serialize: () => 'NaN',
  // allow deserialize the value back to number
  deserialize: (value) => parseFloat(value),
  Renderer: () => {
    return (
      <div className='jv-type-nan'>
        NaN
      </div>
    )
  }
})

export const floatType = defineEasyType<number>({
  is: (value) => typeof value === 'number' && !isInt(value) && !isNaN(value),
  type: 'float',
  colorKey: 'base0B',
  serialize: value => value.toString(),
  deserialize: value => parseFloat(value),
  Renderer: ({ value }) => <>{value}</>
})

export const intType = defineEasyType<number>({
  is: (value) => typeof value === 'number' && isInt(value),
  type: 'int',
  colorKey: 'base0F',
  serialize: value => value.toString(),
  // allow deserialize the value to float
  deserialize: value => parseFloat(value),
  Renderer: ({ value }) => <>{value}</>
})

export const bigIntType = defineEasyType<bigint>({
  is: (value) => typeof value === 'bigint',
  type: 'bigint',
  colorKey: 'base0F',
  serialize: value => value.toString(),
  deserialize: value => BigInt(value.replace(/\D/g, '')),
  Renderer: ({ value }) => <>{`${value}n`}</>
})
