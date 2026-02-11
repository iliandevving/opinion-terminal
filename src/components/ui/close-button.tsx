import { IconButton } from "@chakra-ui/react"
import * as React from "react"
import { LuX } from "react-icons/lu"

export type CloseButtonProps = React.ComponentPropsWithRef<typeof IconButton>;

export const CloseButton = React.forwardRef<HTMLButtonElement, CloseButtonProps>(
  function CloseButton(props, ref) {
    return (
      <IconButton variant="ghost" aria-label="Close" ref={ref} {...props}>
        {props.children ?? <LuX />}
      </IconButton>
    )
  },
)
