import { toast } from "sonner"

export { toast }

export const notify = {
  success: (msg: string, description?: string) =>
    toast.success(msg, description ? { description } : undefined),
  error: (msg: string, description?: string) =>
    toast.error(msg, description ? { description } : undefined),
  info: (msg: string, description?: string) =>
    toast(msg, description ? { description } : undefined),
}
