import { useEffect, useState } from "react"

export const useProcessStatus = (processId: number) => {
  const [isSubmitted, setIsSubmitted] = useState(false)

  useEffect(() => {
    const fetchProcessStatus = async () => {
      try {
        const response = await fetch(`/api/get-process-state?processId=${processId}`)
        if (response.ok) {
          const data = await response.json()
          const status = data.status
          
          setIsSubmitted(status === 'DONE')
        }
      } catch (error) {
        console.error('Error fetching process status:', error)
      }
    }

    fetchProcessStatus()
  }, [processId])

  return { isSubmitted, setIsSubmitted }
}
