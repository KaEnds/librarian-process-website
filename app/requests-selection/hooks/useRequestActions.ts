import { useState } from "react"
import { Request } from "../columns"
import { buildConfirmRequestItems } from "@/utils/utils"
import type { ConfirmRequestItem } from "@/components/ConfirmRequestPopup"
import { updateReviewStatus, updateMultipleProcessStates } from "../services/api"

interface UseRequestActionsOptions {
  data: Request[]
  setData: React.Dispatch<React.SetStateAction<Request[]>>
  setIsSubmitted: (value: boolean) => void
  showToast: (message: string, type: 'success' | 'error' | 'info', duration?: number) => void
}

export const useRequestActions = ({
  data,
  setData,
  setIsSubmitted,
  showToast
}: UseRequestActionsOptions) => {
  const [isNextStepPopupOpen, setIsNextStepPopupOpen] = useState(false)
  const [nextStepRequests, setNextStepRequests] = useState<ConfirmRequestItem[]>([])

  const handleSubmitToNextStep = async () => {
    const rejectedItems = data.filter(item => item.review_status === "REJECT_REVIEW")
    
    if (rejectedItems.length > 0) {
      try {
        // Update rejected items back to pending
        await Promise.all(
          rejectedItems.map(item => 
            item.request_id ? updateReviewStatus(item.request_id, 'PENDING_REVIEW') : Promise.resolve()
          )
        )
        
        // Update state
        const updatedData = data.map(item => ({
          ...item,
          review_status: item.review_status === "REJECT_REVIEW" ? "PENDING_REVIEW" : item.review_status
        })) as Request[]
        
        setData(updatedData)
        setIsSubmitted(false)
        
        // Update process states
        await updateMultipleProcessStates([
          { processId: 1, status: 'IN_PROGRESS' },
          { processId: 2, status: 'PENDING' }
        ])
        
        showToast('เปลี่ยนสถานะเป็นรอดำเนินการแล้ว', 'success', 3000)
      } catch (error) {
        console.error('Error updating review status:', error)
        showToast('เกิดข้อผิดพลาดในการอัปเดตสถานะ', 'error', 3000)
      }
      return
    }
    
    // Open confirmation popup
    const selectedRequests = buildConfirmRequestItems(data)
    setNextStepRequests(selectedRequests)
    setIsNextStepPopupOpen(true)
  }

  const handleConfirmNextStep = async () => {
    const pendingItems = data.filter(item => item.review_status === "PENDING_REVIEW")
    
    if (pendingItems.length === 0) {
      setIsNextStepPopupOpen(false)
      return
    }
    
    try {
      // Update pending items to rejected
      await Promise.all(
        pendingItems.map(item =>
          item.request_id ? updateReviewStatus(item.request_id, 'REJECT_REVIEW') : Promise.resolve()
        )
      )
      
      // Update process states
      await updateMultipleProcessStates([
        { processId: 1, status: 'DONE' },
        { processId: 2, status: 'IN_PROGRESS' }
      ])
      
      // Update state
      setData(prev => prev.map(item => ({
        ...item,
        review_status: item.review_status === "PENDING_REVIEW" ? "REJECT_REVIEW" : item.review_status
      })) as Request[])
      
      showToast('เปลี่ยนสถานะรายการที่รอดำเนินการเป็นปฏิเสธแล้ว', 'success', 3000)
      setIsSubmitted(true)
      setIsNextStepPopupOpen(false)
    } catch (error) {
      console.error('Error updating review status:', error)
      showToast('เกิดข้อผิดพลาดในการอัปเดตสถานะ', 'error', 3000)
      setIsNextStepPopupOpen(false)
    }
  }

  const handleSaveSelection = async (selectedIds: Set<number>) => {
    try {
      const updatePromises = data
        .filter(item => item.request_id !== null)
        .map(async (item) => {
          const newReviewStatus = selectedIds.has(item.id) ? "APPROVE_REVIEW" : "PENDING_REVIEW"
          
          if (newReviewStatus !== item.review_status && item.request_id) {
            await updateReviewStatus(item.request_id, newReviewStatus)
          }
        })
      
      await Promise.all(updatePromises)
      
      // Update state
      setData(prev => prev.map(item => ({
        ...item,
        review_status: selectedIds.has(item.id) ? "APPROVE_REVIEW" : "PENDING_REVIEW"
      })) as Request[])
      
      showToast('บันทึกการเลือกคำร้องขอสำเร็จ', 'success', 3000)
      return true
    } catch (error) {
      console.error('Error updating review status:', error)
      showToast('เกิดข้อผิดพลาดในการบันทึก', 'error', 3000)
      return false
    }
  }

  return {
    isNextStepPopupOpen,
    setIsNextStepPopupOpen,
    nextStepRequests,
    handleSubmitToNextStep,
    handleConfirmNextStep,
    handleSaveSelection
  }
}
