import { useProject, type CurrentUserScope } from '../context/ProjectContext'

export interface Permissions {
  isAdmin: boolean
  hasMultipleClients: boolean
  myClientSlugs: string[]
  canAccessClient: (slug: string) => boolean
  canAccess: (slug: string) => boolean
  currentUserScope: CurrentUserScope
}

/**
 * Small, focused permissions hook extracted from currentUserScope.
 *
 * Usage:
 *   const { isAdmin, canAccessClient, hasMultipleClients } = usePermissions()
 */
export function usePermissions(): Permissions {
  const { isAdmin, currentUserScope, myClientSlugs, hasMultipleClients, canAccessClient } = useProject()

  return {
    isAdmin,
    hasMultipleClients,
    myClientSlugs,
    canAccessClient,
    canAccess: (slug: string) => canAccessClient(slug),
    currentUserScope,
  }
}
