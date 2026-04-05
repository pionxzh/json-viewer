import clsx from 'clsx'
import type { FC } from 'react'
import { useMemo, useState } from 'react'

import { useIsCycleReference } from '../../hooks/useIsCycleReference'
import { useJsonViewerStore } from '../../stores/JsonViewerStore'
import type { DataItemProps, DataType } from '../../type'
import { getValueSize, segmentArray } from '../../utils'
import { DataKeyPair } from '../DataKeyPair'
import { CircularArrowsIcon } from '../Icons'

const objectLb = '{'
const arrayLb = '['
const objectRb = '}'
const arrayRb = ']'

function inspectMetadata (value: object) {
  const length = getValueSize(value)

  let name = ''
  if (value instanceof Map || value instanceof Set) {
    name = value[Symbol.toStringTag]
  }
  if (Object.prototype.hasOwnProperty.call(value, Symbol.toStringTag)) {
    name = (value as any)[Symbol.toStringTag]
  }
  const itemsPluralized = length === 1 ? 'Item' : 'Items'
  return `${length} ${itemsPluralized}${name ? ` (${name})` : ''}`
}

const PreObjectType: FC<DataItemProps<object>> = (props) => {
  const isArrayLike = useMemo(() => Array.isArray(props.value) || (props.value instanceof Set), [props.value])
  const isEmptyValue = useMemo(() => getValueSize(props.value) === 0, [props.value])
  const sizeOfValue = useMemo(() => inspectMetadata(props.value), [props.value])
  const displaySize = useJsonViewerStore(store => store.displaySize)
  const shouldDisplaySize = useMemo(() => typeof displaySize === 'function' ? displaySize(props.path, props.value) : displaySize, [displaySize, props.path, props.value])
  const isTrap = useIsCycleReference(props.path, props.value)
  return (
    <span className='jv-object-start data-object-start'>
      {isArrayLike ? arrayLb : objectLb}
      {shouldDisplaySize && props.inspect && !isEmptyValue && (
        <span className='jv-object-size'>
          {sizeOfValue}
        </span>
      )}

      {isTrap && !props.inspect && (
        <>
          <CircularArrowsIcon
            size='small'
          />
          <span
            className='jv-inline-block'
            style={{
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            {isTrap}
          </span>
        </>
      )}
    </span>
  )
}

const PostObjectType: FC<DataItemProps<object>> = (props) => {
  const isArrayLike = useMemo(() => Array.isArray(props.value) || (props.value instanceof Set), [props.value])
  const isEmptyValue = useMemo(() => getValueSize(props.value) === 0, [props.value])
  const sizeOfValue = useMemo(() => inspectMetadata(props.value), [props.value])
  const displaySize = useJsonViewerStore(store => store.displaySize)
  const shouldDisplaySize = useMemo(() => typeof displaySize === 'function' ? displaySize(props.path, props.value) : displaySize, [displaySize, props.path, props.value])

  return (
    <span
      className='data-object-end jv-object-end'
    >
      {isArrayLike ? arrayRb : objectRb}
      {shouldDisplaySize && (isEmptyValue || !props.inspect)
        ? (
          <span className='jv-object-size'>
            {sizeOfValue}
          </span>
          )
        : null}
    </span>
  )
}

function getIterator (value: any): value is Iterable<unknown> {
  return typeof value?.[Symbol.iterator] === 'function'
}

const ObjectType: FC<DataItemProps<object>> = (props) => {
  const groupArraysAfterLength = useJsonViewerStore(store => store.groupArraysAfterLength)
  const isTrap = useIsCycleReference(props.path, props.value)
  const [displayLength, setDisplayLength] = useState(useJsonViewerStore(store => store.maxDisplayLength))
  const objectSortKeys = useJsonViewerStore(store => store.objectSortKeys)
  const elements = useMemo(() => {
    if (!props.inspect) {
      return null
    }
    const value: unknown[] | object = props.value
    const iterator = getIterator(value)
    // Array also has iterator, we skip it and treat it as an array as normal.
    if (iterator && !Array.isArray(value)) {
      const elements = []
      if (value instanceof Map) {
        const lastIndex = value.size - 1
        let index = 0
        value.forEach((value, k) => {
          // fixme: key might be a object, array, or any value for the `Map<any, any>`
          const key = k.toString()
          const path = [...props.path, key]
          elements.push(
            <DataKeyPair
              key={key}
              path={path}
              value={value}
              prevValue={props.prevValue instanceof Map ? props.prevValue.get(k) : undefined}
              editable={false}
              last={index === lastIndex}
            />
          )
          index++
        })
      } else {
        // iterate with iterator func
        const iterator = value[Symbol.iterator]()
        let result = iterator.next()
        let count = 0
        while (true) {
          const nextResult = iterator.next()
          elements.push(
            <DataKeyPair
              key={count}
              path={[...props.path, `iterator:${count}`]}
              value={result.value}
              nestedIndex={count}
              editable={false}
              last={nextResult.done ?? false}
            />
          )

          if (nextResult.done) {
            break
          }

          count++
          result = nextResult
        }
      }
      return elements
    }
    if (Array.isArray(value)) {
      const lastIndex = value.length - 1
      // unknown[]
      if (value.length <= groupArraysAfterLength) {
        const elements = value.slice(0, displayLength).map((value, _index) => {
          const index = props.nestedIndex ? (props.nestedIndex * groupArraysAfterLength) + _index : _index
          const path = [...props.path, index]
          return (
            <DataKeyPair
              key={index}
              path={path}
              value={value}
              prevValue={Array.isArray(props.prevValue) ? props.prevValue[index] : undefined}
              last={_index === lastIndex}
            />
          )
        })
        if (value.length > displayLength) {
          const rest = value.length - displayLength
          elements.push(
            <span
              className='jv-object-group'
              key='last'
              onClick={() => setDisplayLength(length => length * 2)}
            >
              hidden {rest} items…
            </span>
          )
        }
        return elements
      }

      const elements: unknown[][] = segmentArray(value, groupArraysAfterLength)
      const prevElements = Array.isArray(props.prevValue) ? segmentArray(props.prevValue, groupArraysAfterLength) : undefined

      const elementsLastIndex = elements.length - 1
      return elements.map((list, index) => {
        return (
          <DataKeyPair
            key={index}
            path={props.path}
            value={list}
            nestedIndex={index}
            prevValue={prevElements?.[index]}
            last={index === elementsLastIndex}
          />
        )
      })
    }
    // object
    let entries: [key: string, value: unknown][] = Object.entries(value)
    if (objectSortKeys) {
      entries = objectSortKeys === true
        ? entries.sort(([a], [b]) => a.localeCompare(b))
        : entries.sort(([a], [b]) => objectSortKeys(a, b))
    }
    const lastIndex = entries.length - 1
    const elements = entries.slice(0, displayLength).map(([key, value], index) => {
      const path = [...props.path, key]
      return (
        <DataKeyPair
          key={key}
          path={path}
          value={value}
          prevValue={(props.prevValue as any)?.[key]}
          last={index === lastIndex}
        />
      )
    })
    if (entries.length > displayLength) {
      const rest = entries.length - displayLength
      elements.push(
        <span
          className='jv-object-group'
          key='last'
          onClick={() => setDisplayLength(length => length * 2)}
        >
          hidden {rest} items…
        </span>
      )
    }
    return elements
  }, [
    props.inspect,
    props.value,
    props.prevValue,
    props.path,
    props.nestedIndex,
    groupArraysAfterLength,
    displayLength,
    objectSortKeys
  ])
  const marginLeft = props.inspect ? 0.6 : 0
  const width = useJsonViewerStore(store => store.indentWidth)
  const indentWidth = props.inspect ? width - marginLeft : width
  const isEmptyValue = useMemo(() => getValueSize(props.value) === 0, [props.value])
  if (isEmptyValue) {
    return null
  }
  return (
    <div
      className={clsx('data-object', 'jv-object')}
      data-inspect={props.inspect}
      style={{
        paddingLeft: props.inspect ? `calc(${indentWidth - 0.6} * var(--jv-spacing-unit))` : '0'
      }}
    >
      {
        props.inspect
          ? elements
          : !isTrap && (
            <span
              className='data-object-body jv-function-collapse'
              onClick={() => props.setInspect(true)}
              style={{
                userSelect: 'none'
              }}
            >
              …
            </span>
            )
      }
    </div>
  )
}

export const objectType: DataType<object> = {
  is: (value) => typeof value === 'object',
  Component: ObjectType,
  PreComponent: PreObjectType,
  PostComponent: PostObjectType
}
