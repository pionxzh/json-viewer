import { defineEasyType } from './defineEasyType'

export const undefinedType = defineEasyType<undefined>({
  is: (value) => value === undefined,
  type: 'undefined',
  colorKey: 'base05',
  displayTypeLabel: false,
  Renderer: () => {
    return (
      <div className='jv-type-undefined'>
        undefined
      </div>
    )
  }
})
