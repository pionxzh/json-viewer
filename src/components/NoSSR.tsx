import { type FC, type PropsWithChildren, useEffect, useState } from 'react'

export const NoSsr: FC<PropsWithChildren> = (props) => {
  const { children } = props
  const [mountedState, setMountedState] = useState(false)

  useEffect(() => {
    setMountedState(true)
  }, [])

  return mountedState ? children : null
}
