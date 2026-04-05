import clsx from 'clsx'
import { useState } from 'react'

import { useJsonViewerStore } from '../../stores/JsonViewerStore'
import { defineEasyType } from './defineEasyType'

export const stringType = defineEasyType<string>({
  is: (value) => typeof value === 'string',
  type: 'string',
  colorKey: 'base09',
  serialize: value => value,
  deserialize: value => value,
  Renderer: (props) => {
    const [showRest, setShowRest] = useState(false)
    const collapseStringsAfterLength = useJsonViewerStore(store => store.collapseStringsAfterLength)
    const value = showRest
      ? props.value
      : props.value.slice(0, collapseStringsAfterLength)
    const hasRest = props.value.length > collapseStringsAfterLength
    return (
      <span
        className={clsx('jv-type-string', hasRest && 'jv-expandable')}
        onClick={() => {
          if (window.getSelection()?.type === 'Range') {
            return
          }

          if (hasRest) {
            setShowRest(value => !value)
          }
        }}
      >
        &quot;
        {value}
        {hasRest && !showRest && (<span className='jv-ellipsis'>…</span>)}
        &quot;
      </span>
    )
  }
})
