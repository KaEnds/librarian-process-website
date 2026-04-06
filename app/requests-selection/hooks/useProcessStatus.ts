import { useEffect, useState } from "react"

export const useProcessStatus = (processId: number) => {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isProcessStatusLoading, setIsProcessStatusLoading] = useState(true)
  const [processStatus, setProcessStatus] = useState<string | null>(null)

  useEffect(() => {
    const fetchProcessStatus = async () => {
      setIsProcessStatusLoading(true)
      try {
        const response = await fetch(`/api/get-process-state?processId=${processId}`)
        if (response.ok) {
          const data = await response.json()
          const status = data.status
          
          setProcessStatus(status)
          setIsSubmitted(status === 'DONE')
        }
      } catch (error) {
        console.error('Error fetching process status:', error)
      } finally {
        setIsProcessStatusLoading(false)
      }
    }

    fetchProcessStatus()
  }, [processId])

  return { isSubmitted, setIsSubmitted, isProcessStatusLoading, processStatus, setProcessStatus }
}
