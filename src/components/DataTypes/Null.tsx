import { defineEasyType } from './defineEasyType'

export const nullType = defineEasyType<null>({
  is: (value) => value === null,
  type: 'null',
  colorKey: 'base08',
  displayTypeLabel: false,
  Renderer: () => {
    return (
      <div className='jv-type-null'>
        NULL
      </div>
    )
  }
})
