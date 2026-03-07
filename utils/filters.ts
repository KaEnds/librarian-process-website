import { Request } from "@/app/requests-selection/columns"

export interface FilterState {
  aiStatus: string[]
  actionStatus: string[]
}

export const applyFilters = (
  data: Request[],
  filters: FilterState,
  selectedIds: Set<number>
): Request[] => {
  return data.filter(item => {
    // Filter by AI Status
    if (filters.aiStatus.length > 0 && !filters.aiStatus.includes(item.status)) {
      return false
    }
    
    // Filter by Action Status
    if (filters.actionStatus.length > 0) {
      let itemStatus = "pending"
      if (selectedIds.has(item.id)) {
        itemStatus = "selected"
      } else if (item.review_status === "APPROVE_REVIEW") {
        itemStatus = "selected"
      } else if (item.review_status === "REJECT_REVIEW") {
        itemStatus = "rejected"
      }
      
      if (!filters.actionStatus.includes(itemStatus)) {
        return false
      }
    }
    
    return true
  })
}

export const getActiveFilterCount = (filters: FilterState): number => {
  return filters.aiStatus.length + filters.actionStatus.length
}
