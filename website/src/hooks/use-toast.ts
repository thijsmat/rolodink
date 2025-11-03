import { toast } from "sonner"

type ToastActionElement = React.ReactNode

export interface Toast {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ToasterToast = Toast & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let listeners: Array<(state: ToasterToast[]) => void> = []

let memory: ToasterToast[] = []

function dispatch(action: any) {
  switch (action.type) {
    case "ADD_TOAST":
      return memory = [action.toast, ...memory].slice(0, TOAST_LIMIT)
    case "UPDATE_TOAST":
      return memory = memory.map((t) =>
        t.id === action.toast.id ? { ...t, ...action.toast } : t
      )
    case "DISMISS_TOAST": {
      const { toastId } = action
      if (toastId) {
        setTimeout(() => {
          dispatch({ type: "REMOVE_TOAST", toastId })
        }, TOAST_REMOVE_DELAY)
      } else {
        memory.forEach((toast) => {
          setTimeout(() => {
            dispatch({ type: "REMOVE_TOAST", toastId: toast.id })
          }, TOAST_REMOVE_DELAY)
        })
      }
      return memory = memory.map((t) =>
        t.id === toastId || toastId === undefined ? { ...t, open: false } : t
      )
    }
    case "REMOVE_TOAST":
      return memory = memory.filter((t) => t.id !== action.toastId)
  }
}

function toast_({ ...props }: Toast) {
  const id = genId()
  const update = (props: ToasterToast) =>
    dispatch({ type: "UPDATE_TOAST", toast: { ...props, id } })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open: boolean) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

export function useToast() {
  return { toast: toast_ }
}

export { toast_ as toast }
