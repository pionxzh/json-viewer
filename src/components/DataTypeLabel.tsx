import type { FC } from 'react'

export type DataLabelProps = {
  dataType: string
  enable?: boolean
}

export const DataTypeLabel: FC<DataLabelProps> = ({ dataType, enable = true }) => {
  if (!enable) return null

  return (
    <span className='data-type-label jv-data-type-label'>
      {dataType}
    </span>
  )
}
