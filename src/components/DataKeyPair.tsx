import type { FC, MouseEvent, PropsWithChildren } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useClipboard } from '../hooks/useCopyToClipboard'
import { useInspect } from '../hooks/useInspect'
import { useJsonViewerStore } from '../stores/JsonViewerStore'
import { useTypeComponents } from '../stores/typeRegistry'
import type { DataItemProps } from '../type'
import { copyString, getValueSize, isPlainObject } from '../utils'
import {
  AddBoxIcon,
  CheckIcon,
  ChevronRightIcon,
  CloseIcon,
  ContentCopyIcon,
  DeleteIcon,
  EditIcon,
  ExpandMoreIcon
} from './Icons'

export type DataKeyPairProps = {
  value: unknown
  prevValue?: unknown
  nestedIndex?: number
  editable?: boolean
  path: (string | number)[]
  last: boolean
}

const IconBox: FC<PropsWithChildren &{ onClick?: (e: MouseEvent) => void }> = ({ children, onClick }) => (
  <span className='jv-icon-box' onClick={onClick}>
    {children}
  </span>
)

export const DataKeyPair: FC<DataKeyPairProps> = (props) => {
  const { value, prevValue, path, nestedIndex, last } = props
  const { Component, PreComponent, PostComponent, Editor, serialize, deserialize } = useTypeComponents(value, path)

  const propsEditable = props.editable ?? undefined
  const storeEditable = useJsonViewerStore(store => store.editable)
  const editable = useMemo(() => {
    if (storeEditable === false) {
      return false
    }
    if (propsEditable === false) {
      // props.editable is false which means we cannot provide the suitable way to edit it
      return false
    }
    if (typeof storeEditable === 'function') {
      return !!storeEditable(path, value)
    }
    return storeEditable
  }, [path, propsEditable, storeEditable, value])
  const [tempValue, setTempValue] = useState<string>('')
  const depth = path.length
  const key = path[depth - 1]
  const hoverPath = useJsonViewerStore(store => store.hoverPath)
  const isHover = useMemo(() => {
    return hoverPath && path.every(
      (value, index) => value === hoverPath.path[index] && nestedIndex ===
        hoverPath.nestedIndex)
  }, [hoverPath, path, nestedIndex])
  const setHover = useJsonViewerStore(store => store.setHover)
  const root = useJsonViewerStore(store => store.value)
  const [inspect, setInspect] = useInspect(path, value, nestedIndex)
  const [editing, setEditing] = useState(false)
  const onChange = useJsonViewerStore(store => store.onChange)
  const highlightColor = useJsonViewerStore(store => store.colorspace.base0A)
  const displayComma = useJsonViewerStore(store => store.displayComma)
  const quotesOnKeys = useJsonViewerStore(store => store.quotesOnKeys)
  const rootName = useJsonViewerStore(store => store.rootName)
  const isRoot = root === value
  const isNumberKey = Number.isInteger(Number(key))

  const storeEnableAdd = useJsonViewerStore(store => store.enableAdd)
  const onAdd = useJsonViewerStore(store => store.onAdd)
  const enableAdd = useMemo(() => {
    if (!onAdd || nestedIndex !== undefined) return false

    if (storeEnableAdd === false) {
      return false
    }
    if (propsEditable === false) {
      // props.editable is false which means we cannot provide the suitable way to edit it
      return false
    }
    if (typeof storeEnableAdd === 'function') {
      return !!storeEnableAdd(path, value)
    }

    if (Array.isArray(value) || isPlainObject(value)) {
      return true
    }

    return false
  }, [onAdd, nestedIndex, path, storeEnableAdd, propsEditable, value])

  const storeEnableDelete = useJsonViewerStore(store => store.enableDelete)
  const onDelete = useJsonViewerStore(store => store.onDelete)
  const enableDelete = useMemo(() => {
    if (!onDelete || nestedIndex !== undefined) return false

    if (isRoot) {
      // don't allow delete root
      return false
    }
    if (storeEnableDelete === false) {
      return false
    }
    if (propsEditable === false) {
      // props.editable is false which means we cannot provide the suitable way to edit it
      return false
    }
    if (typeof storeEnableDelete === 'function') {
      return !!storeEnableDelete(path, value)
    }
    return storeEnableDelete
  }, [onDelete, nestedIndex, isRoot, path, storeEnableDelete, propsEditable, value])

  const enableClipboard = useJsonViewerStore(store => store.enableClipboard)
  const { copy, copied } = useClipboard()

  const highlightUpdates = useJsonViewerStore(store => store.highlightUpdates)
  const isHighlight = useMemo(() => {
    if (!highlightUpdates || prevValue === undefined) return false

    // highlight if value type changed
    if (typeof value !== typeof prevValue) {
      return true
    }

    if (typeof value === 'number') {
      // notice: NaN !== NaN
      if (isNaN(value) && isNaN(prevValue as number)) return false
      return value !== prevValue
    }

    // highlight if isArray changed
    if (Array.isArray(value) !== Array.isArray(prevValue)) {
      return true
    }

    // not highlight object/function
    // deep compare they will be slow
    if (typeof value === 'object' || typeof value === 'function') {
      return false
    }

    // highlight if not equal
    if (value !== prevValue) {
      return true
    }

    return false
  }, [highlightUpdates, prevValue, value])
  const highlightContainer = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (highlightContainer.current && isHighlight && 'animate' in highlightContainer.current) {
      highlightContainer.current.animate(
        [
          { backgroundColor: highlightColor },
          { backgroundColor: '' }
        ],
        {
          duration: 1000,
          easing: 'ease-in'
        }
      )
    }
  }, [highlightColor, isHighlight, prevValue, value])

  const startEditing = useCallback((event: MouseEvent) => {
    event.preventDefault()
    if (serialize) setTempValue(serialize(value))
    setEditing(true)
  }, [serialize, value])

  const abortEditing = useCallback(() => {
    setEditing(false)
    setTempValue('')
  }, [setEditing, setTempValue])

  const commitEditing = useCallback((newValue: string) => {
    setEditing(false)
    if (!deserialize) return

    try {
      onChange(path, value, deserialize(newValue))
    } catch {
      // do nothing when deserialize failed
    }
  }, [setEditing, deserialize, onChange, path, value])

  const actionIcons = useMemo(() => {
    if (editing) {
      return (
        <>
          <IconBox>
            <CloseIcon
              size='small'
              onClick={abortEditing}
            />
          </IconBox>
          <IconBox>
            <CheckIcon
              size='small'
              onClick={() => commitEditing(tempValue)}
            />
          </IconBox>
        </>
      )
    }
    return (
      <>
        {enableClipboard && (
          <IconBox
            onClick={event => {
              event.preventDefault()
              try {
                copy(path, value, copyString)
              } catch (e) {
                // in some case, this will throw error
                // fixme: `useAlert` hook
                console.error(e)
              }
            }}
          >
            {
              copied
                ? <CheckIcon size='small' />
                : <ContentCopyIcon size='small' />
            }
          </IconBox>
        )}
        {(Editor && editable && serialize && deserialize) &&
          (
            <IconBox
              onClick={startEditing}
            >
              <EditIcon size='small' />
            </IconBox>
          )}
        {enableAdd && (
          <IconBox
            onClick={event => {
              event.preventDefault()
              onAdd?.(path)
            }}
          >
            <AddBoxIcon size='small' />
          </IconBox>
        )}
        {enableDelete && (
          <IconBox
            onClick={event => {
              event.preventDefault()
              onDelete?.(path, value)
            }}
          >
            <DeleteIcon size='medium' />
          </IconBox>
        )}
      </>
    )
  },
  [
    Editor,
    serialize,
    deserialize,
    copied,
    copy,
    editable,
    editing,
    enableClipboard,
    enableAdd,
    enableDelete,
    tempValue,
    path,
    value,
    onAdd,
    onDelete,
    startEditing,
    abortEditing,
    commitEditing
  ])

  const isEmptyValue = useMemo(() => getValueSize(value) === 0, [value])
  const expandable = !isEmptyValue && !!(PreComponent && PostComponent)
  const KeyRenderer = useJsonViewerStore(store => store.keyRenderer)
  const downstreamProps: DataItemProps = useMemo(() => ({
    path,
    inspect,
    setInspect,
    value,
    prevValue,
    nestedIndex
  }), [inspect, path, setInspect, value, prevValue, nestedIndex])
  return (
    <div
      className='data-key-pair jv-data-key-pair'
      data-testid={'data-key-pair' + path.join('.')}
      onMouseEnter={
        useCallback(() => setHover(path, nestedIndex),
          [setHover, path, nestedIndex])
      }
    >
      <span
        className='data-key jv-data-key'
        onClick={
          useCallback((event: MouseEvent<HTMLSpanElement>) => {
            if (event.isDefaultPrevented()) {
              return
            }
            if (!isEmptyValue) {
              setInspect(state => !state)
            }
          }, [isEmptyValue, setInspect])
        }
      >
        {
          expandable
            ? (inspect
                ? (
                  <ExpandMoreIcon
                    size='small'
                    className='data-key-toggle-expanded jv-data-key-toggle'
                  />
                  )
                : (
                  <ChevronRightIcon
                    size='small'
                    className='data-key-toggle-collapsed jv-data-key-toggle'
                  />
                  )
              )
            : null
        }
        <span
          ref={highlightContainer}
          className='data-key-key'
        >
          {
            (isRoot && depth === 0
              ? rootName !== false
                ? (quotesOnKeys ? <>&quot;{rootName}&quot;</> : <>{rootName}</>)
                : null
              : KeyRenderer.when(downstreamProps)
                ? <KeyRenderer {...downstreamProps} />
                : nestedIndex === undefined && (
                  isNumberKey
                    ? (
                      <span
                        className='jv-number-key'
                      >
                        {key}
                      </span>
                      )
                    : quotesOnKeys ? <>&quot;{key}&quot;</> : <>{key}</>
                )
            )
          }
        </span>
        {
          (
            isRoot
              ? (rootName !== false && (
                <span
                  className='data-key-colon jv-colon'
                >:</span>
                ))
              : nestedIndex === undefined && (
                <span
                  className='data-key-colon jv-colon'
                  style={{
                    userSelect: isNumberKey ? 'none' : 'auto'
                  }}
                >:</span>
              )
          )
        }
        {PreComponent && <PreComponent {...downstreamProps} />}
        {(isHover && expandable && inspect) && actionIcons}
      </span>
      {
        (editing && editable)
          ? (Editor && (
            <Editor
              path={path}
              value={tempValue}
              setValue={setTempValue}
              abortEditing={abortEditing}
              commitEditing={commitEditing}
            />
            ))
          : (Component)
              ? <Component {...downstreamProps} />
              : (
                <span className='data-value-fallback'>
                  {`fallback: ${value}`}
                </span>
                )
      }
      {PostComponent && <PostComponent {...downstreamProps} />}
      {!last && displayComma && <span className='jv-inline-block'>,</span>}
      {(isHover && expandable && !inspect) && actionIcons}
      {(isHover && !expandable) && actionIcons}
      {(!isHover && editing) && actionIcons}
    </div>
  )
}
