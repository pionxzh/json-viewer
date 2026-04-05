import type { ChangeEventHandler, ComponentType, FC, KeyboardEvent } from 'react'
import { memo, useCallback } from 'react'

import { useJsonViewerStore } from '../../stores/JsonViewerStore'
import type { Colorspace } from '../../theme/base16'
import type { DataItemProps, DataType, EditorProps } from '../../type'
import { DataTypeLabel } from '../DataTypeLabel'

export type EasyTypeConfig<Value> = Pick<DataType<Value>, 'is' | 'serialize' | 'deserialize'> & {
  type: string
  colorKey: keyof Colorspace
  displayTypeLabel?: boolean
  Renderer: ComponentType<DataItemProps<Value>>
}
/**
 * Enhanced version of `defineDataType` that creates a `DataType` with editor and a optional type label.
 * It will take care of the color and all the necessary props.
 *
 * *All of the built-in data types are defined with this function.*
 *
 * @param config.type The type name.
 * @param config.colorKey The color key in the colorspace. ('base00' - 'base0F')
 * @param config.displayTypeLabel Whether to display the type label.
 * @param config.Renderer The component to render the value.
 */
export function defineEasyType<Value> ({
  is,
  serialize,
  deserialize,
  type,
  colorKey,
  displayTypeLabel = true,
  Renderer
}: EasyTypeConfig<Value>): DataType<Value> {
  const Render = memo(Renderer)
  const EasyType: FC<DataItemProps<Value>> = (props) => {
    const storeDisplayDataTypes = useJsonViewerStore(store => store.displayDataTypes)
    const color = useJsonViewerStore(store => store.colorspace[colorKey])
    const onSelect = useJsonViewerStore(store => store.onSelect)

    return (
      <span className='jv-inline-block' onClick={() => onSelect?.(props.path, props.value)} style={{ color }}>
        {(displayTypeLabel && storeDisplayDataTypes) && <DataTypeLabel dataType={type} />}
        <span className={`${type}-value jv-inline-block`}>
          <Render
            path={props.path}
            inspect={props.inspect}
            setInspect={props.setInspect}
            value={props.value}
            prevValue={props.prevValue}
          />
        </span>
      </span>
    )
  }
  EasyType.displayName = `easy-${type}-type`

  if (!serialize || !deserialize) {
    return {
      is,
      Component: EasyType
    }
  }

  const EasyTypeEditor: FC<EditorProps<string>> = ({ value, setValue, abortEditing, commitEditing }) => {
    const handleKeyDown = useCallback((event: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        commitEditing(value)
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        abortEditing()
      }
    }, [abortEditing, commitEditing, value])

    const handleChange = useCallback<ChangeEventHandler<HTMLTextAreaElement | HTMLInputElement>>((event) => {
      setValue(event.target.value)
    }, [setValue])

    return (
      <textarea
        autoFocus
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className='jv-easy-type-editor'
        style={{ color: `var(--jv-${colorKey})` }}
      />
    )
  }
  EasyTypeEditor.displayName = `easy-${type}-type-editor`

  return {
    is,
    serialize,
    deserialize,
    Component: EasyType,
    Editor: EasyTypeEditor
  }
}
