/**
 * Use NoSsr on function value.
 *  Because in Next.js SSR, the function will be translated to other type
 */
import clsx from 'clsx'
import type { FC } from 'react'

import type { DataItemProps, DataType } from '../../type'
import { DataTypeLabel } from '../DataTypeLabel'
import { NoSsr } from '../NoSSR'

const functionBody = (func: Function) => {
  const funcString = func.toString()

  let isUsualFunction = true
  const parenthesisPos = funcString.indexOf(')')
  const arrowPos = funcString.indexOf('=>')
  if (arrowPos !== -1 && arrowPos > parenthesisPos) {
    isUsualFunction = false
  }
  if (isUsualFunction) {
    return funcString.substring(
      funcString.indexOf('{', parenthesisPos) + 1,
      funcString.lastIndexOf('}')
    )
  }

  return funcString.substring(funcString.indexOf('=>') + 2)
}

const functionName = (func: Function) => {
  const funcString = func.toString()
  const isUsualFunction = funcString.indexOf('function') !== -1
  if (isUsualFunction) {
    return funcString.substring(8, funcString.indexOf('{')).trim()
  }

  return funcString.substring(0, funcString.indexOf('=>') + 2).trim()
}

const lb = '{'
const rb = '}'

const PreFunctionType: FC<DataItemProps<Function>> = (props) => {
  return (
    <NoSsr>
      <DataTypeLabel dataType='function' />
      <span className='data-function-start jv-function-header'>
        {functionName(props.value)}
        {' '}{lb}
      </span>
    </NoSsr>
  )
}

const PostFunctionType: FC<DataItemProps<Function>> = () => {
  return (
    <NoSsr>
      <span className='data-function-end'>
        {rb}
      </span>
    </NoSsr>
  )
}

const FunctionType: FC<DataItemProps<Function>> = (props) => {
  return (
    <NoSsr>
      <div
        className={clsx('jv-function', 'data-function')}
        data-inspect={props.inspect}
      >
        {props.inspect
          ? functionBody(props.value)
          : (
            <span
              className='data-function-body jv-function-collapse'
              onClick={() => props.setInspect(true)}
            >
              …
            </span>
            )}
      </div>
    </NoSsr>
  )
}

export const functionType: DataType<Function> = {
  is: (value) => typeof value === 'function',
  Component: FunctionType,
  PreComponent: PreFunctionType,
  PostComponent: PostFunctionType
}
